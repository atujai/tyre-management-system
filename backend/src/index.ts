import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Routes
import authRoutes from './routes/auth.js'
import vehicleRoutes from './routes/vehicles.js'
import makeRoutes from './routes/makes.js'
import vehicleTypeRoutes from './routes/vehicle-types.js'
import locationRoutes from './routes/locations.js'
import tyreRoutes from './routes/tyres.js'
import allotmentRoutes from './routes/allotment.js'
import historyRoutes from './routes/history.js'
import dashboardRoutes from './routes/dashboard.js'

app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/makes', makeRoutes)
app.use('/api/vehicle-types', vehicleTypeRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/tyres', tyreRoutes)
app.use('/api/allotment', allotmentRoutes)
app.use('/api/history', historyRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📁 Uploads directory: ${path.join(process.cwd(), 'uploads')}`)
})

export default app