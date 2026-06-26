// backend/src/services/alert.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AlertService {
  // Check all locations against thresholds and create alerts
  static async checkStockLevels(): Promise<number> {
    let alertsCreated = 0;

    const thresholds = await prisma.alertThreshold.findMany({
      where: { isActive: true },
      include: { location: true },
    });

    for (const threshold of thresholds) {
      // Count NEW tyres
      const newCount = await prisma.tyre.count({
        where: {
          currentLocationId: threshold.locationId,
          condition: 'NEW',
          size: threshold.size,
          ...(threshold.brand ? { brand: threshold.brand } : {}),
        },
      });

      // Count RETREAD tyres
      const retreadCount = await prisma.tyre.count({
        where: {
          currentLocationId: threshold.locationId,
          condition: 'RETREAD',
          size: threshold.size,
          ...(threshold.brand ? { brand: threshold.brand } : {}),
        },
      });

      // Check NEW alert
      if (newCount < threshold.minNewCount) {
        const severity = newCount === 0 ? 'CRITICAL' : 'LOW';

        // Check if alert already exists
        const existing = await prisma.stockAlert.findFirst({
          where: {
            locationId: threshold.locationId,
            size: threshold.size,
            brand: threshold.brand || '',
            status: { in: ['ACTIVE', 'ACKNOWLEDGED'] },
          },
        });

        if (!existing) {
          await prisma.stockAlert.create({
            data: {
              locationId: threshold.locationId,
              locationName: threshold.location.name,
              size: threshold.size,
              brand: threshold.brand || '',
              currentStock: newCount,
              threshold: threshold.minNewCount,
              severity,
              status: 'ACTIVE',
            },
          });
          alertsCreated++;
        } else if (existing.status === 'ACKNOWLEDGED' && severity === 'CRITICAL') {
          // Re-activate if critical
          await prisma.stockAlert.update({
            where: { id: existing.id },
            data: { status: 'ACTIVE', currentStock: newCount },
          });
        }
      }

      // Check RETREAD alert
      if (retreadCount < threshold.minRetreadCount) {
        // Similar logic for retread alerts...
        // Can create separate alert type or combine
      }
    }

    return alertsCreated;
  }

  // Get all active alerts
  static async getAlerts(filters?: {
    locationId?: string;
    severity?: string;
    status?: string;
  }) {
    return prisma.stockAlert.findMany({
      where: {
        ...(filters?.locationId && { locationId: filters.locationId }),
        ...(filters?.severity && { severity: filters.severity }),
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Acknowledge alert
  static async acknowledgeAlert(alertId: string, userId: string, userName: string) {
    return prisma.stockAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: userName,
      },
    });
  }

  // Resolve alert
  static async resolveAlert(alertId: string) {
    return prisma.stockAlert.update({
      where: { id: alertId },
      data: { status: 'RESOLVED' },
    });
  }
}
