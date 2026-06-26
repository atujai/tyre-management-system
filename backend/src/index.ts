import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || '0.0.0.0'

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Routes
import authRoutes from './routes/auth.js'
import vehicleRoutes from './routes/vehicles.js'
import makeRoutes from './routes/makes.js'
import vehicleTypeRoutes from './routes/vehicle-types.js'
import locationRoutes from './routes/locations.js'
import { transferRouter, alertRouter } from './routes/location-features.js'
import tyreRoutes from './routes/tyres.js'
import allotmentRoutes from './routes/allotment.js'
import historyRoutes from './routes/history.js'
import dashboardRoutes from './routes/dashboard.js'
import gpsRoutes from './routes/gps.js'

// Only import challans if the file exists
let challanRoutes: any = null
try {
  const { default: cr } = await import('./routes/challans.js')
  challanRoutes = cr
} catch {
  console.log('⚠️ challans routes not found, skipping')
}

app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/makes', makeRoutes)
app.use('/api/vehicle-types', vehicleTypeRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/transfers', transferRouter)
app.use('/api/alerts', alertRouter)
app.use('/api/tyres', tyreRoutes)
app.use('/api/allotment', allotmentRoutes)
app.use('/api/history', historyRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/gps', gpsRoutes)
if (challanRoutes) app.use('/api/challans', challanRoutes)

// Only import cron if file exists
try {
  await import('./jobs/challanCron.js')
} catch {
  console.log('⚠️ challanCron not found, skipping')
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// Create HTTP server and attach WebSocket
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket client connected')

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString())
      console.log('📨 WS message:', msg)

      // Handle AUTH
      if (msg.type === 'AUTH' && msg.token) {
        ws.send(JSON.stringify({ type: 'AUTH_SUCCESS' }))
      }

      // Handle SUBSCRIBE
      if (msg.type === 'SUBSCRIBE' && msg.channel) {
        ws.send(JSON.stringify({ type: 'SUBSCRIBED', channel: msg.channel }))
      }

      // Broadcast to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ ...msg, timestamp: new Date().toISOString() }))
        }
      })
    } catch (err) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON' }))
    }
  })

  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected')
  })

  ws.on('error', (err) => {
    console.error('WebSocket error:', err)
  })

  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Welcome to Tyre Management WS' }))
})

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`)
  console.log(`📡 WebSocket running on ws://${HOST}:${PORT}/ws`)
})

export default app