import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';
import ActivityLog from '../models/activityLogModel.js';

// @desc    Get user notifications (Personal, Role-based, Global)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const query = {
    $or: [
      { user: req.user._id }, // Targeted to this specific user
      { isGlobal: true }, // Global announcements
      { targetRoles: req.user.role } // Targeted to their role
    ]
  };

  // If the notification is mall-specific, ensure it's for their mall
  if (req.user.mall) {
    query.$or.push({ mall: req.user.mall, targetRoles: req.user.role });
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .populate('sender', 'name role avatar');
    
  res.json(notifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  notification.isRead = true;
  await notification.save();
  res.json({ message: 'Notification marked as read' });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const query = {
    $or: [
      { user: req.user._id },
      { isGlobal: true },
      { targetRoles: req.user.role }
    ],
    isRead: false
  };

  await Notification.updateMany(query, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
});

// @desc    Create a broadcast notification
// @route   POST /api/notifications
// @access  Private (Admins/Shop Owners/Staff)
const createNotification = asyncHandler(async (req, res) => {
  const { title, message, type, isGlobal, targetRoles, targetUser, mall } = req.body;
  
  // RBAC Checks
  if (isGlobal && req.user.role !== 'Super Admin') {
    res.status(403);
    throw new Error('Only Super Admins can send global announcements');
  }

  if (req.user.role === 'Staff' && !targetUser) {
    res.status(403);
    throw new Error('Staff can only send direct notifications to specific users (e.g. queue alerts)');
  }

  const notification = await Notification.create({
    title,
    message,
    type: type || 'System',
    isGlobal: isGlobal || false,
    targetRoles: targetRoles || [],
    user: targetUser || null,
    sender: req.user._id,
    mall: req.user.role === 'Super Admin' ? mall : req.user.mall // Lock to their mall unless super admin
  });
  
  // Log the broadcast
  await ActivityLog.create({
    user: req.user._id,
    action: 'BROADCAST_NOTIFICATION',
    details: `Sent ${type} broadcast: ${title}`,
    targetModel: 'Notification',
    targetId: notification._id,
    severity: type === 'Emergency' ? 'Critical' : 'Info',
    mall: req.user.mall
  });

  // Emit Socket.IO events
  const io = req.app.get('io');
  if (io) {
    // Populate sender details for UI
    const populated = await Notification.findById(notification._id).populate('sender', 'name role avatar');
    
    if (populated.isGlobal) {
      io.emit('notification', populated);
    } else {
      if (populated.user) {
        io.to(populated.user.toString()).emit('notification', populated);
      }
      if (populated.targetRoles && populated.targetRoles.length > 0) {
        populated.targetRoles.forEach(role => {
          io.to(role).emit('notification', populated);
        });
      }
      if (populated.mall) {
        io.to(`mall_${populated.mall.toString()}`).emit('notification', populated);
      }
    }
  }

  res.status(201).json(notification);
});

export { getNotifications, markAsRead, markAllAsRead, createNotification };
