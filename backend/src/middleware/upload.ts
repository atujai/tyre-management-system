import multer from 'multer'
import path from 'path'
import { Request } from 'express'
import fs from 'fs'

const uploadDir = process.env.UPLOAD_DIR || 'uploads'

const dirs = ['tyres', 'documents']
dirs.forEach(dir => {
  const fullPath = path.join(uploadDir, dir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
  }
})

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const type = req.body.imageType || 'tyres'
    const dest = path.join(uploadDir, type === 'DOCUMENT' ? 'documents' : 'tyres')
    cb(null, dest)
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF allowed.'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
})
