// backend/src/controllers/location.controller.ts (COMPLETE — replace existing file)
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PDFService } from '../services/pdf.service';
import { AlertService } from '../services/alert.service';

const prisma = new PrismaClient();

const TYRE_CONDITIONS = ['NEW', 'REPAIR', 'RETREAD', 'WORN', 'SCRAP', 'REJECTED'] as const;
type TyreCondition = typeof TYRE_CONDITIONS[number];

export const locationController = {
  // ========== EXISTING METHODS ==========

  getAll: async (req: Request, res: Response) => {
    try {
      const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });
      res.json(locations);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch locations' }); }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const location = await prisma.location.findUnique({ where: { id: req.params.id } });
      if (!location) return res.status(404).json({ error: 'Location not found' });
      res.json(location);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch location' }); }
  },

  getInventory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const location = await prisma.location.findUnique({ where: { id } });
      if (!location) return res.status(404).json({ error: 'Location not found' });

      const tyres = await prisma.tyre.findMany({
        where: { currentLocationId: id },
        include: { vehicle: { select: { registrationNumber: true } } },
      });

      const sizeMap = new Map<string, any>();
      tyres.forEach((tyre) => {
        const key = `${tyre.size}-${tyre.brand}-${tyre.pattern || 'default'}`;
        if (!sizeMap.has(key)) {
          sizeMap.set(key, {
            size: tyre.size, brand: tyre.brand, pattern: tyre.pattern || 'Standard',
            total: 0, withRim: 0, withoutRim: 0,
            conditions: {} as Record<TyreCondition, any>,
          });
        }
        const group = sizeMap.get(key);
        group.total += 1;
        tyre.hasRim ? group.withRim++ : group.withoutRim++;
        const condition = tyre.condition as TyreCondition;
        if (!group.conditions[condition]) {
          group.conditions[condition] = { count: 0, withRim: 0, withoutRim: 0 };
        }
        group.conditions[condition].count++;
        tyre.hasRim ? group.conditions[condition].withRim++ : group.conditions[condition].withoutRim++;
      });

      const summary = {
        totalTyres: tyres.length,
        totalWithRim: tyres.filter(t => t.hasRim).length,
        totalWithoutRim: tyres.filter(t => !t.hasRim).length,
        byCondition: {} as Record<TyreCondition, number>,
      };
      TYRE_CONDITIONS.forEach(c => summary.byCondition[c] = tyres.filter(t => t.condition === c).length);

      res.json({ location, summary, bySize: Array.from(sizeMap.values()) });
    } catch (error) { res.status(500).json({ error: 'Failed to fetch inventory' }); }
  },

  getTyres: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { condition, size, hasRim, search } = req.query;
      const where: any = { currentLocationId: id };
      if (condition) where.condition = condition;
      if (size) where.size = size;
      if (hasRim !== undefined) where.hasRim = hasRim === 'true';
      if (search) {
        where.OR = [
          { serialNumber: { contains: search as string, mode: 'insensitive' } },
          { brand: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      const tyres = await prisma.tyre.findMany({
        where, include: { vehicle: { select: { registrationNumber: true } }, currentLocation: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(tyres);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch tyres' }); }
  },

  create: async (req: Request, res: Response) => {
    try {
      const location = await prisma.location.create({ data: req.body });
      res.status(201).json(location);
    } catch (error) { res.status(500).json({ error: 'Failed to create location' }); }
  },

  update: async (req: Request, res: Response) => {
    try {
      const location = await prisma.location.update({ where: { id: req.params.id }, data: req.body });
      res.json(location);
    } catch (error) { res.status(500).json({ error: 'Failed to update location' }); }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const count = await prisma.tyre.count({ where: { currentLocationId: req.params.id } });
      if (count > 0) return res.status(400).json({ error: 'Cannot delete location with tyres' });
      await prisma.location.delete({ where: { id: req.params.id } });
      res.json({ message: 'Location deleted' });
    } catch (error) { res.status(500).json({ error: 'Failed to delete location' }); }
  },

  // ========== TRANSFER METHODS ==========

  getTransferableTyres: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { condition, size, search } = req.query;
      const where: any = { currentLocationId: id };
      if (condition) where.condition = condition;
      if (size) where.size = size;
      if (search) {
        where.OR = [
          { serialNumber: { contains: search as string, mode: 'insensitive' } },
          { brand: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      const tyres = await prisma.tyre.findMany({
        where,
        select: { id: true, serialNumber: true, brand: true, size: true, condition: true, hasRim: true },
        orderBy: { serialNumber: 'asc' },
      });
      res.json(tyres.map(t => ({ tyreId: t.id, ...t })));
    } catch (error) { res.status(500).json({ error: 'Failed to fetch tyres' }); }
  },

  getTransferHistory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { direction, fromDate, toDate, limit } = req.query;

      const where: any = {};
      if (direction === 'IN') where.toLocationId = id;
      else if (direction === 'OUT') where.fromLocationId = id;
      else where.OR = [{ fromLocationId: id }, { toLocationId: id }];

      if (fromDate || toDate) {
        where.transferDate = {};
        if (fromDate) where.transferDate.gte = new Date(fromDate as string);
        if (toDate) where.transferDate.lte = new Date(toDate as string);
      }

      const transfers = await prisma.transferHistory.findMany({
        where,
        include: {
          fromLocation: true,
          toLocation: true,
          tyre: { select: { id: true, serialNumber: true, brand: true, size: true } },
          transferredBy: { select: { id: true, name: true } },
        },
        orderBy: { transferDate: 'desc' },
        take: limit ? parseInt(limit as string) : 50,
      });
      res.json(transfers);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch transfer history' }); }
  },

  // ========== PDF REPORT METHODS ==========

  getReportData: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const location = await prisma.location.findUnique({ where: { id } });
      if (!location) return res.status(404).json({ error: 'Location not found' });

      // Reuse inventory logic
      const tyres = await prisma.tyre.findMany({
        where: { currentLocationId: id },
        include: { vehicle: { select: { registrationNumber: true } } },
      });

      const sizeMap = new Map();
      tyres.forEach(t => {
        const key = `${t.size}-${t.brand}-${t.pattern || 'default'}`;
        if (!sizeMap.has(key)) sizeMap.set(key, { size: t.size, brand: t.brand, pattern: t.pattern || 'Standard', total: 0, withRim: 0, withoutRim: 0, conditions: {} });
        const g = sizeMap.get(key);
        g.total++; t.hasRim ? g.withRim++ : g.withoutRim++;
        const c = t.condition as TyreCondition;
        if (!g.conditions[c]) g.conditions[c] = { count: 0, withRim: 0, withoutRim: 0 };
        g.conditions[c].count++; t.hasRim ? g.conditions[c].withRim++ : g.conditions[c].withoutRim++;
      });

      const summary = {
        totalTyres: tyres.length,
        totalWithRim: tyres.filter(t => t.hasRim).length,
        totalWithoutRim: tyres.filter(t => !t.hasRim).length,
        byCondition: {} as Record<TyreCondition, number>,
      };
      TYRE_CONDITIONS.forEach(c => summary.byCondition[c] = tyres.filter(t => t.condition === c).length);

      // Get recent transfers
      const transfersIn = await prisma.transferHistory.findMany({
        where: { toLocationId: id },
        include: { fromLocation: true, toLocation: true, tyre: { select: { id: true, serialNumber: true, brand: true, size: true } }, transferredBy: { select: { id: true, name: true } } },
        orderBy: { transferDate: 'desc' }, take: 10,
      });

      const transfersOut = await prisma.transferHistory.findMany({
        where: { fromLocationId: id },
        include: { fromLocation: true, toLocation: true, tyre: { select: { id: true, serialNumber: true, brand: true, size: true } }, transferredBy: { select: { id: true, name: true } } },
        orderBy: { transferDate: 'desc' }, take: 10,
      });

      res.json({
        location,
        generatedAt: new Date().toISOString(),
        generatedBy: (req as any).user?.name || 'System',
        summary,
        bySize: Array.from(sizeMap.values()),
        transfersIn,
        transfersOut,
      });
    } catch (error) { res.status(500).json({ error: 'Failed to generate report data' }); }
  },

  generatePDF: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const location = await prisma.location.findUnique({ where: { id } });
      if (!location) return res.status(404).json({ error: 'Location not found' });

      const tyres = await prisma.tyre.findMany({ where: { currentLocationId: id } });
      const sizeMap = new Map();
      tyres.forEach(t => {
        const key = `${t.size}-${t.brand}-${t.pattern || 'default'}`;
        if (!sizeMap.has(key)) sizeMap.set(key, { size: t.size, brand: t.brand, pattern: t.pattern || 'Standard', total: 0, withRim: 0, withoutRim: 0, conditions: {} });
        const g = sizeMap.get(key); g.total++; t.hasRim ? g.withRim++ : g.withoutRim++;
      });

      const summary = {
        totalTyres: tyres.length,
        totalWithRim: tyres.filter(t => t.hasRim).length,
        totalWithoutRim: tyres.filter(t => !t.hasRim).length,
        byCondition: {} as Record<TyreCondition, number>,
      };
      TYRE_CONDITIONS.forEach(c => summary.byCondition[c] = tyres.filter(t => t.condition === c).length);

      const transfersIn = await prisma.transferHistory.findMany({
        where: { toLocationId: id },
        include: { fromLocation: true, toLocation: true, tyre: { select: { serialNumber: true, brand: true, size: true } }, transferredBy: { select: { name: true } } },
        orderBy: { transferDate: 'desc' }, take: 10,
      });

      const transfersOut = await prisma.transferHistory.findMany({
        where: { fromLocationId: id },
        include: { fromLocation: true, toLocation: true, tyre: { select: { serialNumber: true, brand: true, size: true } }, transferredBy: { select: { name: true } } },
        orderBy: { transferDate: 'desc' }, take: 10,
      });

      const doc = PDFService.generateInventoryReport({
        location,
        generatedAt: new Date(),
        generatedBy: (req as any).user?.name || 'System',
        summary,
        bySize: Array.from(sizeMap.values()),
        transfersIn,
        transfersOut,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-${location.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
      doc.pipe(res);
    } catch (error) { res.status(500).json({ error: 'Failed to generate PDF' }); }
  },
};

// ========== TRANSFER CONTROLLER ==========
export const transferController = {
  bulkTransfer: async (req: Request, res: Response) => {
    try {
      const { fromLocationId, toLocationId, tyreIds, reason, customReason, notes, referenceNumber } = req.body;
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name;

      if (!fromLocationId || !toLocationId || !tyreIds?.length) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const results = await prisma.$transaction(async (tx) => {
        const transfers = [];
        for (const tyreId of tyreIds) {
          // Update tyre location
          await tx.tyre.update({
            where: { id: tyreId },
            data: { currentLocationId: toLocationId },
          });

          // Create transfer record
          const transfer = await tx.transferHistory.create({
            data: {
              fromLocationId,
              toLocationId,
              tyreId,
              reason,
              customReason,
              notes,
              referenceNumber,
              transferredById: userId,
              transferDate: new Date(),
            },
          });
          transfers.push(transfer);
        }
        return transfers;
      });

      res.json({ transferred: results.length, transferId: results[0]?.id });
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(500).json({ error: 'Transfer failed' });
    }
  },
};

// ========== ALERT CONTROLLER ==========
export const alertController = {
  getAlerts: async (req: Request, res: Response) => {
    try {
      const alerts = await AlertService.getAlerts(req.query as any);
      res.json(alerts);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch alerts' }); }
  },

  acknowledgeAlert: async (req: Request, res: Response) => {
    try {
      const alert = await AlertService.acknowledgeAlert(
        req.params.id,
        (req as any).user?.id,
        (req as any).user?.name
      );
      res.json(alert);
    } catch (error) { res.status(500).json({ error: 'Failed to acknowledge alert' }); }
  },

  resolveAlert: async (req: Request, res: Response) => {
    try {
      const alert = await AlertService.resolveAlert(req.params.id);
      res.json(alert);
    } catch (error) { res.status(500).json({ error: 'Failed to resolve alert' }); }
  },

  getThresholds: async (req: Request, res: Response) => {
    try {
      const thresholds = await prisma.alertThreshold.findMany({
        where: req.query.locationId ? { locationId: req.query.locationId as string } : undefined,
        include: { location: { select: { name: true } } },
      });
      res.json(thresholds);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch thresholds' }); }
  },

  setThreshold: async (req: Request, res: Response) => {
    try {
      const threshold = await prisma.alertThreshold.create({ data: req.body });
      res.status(201).json(threshold);
    } catch (error) { res.status(500).json({ error: 'Failed to create threshold' }); }
  },

  deleteThreshold: async (req: Request, res: Response) => {
    try {
      await prisma.alertThreshold.delete({ where: { id: req.params.id } });
      res.json({ message: 'Threshold deleted' });
    } catch (error) { res.status(500).json({ error: 'Failed to delete threshold' }); }
  },

  checkStock: async (req: Request, res: Response) => {
    try {
      const count = await AlertService.checkStockLevels();
      res.json({ alertsCreated: count });
    } catch (error) { res.status(500).json({ error: 'Stock check failed' }); }
  },
};
