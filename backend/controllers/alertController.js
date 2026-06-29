import asyncHandler from 'express-async-handler';
import Alert from '../models/alertModel.js';

// @desc    Get active alerts for a mall
// @route   GET /api/alerts/mall/:mallId
// @access  Public
const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await Alert.find({ mall: req.params.mallId, isActive: true })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json(alerts);
});

// @desc    Create emergency alert
// @route   POST /api/alerts
// @access  Private/Mall Admin or Super Admin
const createAlert = asyncHandler(async (req, res) => {
  const { mallId, type, message } = req.body;
  const alert = await Alert.create({
    mall: mallId,
    type,
    message,
    createdBy: req.user._id,
  });
  res.status(201).json(alert);
});

// @desc    Deactivate alert
// @route   PUT /api/alerts/:id/deactivate
// @access  Private/Mall Admin or Super Admin
const deactivateAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }
  alert.isActive = false;
  await alert.save();
  res.json({ message: 'Alert deactivated' });
});

export { getAlerts, createAlert, deactivateAlert };
