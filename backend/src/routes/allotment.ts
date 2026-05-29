import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Mount tyre on vehicle axle position
router.post('/mount', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      tyreId: z.string(),
      vehicleId: z.string(),
      axleId: z.string(),
      position: z.string(),
    })

    const { tyreId, vehicleId, axleId, position } = schema.parse(req.body)

    const tyre = await prisma.tyre.findUnique({
      where: { id: tyreId },
    })

    if (!tyre || tyre.status !== 'INVENTORY') {
      return res.status(400).json({ error: 'Tyre not available for mounting' })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { axles: true },
    })

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    const axle = vehicle.axles.find(a => a.id === axleId)
    if (!axle) {
      return res.status(404).json({ error: 'Axle not found' })
    }

    // Check if position is already occupied
    const existing = await prisma.tyre.findFirst({
      where: {
        vehicleId,
        axleId,
        position,
        status: 'MOUNTED',
      },
    })

    if (existing) {
      return res.status(400).json({ error: 'Position already occupied' })
    }

    const updatedTyre = await prisma.tyre.update({
      where: { id: tyreId },
      data: {
        status: 'MOUNTED',
        vehicleId,
        axleId,
        position,
        mountingDate: new Date(),
        locationId: null,
      },
      include: {
        images: true,
        vehicle: true,
        axle: true,
      },
    })

    // Log history
    await prisma.history.create({
      data: {
        action: 'Mounted',
        tyreId,
        vehicleId,
        axleIndex: axle.sortOrder,
        position,
        details: `${tyre.serial} mounted on ${vehicle.reg} Axle ${axle.sortOrder + 1}/${position}`,
        userId: req.user!.id,
      },
    })

    res.json(updatedTyre)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Mount failed' })
  }
})

// Mount from retreader directly
router.post('/mount-from-retreader', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      tyreId: z.string(),
      vehicleId: z.string(),
      axleId: z.string(),
      position: z.string(),
    })

    const { tyreId, vehicleId, axleId, position } = schema.parse(req.body)

    const tyre = await prisma.tyre.findUnique({
      where: { id: tyreId },
      include: { location: true },
    })

    if (!tyre || tyre.status !== 'REPAIR') {
      return res.status(400).json({ error: 'Tyre not at retreader' })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { axles: true },
    })

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    const axle = vehicle.axles.find(a => a.id === axleId)
    if (!axle) {
      return res.status(404).json({ error: 'Axle not found' })
    }

    const existing = await prisma.tyre.findFirst({
      where: {
        vehicleId,
        axleId,
        position,
        status: 'MOUNTED',
      },
    })

    if (existing) {
      return res.status(400).json({ error: 'Position already occupied' })
    }

    const oldLocation = tyre.location?.name || 'retreader'

    const updatedTyre = await prisma.tyre.update({
      where: { id: tyreId },
      data: {
        status: 'MOUNTED',
        vehicleId,
        axleId,
        position,
        mountingDate: new Date(),
        locationId: null,
      },
      include: {
        images: true,
        vehicle: true,
        axle: true,
      },
    })

    await prisma.history.create({
      data: {
        action: 'Returned-Retread',
        tyreId,
        vehicleId,
        axleIndex: axle.sortOrder,
        position,
        details: `${tyre.serial} from ${oldLocation} -> ${vehicle.reg} Axle ${axle.sortOrder + 1}/${position}`,
        userId: req.user!.id,
      },
    })

    res.json(updatedTyre)
  } catch (error) {
    res.status(500).json({ error: 'Mount from retreader failed' })
  }
})

// Unmount tyre with destination
router.post('/unmount', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      tyreId: z.string(),
      destination: z.enum(['godown', 'retreader', 'stepney-same', 'stepney-other', 'scrap']),
      locationId: z.string().optional(),
      targetVehicleId: z.string().optional(),
      stepneyType: z.enum(['READY', 'BURST', 'CLAIM', 'PUNCTURE', 'RETREAD_CHECKUP']).optional(),
      withRim: z.boolean().optional(),
    })

    const data = schema.parse(req.body)
    const { tyreId, destination } = data

    const tyre = await prisma.tyre.findUnique({
      where: { id: tyreId },
      include: { vehicle: true, axle: true },
    })

    if (!tyre || tyre.status !== 'MOUNTED') {
      return res.status(400).json({ error: 'Tyre is not mounted' })
    }

    const fromInfo = `${tyre.vehicle?.reg || '?'} Axle ${(tyre.axle?.sortOrder || 0) + 1}/${tyre.position}`
    let updateData: any = {
      vehicleId: null,
      axleId: null,
      position: null,
      mountingDate: null,
    }
    let action = ''
    let details = ''

    switch (destination) {
      case 'godown':
        if (!data.locationId) {
          return res.status(400).json({ error: 'Godown required' })
        }
        updateData = {
          ...updateData,
          status: 'INVENTORY',
          locationId: data.locationId,
        }
        action = 'Removed'
        details = `${tyre.serial} unmounted from ${fromInfo} -> ${data.locationId}`
        break

      case 'retreader':
        if (!data.locationId) {
          return res.status(400).json({ error: 'Retreader required' })
        }
        updateData = {
          ...updateData,
          status: 'REPAIR',
          locationId: data.locationId,
        }
        action = 'Sent-Retread'
        details = `${tyre.serial} unmounted from ${fromInfo} -> retreader`
        break

      case 'stepney-same':
        if (!tyre.vehicleId) {
          return res.status(400).json({ error: 'No vehicle' })
        }
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: tyre.vehicleId },
          include: {
            stepneys: {
              where: { status: 'STEPNEY' },
            },
          },
        })
        if (!vehicle || vehicle.stepneys.length >= vehicle.stepneySlots) {
          return res.status(400).json({ error: 'No stepney slots available' })
        }
        updateData = {
          ...updateData,
          status: 'STEPNEY',
          stepneyVehicleId: tyre.vehicleId,
          stepneyDate: new Date(),
          stepneyType: data.stepneyType || 'READY',
          withRim: data.withRim !== false,
        }
        action = 'Stepney-Added'
        details = `${tyre.serial} -> stepney on ${vehicle.reg} [${data.stepneyType || 'READY'}]`
        break

      case 'stepney-other':
        if (!data.targetVehicleId) {
          return res.status(400).json({ error: 'Target vehicle required' })
        }
        const targetV = await prisma.vehicle.findUnique({
          where: { id: data.targetVehicleId },
          include: {
            stepneys: {
              where: { status: 'STEPNEY' },
            },
          },
        })
        if (!targetV || targetV.stepneys.length >= targetV.stepneySlots) {
          return res.status(400).json({ error: 'No slots on target vehicle' })
        }
        updateData = {
          ...updateData,
          status: 'STEPNEY',
          stepneyVehicleId: data.targetVehicleId,
          stepneyDate: new Date(),
          stepneyType: data.stepneyType || 'READY',
          withRim: data.withRim !== false,
        }
        action = 'Stepney-Added'
        details = `${tyre.serial} -> stepney on ${targetV.reg} [${data.stepneyType || 'READY'}]`
        break

      case 'scrap':
        updateData = {
          ...updateData,
          status: 'SCRAPPED',
        }
        action = 'Scrapped'
        details = `${tyre.serial} unmounted from ${fromInfo} -> scrapped`
        break
    }

    const updatedTyre = await prisma.tyre.update({
      where: { id: tyreId },
      data: updateData,
      include: {
        images: true,
        location: true,
        stepneyVehicle: true,
      },
    })

    await prisma.history.create({
      data: {
        action,
        tyreId,
        vehicleId: tyre.vehicleId,
        axleIndex: tyre.axle?.sortOrder,
        position: tyre.position,
        details,
        userId: req.user!.id,
      },
    })

    res.json(updatedTyre)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Unmount failed' })
  }
})

// Rotate two tyres
router.post('/rotate', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      tyreId1: z.string(),
      tyreId2: z.string(),
    })

    const { tyreId1, tyreId2 } = schema.parse(req.body)

    const tyre1 = await prisma.tyre.findUnique({
      where: { id: tyreId1 },
      include: { vehicle: true, axle: true },
    })

    const tyre2 = await prisma.tyre.findUnique({
      where: { id: tyreId2 },
      include: { vehicle: true, axle: true },
    })

    if (!tyre1 || !tyre2 || tyre1.status !== 'MOUNTED' || tyre2.status !== 'MOUNTED') {
      return res.status(400).json({ error: 'Both tyres must be mounted' })
    }

    // Swap positions
    await prisma.tyre.update({
      where: { id: tyreId1 },
      data: {
        vehicleId: tyre2.vehicleId,
        axleId: tyre2.axleId,
        position: tyre2.position,
      },
    })

    await prisma.tyre.update({
      where: { id: tyreId2 },
      data: {
        vehicleId: tyre1.vehicleId,
        axleId: tyre1.axleId,
        position: tyre1.position,
      },
    })

    await prisma.history.create({
      data: {
        action: 'Rotated',
        tyreId: tyreId1,
        vehicleId: tyre2.vehicleId,
        axleIndex: tyre2.axle?.sortOrder,
        position: tyre2.position,
        details: `${tyre1.serial} -> Axle ${(tyre2.axle?.sortOrder || 0) + 1}/${tyre2.position}`,
        userId: req.user!.id,
      },
    })

    await prisma.history.create({
      data: {
        action: 'Rotated',
        tyreId: tyreId2,
        vehicleId: tyre1.vehicleId,
        axleIndex: tyre1.axle?.sortOrder,
        position: tyre1.position,
        details: `${tyre2.serial} -> Axle ${(tyre1.axle?.sortOrder || 0) + 1}/${tyre1.position}`,
        userId: req.user!.id,
      },
    })

    res.json({ message: 'Tyres rotated successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Rotation failed' })
  }
})

// Bulk mount - Quick fill
router.post('/bulk-mount', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      vehicleId: z.string(),
    })

    const { vehicleId } = schema.parse(req.body)

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        axles: {
          orderBy: { sortOrder: 'asc' },
          include: {
            tyres: {
              where: { status: 'MOUNTED' },
            },
          },
        },
      },
    })

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    // Get available tyres
    const availableTyres = await prisma.tyre.findMany({
      where: {
        OR: [
          { status: 'INVENTORY' },
          { status: 'REPAIR' },
        ],
      },
      orderBy: { createdAt: 'asc' },
    })

    let mountedCount = 0
    let tyreIndex = 0

    for (const axle of vehicle.axles) {
      const positions = getPositionLabels(axle.tyreCount)
      for (const position of positions) {
        const occupied = axle.tyres.some(t => t.position === position)
        if (!occupied && tyreIndex < availableTyres.length) {
          const tyre = availableTyres[tyreIndex]
          await prisma.tyre.update({
            where: { id: tyre.id },
            data: {
              status: 'MOUNTED',
              vehicleId,
              axleId: axle.id,
              position,
              mountingDate: new Date(),
              locationId: null,
            },
          })

          await prisma.history.create({
            data: {
              action: 'Mounted',
              tyreId: tyre.id,
              vehicleId,
              axleIndex: axle.sortOrder,
              position,
              details: `${tyre.serial} -> ${vehicle.reg} Axle ${axle.sortOrder + 1}/${position}`,
              userId: req.user!.id,
            },
          })

          tyreIndex++
          mountedCount++
        }
      }
    }

    res.json({ mountedCount })
  } catch (error) {
    res.status(500).json({ error: 'Bulk mount failed' })
  }
})

// Unmount all from vehicle
router.post('/unmount-all', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      vehicleId: z.string(),
      locationId: z.string().optional(),
    })

    const { vehicleId, locationId } = schema.parse(req.body)

    const mountedTyres = await prisma.tyre.findMany({
      where: {
        vehicleId,
        status: 'MOUNTED',
      },
    })

    const stepneyTyres = await prisma.tyre.findMany({
      where: {
        stepneyVehicleId: vehicleId,
        status: 'STEPNEY',
      },
    })

    const godownId = locationId || (await prisma.location.findFirst({
      where: { type: 'GODOWN' },
    }))?.id

    for (const tyre of mountedTyres) {
      await prisma.tyre.update({
        where: { id: tyre.id },
        data: {
          status: 'INVENTORY',
          vehicleId: null,
          axleId: null,
          position: null,
          mountingDate: null,
          locationId: godownId,
        },
      })

      await prisma.history.create({
        data: {
          action: 'Removed',
          tyreId: tyre.id,
          vehicleId,
          details: `${tyre.serial} removed (bulk)`,
          userId: req.user!.id,
        },
      })
    }

    for (const tyre of stepneyTyres) {
      await prisma.tyre.update({
        where: { id: tyre.id },
        data: {
          status: 'INVENTORY',
          stepneyVehicleId: null,
          stepneyDate: null,
          stepneyType: null,
          withRim: true,
          locationId: godownId,
        },
      })

      await prisma.history.create({
        data: {
          action: 'Stepney-Removed',
          tyreId: tyre.id,
          details: `${tyre.serial} stepney removed (bulk)`,
          userId: req.user!.id,
        },
      })
    }

    res.json({
      unmountedCount: mountedTyres.length,
      stepneyRemovedCount: stepneyTyres.length,
    })
  } catch (error) {
    res.status(500).json({ error: 'Unmount all failed' })
  }
})

// Stepney operations
router.post('/stepney/assign', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      tyreId: z.string(),
      vehicleId: z.string(),
      stepneyType: z.enum(['READY', 'BURST', 'CLAIM', 'PUNCTURE', 'RETREAD_CHECKUP']).default('READY'),
      withRim: z.boolean().default(true),
    })

    const { tyreId, vehicleId, stepneyType, withRim } = schema.parse(req.body)

    const tyre = await prisma.tyre.findUnique({
      where: { id: tyreId },
    })

    if (!tyre || (tyre.status !== 'INVENTORY' && tyre.status !== 'REPAIR')) {
      return res.status(400).json({ error: 'Tyre not available' })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        stepneys: {
          where: { status: 'STEPNEY' },
        },
      },
    })

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    if (vehicle.stepneys.length >= vehicle.stepneySlots) {
      return res.status(400).json({ error: 'All stepney slots filled' })
    }

    const updatedTyre = await prisma.tyre.update({
      where: { id: tyreId },
      data: {
        status: 'STEPNEY',
        stepneyVehicleId: vehicleId,
        stepneyDate: new Date(),
        stepneyType,
        withRim,
        vehicleId: null,
        axleId: null,
        position: null,
        mountingDate: null,
        locationId: null,
      },
      include: {
        images: true,
        stepneyVehicle: true,
      },
    })

    await prisma.history.create({
      data: {
        action: 'Stepney-Added',
        tyreId,
        vehicleId,
        details: `${tyre.serial} -> stepney on ${vehicle.reg} [${stepneyType}]`,
        userId: req.user!.id,
      },
    })

    res.json(updatedTyre)
  } catch (error) {
    res.status(500).json({ error: 'Stepney assignment failed' })
  }
})

// Return stepney to inventory
router.post('/stepney/return', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      tyreId: z.string(),
      locationId: z.string().optional(),
    })

    const { tyreId, locationId } = schema.parse(req.body)

    const tyre = await prisma.tyre.findUnique({
      where: { id: tyreId },
      include: { stepneyVehicle: true },
    })

    if (!tyre || tyre.status !== 'STEPNEY') {
      return res.status(400).json({ error: 'Not a stepney tyre' })
    }

    const godownId = locationId || (await prisma.location.findFirst({
      where: { type: 'GODOWN' },
    }))?.id

    const updatedTyre = await prisma.tyre.update({
      where: { id: tyreId },
      data: {
        status: 'INVENTORY',
        stepneyVehicleId: null,
        stepneyDate: null,
        stepneyType: null,
        withRim: true,
        locationId: godownId,
      },
      include: {
        location: true,
      },
    })

    await prisma.history.create({
      data: {
        action: 'Stepney-Removed',
        tyreId,
        details: `${tyre.serial} removed from stepney on ${tyre.stepneyVehicle?.reg || '?'} -> inventory`,
        userId: req.user!.id,
      },
    })

    res.json(updatedTyre)
  } catch (error) {
    res.status(500).json({ error: 'Return to inventory failed' })
  }
})

// Mount stepney to axle
router.post('/stepney/mount', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      tyreId: z.string(),
      axleId: z.string(),
      position: z.string(),
    })

    const { tyreId, axleId, position } = schema.parse(req.body)

    const tyre = await prisma.tyre.findUnique({
      where: { id: tyreId },
    })

    if (!tyre || tyre.status !== 'STEPNEY') {
      return res.status(400).json({ error: 'Not a stepney tyre' })
    }

    const axle = await prisma.axle.findUnique({
      where: { id: axleId },
      include: { vehicle: true },
    })

    if (!axle) {
      return res.status(404).json({ error: 'Axle not found' })
    }

    const existing = await prisma.tyre.findFirst({
      where: {
        vehicleId: axle.vehicleId,
        axleId,
        position,
        status: 'MOUNTED',
      },
    })

    if (existing) {
      return res.status(400).json({ error: 'Position occupied' })
    }

    const updatedTyre = await prisma.tyre.update({
      where: { id: tyreId },
      data: {
        status: 'MOUNTED',
        vehicleId: axle.vehicleId,
        axleId,
        position,
        mountingDate: new Date(),
        stepneyVehicleId: null,
        stepneyDate: null,
        stepneyType: null,
        withRim: true,
        locationId: null,
      },
      include: {
        vehicle: true,
        axle: true,
      },
    })

    await prisma.history.create({
      data: {
        action: 'Mounted',
        tyreId,
        vehicleId: axle.vehicleId,
        axleIndex: axle.sortOrder,
        position,
        details: `${tyre.serial} moved from stepney -> ${axle.vehicle.reg} Axle ${axle.sortOrder + 1}/${position}`,
        userId: req.user!.id,
      },
    })

    res.json(updatedTyre)
  } catch (error) {
    res.status(500).json({ error: 'Mount stepney failed' })
  }
})

// Helper function
function getPositionLabels(tc: number): string[] {
  switch (tc) {
    case 1: return ['S']
    case 2: return ['L', 'R']
    case 4: return ['L1', 'L2', 'R1', 'R2']
    case 6: return ['L1', 'L2', 'L3', 'R1', 'R2', 'R3']
    case 8: return ['L1', 'L2', 'L3', 'L4', 'R1', 'R2', 'R3', 'R4']
    default: return Array.from({ length: tc }, (_, i) => `P${i + 1}`)
  }
}

export default router
