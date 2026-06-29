import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Mall from '../models/mallModel.js';
import Shop from '../models/shopModel.js';

// Helper to calculate distance in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return parseFloat((R * c).toFixed(1)); // Rounded to 1 decimal place
};

// @desc    Get all malls
// @route   GET /api/malls
// @access  Public
const getMalls = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { district: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const malls = await Mall.find({ ...keyword });
  
  const mallsWithShopsCount = await Promise.all(
    malls.map(async (mall) => {
      const shopCount = await Shop.countDocuments({ mall: mall._id });
      return {
        ...mall.toObject(),
        shopCount,
      };
    })
  );

  res.json(mallsWithShopsCount);
});

// @desc    Get nearby malls
// @route   GET /api/malls/nearby
// @access  Public
const getNearbyMalls = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('Please provide latitude and longitude');
  }

  const malls = await Mall.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: 50000, // 50km
      },
    },
  });

  const mallsWithDetails = await Promise.all(
    malls.map(async (mall) => {
      const shopCount = await Shop.countDocuments({ mall: mall._id });
      const mallLng = mall.location.coordinates[0];
      const mallLat = mall.location.coordinates[1];
      const distance = calculateDistance(parseFloat(lat), parseFloat(lng), mallLat, mallLng);
      return {
        ...mall.toObject(),
        shopCount,
        distance,
      };
    })
  );

  mallsWithDetails.sort((a, b) => a.distance - b.distance);

  res.json(mallsWithDetails);
});

// @desc    Create a mall
// @route   POST /api/malls
// @access  Private/Admin
const createMall = asyncHandler(async (req, res) => {
  const { name, district, address, coordinates, image, logo, gallery, adminId } = req.body;

  const mall = new Mall({
    name,
    district,
    address,
    location: { type: 'Point', coordinates },
    image,
    logo,
    gallery,
    admin: adminId || null,
  });

  const createdMall = await mall.save();

  // Bi-directional link update
  if (adminId) {
    const User = (await import('../models/userModel.js')).default;
    const user = await User.findById(adminId);
    if (user) {
      user.role = 'Mall Admin';
      user.mall = createdMall._id;
      await user.save();
    }
  }

  res.status(201).json(createdMall);
});

// @desc    Get mall by ID
// @route   GET /api/malls/:id
// @access  Public
const getMallById = asyncHandler(async (req, res) => {
  const mall = await Mall.findById(req.params.id);

  if (mall) {
    res.json(mall);
  } else {
    res.status(404);
    throw new Error('Mall not found');
  }
});

// @desc    Update a mall
// @route   PUT /api/malls/:id
// @access  Private/Mall Admin/Super Admin
const updateMall = asyncHandler(async (req, res) => {
  const mall = await Mall.findById(req.params.id);
  if (!mall) {
    res.status(404);
    throw new Error('Mall not found');
  }

  // RBAC check
  if (req.user.role !== 'Super Admin' && (req.user.role !== 'Mall Admin' || req.user.mall?.toString() !== mall._id.toString())) {
    res.status(403);
    throw new Error('Not authorized to modify this mall');
  }

  const oldAdminId = mall.admin?.toString();
  const newAdminId = req.body.adminId !== undefined ? req.body.adminId : req.body.admin;

  const updatedMall = await Mall.findByIdAndUpdate(req.params.id, req.body, { new: true });

  // Bi-directional link update
  const User = (await import('../models/userModel.js')).default;
  
  if (newAdminId !== undefined && newAdminId !== oldAdminId) {
    // 1. Remove old admin link
    if (oldAdminId) {
      const oldAdmin = await User.findById(oldAdminId);
      if (oldAdmin) {
        oldAdmin.role = 'User';
        oldAdmin.mall = undefined;
        await oldAdmin.save();
      }
    }

    // 2. Link new admin
    if (newAdminId) {
      const newAdmin = await User.findById(newAdminId);
      if (newAdmin) {
        newAdmin.role = 'Mall Admin';
        newAdmin.mall = updatedMall._id;
        await newAdmin.save();
      }
    }

    // 3. Make sure the saved Mall model matches
    updatedMall.admin = newAdminId || null;
    await updatedMall.save();
  }

  res.json(updatedMall);
});

// @desc    Delete a mall
// @route   DELETE /api/malls/:id
// @access  Private/Super Admin
const deleteMall = asyncHandler(async (req, res) => {
  const mall = await Mall.findById(req.params.id);
  if (!mall) {
    res.status(404);
    throw new Error('Mall not found');
  }

  // RBAC check - Only Super Admin can delete a mall
  if (req.user.role !== 'Super Admin') {
    res.status(403);
    throw new Error('Not authorized to delete a mall');
  }

  // Clear references from users linked to this mall
  const User = (await import('../models/userModel.js')).default;
  const linkedUsers = await User.find({ mall: mall._id });
  for (const user of linkedUsers) {
    if (user.role === 'Mall Admin') {
      user.role = 'User';
    }
    user.mall = undefined;
    await user.save();
  }

  await Mall.deleteOne({ _id: mall._id });
  res.json({ message: 'Mall removed' });
});

// @desc    Get live crowd density per zone for a mall
// @route   GET /api/malls/:id/crowd-density
// @access  Public
const getCrowdDensity = asyncHandler(async (req, res) => {
  let mallId = req.params.id;

  // If "default" or not a valid objectId, find the first available mall
  if (!mallId || mallId === 'default' || !mongoose.Types.ObjectId.isValid(mallId)) {
    const firstMall = await Mall.findOne();
    if (!firstMall) {
      // Fallback dummy data if no malls are seeded yet
      return res.json([
        { id: 1, name: 'Food Court', emoji: '🍔', pct: 45 },
        { id: 2, name: 'Electronics', emoji: '💻', pct: 30 },
        { id: 3, name: 'Fashion Zone', emoji: '👗', pct: 55 },
        { id: 4, name: 'Parking', emoji: '🚗', pct: 20 },
        { id: 5, name: 'Kids Area', emoji: '🎠', pct: 15 },
        { id: 6, name: 'Entrance', emoji: '🚪', pct: 40 },
      ]);
    }
    mallId = firstMall._id;
  }

  // 1. Parking Occupancy
  const ParkingSlot = (await import('../models/parkingSlotModel.js')).default;
  const totalParkingSlots = await ParkingSlot.countDocuments({ mall: mallId });
  const occupiedParkingSlots = await ParkingSlot.countDocuments({ mall: mallId, status: 'Occupied' });
  const parkingPct = totalParkingSlots > 0 ? Math.round((occupiedParkingSlots / totalParkingSlots) * 100) : 35;

  // 2. Food Court Occupancy from queues of type 'Food Court'
  const Queue = (await import('../models/queueModel.js')).default;
  const foodCourtQueues = await Queue.countDocuments({ mall: mallId, type: 'Food Court', status: { $in: ['Waiting', 'In-Progress', 'Active'] } });
  const foodCourtPct = Math.min(100, Math.max(15, 30 + foodCourtQueues * 15));

  // 3. Electronics Occupancy from Billing Counters
  const electronicsQueues = await Queue.countDocuments({ mall: mallId, type: 'Billing Counter', status: { $in: ['Waiting', 'In-Progress', 'Active'] } });
  const electronicsPct = Math.min(100, Math.max(10, 20 + electronicsQueues * 12));

  // 4. Fashion Zone Occupancy from Customer Service
  const fashionQueues = await Queue.countDocuments({ mall: mallId, type: 'Customer Service', status: { $in: ['Waiting', 'In-Progress', 'Active'] } });
  const fashionPct = Math.min(100, Math.max(15, 25 + fashionQueues * 10));

  // 5. Kids Area Occupancy from Event queues
  const kidsQueues = await Queue.countDocuments({ mall: mallId, type: 'Event Queue', status: { $in: ['Waiting', 'In-Progress', 'Active'] } });
  const kidsPct = Math.min(100, Math.max(10, 15 + kidsQueues * 8));

  // 6. Entrance Occupancy calculated from recent parking entries in the last 1 hour
  const VehicleEntry = (await import('../models/vehicleEntryModel.js')).default;
  const recentEntries = await VehicleEntry.countDocuments({
    mall: mallId,
    entryTime: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
  });
  const entrancePct = Math.min(100, Math.max(20, 25 + recentEntries * 15));

  res.json([
    { id: 1, name: 'Food Court', emoji: '🍔', pct: foodCourtPct },
    { id: 2, name: 'Electronics', emoji: '💻', pct: electronicsPct },
    { id: 3, name: 'Fashion Zone', emoji: '👗', pct: fashionPct },
    { id: 4, name: 'Parking', emoji: '🚗', pct: parkingPct },
    { id: 5, name: 'Kids Area', emoji: '🎠', pct: kidsPct },
    { id: 6, name: 'Entrance', emoji: '🚪', pct: entrancePct },
  ]);
});

export { getMalls, getNearbyMalls, createMall, getMallById, updateMall, deleteMall, getCrowdDensity };
