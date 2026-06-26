// routes/location.routes.ts — COMPLETE FINAL FILE
import { Router } from 'express';
import { locationController, transferController, alertController } from '../controllers/location.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Location CRUD
router.get('/', locationController.getAll);
router.get('/:id', locationController.getById);
router.get('/:id/inventory', locationController.getInventory);
router.get('/:id/tyres', locationController.getTyres);
router.get('/:id/transferable-tyres', locationController.getTransferableTyres);
router.get('/:id/transfers', locationController.getTransferHistory);
router.get('/:id/report/data', locationController.getReportData);
router.get('/:id/report/pdf', locationController.generatePDF);
router.post('/', locationController.create);
router.patch('/:id', locationController.update);
router.delete('/:id', locationController.delete);

export default router;

// Transfer routes
export const transferRouter = Router();
transferRouter.use(authenticate);
transferRouter.post('/bulk', transferController.bulkTransfer);

// Alert routes
export const alertRouter = Router();
alertRouter.use(authenticate);
alertRouter.get('/', alertController.getAlerts);
alertRouter.get('/thresholds', alertController.getThresholds);
alertRouter.post('/thresholds', alertController.setThreshold);
alertRouter.delete('/thresholds/:id', alertController.deleteThreshold);
alertRouter.patch('/:id/acknowledge', alertController.acknowledgeAlert);
alertRouter.patch('/:id/resolve', alertController.resolveAlert);
alertRouter.post('/check', alertController.checkStock);
