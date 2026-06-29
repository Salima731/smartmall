import express from 'express';
import {
  getMalls,
  getNearbyMalls,
  createMall,
  getMallById,
  updateMall,
  deleteMall,
  getCrowdDensity
} from '../controllers/mallController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getMalls).post(protect, authorize('Super Admin'), createMall);
router.get('/nearby', getNearbyMalls);
router.get('/:id/crowd-density', getCrowdDensity);
router.route('/:id')
  .get(getMallById)
  .put(protect, authorize('Mall Admin', 'Super Admin'), updateMall)
  .delete(protect, authorize('Super Admin'), deleteMall);

export default router;
