import { Request, Response } from 'express';
import { PrismaClient, DocumentType, DocumentStatus } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { addDays, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

class DocumentController {

  async getByTruck(req: Request, res: Response) {
    try {
      const { truckId } = req.params;
      const { type, status } = req.query;

      const documents = await prisma.document.findMany({
        where: {
          truckId,
          ...(type && { type: type as DocumentType }),
          ...(status && { status: status as DocumentStatus }),
        },
        include: {
          truck: { select: { id: true, number: true, model: true } },
          reminders: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: [
          { expiryDate: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          truck: { select: { id: true, number: true, model: true } },
          reminders: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!document) return res.status(404).json({ error: 'Document not found' });
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        truckId, title, type, number,
        issueDate, expiryDate, reminderDays,
        notes, renewalCost,
      } = req.body;

      const file = req.file;
      const userId = (req as any).user.id;

      const status = this.calculateStatus(expiryDate ? new Date(expiryDate) : null);

      const document = await prisma.document.create({
        data: {
          truckId,
          title,
          type: type as DocumentType,
          number,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          reminderDays: parseInt(reminderDays) || 30,
          renewalCost: renewalCost ? parseFloat(renewalCost) : null,
          status,
          notes,
          createdBy: userId,
          ...(file && {
            fileUrl: `/uploads/documents/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
          }),
        },
        include: {
          truck: { select: { id: true, number: true, model: true } },
        },
      });

      res.status(201).json(document);
    } catch (error) {
      console.error('Create document error:', error);
      res.status(500).json({ error: 'Failed to create document' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        title, type, number,
        issueDate, expiryDate, reminderDays,
        notes, renewalCost, status,
      } = req.body;

      const file = req.file;
      const existing = await prisma.document.findUnique({ where: { id } });

      if (!existing) return res.status(404).json({ error: 'Document not found' });

      if (file && existing.fileUrl) {
        const oldPath = path.join(process.cwd(), existing.fileUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const newExpiryDate = expiryDate ? new Date(expiryDate) : existing.expiryDate;
      const newStatus = status || this.calculateStatus(newExpiryDate);

      const document = await prisma.document.update({
        where: { id },
        data: {
          title,
          type: type as DocumentType,
          number,
          issueDate: issueDate ? new Date(issueDate) : existing.issueDate,
          expiryDate: newExpiryDate,
          reminderDays: reminderDays ? parseInt(reminderDays) : existing.reminderDays,
          renewalCost: renewalCost ? parseFloat(renewalCost) : existing.renewalCost,
          status: newStatus as DocumentStatus,
          notes,
          ...(file && {
            fileUrl: `/uploads/documents/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
          }),
        },
        include: {
          truck: { select: { id: true, number: true, model: true } },
        },
      });

      res.json(document);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update document' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const document = await prisma.document.findUnique({ where: { id } });

      if (!document) return res.status(404).json({ error: 'Document not found' });

      if (document.fileUrl) {
        const filePath = path.join(process.cwd(), document.fileUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await prisma.document.delete({ where: { id } });
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }

  async renew(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newExpiryDate, renewalCost, notes } = req.body;

      const existing = await prisma.document.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Document not found' });

      const expiry = new Date(newExpiryDate);
      const status = this.calculateStatus(expiry);

      const document = await prisma.document.update({
        where: { id },
        data: {
          lastRenewalDate: new Date(),
          nextRenewalDate: expiry,
          expiryDate: expiry,
          renewalCost: renewalCost ? parseFloat(renewalCost) : existing.renewalCost,
          status,
          reminderSent30: false,
          reminderSent15: false,
          reminderSent7: false,
          reminderSent1: false,
          notes: notes ? `${existing.notes || ''}\nRenewed: ${notes}` : existing.notes,
        },
        include: {
          truck: { select: { id: true, number: true, model: true } },
        },
      });

      await prisma.documentReminder.create({
        data: {
          documentId: id,
          type: 'RENEWAL_DUE',
          daysBefore: 0,
          message: `Document renewed. New expiry: ${expiry.toDateString()}`,
        },
      });

      res.json(document);
    } catch (error) {
      res.status(500).json({ error: 'Failed to renew document' });
    }
  }

  async getExpiring(req: Request, res: Response) {
    try {
      const { days = 30 } = req.query;
      const cutoffDate = addDays(new Date(), parseInt(days as string));

      const documents = await prisma.document.findMany({
        where: {
          expiryDate: {
            lte: cutoffDate,
            gte: new Date(),
          },
          status: { not: 'ARCHIVED' },
        },
        include: {
          truck: { select: { id: true, number: true, model: true } },
        },
        orderBy: { expiryDate: 'asc' },
      });

      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expiring documents' });
    }
  }

  async getDashboard(req: Request, res: Response) {
    try {
      const now = new Date();
      const thirtyDays = addDays(now, 30);
      const fifteenDays = addDays(now, 15);
      const sevenDays = addDays(now, 7);

      const [
        totalDocuments,
        expiring30,
        expiring15,
        expiring7,
        expired,
        byType,
      ] = await Promise.all([
        prisma.document.count({ where: { status: { not: 'ARCHIVED' } } }),
        prisma.document.count({
          where: {
            expiryDate: { lte: thirtyDays, gte: now },
            status: { not: 'ARCHIVED' },
          },
        }),
        prisma.document.count({
          where: {
            expiryDate: { lte: fifteenDays, gte: now },
            status: { not: 'ARCHIVED' },
          },
        }),
        prisma.document.count({
          where: {
            expiryDate: { lte: sevenDays, gte: now },
            status: { not: 'ARCHIVED' },
          },
        }),
        prisma.document.count({
          where: {
            expiryDate: { lt: now },
            status: { not: 'ARCHIVED' },
          },
        }),
        prisma.document.groupBy({
          by: ['type'],
          _count: { id: true },
          where: { status: { not: 'ARCHIVED' } },
        }),
      ]);

      res.json({
        totalDocuments,
        expiring30,
        expiring15,
        expiring7,
        expired,
        byType: byType.map(t => ({ type: t.type, count: t._count.id })),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  async sendReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { message } = req.body;

      const document = await prisma.document.findUnique({
        where: { id },
        include: { truck: true },
      });

      if (!document) return res.status(404).json({ error: 'Document not found' });

      const daysUntilExpiry = document.expiryDate
        ? differenceInDays(document.expiryDate, new Date())
        : null;

      const reminder = await prisma.documentReminder.create({
        data: {
          documentId: id,
          type: daysUntilExpiry && daysUntilExpiry <= 0 ? 'EXPIRED' : 'RENEWAL_DUE',
          daysBefore: daysUntilExpiry || 0,
          message: message || `Reminder: ${document.title} for truck ${document.truck.number} expires ${document.expiryDate?.toDateString() || 'soon'}`,
        },
      });

      res.json(reminder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to send reminder' });
    }
  }

  private calculateStatus(expiryDate: Date | null): DocumentStatus {
    if (!expiryDate) return 'ACTIVE';

    const now = new Date();
    const daysUntil = differenceInDays(expiryDate, now);

    if (daysUntil < 0) return 'EXPIRED';
    if (daysUntil <= 7) return 'RENEWAL_PENDING';
    if (daysUntil <= 30) return 'EXPIRING_SOON';
    return 'ACTIVE';
  }
}

export default new DocumentController();