import express from 'express';
import { getOffers, createOffer, updateOffer, deleteOffer } from '../controllers/offerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getOffers)
  .post(protect, authorize('Shop Owner', 'Mall Admin', 'Super Admin'), createOffer);

router.route('/:id')
  .put(protect, authorize('Shop Owner', 'Mall Admin', 'Super Admin'), updateOffer)
  .delete(protect, authorize('Shop Owner', 'Mall Admin', 'Super Admin'), deleteOffer);

export default router;
