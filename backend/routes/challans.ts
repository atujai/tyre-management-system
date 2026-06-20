import { Router } from 'express';
import { authenticate, requireAdmin } from '../src/middleware/auth.js';
import { ChallanService } from '../services/challanService.js';
import { prisma } from '../src/lib/prisma.js';

const router = Router();
const service = new ChallanService();

// GET /api/challans - List all challans
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, vehicleId, from, to, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (from || to) {
      where.challanDate = {};
      if (from) where.challanDate.gte = new Date(from as string);
      if (to) where.challanDate.lte = new Date(to as string);
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        include: {
          vehicle: { select: { id: true, reg: true, model: true, type: true } },
          payments: { where: { status: 'SUCCESS' }, take: 1 }
        },
        orderBy: { challanDate: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.challan.count({ where })
    ]);

    res.json({
      data: challans,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching challans:', error);
    res.status(500).json({ error: 'Failed to fetch challans' });
  }
});

// GET /api/challans/stats - Dashboard stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const baseWhere = vehicleId ? { vehicleId: vehicleId as string } : {};

    const [totalStats, pendingCount, overdueCount, paidStats] = await Promise.all([
      prisma.challan.aggregate({
        where: baseWhere,
        _count: { id: true },
        _sum: { totalAmount: true }
      }),
      prisma.challan.count({
        where: { ...baseWhere, status: 'PENDING' }
      }),
      prisma.challan.count({
        where: {
          ...baseWhere,
          status: 'PENDING',
          challanDate: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.challanPayment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
      })
    ]);

    res.json({
      totalChallans: totalStats._count.id,
      totalAmount: totalStats._sum.totalAmount || 0,
      pendingCount,
      overdueCount,
      paidAmount: paidStats._sum.amount || 0
    });
  } catch (error: any) {
    console.error('Error fetching challan stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST /api/challans/check-now - Manual trigger (admin only)
router.post('/check-now', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await service.checkAllVehicles();
    res.json(result);
  } catch (error: any) {
    console.error('Error checking challans:', error);
    res.status(500).json({ error: 'Failed to check challans' });
  }
});

// POST /api/challans - Manual entry
router.post('/', authenticate, async (req, res) => {
  try {
    const { vehicleId, challanNumber, challanDate, offence, section, fineAmount, totalAmount, location, notes } = req.body;

    if (!vehicleId || !challanNumber || !challanDate || !offence || fineAmount === undefined || totalAmount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const challan = await service.createManualChallan({
      vehicleId,
      challanNumber,
      challanDate: new Date(challanDate),
      offence,
      section,
      fineAmount: parseFloat(fineAmount),
      totalAmount: parseFloat(totalAmount),
      location,
      notes
    });

    res.status(201).json(challan);
  } catch (error: any) {
    console.error('Error creating challan:', error);
    res.status(400).json({ error: error.message || 'Failed to create challan' });
  }
});

// PATCH /api/challans/:id/pay - Mark as paid
router.patch('/:id/pay', authenticate, async (req, res) => {
  try {
    const { paymentDate, paymentMethod, receiptUrl, notes } = req.body;

    if (!paymentDate || !paymentMethod) {
      return res.status(400).json({ error: 'Payment date and method are required' });
    }

    const result = await service.markAsPaid(req.params.id, {
      paymentDate: new Date(paymentDate),
      paymentMethod,
      receiptUrl,
      notes
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error marking challan as paid:', error);
    res.status(400).json({ error: error.message || 'Failed to process payment' });
  }
});

// PATCH /api/challans/:id/contest - Contest challan
router.patch('/:id/contest', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Reason is required to contest' });
    }

    const result = await service.contestChallan(req.params.id, reason);
    res.json(result);
  } catch (error: any) {
    console.error('Error contesting challan:', error);
    res.status(400).json({ error: error.message || 'Failed to contest challan' });
  }
});

// GET /api/challans/analytics - Analytics dashboard
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const { from, to, vehicleId } = req.query;
    const analytics = await service.getAnalytics({
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      vehicleId: vehicleId as string
    });
    res.json(analytics);
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;