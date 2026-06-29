import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, createNotification } from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getNotifications)
  .post(protect, authorize('Staff', 'Shop Owner', 'Mall Admin', 'Super Admin'), createNotification); 

router.route('/read-all')
  .put(protect, markAllAsRead);

router.route('/:id/read')
  .put(protect, markAsRead);

export default router;
