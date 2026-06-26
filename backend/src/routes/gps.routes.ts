import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/gps/fleet - Fleet overview for map
router.get('/fleet', async (req, res) => {
  try {
    const devices = await prisma.gPSDevice.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        deviceId: true,
        latitude: true,
        longitude: true,
        speed: true,
        ignition: true,
        status: true,
        currentVehicleRegNumber: true,
        currentVehicleMake: true,
        currentVehicleModel: true,
        currentVehicleYear: true,
        assignedAt: true,
      }
    });
    res.json(devices);
  } catch (error) {
    console.error('Fleet error:', error);
    res.status(500).json({ error: 'Failed to fetch fleet' });
  }
});

// GET /api/gps/devices/:id - Single device detail
router.get('/devices/:id', async (req, res) => {
  try {
    const device = await prisma.gPSDevice.findUnique({
      where: { id: req.params.id },
      include: {
        trips: { orderBy: { startedAt: 'desc' }, take: 10 },
        alerts: { orderBy: { createdAt: 'desc' }, take: 10 },
        assignmentHistory: { orderBy: { assignedAt: 'desc' } },
      }
    });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
  } catch (error) {
    console.error('Device detail error:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// POST /api/gps/devices/:id/assign - Assign to vehicle
router.post('/devices/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { vehicleRegNumber, vehicleMake, vehicleModel, vehicleYear, notes } = req.body;

  try {
    // Close previous assignment
    await prisma.gPSDeviceAssignment.updateMany({
      where: { deviceId: id, removedAt: null },
      data: { removedAt: new Date() }
    });

    // Create new assignment record
    await prisma.gPSDeviceAssignment.create({
      data: {
        deviceId: id,
        vehicleRegNumber,
        vehicleMake,
        vehicleModel,
        notes: notes || null,
      }
    });

    // Update device with current vehicle
    const device = await prisma.gPSDevice.update({
      where: { id },
      data: {
        currentVehicleRegNumber: vehicleRegNumber,
        currentVehicleMake: vehicleMake,
        currentVehicleModel: vehicleModel,
        currentVehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
        assignedAt: new Date(),
      }
    });

    res.json(device);
  } catch (error) {
    console.error('Assign error:', error);
    res.status(500).json({ error: 'Failed to assign vehicle' });
  }
});

// GET /api/gps/devices/:id/history
router.get('/devices/:id/history', async (req, res) => {
  const { start, end } = req.query;
  try {
    const history = await prisma.gPSLocationHistory.findMany({
      where: {
        deviceId: req.params.id,
        timestamp: {
          gte: new Date(start as string),
          lte: new Date(end as string),
        }
      },
      orderBy: { timestamp: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/gps/devices/:id/trips
router.get('/devices/:id/trips', async (req, res) => {
  try {
    const trips = await prisma.gPSTrip.findMany({
      where: { deviceId: req.params.id },
      orderBy: { startedAt: 'desc' }
    });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// GET /api/gps/devices/:id/alerts
router.get('/devices/:id/alerts', async (req, res) => {
  try {
    const alerts = await prisma.gPSAlert.findMany({
      where: { deviceId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET /api/gps/stats - Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalDevices = await prisma.gPSDevice.count();
    const activeDevices = await prisma.gPSDevice.count({ where: { status: 'ACTIVE' } });
    const onlineDevices = await prisma.gPSDevice.count({ 
      where: { 
        status: 'ACTIVE',
        lastPing: { gte: new Date(Date.now() - 5 * 60 * 1000) } // online if pinged in last 5 min
      } 
    });
    
    res.json({
      totalDevices,
      activeDevices,
      activeTrips: 0, // calculate based on your logic
      unacknowledgedAlerts: 0,
      onlinePercentage: totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;