import asyncHandler from 'express-async-handler';
import Complaint from '../models/complaintModel.js';
import ActivityLog from '../models/activityLogModel.js';
import Shop from '../models/shopModel.js';

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (User)
const createComplaint = asyncHandler(async (req, res) => {
  const { mall, shop, department, subject, description, priority } = req.body;

  const complaint = await Complaint.create({
    user: req.user._id,
    mall,
    shop,
    department,
    subject,
    description,
    priority: priority || 'Medium'
  });

  await ActivityLog.create({
    user: req.user._id,
    action: 'CREATE_COMPLAINT',
    details: `Created a new complaint: ${subject}`,
    targetModel: 'Complaint',
    targetId: complaint._id,
    severity: priority === 'Emergency' || priority === 'High' ? 'Warning' : 'Info',
    mall
  });

  res.status(201).json(complaint);
});

// @desc    Get complaints
// @route   GET /api/complaints
// @access  Private
const getComplaints = asyncHandler(async (req, res) => {
  let filter = {};

  // RBAC Filtering
  if (req.user.role === 'User') {
    // Users only see their own complaints
    filter.user = req.user._id;
  } else if (req.user.role === 'Mall Admin') {
    // Mall Admins see complaints for their mall
    filter.mall = req.user.mall;
  } else if (req.user.role === 'Staff') {
    // Staff see complaints assigned to their department in their mall
    filter.mall = req.user.mall;
    filter.department = req.user.department;
  } else if (req.user.role === 'Shop Owner') {
    // Shop Owners see complaints against their shop
    const ownedShop = await Shop.findOne({ owner: req.user._id }).select('_id');
    filter.shop = ownedShop ? ownedShop._id : null;
  }

  const complaints = await Complaint.find(filter)
    .populate('user', 'name email')
    .populate('mall', 'name')
    .populate('shop', 'name')
    .sort({ createdAt: -1 });

  res.json(complaints);
});

// @desc    Update complaint status or add admin notes
// @route   PUT /api/complaints/:id
// @access  Private (Admins)
const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Authorization checks
  if (req.user.role === 'User' || req.user.role === 'Shop Owner') {
    res.status(403);
    throw new Error('Not authorized to update complaints');
  }

  if (req.user.role === 'Mall Admin' && complaint.mall?.toString() !== req.user.mall?.toString()) {
    res.status(403);
    throw new Error('Not authorized for this mall\'s complaints');
  }

  const { status, note } = req.body;

  if (status) {
    complaint.status = status;
  }

  if (note) {
    complaint.adminNotes.push({
      admin: req.user._id,
      note
    });
  }

  const updatedComplaint = await complaint.save();

  if (status || note) {
    await ActivityLog.create({
      user: req.user._id,
      action: 'UPDATE_COMPLAINT',
      details: `Updated complaint status to ${status || 'unchanged'} and/or added a note.`,
      targetModel: 'Complaint',
      targetId: complaint._id,
      mall: complaint.mall
    });
  }

  res.json(updatedComplaint);
});

export { createComplaint, getComplaints, updateComplaint };
