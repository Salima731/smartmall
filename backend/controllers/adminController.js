import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Mall from '../models/mallModel.js';
import Shop from '../models/shopModel.js';
import Product from '../models/productModel.js';
import Offer from '../models/offerModel.js';
import ParkingSpace from '../models/parkingSpaceModel.js';
import Restroom from '../models/restroomModel.js';
import ActivityLog from '../models/activityLogModel.js';
import Settings from '../models/settingsModel.js';
import Notification from '../models/notificationModel.js';
import Alert from '../models/alertModel.js';

const logActivity = async (userId, action, details, targetId = null, targetModel = null, req = null) => {
  try {
    await ActivityLog.create({
      user: userId, action, details, targetId, targetModel,
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null,
      userAgent: req ? req.headers['user-agent'] : null,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// @desc    Get dashboard metrics & analytics
// @route   GET /api/admin/stats
// @access  Private/Super Admin
export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalMalls = await Mall.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalShops = await Shop.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalOffers = await Offer.countDocuments();

  // Parking Metrics via ParkingSpace aggregation
  const parkingAgg = await ParkingSpace.aggregate([{
    $group: {
      _id: null,
      totalCapacity: { $sum: '$totalCapacity' },
      totalOccupied: { $sum: '$occupiedSpaces' },
    },
  }]);
  const parkingTotals = parkingAgg[0] || { totalCapacity: 0, totalOccupied: 0 };
  const parkingOccupancyRate = parkingTotals.totalCapacity > 0
    ? Math.round((parkingTotals.totalOccupied / parkingTotals.totalCapacity) * 100) : 0;

  const totalRestrooms = await Restroom.countDocuments();
  const dirtyRestrooms = await Restroom.countDocuments({ status: { $in: ['Needs Cleaning', 'Closed for Cleaning'] } });

  const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const revenueData = [12000, 19000, 15000, 25000, 22000, 30000];
  const visitorsData = [45000, 52000, 49000, 68000, 60000, 75000];
  const chartData = months.map((month, idx) => ({
    name: month,
    Revenue: revenueData[idx],
    Visitors: visitorsData[idx],
  }));

  const malls = await Mall.find();
  const mallBreakdown = await Promise.all(
    malls.map(async (mall) => {
      const shopsCount = await Shop.countDocuments({ mall: mall._id });
      const shopIds = await Shop.find({ mall: mall._id }).distinct('_id');
      const productsCount = await Product.countDocuments({ shop: { $in: shopIds } });
      const mallParkingAgg = await ParkingSpace.aggregate([
        { $match: { mall: mall._id } },
        { $group: { _id: null, total: { $sum: '$totalCapacity' }, occupied: { $sum: '$occupiedSpaces' } } },
      ]);
      const mp = mallParkingAgg[0] || { total: 0, occupied: 0 };
      return {
        id: mall._id, name: mall.name, district: mall.district,
        shopsCount, productsCount,
        parkingOccupancy: mp.total > 0 ? Math.round((mp.occupied / mp.total) * 100) : 0,
        isActive: mall.isActive,
      };
    })
  );

  res.json({
    metrics: {
      totalMalls, totalUsers, totalShops, totalProducts, totalOffers,
      parking: { total: parkingTotals.totalCapacity, occupied: parkingTotals.totalOccupied, rate: parkingOccupancyRate },
      restrooms: { total: totalRestrooms, dirty: dirtyRestrooms },
    },
    chartData, mallBreakdown,
  });
});

// @desc    Get system activity & audit logs
// @route   GET /api/admin/logs
// @access  Private/Super Admin
export const getActivityLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const total = await ActivityLog.countDocuments();
  const logs = await ActivityLog.find()
    .populate('user', 'name email role')
    .sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.json({ logs, page, pages: Math.ceil(total / limit), total });
});

// @desc    Get system configurations
// @route   GET /api/admin/settings
// @access  Private/Super Admin
export const getSystemSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json(settings);
});

// @desc    Update system configurations
// @route   PUT /api/admin/settings
// @access  Private/Super Admin
export const updateSystemSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) { settings = new Settings(req.body); }
  else { Object.assign(settings, req.body); }
  const updatedSettings = await settings.save();
  await logActivity(req.user._id, 'UPDATE_SETTINGS', 'Updated global system configurations', settings._id, 'Settings', req);
  res.json(updatedSettings);
});

// @desc    Send global/emergency announcements
// @route   POST /api/admin/announcements
// @access  Private/Super Admin
export const sendGlobalAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, type, isEmergency, mallId } = req.body;
  if (!title || !message) { res.status(400); throw new Error('Please provide title and message'); }
  const io = req.app.get('io');

  if (isEmergency) {
    if (!mallId) { res.status(400); throw new Error('Please select a target mall for emergency alert'); }
    const alert = await Alert.create({ mall: mallId, type: type || 'General', message, createdBy: req.user._id });
    io.emit('emergency_alert', { mallId, type: alert.type, message, createdAt: alert.createdAt });
    await logActivity(req.user._id, 'EMERGENCY_ALERT', `Sent emergency alert to Mall ${mallId}: ${message}`, alert._id, 'Alert', req);
    return res.status(201).json({ message: 'Emergency alert sent successfully', alert });
  } else {
    const notification = await Notification.create({ title, message, type: 'System', mall: mallId || undefined });
    io.emit('global_notification', { title, message, mallId, createdAt: notification.createdAt });
    await logActivity(req.user._id, 'GLOBAL_ANNOUNCEMENT', `Sent global announcement: "${title}"`, notification._id, 'Notification', req);
    res.status(201).json({ message: 'Global announcement sent successfully', notification });
  }
});

// @desc    Assign Mall Admin to Mall
// @route   POST /api/admin/assign-mall-admin
// @access  Private/Super Admin
export const assignMallAdmin = asyncHandler(async (req, res) => {
  const { mallId, adminId } = req.body;
  const mall = await Mall.findById(mallId);
  if (!mall) { res.status(404); throw new Error('Mall not found'); }
  const user = await User.findById(adminId);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role !== 'Mall Admin' && user.role !== 'Super Admin') {
    res.status(400); throw new Error('User must have the Mall Admin role');
  }
  mall.admin = adminId; await mall.save();
  user.mall = mallId; await user.save();
  await logActivity(req.user._id, 'ASSIGN_MALL_ADMIN', `Assigned Mall Admin ${user.name} to Mall ${mall.name}`, mallId, 'Mall', req);
  res.json({ message: 'Mall Admin assigned successfully', mall, user });
});

// @desc    Manage Shops status
// @route   PUT /api/admin/shops/:id/status
// @access  Private/Super Admin
export const updateShopStatus = asyncHandler(async (req, res) => {
  const { status, isFeatured } = req.body;
  const shop = await Shop.findById(req.params.id);
  if (!shop) { res.status(404); throw new Error('Shop not found'); }
  if (status !== undefined) shop.status = status;
  if (isFeatured !== undefined) shop.isFeatured = isFeatured;
  await shop.save();
  await logActivity(req.user._id, 'UPDATE_SHOP_STATUS', `Updated shop ${shop.name} status to ${status || shop.status}`, shop._id, 'Shop', req);
  res.json({ message: 'Shop updated successfully', shop });
});

// @desc    Moderate Products
// @route   PUT /api/admin/products/:id/status
// @access  Private/Super Admin
export const updateProductStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  product.status = status; await product.save();
  await logActivity(req.user._id, 'MODERATE_PRODUCT', `Moderated product ${product.name}: status set to ${status}`, product._id, 'Product', req);
  res.json({ message: 'Product status updated successfully', product });
});

// @desc    Moderate Offers
// @route   PUT /api/admin/offers/:id/status
// @access  Private/Super Admin
export const updateOfferStatus = asyncHandler(async (req, res) => {
  const { status, isFeatured } = req.body;
  const offer = await Offer.findById(req.params.id);
  if (!offer) { res.status(404); throw new Error('Offer not found'); }
  if (status !== undefined) offer.status = status;
  if (isFeatured !== undefined) offer.isActive = isFeatured;
  await offer.save();
  await logActivity(req.user._id, 'MODERATE_OFFER', `Moderated offer ${offer.title}: status set to ${status || offer.status}`, offer._id, 'Offer', req);
  res.json({ message: 'Offer status updated successfully', offer });
});

// @desc    Monitor Real-Time Platform Ops (Parking, Restrooms, Staff)
// @route   GET /api/admin/monitoring
// @access  Private/Super Admin
export const getMonitoringOps = asyncHandler(async (req, res) => {
  const parkingSpaces = await ParkingSpace.find().populate('mall', 'name');
  const parkingByMall = parkingSpaces.reduce((acc, ps) => {
    const mallId = ps.mall?._id?.toString();
    if (!acc[mallId]) acc[mallId] = { mall: ps.mall, totalCapacity: 0, occupiedSpaces: 0, spaces: [] };
    acc[mallId].totalCapacity += ps.totalCapacity;
    acc[mallId].occupiedSpaces += ps.occupiedSpaces;
    acc[mallId].spaces.push(ps);
    return acc;
  }, {});

  const restrooms = await Restroom.find().populate('mall', 'name').populate('staff', 'name');
  const staff = await User.find({ role: 'Staff' }).populate('mall', 'name').select('-password');

  res.json({ parking: Object.values(parkingByMall), restrooms, staff });
});

// @desc    Activate/Deactivate Mall
// @route   PUT /api/admin/malls/:id/status
// @access  Private/Super Admin
export const updateMallStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const mall = await Mall.findById(req.params.id);
  if (!mall) { res.status(404); throw new Error('Mall not found'); }
  mall.isActive = isActive; await mall.save();
  await logActivity(req.user._id, 'UPDATE_MALL_STATUS', `Updated mall ${mall.name} status: Active = ${isActive}`, mall._id, 'Mall', req);
  res.json({ message: `Mall ${isActive ? 'activated' : 'deactivated'} successfully`, mall });
});
