import express from 'express';
import { getRestrooms, updateRestroom, addMaintenanceReport, addComplaint, emergencyMaintenance, createRestroom, deleteRestroom } from '../controllers/restroomController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Mall Admin', 'Super Admin'), createRestroom);
router.get('/mall/:mallId', getRestrooms);
router.put('/:id', protect, authorize('Staff', 'Mall Admin', 'Super Admin'), updateRestroom);
router.delete('/:id', protect, authorize('Mall Admin', 'Super Admin'), deleteRestroom);
router.post('/:id/maintenance', protect, authorize('Staff', 'Mall Admin', 'Super Admin'), addMaintenanceReport);
router.post('/:id/complaint', addComplaint);
router.post('/mall/:mallId/emergency', protect, authorize('Mall Admin', 'Super Admin'), emergencyMaintenance);

export default router;
