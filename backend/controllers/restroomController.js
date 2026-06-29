import asyncHandler from 'express-async-handler';
import Restroom from '../models/restroomModel.js';

// @desc    Get restroom status
// @route   GET /api/restrooms/mall/:mallId
// @access  Public
const getRestrooms = asyncHandler(async (req, res) => {
  const restrooms = await Restroom.find({ mall: req.params.mallId }).populate('staff', 'name email avatar');
  res.json(restrooms);
});

// @desc    Create a restroom
// @route   POST /api/restrooms
// @access  Private/MallAdmin
const createRestroom = asyncHandler(async (req, res) => {
  const { mallId, location, floor, gender } = req.body;
  const restroom = await Restroom.create({
    mall: mallId,
    location,
    floor,
    gender,
    status: 'Clean',
    occupancy: 0,
    averageRating: 5.0,
  });
  const io = req.app.get('io');
  if (io) {
    io.emit('restroom_update', { mallId });
  }
  res.status(201).json(restroom);
});

// @desc    Delete a restroom
// @route   DELETE /api/restrooms/:id
// @access  Private/MallAdmin
const deleteRestroom = asyncHandler(async (req, res) => {
  const restroom = await Restroom.findById(req.params.id);
  if (restroom) {
    const mallId = restroom.mall;
    await Restroom.deleteOne({ _id: restroom._id });
    const io = req.app.get('io');
    if (io) {
      io.emit('restroom_update', { mallId });
    }
    res.json({ message: 'Restroom removed successfully' });
  } else {
    res.status(404);
    throw new Error('Restroom not found');
  }
});

// @desc    Update restroom status
// @route   PUT /api/restrooms/:id
// @access  Private/Staff
const updateRestroom = asyncHandler(async (req, res) => {
  const restroom = await Restroom.findById(req.params.id);

  if (restroom) {
    if (req.body.status) {
      restroom.status = req.body.status;
      if (req.body.status === 'Available' || req.body.status === 'Clean') {
        restroom.lastCleanedAt = Date.now();
      }
    }
    if (req.body.occupancy !== undefined) restroom.occupancy = req.body.occupancy;
    if (req.user) restroom.staff = req.user._id;

    const updatedRestroom = await restroom.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('restroom_update', { mallId: restroom.mall, restroomId: restroom._id, status: restroom.status, occupancy: restroom.occupancy });
    }

    res.json(updatedRestroom);
  } else {
    res.status(404);
    throw new Error('Restroom not found');
  }
});

// @desc    Add maintenance report
// @route   POST /api/restrooms/:id/maintenance
// @access  Private/Staff
const addMaintenanceReport = asyncHandler(async (req, res) => {
  const { issue } = req.body;
  const restroom = await Restroom.findById(req.params.id);

  if (restroom) {
    restroom.maintenanceReports.push({
      issue,
      reportedBy: req.user ? req.user.name : 'Staff',
      reportedAt: Date.now(),
      status: 'Pending'
    });
    restroom.status = 'Maintenance';

    const updatedRestroom = await restroom.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('restroom_update', { mallId: restroom.mall, restroomId: restroom._id, status: restroom.status, maintenance: true });
    }

    res.status(201).json(updatedRestroom);
  } else {
    res.status(404);
    throw new Error('Restroom not found');
  }
});

// @desc    Add QR complaint/rating
// @route   POST /api/restrooms/:id/complaint
// @access  Public
const addComplaint = asyncHandler(async (req, res) => {
  const { complaint, rating, qrCodeId } = req.body;
  const restroom = await Restroom.findById(req.params.id);

  if (restroom) {
    restroom.complaints.push({
      qrCodeId,
      complaint,
      rating: Number(rating) || 5,
      submittedAt: Date.now()
    });

    // Recalculate average rating
    const totalRatings = restroom.complaints.reduce((acc, item) => acc + item.rating, 0);
    restroom.averageRating = Math.round((totalRatings / restroom.complaints.length) * 10) / 10;

    if (rating <= 2) {
      restroom.status = 'Needs Cleaning';
    }

    const updatedRestroom = await restroom.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('restroom_update', { mallId: restroom.mall, restroomId: restroom._id, status: restroom.status, rating: restroom.averageRating });
    }

    res.status(201).json(updatedRestroom);
  } else {
    res.status(404);
    throw new Error('Restroom not found');
  }
});

// @desc    Dispatch emergency maintenance
// @route   POST /api/restrooms/mall/:mallId/emergency
// @access  Private/MallAdmin
const emergencyMaintenance = asyncHandler(async (req, res) => {
  const { mallId } = req.params;
  
  await Restroom.updateMany(
    { mall: mallId, status: { $ne: 'Closed' } },
    { $set: { status: 'Needs Cleaning' } }
  );

  const restrooms = await Restroom.find({ mall: mallId }).populate('staff', 'name email avatar');

  const io = req.app.get('io');
  if (io) {
    io.emit('restroom_update', { mallId, emergency: true });
  }

  res.json({ message: 'Emergency cleaning dispatched across all facilities', restrooms });
});

export { getRestrooms, updateRestroom, addMaintenanceReport, addComplaint, emergencyMaintenance, createRestroom, deleteRestroom };
