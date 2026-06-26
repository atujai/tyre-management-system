import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const axleSchema = z.object({
  tyreCount: z.number().min(1).max(8),
  steering: z.boolean().default(false),
  drive: z.boolean().default(false),
  line: z.number().nullable().optional(),
})

const vehicleSchema = z.object({
  reg: z.string().min(1),
  type: z.string().min(1),
  make: z.string().min(1).optional(),
  model: z.string().min(1),
  stepneySlots: z.number().min(0).max(10).default(1),
  axles: z.array(axleSchema).min(1),
})

// Get all vehicles with tyre counts
router.get('/', authenticate, async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      make: true,
      vehicleType: true,
      axles: {
        orderBy: { sortOrder: 'asc' },
      },
      _count: {
        select: {
          tyres: {
            where: { status: 'MOUNTED' },
          },
          stepneys: {
            where: { status: 'STEPNEY' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const formatted = vehicles.map(v => ({
    ...v,
    type: v.vehicleType?.name || v.type,
    make: v.make?.name || null,
    totalTyres: v.axles.reduce((sum, a) => sum + a.tyreCount, 0),
    mountedCount: v._count.tyres,
    stepneyCount: v._count.stepneys,
  }))

  res.json(formatted)
})

// NEW: Get available vehicles for GPS assignment dropdown
router.get('/available', authenticate, async (req, res) => {
  try {
    const allVehicles = await prisma.vehicle.findMany({
      select: {
        id: true,
        reg: true,
        make: true,
        model: true,
        year: true,
      },
      orderBy: { reg: 'asc' },
    })

    // Get vehicles already assigned to a GPS device
    const assignedDevices = await prisma.gPSDevice.findMany({
      where: { currentVehicleRegNumber: { not: null } },
      select: { currentVehicleRegNumber: true },
    })

    const assignedRegNumbers = assignedDevices.map(d => d.currentVehicleRegNumber)

    // Filter out vehicles that already have a GPS assigned
    const availableVehicles = allVehicles
      .filter(v => !assignedRegNumbers.includes(v.reg))
      .map(v => ({
        id: v.id,
        registrationNumber: v.reg,
        make: v.make?.name || null,
        model: v.model,
        year: v.year,
      }))

    res.json(availableVehicles)
  } catch (error) {
    console.error('Available vehicles error:', error)
    res.status(500).json({ error: 'Failed to fetch available vehicles' })
  }
})

// Get single vehicle with full details
router.get('/:id', authenticate, async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      make: true,
      vehicleType: true,
      axles: {
        orderBy: { sortOrder: 'asc' },
        include: {
          tyres: {
            where: { status: 'MOUNTED' },
            include: {
              images: true,
            },
          },
        },
      },
      stepneys: {
        where: { status: 'STEPNEY' },
        include: {
          images: true,
        },
      },
      tyres: {
        where: { status: 'MOUNTED' },
        include: {
          images: true,
        },
      },
    },
  })

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' })
  }

  res.json({
    ...vehicle,
    type: vehicle.vehicleType?.name || vehicle.type,
    make: vehicle.make?.name || null,
  })
})

// Create vehicle
router.post('/', authenticate, async (req, res) => {
  try {
    const data = vehicleSchema.parse(req.body)

    // Resolve make and type by name to get IDs
    const makeRecord = data.make ? await prisma.make.findFirst({ where: { name: data.make } }) : null
    const typeRecord = await prisma.vehicleType.findFirst({ where: { name: data.type } })

    const vehicle = await prisma.vehicle.create({
      data: {
        reg: data.reg,
        type: data.type,
        model: data.model,
        makeId: makeRecord?.id || null,
        typeId: typeRecord?.id || null,
        stepneySlots: data.stepneySlots,
        axles: {
          create: data.axles.map((a, i) => ({
            tyreCount: a.tyreCount,
            steering: a.steering,
            drive: a.drive,
            line: a.line,
            sortOrder: i,
          })),
        },
      },
      include: {
        make: true,
        vehicleType: true,
        axles: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    res.status(201).json({
      ...vehicle,
      type: vehicle.vehicleType?.name || vehicle.type,
      make: vehicle.make?.name || null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Registration number already exists' })
    }
    res.status(500).json({ error: 'Failed to create vehicle' })
  }
})

// Update vehicle
router.put('/:id', authenticate, async (req, res) => {
  try {
    const data = vehicleSchema.parse(req.body)

    // Resolve make and type by name to get IDs
    const makeRecord = data.make ? await prisma.make.findFirst({ where: { name: data.make } }) : null
    const typeRecord = await prisma.vehicleType.findFirst({ where: { name: data.type } })

    // Delete existing axles and recreate
    await prisma.axle.deleteMany({
      where: { vehicleId: req.params.id },
    })

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        reg: data.reg,
        type: data.type,
        model: data.model,
        makeId: makeRecord?.id || null,
        typeId: typeRecord?.id || null,
        stepneySlots: data.stepneySlots,
        axles: {
          create: data.axles.map((a, i) => ({
            tyreCount: a.tyreCount,
            steering: a.steering,
            drive: a.drive,
            line: a.line,
            sortOrder: i,
          })),
        },
      },
      include: {
        make: true,
        vehicleType: true,
        axles: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    res.json({
      ...vehicle,
      type: vehicle.vehicleType?.name || vehicle.type,
      make: vehicle.make?.name || null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Registration number already exists' })
    }
    res.status(500).json({ error: 'Failed to update vehicle' })
  }
})

// Delete vehicle
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const mountedCount = await prisma.tyre.count({
      where: {
        vehicleId: req.params.id,
        status: 'MOUNTED',
      },
    })

    if (mountedCount > 0) {
      return res.status(400).json({ error: 'Cannot delete vehicle with mounted tyres' })
    }

    await prisma.vehicle.delete({
      where: { id: req.params.id },
    })

    res.json({ message: 'Vehicle deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle' })
  }
})

export default router