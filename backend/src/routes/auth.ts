import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

const loginSchema = z.object({
  name: z.string().min(2),
  password: z.string().min(6),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
  permissions: z.object({
    dashboard: z.boolean().default(true),
    vehicles: z.boolean().default(true),
    locations: z.boolean().default(true),
    tyres: z.boolean().default(true),
    allotment: z.boolean().default(true),
    stepney: z.boolean().default(true),
    history: z.boolean().default(true),
    users: z.boolean().default(false),
  }).optional(),
})

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
  permissions: z.object({
    dashboard: z.boolean().optional(),
    vehicles: z.boolean().optional(),
    locations: z.boolean().optional(),
    tyres: z.boolean().optional(),
    allotment: z.boolean().optional(),
    stepney: z.boolean().optional(),
    history: z.boolean().optional(),
    users: z.boolean().optional(),
  }).optional(),
})

function formatZodErrors(error: z.ZodError): string {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { name, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findFirst({
      where: { name },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodErrors(error) })
    }
    res.status(500).json({ error: 'Login failed' })
  }
})

// Register (Admin only)
router.post('/register', authenticate, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role, permissions } = registerSchema.parse(req.body)

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { name }] },
    })

    if (existing) {
      return res.status(400).json({ error: 'Email or name already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const defaultPermissions = role === 'ADMIN'
      ? {
          dashboard: true,
          vehicles: true,
          locations: true,
          tyres: true,
          allotment: true,
          stepney: true,
          history: true,
          users: true,
        }
      : {
          dashboard: true,
          vehicles: true,
          locations: true,
          tyres: true,
          allotment: true,
          stepney: true,
          history: true,
          users: false,
        }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        permissions: permissions || defaultPermissions,
      },
    })

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodErrors(error) })
    }
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user })
})

// List all users (Admin only)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      permissions: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(users)
})

// Toggle user active status (Admin only)
router.patch('/users/:id/toggle', authenticate, requireAdmin, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !user.isActive },
  })

  res.json(updated)
})

// Update user (Admin only)
router.patch('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, role, password, permissions } = updateSchema.parse(req.body)

    const existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check email uniqueness if changing email
    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      })
      if (emailTaken) {
        return res.status(400).json({ error: 'Email already in use' })
      }
    }

    // Check name uniqueness if changing name
    if (name && name !== existing.name) {
      const nameTaken = await prisma.user.findFirst({
        where: { name },
      })
      if (nameTaken) {
        return res.status(400).json({ error: 'Name already in use' })
      }
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (password) updateData.password = await bcrypt.hash(password, 12)
    if (permissions) updateData.permissions = permissions

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        permissions: true,
        createdAt: true,
      },
    })

    res.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodErrors(error) })
    }
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Delete user (Admin only)
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    await prisma.user.delete({
      where: { id },
    })

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router