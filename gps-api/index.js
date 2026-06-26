import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3001
const HOST = '0.0.0.0'

// Mock GPS fleet data
const mockDevices = [
  { id: 'GPS-001', name: 'Truck 1', lat: 28.6139, lng: 77.2090, speed: 45, status: 'moving', lastUpdate: new Date().toISOString() },
  { id: 'GPS-002', name: 'Truck 2', lat: 28.7041, lng: 77.1025, speed: 0, status: 'parked', lastUpdate: new Date().toISOString() },
  { id: 'GPS-003', name: 'Truck 3', lat: 19.0760, lng: 72.8777, speed: 60, status: 'moving', lastUpdate: new Date().toISOString() },
]

// Dashboard stats
app.get('/api/gps/stats', (req, res) => {
  res.json({
    totalDevices: mockDevices.length,
    active: mockDevices.filter(d => d.status === 'moving').length,
    alerts: 0,
    offline: 0
  })
})

// Fleet overview
app.get('/api/gps/fleet', (req, res) => {
  res.json(mockDevices)
})

// Get device by ID
app.get('/api/gps/devices/:id', (req, res) => {
  const device = mockDevices.find(d => d.id === req.params.id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  res.json(device)
})

// Location history
app.get('/api/gps/devices/:id/history', (req, res) => {
  const { start, end } = req.query
  res.json([
    { lat: 28.6139, lng: 77.2090, timestamp: new Date(Date.now() - 3600000).toISOString(), speed: 45 },
    { lat: 28.6200, lng: 77.2150, timestamp: new Date(Date.now() - 1800000).toISOString(), speed: 50 },
    { lat: 28.6300, lng: 77.2200, timestamp: new Date().toISOString(), speed: 48 },
  ])
})

// Trips
app.get('/api/gps/devices/:id/trips', (req, res) => {
  res.json([
    { id: 'T1', startTime: new Date(Date.now() - 86400000).toISOString(), endTime: new Date(Date.now() - 43200000).toISOString(), distance: 125.5, duration: 28800 }
  ])
})

// Alerts
app.get('/api/gps/devices/:id/alerts', (req, res) => {
  res.json([])
})

// Acknowledge alert
app.post('/api/gps/alerts/:id/acknowledge', (req, res) => {
  res.json({ success: true, alertId: req.params.id })
})

// Geofence
app.post('/api/gps/devices/:id/geofence', (req, res) => {
  res.json({ success: true, deviceId: req.params.id, ...req.body })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gps-api', timestamp: new Date().toISOString() })
})

app.listen(PORT, HOST, () => {
  console.log(`🛰️ GPS API running on http://${HOST}:${PORT}`)
  console.log(`📡 Endpoints:`)
  console.log(`   GET  /api/gps/stats`)
  console.log(`   GET  /api/gps/fleet`)
  console.log(`   GET  /api/gps/devices/:id`)
  console.log(`   GET  /api/gps/devices/:id/history`)
  console.log(`   GET  /api/gps/devices/:id/trips`)
  console.log(`   GET  /api/gps/devices/:id/alerts`)
  console.log(`   POST /api/gps/alerts/:id/acknowledge`)
  console.log(`   POST /api/gps/devices/:id/geofence`)
})