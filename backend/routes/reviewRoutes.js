import express from 'express';
import { 
  getReviews, 
  getAllReviews, 
  createReview, 
  moderateReview, 
  getAverageRating, 
  getMyReviews,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Private user route (must be before :targetType/:targetId to avoid routing conflicts)
router.get('/myreviews', protect, getMyReviews);

// Public routes
router.get('/:targetType/:targetId', getReviews);
router.get('/avg/:targetType/:targetId', getAverageRating);

// Admin and Shop Owner routes
router.get('/', protect, authorize('Super Admin', 'Mall Admin', 'Shop Owner'), getAllReviews);
router.put('/:id/moderate', protect, authorize('Super Admin', 'Mall Admin'), moderateReview);

// User routes
router.post('/', protect, createReview);
router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

export default router;
