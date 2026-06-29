import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Notification from '../models/notificationModel.js';
import Shop from '../models/shopModel.js';

const FOOD_SHOP_TYPES = ['Restaurant', 'Food Court', 'Cafe', 'Bakery', 'Juice Bar'];
const FOOD_KEYWORDS = ['food', 'restaurant', 'cafe', 'bakery', 'juice', 'burger', 'kfc', 'pizza', 'coffee'];

const containsFoodKeyword = (value) => FOOD_KEYWORDS.some((keyword) => (
  value?.toLowerCase().includes(keyword)
));

// Helper: send order notification to the user
const notifyUser = async (userId, title, message) => {
  try {
    await Notification.create({ user: userId, title, message, type: 'Order' });
  } catch (err) {
    console.error('Order notification failed:', err);
  }
};

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private/User
const placeOrder = asyncHandler(async (req, res) => {
  const { shopId, items } = req.body;

  if (!shopId || !items || items.length === 0) {
    res.status(400); throw new Error('shopId and at least one item are required');
  }

  let totalAmount = 0;
  const enrichedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) { res.status(404); throw new Error(`Product ${item.productId} not found`); }
    if (product.countInStock < item.quantity) {
      res.status(400); throw new Error(`Insufficient stock for ${product.name}`);
    }
    const subtotal = (product.discountPrice || product.price) * item.quantity;
    totalAmount += subtotal;
    enrichedItems.push({ product: product._id, quantity: item.quantity, subtotal });
  }

  const order = await Order.create({
    user: req.user._id,
    shop: shopId,
    items: enrichedItems,
    totalAmount,
    paymentStatus: 'Pending',
    orderStatus: 'Pending',
  });

  res.status(201).json(order);
});

// @desc    Confirm payment & set order to Confirmed
// @route   PUT /api/orders/:id/pay
// @access  Private
const confirmPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('shop');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (order.user.toString() !== req.user._id.toString() && req.user.role === 'User') {
    res.status(403); throw new Error('Not authorized to pay for this order');
  }

  const orderProductIds = order.items.map((item) => item.product);
  const orderProducts = await Product.find({ _id: { $in: orderProductIds } }).select('name category');
  const isFoodShop = (
    FOOD_SHOP_TYPES.includes(order.shop?.shopType) ||
    containsFoodKeyword(order.shop?.name) ||
    containsFoodKeyword(order.shop?.category) ||
    orderProducts.some((product) => containsFoodKeyword(product.name) || containsFoodKeyword(product.category))
  );

  order.paymentStatus = 'Paid';
  order.orderStatus = isFoodShop ? 'Confirmed' : 'Completed';
  await order.save();

  // Always notify: Payment Successful
  await notifyUser(order.user, 'Payment Successful 💳', 'Your payment has been received successfully.');

  // Then: Order Confirmed (food) or Purchase Completed (retail)
  if (isFoodShop) {
    await notifyUser(order.user, 'Order Confirmed ✅', 'Your order has been confirmed and sent to the restaurant.');
  } else {
    await notifyUser(order.user, 'Purchase Completed 🛍️', 'Thank you for your purchase! Your order has been processed.');
  }

  const io = req.app.get('io');
  if (io) {
    io.to(order.user.toString()).emit('order_update', { orderId: order._id, orderStatus: order.orderStatus });
    // Notify shop staff of new confirmed order
    if (order.shop?._id) {
      io.to(`shop_${order.shop._id.toString()}`).emit('order_update', { orderId: order._id, orderStatus: order.orderStatus, newOrder: true });
    }
  }

  res.json(order);
});

// @desc    Update order status (Shop Owner workflow)
// @route   PUT /api/orders/:id/status
// @access  Private/Shop Owner/Super Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  // Security: Only Super Admin or the exact Shop Owner can update the status
  if (req.user.role === 'Shop Owner') {
    const ownedShop = await Shop.findOne({ owner: req.user._id }).select('_id');
    if (!ownedShop || order.shop.toString() !== ownedShop._id.toString()) {
      res.status(403); throw new Error('Not authorized to update orders for this shop');
    }
  } else if (req.user.role !== 'Super Admin') {
    res.status(403); throw new Error('Not authorized to update order status');
  }

  const validTransitions = {
    Confirmed: ['Preparing'],
    Preparing: ['Ready'],
    Ready: ['Completed'],
  };

  if (validTransitions[order.orderStatus]) {
    if (!validTransitions[order.orderStatus].includes(orderStatus)) {
      res.status(400);
      throw new Error(`Cannot transition from ${order.orderStatus} to ${orderStatus}. Valid: ${validTransitions[order.orderStatus].join(', ')}`);
    }
  } else {
    res.status(400); throw new Error(`Order in ${order.orderStatus} state cannot be updated`);
  }

  order.orderStatus = orderStatus;
  await order.save();

  // Only notify user when food is Ready for pickup — NOT for Preparing or Completed (internal states)
  if (orderStatus === 'Ready') {
    await notifyUser(
      order.user,
      '🍱 Food Ready for Pickup!',
      'Your order is ready. Please collect it from the food court counter.'
    );
  }

  const io = req.app.get('io');
  if (io) {
    // Notify the user who placed the order (for their tracking view)
    io.to(order.user.toString()).emit('order_update', { orderId: order._id, orderStatus });
    // Notify the shop room (for staff/shop owner real-time dashboard updates)
    if (order.shop) {
      io.to(`shop_${order.shop.toString()}`).emit('order_update', { orderId: order._id, orderStatus });
    }
  }

  res.json(order);
});

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const cancellableStates = ['Pending', 'Confirmed'];
  if (!cancellableStates.includes(order.orderStatus)) {
    res.status(400); throw new Error(`Cannot cancel an order in ${order.orderStatus} state`);
  }

  // Only the order owner or staff/admin can cancel
  if (req.user.role === 'User' && order.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized to cancel this order');
  }

  order.orderStatus = 'Cancelled';
  if (order.paymentStatus === 'Paid') order.paymentStatus = 'Failed'; // Flag for refund
  await order.save();

  await notifyUser(order.user, 'Order Cancelled', `Your order #${order._id} has been cancelled.`);

  res.json({ message: 'Order cancelled successfully', order });
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('shop', 'name image shopType')
    .populate('items.product', 'name image price')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Get orders for a shop (Shop Owner / Mall Admin / Super Admin)
// @route   GET /api/orders/shop
// @access  Private/Shop Owner/Mall Admin/Super Admin
const getShopOrders = asyncHandler(async (req, res) => {
  const { shopId, status } = req.query;
  const requestedShopId = shopId && !['null', 'undefined', ''].includes(shopId) ? shopId : null;
  const requestedStatus = status && !['null', 'undefined', ''].includes(status) ? status : null;
  const filter = {};

  if (req.user.role === 'Shop Owner') {
    // Shop owner can only query their own shop
    const ownedShop = await Shop.findOne({ owner: req.user._id }).select('_id');
    if (!ownedShop) {
      return res.json([]);
    }
    filter.shop = ownedShop._id;
  } else if (req.user.role === 'Mall Admin') {
    // Mall Admin can only see orders for shops in their mall
    const shopsInMall = await Shop.find({ mall: req.user.mall }).select('_id');
    const shopIds = shopsInMall.map((s) => s._id);
    filter.shop = { $in: shopIds };
    
    // Optionally filter by a specific shopId if provided and valid
    if (requestedShopId) {
      if (!shopIds.some(id => id.toString() === requestedShopId)) {
        res.status(403); throw new Error('Not authorized to view orders for this shop');
      }
      filter.shop = requestedShopId;
    }
  } else if (req.user.role === 'Super Admin') {
    if (requestedShopId) filter.shop = requestedShopId;
  } else {
    res.status(403); throw new Error('Not authorized to view shop orders');
  }

  if (requestedStatus) filter.orderStatus = requestedStatus;

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .populate('shop', 'name mall shopType')
    .populate('items.product', 'name image price')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('shop', 'name image shopType')
    .populate('items.product', 'name image price');

  if (!order) { res.status(404); throw new Error('Order not found'); }

  // Only the owner, shop staff, or admin can view
  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = ['Mall Admin', 'Super Admin', 'Staff', 'Shop Owner'].includes(req.user.role);
  if (!isOwner && !isAdmin) { res.status(403); throw new Error('Not authorized to view this order'); }

  res.json(order);
});

export { placeOrder, confirmPayment, updateOrderStatus, cancelOrder, getMyOrders, getShopOrders, getOrderById };
