import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// GET /api/vehicle-types
router.get('/', authenticate, async (req, res) => {
  const types = await prisma.vehicleType.findMany({ orderBy: { name: 'asc' } })
  res.json(types)
})

// POST /api/vehicle-types
router.post('/', authenticate, async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })
  try {
    const type = await prisma.vehicleType.create({ data: { name } })
    res.json(type)
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Vehicle type already exists' })
    res.status(500).json({ error: 'Failed to create vehicle type' })
  }
})

// PUT /api/vehicle-types/:id
router.put('/:id', authenticate, async (req, res) => {
  const { name } = req.body
  try {
    const type = await prisma.vehicleType.update({ where: { id: req.params.id }, data: { name } })
    res.json(type)
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Vehicle type name already exists' })
    res.status(500).json({ error: 'Failed to update vehicle type' })
  }
})

// DELETE /api/vehicle-types/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.vehicleType.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e: any) {
    if (e.code === 'P2003') return res.status(400).json({ error: 'Cannot delete type in use by vehicles' })
    res.status(500).json({ error: 'Failed to delete vehicle type' })
  }
})

export default router