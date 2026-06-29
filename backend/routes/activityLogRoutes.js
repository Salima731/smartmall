import express from 'express';
import { getActivityLogs } from '../controllers/activityLogController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('Super Admin', 'Mall Admin', 'Shop Owner', 'Staff'), getActivityLogs);

export default router;
