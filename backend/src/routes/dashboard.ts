import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/stats', authenticate, async (req, res) => {
  const [
    vehicleCount,
    tyreCount,
    mountedCount,
    inventoryCount,
    stepneyCount,
    wornCount,
    damagedCount,
    repairCount,
    scrappedCount,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.tyre.count(),
    prisma.tyre.count({ where: { status: 'MOUNTED' } }),
    prisma.tyre.count({ where: { status: 'INVENTORY' } }),
    prisma.tyre.count({ where: { status: 'STEPNEY' } }),
    prisma.tyre.count({ where: { status: 'WORN' } }),
    prisma.tyre.count({ where: { status: 'DAMAGED' } }),
    prisma.tyre.count({ where: { status: 'REPAIR' } }),
    prisma.tyre.count({ where: { status: 'SCRAPPED' } }),
  ])

  const stepneyBreakdown = await prisma.tyre.groupBy({
    by: ['stepneyType'],
    where: { status: 'STEPNEY' },
    _count: { id: true },
  })

  const recentActivity = await prisma.history.findMany({
    take: 10,
    orderBy: { date: 'desc' },
    include: {
      tyre: { select: { serial: true } },
      vehicle: { select: { reg: true } },
      user: { select: { name: true } },
    },
  })

  res.json({
    counts: {
      vehicles: vehicleCount,
      totalTyres: tyreCount,
      mounted: mountedCount,
      inventory: inventoryCount,
      stepney: stepneyCount,
      worn: wornCount,
      damaged: damagedCount,
      repair: repairCount,
      scrapped: scrappedCount,
    },
    stepneyBreakdown,
    recentActivity,
  })
})

export default router
