import asyncHandler from 'express-async-handler';
import ActivityLog from '../models/activityLogModel.js';

// @desc    Get activity logs
// @route   GET /api/activitylogs
// @access  Private (Super Admin, Mall Admin, Shop Owner, Staff)
const getActivityLogs = asyncHandler(async (req, res) => {
  let filter = {};

  // Apply RBAC filters based on role
  if (req.user.role === 'Super Admin') {
    // Super Admins can see everything, or filter by mall if requested
    if (req.query.mall) filter.mall = req.query.mall;
  } else if (req.user.role === 'Mall Admin') {
    // Mall Admins only see logs related to their mall
    filter.mall = req.user.mall;
  } else if (req.user.role === 'Shop Owner') {
    // Shop Owners only see logs they performed
    filter.user = req.user._id;
  } else if (req.user.role === 'Staff') {
    // Staff only see logs they performed
    filter.user = req.user._id;
  } else {
    // Users don't have access to system audit logs
    res.status(403);
    throw new Error('Access denied to audit logs');
  }

  // Support pagination
  const pageSize = Number(req.query.pageSize) || 50;
  const page = Number(req.query.pageNumber) || 1;

  const count = await ActivityLog.countDocuments(filter);
  const logs = await ActivityLog.find(filter)
    .populate('user', 'name email role department')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ logs, page, pages: Math.ceil(count / pageSize), total: count });
});

export { getActivityLogs };
