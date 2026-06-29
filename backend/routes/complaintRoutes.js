import express from 'express';
import { createComplaint, getComplaints, updateComplaint } from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createComplaint)
  .get(protect, getComplaints);

router.route('/:id')
  .put(protect, authorize('Super Admin', 'Mall Admin', 'Staff'), updateComplaint);

export default router;
