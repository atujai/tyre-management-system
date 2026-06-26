// backend/src/routes/gps.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ===========================================
// GET ROUTES
// ===========================================

router.get('/stats', async (req, res) => {
  try {
    const [totalVehicles, linkedDevices, onlineDevices, totalPositions] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM vehicles`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM gps_devices WHERE vehicle_id IS NOT NULL`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM tc_devices WHERE status = 'online'`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM tc_positions`
    ]);
    res.json({ success: true, data: { totalVehicles: (totalVehicles as any)[0]?.count || 0, linkedDevices: (linkedDevices as any)[0]?.count || 0, onlineDevices: (onlineDevices as any)[0]?.count || 0, totalPositions: (totalPositions as any)[0]?.count || 0 } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/fleet', async (req, res) => {
  try {
    const fleet = await prisma.gps_devices.findMany({ orderBy: { traccar_device_id: 'asc' } });
    res.json({ success: true, data: fleet });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===========================================
// POST ROUTES
// ===========================================

router.post('/devices/link', async (req, res) => {
  try {
    const { deviceId, vehicleId } = req.body;
    if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });

    let vehicle = null;
    if (vehicleId) {
      vehicle = await prisma.vehicle.findFirst({
        where: { OR: [{ id: vehicleId }, { reg: vehicleId }] },
        include: { make: true }
      });
    }

    const traccarDeviceId = parseInt(deviceId, 10);
    const updated = await prisma.gps_devices.upsert({
      where: { traccar_device_id: traccarDeviceId },
      update: {
        device_name: vehicle ? `${vehicle.reg} - ${vehicle.model}` : "Unnamed Device",
        vehicle_id: vehicle ? vehicle.id : null,
        current_vehicle_reg: vehicle ? vehicle.reg : null,
        assigned_at: vehicle ? new Date() : null
      },
      create: {
        traccar_device_id: traccarDeviceId,
        device_name: vehicle ? `${vehicle.reg} - ${vehicle.model}` : "Unnamed Device",
        vehicle_id: vehicle ? vehicle.id : null,
        current_vehicle_reg: vehicle ? vehicle.reg : null,
        assigned_at: vehicle ? new Date() : null
      }
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/devices/:id/assign', async (req, res) => {
  try {
    const traccarDeviceId = parseInt(req.params.id, 10);
    const { vehicleRegNumber } = req.body;

    const vehicle = await prisma.vehicle.findUnique({
      where: { reg: vehicleRegNumber },
      include: { make: true }
    });

    const updated = await prisma.gps_devices.upsert({
      where: { traccar_device_id: traccarDeviceId },
      update: {
        device_name: vehicle ? `${vehicle.reg} - ${vehicle.model}` : "Unnamed Device",
        vehicle_id: vehicle ? vehicle.id : null,
        current_vehicle_reg: vehicleRegNumber,
        assigned_at: vehicle ? new Date() : null
      },
      create: {
        traccar_device_id: traccarDeviceId,
        device_name: vehicle ? `${vehicle.reg} - ${vehicle.model}` : "Unnamed Device",
        vehicle_id: vehicle ? vehicle.id : null,
        current_vehicle_reg: vehicleRegNumber,
        assigned_at: vehicle ? new Date() : null
      }
    });

    res.json({ success: true, message: 'Vehicle assigned successfully', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;