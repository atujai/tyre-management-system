import express from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import documentController from '../controllers/documentController';

const router = express.Router();

router.use(authenticate);

router.get('/truck/:truckId', documentController.getByTruck);
router.get('/expiring', documentController.getExpiring);
router.get('/dashboard', documentController.getDashboard);
router.get('/:id', documentController.getById);

router.post('/', upload.single('file'), documentController.create);
router.put('/:id', upload.single('file'), documentController.update);
router.delete('/:id', documentController.delete);

router.post('/:id/renew', documentController.renew);
router.post('/:id/remind', documentController.sendReminder);

export default router;