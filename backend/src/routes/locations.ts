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

export default router
