import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const router = Router()

const tyreSchema = z.object({
  serial: z.string().min(1),
  brand: z.string().min(1),
  size: z.string().min(1),
  pattern: z.string().optional(),
  purchaseDate: z.string().optional(),
  initialTread: z.number().min(0).default(20),
  currentTread: z.number().min(0).default(20),
  status: z.enum(['MOUNTED', 'INVENTORY', 'STEPNEY', 'WORN', 'DAMAGED', 'REPAIR', 'SCRAPPED']).default('INVENTORY'),
  cost: z.number().optional(),
  remarks: z.string().optional(),
  locationId: z.string().optional(),
  withRim: z.boolean().default(true),
})

// Get all tyres with filtering
router.get('/', authenticate, async (req, res) => {
  const { status, locationId, search } = req.query

  const where: any = {}

  if (status && status !== 'all') {
    where.status = status
  }

  if (locationId && locationId !== 'all') {
    where.locationId = locationId
  }

  if (search) {
    where.OR = [
      { serial: { contains: search as string, mode: 'insensitive' } },
      { brand: { contains: search as string, mode: 'insensitive' } },
    ]
  }

  const tyres = await prisma.tyre.findMany({
    where,
    include: {
      images: true,
      vehicle: {
        select: { id: true, reg: true, type: true },
      },
      location: {
        select: { id: true, name: true, type: true },
      },
      stepneyVehicle: {
        select: { id: true, reg: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(tyres)
})

// Get single tyre
router.get('/:id', authenticate, async (req, res) => {
  const tyre = await prisma.tyre.findUnique({
    where: { id: req.params.id },
    include: {
      images: true,
      vehicle: true,
      axle: true,
      location: true,
      stepneyVehicle: true,
      history: {
        orderBy: { date: 'desc' },
        take: 20,
      },
    },
  })

  if (!tyre) {
    return res.status(404).json({ error: 'Tyre not found' })
  }

  res.json(tyre)
})

// Create tyre with optional image
router.post('/', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const data = tyreSchema.parse(req.body)

    // Process images with sharp
    const imageUrls: string[] = []
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const outputPath = file.path.replace(path.extname(file.path), '_optimized.webp')
        await sharp(file.path)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath)

        // Remove original
        fs.unlinkSync(file.path)
        imageUrls.push('/uploads/tyres/' + path.basename(outputPath))
      }
    }

    const tyre = await prisma.tyre.create({
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        images: {
          create: imageUrls.map(url => ({
            url,
            type: (req.body.imageType as any) || 'TYRE',
          })),
        },
      },
      include: {
        images: true,
        location: true,
      },
    })

    // Log creation
    await prisma.history.create({
      data: {
        action: 'Purchased',
        tyreId: tyre.id,
        details: `${tyre.serial} added to inventory`,
        userId: req.user!.id,
      },
    })

    res.status(201).json(tyre)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Serial number already exists' })
    }
    res.status(500).json({ error: 'Failed to create tyre' })
  }
})

// Update tyre
router.put('/:id', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const data = tyreSchema.partial().parse(req.body)

    // Process new images
    const imageUrls: string[] = []
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const outputPath = file.path.replace(path.extname(file.path), '_optimized.webp')
        await sharp(file.path)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath)

        fs.unlinkSync(file.path)
        imageUrls.push('/uploads/tyres/' + path.basename(outputPath))
      }
    }

    const updateData: any = {
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
    }

    if (imageUrls.length > 0) {
      updateData.images = {
        create: imageUrls.map(url => ({
          url,
          type: (req.body.imageType as any) || 'TYRE',
        })),
      }
    }

    const tyre = await prisma.tyre.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        images: true,
        location: true,
      },
    })

    res.json(tyre)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Failed to update tyre' })
  }
})

// Delete tyre image
router.delete('/:id/images/:imageId', authenticate, async (req, res) => {
  try {
    const image = await prisma.tyreImage.findUnique({
      where: { id: req.params.imageId },
    })

    if (!image) {
      return res.status(404).json({ error: 'Image not found' })
    }

    // Delete file
    const filePath = path.join(process.cwd(), image.url.replace('/uploads/', 'uploads/'))
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await prisma.tyreImage.delete({
      where: { id: req.params.imageId },
    })

    res.json({ message: 'Image deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

// Delete tyre
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const tyre = await prisma.tyre.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    })

    if (!tyre) {
      return res.status(404).json({ error: 'Tyre not found' })
    }

    if (tyre.status === 'MOUNTED' || tyre.status === 'STEPNEY') {
      return res.status(400).json({ error: 'Cannot delete tyre that is mounted or assigned as stepney' })
    }

    // Delete associated images
    for (const image of tyre.images) {
      const filePath = path.join(process.cwd(), image.url.replace('/uploads/', 'uploads/'))
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await prisma.tyre.delete({
      where: { id: req.params.id },
    })

    res.json({ message: 'Tyre deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tyre' })
  }
})

export default router
