import express from 'express';
import {
   getProductsByShop,
   createProduct,
   getProducts,
   updateProduct,
   deleteProduct,
   getProductById
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorize('Shop Owner', 'Mall Admin', 'Super Admin'), createProduct);

router.route('/shop/:shopId')
  .get(getProductsByShop);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('Shop Owner', 'Mall Admin', 'Super Admin'), updateProduct)
  .delete(protect, authorize('Shop Owner', 'Mall Admin', 'Super Admin'), deleteProduct);

export default router;
