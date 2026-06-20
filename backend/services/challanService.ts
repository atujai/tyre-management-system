import { PrismaClient, ChallanStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import axios from 'axios';
import { prisma } from '../src/lib/prisma.js';
// Parivahan eChallan public endpoints (no API key needed - web scraping)
const PARIVAHAN_URL = 'https://echallan.parivahan.gov.in/index/accused-challan';

export class ChallanService {

  // ============ DAILY CHECK ============

  async checkAllVehicles(): Promise<{
    checked: number;
    newChallans: number;
    updated: number;
    errors: string[];
  }> {
    const vehicles = await prisma.vehicle.findMany({
      select: { id: true, reg: true }
    });

    const results = { checked: 0, newChallans: 0, updated: 0, errors: [] as string[] };

    for (const vehicle of vehicles) {
      try {
        const challans = await this.scrapeParivahan(vehicle.reg);
        const { newCount, updatedCount } = await this.syncChallans(vehicle.id, challans);
        results.checked++;
        results.newChallans += newCount;
        results.updated += updatedCount;
        await this.delay(5000);
      } catch (error: any) {
        results.errors.push(`${vehicle.reg}: ${error.message}`);
      }
    }

    return results;
  }

  private async scrapeParivahan(regNo: string): Promise<any[]> {
    try {
      const response = await axios.post(PARIVAHAN_URL, 
        { vehicleNumber: regNo.toUpperCase().replace(/\s/g, '') },
        { 
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          },
          timeout: 25000
        }
      );

      return response.data?.result?.challans || [];
    } catch (error: any) {
      console.log(`Parivahan scrape failed for ${regNo}:`, error.message);
      return [];
    }
  }

  private async syncChallans(vehicleId: string, challans: any[]): Promise<{ newCount: number; updatedCount: number }> {
    let newCount = 0;
    let updatedCount = 0;

    for (const c of challans) {
      const challanNo = c.challanNo || c.challanNumber;
      if (!challanNo) continue;

      const existing = await prisma.challan.findUnique({
        where: { challanNumber: challanNo }
      });

      const challanData = {
        vehicleId,
        challanNumber: challanNo,
        challanDate: c.challanDate ? new Date(c.challanDate) : new Date(),
        offence: c.offenceDetails || c.offence || 'Unknown',
        section: c.section || null,
        fineAmount: parseFloat(c.amount) || 0,
        totalAmount: parseFloat(c.totalAmount || c.amount) || 0,
        status: this.mapStatus(c.status),
        location: c.location || null,
        source: 'PARIVAHAN' as const,
        checkedAt: new Date()
      };

      if (!existing) {
        await prisma.challan.create({ data: challanData });
        newCount++;
      } else if (existing.status === 'PENDING' && challanData.status === 'PAID') {
        await prisma.challan.update({
          where: { id: existing.id },
          data: { status: 'PAID', checkedAt: new Date() }
        });
        updatedCount++;
      }
    }

    return { newCount, updatedCount };
  }

  // ============ MANUAL PAYMENT ============

  async markAsPaid(challanId: string, data: {
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    receiptUrl?: string;
    notes?: string;
  }) {
    const challan = await prisma.challan.findUnique({
      where: { id: challanId }
    });

    if (!challan) throw new Error('Challan not found');
    if (challan.status === 'PAID') throw new Error('Challan already paid');

    return prisma.$transaction([
      prisma.challan.update({
        where: { id: challanId },
        data: {
          status: 'PAID',
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          paymentReceipt: data.receiptUrl,
          notes: data.notes || challan.notes
        }
      }),
      prisma.challanPayment.create({
        data: {
          challanId,
          amount: challan.totalAmount,
          method: data.paymentMethod,
          status: 'SUCCESS',
          completedAt: data.paymentDate,
          receiptUrl: data.receiptUrl
        }
      })
    ]);
  }

  // ============ ANALYTICS ============

  async getAnalytics(filters: { from?: Date; to?: Date; vehicleId?: string }) {
    const where: any = {};
    if (filters.from || filters.to) {
      where.challanDate = {};
      if (filters.from) where.challanDate.gte = filters.from;
      if (filters.to) where.challanDate.lte = filters.to;
    }
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;

    const [
      totalStats,
      statusBreakdown,
      topOffences,
      vehicleRanking,
      paymentStats
    ] = await Promise.all([
      prisma.challan.aggregate({
        where,
        _count: { id: true },
        _sum: { totalAmount: true, fineAmount: true },
        _avg: { totalAmount: true }
      }),

      prisma.challan.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: { totalAmount: true }
      }),

      prisma.challan.groupBy({
        by: ['offence'],
        where,
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),

      prisma.challan.groupBy({
        by: ['vehicleId'],
        where,
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10
      }),

      prisma.challanPayment.aggregate({
        where: { status: 'SUCCESS' },
        _count: { id: true },
        _sum: { amount: true }
      })
    ]);

    const vehicleIds = vehicleRanking.map(v => v.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, reg: true, model: true }
    });

    const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

    return {
      summary: {
        totalChallans: totalStats._count.id,
        totalFineAmount: totalStats._sum.totalAmount || 0,
        averageFine: totalStats._avg.totalAmount || 0,
        totalPaid: paymentStats._sum.amount || 0,
        pendingAmount: (totalStats._sum.totalAmount || 0) - (paymentStats._sum.amount || 0)
      },
      statusBreakdown: statusBreakdown.map(s => ({
        status: s.status,
        count: s._count.id,
        amount: s._sum.totalAmount || 0
      })),
      topOffences: topOffences.map(o => ({
        offence: o.offence,
        count: o._count.id,
        amount: o._sum.totalAmount || 0
      })),
      vehicleRanking: vehicleRanking.map(v => ({
        vehicle: vehicleMap.get(v.vehicleId),
        count: v._count.id,
        amount: v._sum.totalAmount || 0
      })),
      paymentEfficiency: totalStats._count.id > 0 
        ? ((paymentStats._count.id / totalStats._count.id) * 100).toFixed(1)
        : '0'
    };
  }

  // ============ MANUAL OPERATIONS ============

  async createManualChallan(data: {
    vehicleId: string;
    challanNumber: string;
    challanDate: Date;
    offence: string;
    section?: string;
    fineAmount: number;
    totalAmount: number;
    location?: string;
    notes?: string;
  }) {
    return prisma.challan.create({
      data: {
        ...data,
        status: 'PENDING',
        source: 'MANUAL'
      }
    });
  }

  async contestChallan(challanId: string, reason: string) {
    return prisma.challan.update({
      where: { id: challanId },
      data: { status: 'CONTESTED', notes: reason }
    });
  }

  private mapStatus(status: string): ChallanStatus {
    const s = status?.toUpperCase() || '';
    if (s.includes('PAID')) return 'PAID';
    if (s.includes('DISMISS')) return 'DISMISSED';
    if (s.includes('CONTEST')) return 'CONTESTED';
    return 'PENDING';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}