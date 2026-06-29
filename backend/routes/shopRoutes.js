import express from 'express';
import {
  getShopsByMall,
  getManagedShops,
  getMyShop,
  globalSearch,
  createShop,
  getShops,
  updateShop,
  deleteShop,
  getShopById
} from '../controllers/shopController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getShops);
router.get('/search', globalSearch);
router.get('/managed', protect, authorize('Mall Admin', 'Super Admin'), getManagedShops);
router.get('/my-shop', protect, authorize('Shop Owner'), getMyShop);
router.get('/mall/:mallId', getShopsByMall);
router.route('/')
  .get(getShops)
  .post(protect, authorize('Mall Admin', 'Super Admin'), createShop);

router.route('/:id')
  .get(getShopById)
  .put(protect, authorize('Shop Owner', 'Mall Admin', 'Super Admin'), updateShop)
  .delete(protect, authorize('Mall Admin', 'Super Admin'), deleteShop);

export default router;
