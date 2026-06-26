import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const locationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['GODOWN', 'RETREADER']),
  address: z.string().optional(),
  contact: z.string().optional(),
})

router.get('/', authenticate, async (req, res) => {
  const locations = await prisma.location.findMany({
    include: {
      _count: {
        select: {
          tyres: {
            where: {
              status: {
                in: ['INVENTORY', 'REPAIR'],
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(locations)
})

router.post('/', authenticate, async (req, res) => {
  try {
    const data = locationSchema.parse(req.body)

    const location = await prisma.location.create({
      data,
    })

    res.status(201).json(location)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Failed to create location' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const data = locationSchema.parse(req.body)

    const location = await prisma.location.update({
      where: { id: req.params.id },
      data,
    })

    res.json(location)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Failed to update location' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const tyreCount = await prisma.tyre.count({
      where: { locationId: req.params.id },
    })

    if (tyreCount > 0) {
      return res.status(400).json({ error: 'Cannot delete location with tyres' })
    }

    await prisma.location.delete({
      where: { id: req.params.id },
    })

    res.json({ message: 'Location deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete location' })
  }
})

// ========== NEW ENDPOINTS FOR LOCATION DETAIL VIEW ==========

// Get inventory breakdown for a location
router.get('/:id/inventory', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const location = await prisma.location.findUnique({ where: { id } })
    if (!location) return res.status(404).json({ error: 'Location not found' })

    const tyres = await prisma.tyre.findMany({
      where: { locationId: id },
      include: { vehicle: { select: { registrationNumber: true } } },
    })

    const sizeMap = new Map<string, any>()
    tyres.forEach((tyre) => {
      const key = `${tyre.size}-${tyre.brand}-${tyre.pattern || 'default'}`
      if (!sizeMap.has(key)) {
        sizeMap.set(key, {
          size: tyre.size,
          brand: tyre.brand,
          pattern: tyre.pattern || 'Standard',
          total: 0,
          withRim: 0,
          withoutRim: 0,
          conditions: {} as Record<string, any>,
        })
      }
      const group = sizeMap.get(key)
      group.total += 1
      tyre.hasRim ? group.withRim++ : group.withoutRim++
      const condition = tyre.condition || 'NEW'
      if (!group.conditions[condition]) {
        group.conditions[condition] = { count: 0, withRim: 0, withoutRim: 0 }
      }
      group.conditions[condition].count++
      tyre.hasRim ? group.conditions[condition].withRim++ : group.conditions[condition].withoutRim++
    })

    const summary = {
      totalTyres: tyres.length,
      totalWithRim: tyres.filter(t => t.hasRim).length,
      totalWithoutRim: tyres.filter(t => !t.hasRim).length,
      byCondition: {} as Record<string, number>,
    }

    const conditions = ['NEW', 'REPAIR', 'RETREAD', 'WORN', 'SCRAP', 'REJECTED']
    conditions.forEach(c => summary.byCondition[c] = tyres.filter(t => t.condition === c).length)

    res.json({ location, summary, bySize: Array.from(sizeMap.values()) })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
})

// Get tyres at location with filters
router.get('/:id/tyres', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { condition, size, hasRim, search } = req.query

    const where: any = { locationId: id }
    if (condition) where.condition = condition
    if (size) where.size = size
    if (hasRim !== undefined) where.hasRim = hasRim === 'true'
    if (search) {
      where.OR = [
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
        { brand: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    const tyres = await prisma.tyre.findMany({
      where,
      include: { vehicle: { select: { registrationNumber: true } }, location: true },
      orderBy: { createdAt: 'desc' },
    })

    res.json(tyres)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tyres' })
  }
})

// Get tyres available for transfer
router.get('/:id/transferable-tyres', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { condition, size, search } = req.query

    const where: any = { locationId: id }
    if (condition) where.condition = condition
    if (size) where.size = size
    if (search) {
      where.OR = [
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
        { brand: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    const tyres = await prisma.tyre.findMany({
      where,
      select: { id: true, serialNumber: true, brand: true, size: true, condition: true, hasRim: true },
      orderBy: { serialNumber: 'asc' },
    })

    res.json(tyres.map(t => ({ tyreId: t.id, ...t })))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tyres' })
  }
})

// Get transfer history
router.get('/:id/transfers', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { direction } = req.query

    const where: any = {}
    if (direction === 'IN') where.toLocationId = id
    else if (direction === 'OUT') where.fromLocationId = id
    else where.OR = [{ fromLocationId: id }, { toLocationId: id }]

    const transfers = await prisma.transferHistory.findMany({
      where,
      include: {
        fromLocation: true,
        toLocation: true,
        tyre: { select: { id: true, serialNumber: true, brand: true, size: true } },
        transferredBy: { select: { id: true, name: true } },
      },
      orderBy: { transferDate: 'desc' },
      take: 50,
    })

    res.json(transfers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transfer history' })
  }
})

// Get report preview data
router.get('/:id/report/data', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const location = await prisma.location.findUnique({ where: { id } })
    if (!location) return res.status(404).json({ error: 'Location not found' })

    const tyres = await prisma.tyre.findMany({ where: { locationId: id } })
    const sizeMap = new Map()
    tyres.forEach(t => {
      const key = `${t.size}-${t.brand}-${t.pattern || 'default'}`
      if (!sizeMap.has(key)) sizeMap.set(key, { size: t.size, brand: t.brand, pattern: t.pattern || 'Standard', total: 0, withRim: 0, withoutRim: 0, conditions: {} })
      const g = sizeMap.get(key); g.total++; t.hasRim ? g.withRim++ : g.withoutRim++
    })

    const summary = {
      totalTyres: tyres.length,
      totalWithRim: tyres.filter(t => t.hasRim).length,
      totalWithoutRim: tyres.filter(t => !t.hasRim).length,
      byCondition: {} as Record<string, number>,
    }
    const conditions = ['NEW', 'REPAIR', 'RETREAD', 'WORN', 'SCRAP', 'REJECTED']
    conditions.forEach(c => summary.byCondition[c] = tyres.filter(t => t.condition === c).length)

    const transfersIn = await prisma.transferHistory.findMany({
      where: { toLocationId: id },
      include: { fromLocation: true, toLocation: true, tyre: { select: { serialNumber: true, brand: true, size: true } }, transferredBy: { select: { name: true } } },
      orderBy: { transferDate: 'desc' }, take: 10,
    })

    const transfersOut = await prisma.transferHistory.findMany({
      where: { fromLocationId: id },
      include: { fromLocation: true, toLocation: true, tyre: { select: { serialNumber: true, brand: true, size: true } }, transferredBy: { select: { name: true } } },
      orderBy: { transferDate: 'desc' }, take: 10,
    })

    res.json({
      location,
      generatedAt: new Date().toISOString(),
      generatedBy: (req as any).user?.name || 'System',
      summary,
      bySize: Array.from(sizeMap.values()),
      transfersIn,
      transfersOut,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report data' })
  }
})

// Generate PDF report
router.get('/:id/report/pdf', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const location = await prisma.location.findUnique({ where: { id } })
    if (!location) return res.status(404).json({ error: 'Location not found' })

    const tyres = await prisma.tyre.findMany({ where: { locationId: id } })
    const sizeMap = new Map()
    tyres.forEach(t => {
      const key = `${t.size}-${t.brand}-${t.pattern || 'default'}`
      if (!sizeMap.has(key)) sizeMap.set(key, { size: t.size, brand: t.brand, pattern: t.pattern || 'Standard', total: 0, withRim: 0, withoutRim: 0, conditions: {} })
      const g = sizeMap.get(key); g.total++; t.hasRim ? g.withRim++ : g.withoutRim++
    })

    const summary = {
      totalTyres: tyres.length,
      totalWithRim: tyres.filter(t => t.hasRim).length,
      totalWithoutRim: tyres.filter(t => !t.hasRim).length,
      byCondition: {} as Record<string, number>,
    }
    const conditions = ['NEW', 'REPAIR', 'RETREAD', 'WORN', 'SCRAP', 'REJECTED']
    conditions.forEach(c => summary.byCondition[c] = tyres.filter(t => t.condition === c).length)

    // Return JSON for now (PDF generation can be added later)
    res.json({
      location,
      generatedAt: new Date().toISOString(),
      generatedBy: (req as any).user?.name || 'System',
      summary,
      bySize: Array.from(sizeMap.values()),
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
})

export default router