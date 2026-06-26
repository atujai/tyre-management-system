import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { transferController, alertController } from '../controllers/location.controller.js'

const transferRouter = Router()
transferRouter.use(authenticate)
transferRouter.post('/bulk', transferController.bulkTransfer)

const alertRouter = Router()
alertRouter.use(authenticate)
alertRouter.get('/', alertController.getAlerts)
alertRouter.get('/thresholds', alertController.getThresholds)
alertRouter.post('/thresholds', alertController.setThreshold)
alertRouter.delete('/thresholds/:id', alertController.deleteThreshold)
alertRouter.patch('/:id/acknowledge', alertController.acknowledgeAlert)
alertRouter.patch('/:id/resolve', alertController.resolveAlert)
alertRouter.post('/check', alertController.checkStock)

export { transferRouter, alertRouter }
