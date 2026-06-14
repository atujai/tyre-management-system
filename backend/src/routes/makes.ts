import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// GET /api/makes
router.get('/', authenticate, async (req, res) => {
  const makes = await prisma.make.findMany({ orderBy: { name: 'asc' } })
  res.json(makes)
})

// POST /api/makes
router.post('/', authenticate, async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })
  try {
    const make = await prisma.make.create({ data: { name } })
    res.json(make)
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Make already exists' })
    res.status(500).json({ error: 'Failed to create make' })
  }
})

// PUT /api/makes/:id
router.put('/:id', authenticate, async (req, res) => {
  const { name } = req.body
  try {
    const make = await prisma.make.update({ where: { id: req.params.id }, data: { name } })
    res.json(make)
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Make name already exists' })
    res.status(500).json({ error: 'Failed to update make' })
  }
})

// DELETE /api/makes/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.make.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e: any) {
    if (e.code === 'P2003') return res.status(400).json({ error: 'Cannot delete make in use by vehicles' })
    res.status(500).json({ error: 'Failed to delete make' })
  }
})

export default router