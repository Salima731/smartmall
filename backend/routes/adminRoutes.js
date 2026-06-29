import express from 'express';
import {
  getDashboardStats,
  getActivityLogs,
  getSystemSettings,
  updateSystemSettings,
  sendGlobalAnnouncement,
  assignMallAdmin,
  updateShopStatus,
  updateProductStatus,
  updateOfferStatus,
  getMonitoringOps,
  updateMallStatus
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply Super Admin protection globally to all admin routes
router.use(protect, authorize('Super Admin'));

router.get('/stats', getDashboardStats);
router.get('/logs', getActivityLogs);
router.route('/settings')
  .get(getSystemSettings)
  .put(updateSystemSettings);

router.post('/announcements', sendGlobalAnnouncement);
router.post('/assign-mall-admin', assignMallAdmin);
router.get('/monitoring', getMonitoringOps);

router.put('/malls/:id/status', updateMallStatus);
router.put('/shops/:id/status', updateShopStatus);
router.put('/products/:id/status', updateProductStatus);
router.put('/offers/:id/status', updateOfferStatus);

export default router;
