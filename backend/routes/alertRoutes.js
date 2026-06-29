import express from 'express';
import { getAlerts, createAlert, deactivateAlert } from '../controllers/alertController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/mall/:mallId', getAlerts);
router.post('/', protect, authorize('Mall Admin', 'Super Admin'), createAlert);
router.put('/:id/deactivate', protect, authorize('Mall Admin', 'Super Admin'), deactivateAlert);

export default router;
