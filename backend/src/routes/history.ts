import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  const { limit = '50', offset = '0', vehicleId, tyreId } = req.query

  const where: any = {}
  if (vehicleId) where.vehicleId = vehicleId as string
  if (tyreId) where.tyreId = tyreId as string

  const [history, total] = await Promise.all([
    prisma.history.findMany({
      where,
      include: {
        tyre: {
          select: { serial: true, brand: true },
        },
        vehicle: {
          select: { reg: true, type: true },
        },
        user: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    }),
    prisma.history.count({ where }),
  ])

  res.json({ history, total })
})

router.delete('/clear', authenticate, async (req, res) => {
  await prisma.history.deleteMany({})
  res.json({ message: 'History cleared' })
})

export default router
