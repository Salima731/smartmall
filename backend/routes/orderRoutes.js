import express from 'express';
import {
  placeOrder,
  confirmPayment,
  updateOrderStatus,
  cancelOrder,
  getMyOrders,
  getShopOrders,
  getOrderById,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// User: place order
router.post('/', protect, authorize('User'), placeOrder);

// User: confirm payment
router.put('/:id/pay', protect, confirmPayment);

// Shop Owner / Super Admin: update order status (workflow transitions)
router.put('/:id/status', protect, authorize('Shop Owner', 'Super Admin'), updateOrderStatus);

// User / Staff: cancel order
router.put('/:id/cancel', protect, cancelOrder);

// User: get own orders
router.get('/my', protect, getMyOrders);

// Shop Owner / Mall Admin / Super Admin: get shop orders
router.get('/shop', protect, authorize('Shop Owner', 'Mall Admin', 'Super Admin'), getShopOrders);

// Any authenticated: get single order
router.get('/:id', protect, getOrderById);

export default router;
