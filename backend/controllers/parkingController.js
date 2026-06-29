import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import RazorpayPackage from 'razorpay';
const Razorpay = RazorpayPackage.default || RazorpayPackage;
import ParkingSpace from '../models/parkingSpaceModel.js';
import ParkingBay from '../models/parkingBayModel.js';
import VehicleEntry from '../models/vehicleEntryModel.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';

// @desc    Get parking revenue and stats
// @route   GET /api/parking/stats/:mallId
// @access  Private/Staff+
const getParkingStats = asyncHandler(async (req, res) => {
  const { mallId } = req.params;
  if (!mallId || mallId === 'undefined' || !mongoose.Types.ObjectId.isValid(mallId)) {
    res.status(400); throw new Error('Invalid or missing mall ID');
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayEntries = await VehicleEntry.find({
    mall: mallId,
    entryTime: { $gte: startOfDay }
  });

  const totalVehiclesToday = todayEntries.length;
  const todaysRevenue = todayEntries.reduce((sum, entry) => sum + (entry.fee || 0), 0);
  const totalPaidRevenue = todayEntries.filter(e => e.paymentStatus === 'Paid').reduce((sum, entry) => sum + (entry.fee || 0), 0);
  const pendingPayments = todayEntries.filter(e => e.paymentStatus === 'Pending').reduce((sum, entry) => sum + (entry.fee || 0), 0);
  const activeVehicles = await VehicleEntry.countDocuments({ mall: mallId, status: 'Parked' });

  const spaces = await ParkingSpace.find({ mall: mallId });
  let totalCap = 0;
  let occCap = 0;
  spaces.forEach(s => {
    totalCap += s.totalCapacity || 0;
    occCap += s.occupiedSpaces || 0;
  });

  const occupancyPercentage = totalCap === 0 ? 0 : Math.round((occCap / totalCap) * 100);

  res.json({
    todaysRevenue,
    totalPaidRevenue,
    pendingPayments,
    totalVehiclesToday,
    activeVehicles,
    occupancyPercentage
  });
});

// @desc    Get all slots for a mall (aggregated view for ParkingManager)
// @route   GET /api/parking/mall/:mallId
// @access  Private/Staff+
const getMallParkingStatus = asyncHandler(async (req, res) => {
  const { mallId } = req.params;
  if (!mallId || mallId === 'undefined' || !mongoose.Types.ObjectId.isValid(mallId)) {
    res.status(400); throw new Error('Invalid or missing mall ID');
  }

  // All zones for this mall
  const spaces = await ParkingSpace.find({ mall: mallId });
  const spaceIds = spaces.map((s) => s._id);

  // All individual bays across those zones
  const bays = await ParkingBay.find({ parkingSpace: { $in: spaceIds } });

  // All currently-parked vehicles in this mall
  const activeEntries = await VehicleEntry.find({ mall: mallId, status: 'Parked' });
  const entryByBay = {};
  activeEntries.forEach((e) => {
    if (e.parkingBay) entryByBay[e.parkingBay.toString()] = e;
  });

  // Enrich each bay with live occupancy data
  const slots = bays.map((bay) => {
    const entry = entryByBay[bay._id.toString()];
    return {
      _id: bay._id,
      slotNumber: bay.slotNumber,
      status: bay.status,
      isOccupied: bay.status === 'Occupied',
      parkingSpace: bay.parkingSpace, // used by frontend to derive spaceId on entry
      currentVehicle: entry
        ? { vehicleNumber: entry.vehicleNumber, entryTime: entry.entryTime }
        : null,
    };
  });

  res.json({ slots, spaces });
});

// @desc    Get all parking spaces for a mall
// @route   GET /api/parking/spaces/:mallId
// @access  Public
const getParkingSpaces = asyncHandler(async (req, res) => {
  const { mallId } = req.params;
  if (!mallId || mallId === 'undefined' || mallId.length !== 24) {
    res.status(400); throw new Error('Invalid or missing mall ID');
  }
  const spaces = await ParkingSpace.find({ mall: mallId });
  res.json(spaces);
});

// @desc    Create a parking space zone
// @route   POST /api/parking/spaces
// @access  Private/Mall Admin/Super Admin
const createParkingSpace = asyncHandler(async (req, res) => {
  const { mallId, name, totalCapacity, parkingFeePerHour, vehicleType } = req.body;
  const space = await ParkingSpace.create({
    mall: mallId,
    name,
    totalCapacity: Number(totalCapacity),
    availableSpaces: Number(totalCapacity),
    occupiedSpaces: 0,
    parkingFeePerHour: Number(parkingFeePerHour) || 0,
    vehicleType,
    status: 'Available',
  });
  res.status(201).json(space);
});

// @desc    Update a parking space zone
// @route   PUT /api/parking/spaces/:id
// @access  Private/Mall Admin/Super Admin
const updateParkingSpace = asyncHandler(async (req, res) => {
  const space = await ParkingSpace.findById(req.params.id);
  if (!space) { res.status(404); throw new Error('Parking space not found'); }
  const updated = await ParkingSpace.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// @desc    Get bays for a parking space
// @route   GET /api/parking/bays/:spaceId
// @access  Public
const getParkingBays = asyncHandler(async (req, res) => {
  const bays = await ParkingBay.find({ parkingSpace: req.params.spaceId });
  res.json(bays);
});

// @desc    Record vehicle entry
// @route   POST /api/parking/entry
// @access  Private/Staff
const recordEntry = asyncHandler(async (req, res) => {
  // Accept slotId (frontend) as alias for bayId
  const { mallId, vehicleNumber } = req.body;
  const bayId = req.body.bayId || req.body.slotId;

  const bay = await ParkingBay.findById(bayId);
  if (!bay || bay.status !== 'Available') {
    res.status(400); throw new Error('Parking bay is not available');
  }

  // Derive spaceId from the bay itself
  const spaceId = bay.parkingSpace;
  const space = await ParkingSpace.findById(spaceId);
  if (!space || space.status === 'Full' || space.status === 'Maintenance') {
    res.status(400); throw new Error('Parking space is not available');
  }

  bay.status = 'Occupied';
  await bay.save();

  space.occupiedSpaces = Math.min(space.occupiedSpaces + 1, space.totalCapacity);
  space.availableSpaces = Math.max(space.totalCapacity - space.occupiedSpaces, 0);
  space.status = space.availableSpaces === 0 ? 'Full' : 'Available';
  await space.save();

  const entry = await VehicleEntry.create({
    mall: mallId,
    parkingSpace: spaceId,
    parkingBay: bayId,
    vehicleNumber,
    staff: req.user._id,
  });

  const io = req.app.get('io');
  if (io) io.emit('parking_update', { mallId, spaceId, bayId, status: 'Occupied' });

  res.status(201).json(entry);
});

// @desc    Initiate online payment — creates a Razorpay order and returns a UPI QR payload
// @route   POST /api/parking/payment/init
// @access  Private/Staff
const initParkingPayment = asyncHandler(async (req, res) => {
  const { vehicleNumber } = req.body;

  const entry = await VehicleEntry.findOne({ vehicleNumber, status: 'Parked' });
  if (!entry) { res.status(404); throw new Error('Vehicle not found or already exited'); }

  const space = await ParkingSpace.findById(entry.parkingSpace);
  const exitTime = new Date();
  const hours = Math.max(Math.ceil((exitTime - entry.entryTime) / (1000 * 60 * 60)), 1);
  const feePerHour = space?.parkingFeePerHour || 0;
  const totalFee = hours * feePerHour;

  let razorpayOrderId = null;
  let upiQrString = null;

  if (totalFee > 0) {
    try {
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Smo4dv2jns6Tpu',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dgbY8bdqw3o4VNOGvvs7lYew',
      });
      const order = await instance.orders.create({
        amount: Math.round(totalFee * 100),
        currency: 'INR',
        receipt: `parking_${vehicleNumber}_${Date.now()}`,
      });
      razorpayOrderId = order.id;
      // Build a UPI deep-link the customer can scan with any UPI app
      upiQrString = `upi://pay?pa=smartmall@razorpay&pn=SmartMallParking&am=${totalFee}&cu=INR&tn=Parking:${vehicleNumber}&tr=${order.id}`;
    } catch (err) {
      console.error('Razorpay order creation failed:', err);
      // Fall back to a simple UPI QR without order tracking
      upiQrString = `upi://pay?pa=smartmall@razorpay&pn=SmartMallParking&am=${totalFee}&cu=INR&tn=Parking:${vehicleNumber}`;
    }
  }

  res.json({
    vehicleNumber,
    entryTime: entry.entryTime,
    estimatedExitTime: exitTime,
    durationHours: hours,
    feePerHour,
    totalFee,
    razorpayOrderId,
    upiQrString,
  });
});

// @desc    Get current user's parking payment/visit history
// @route   GET /api/parking/my-history
// @access  Private
const getMyParkingHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const vehicles = user.vehicleNumbers || [];
  if (vehicles.length === 0) {
    return res.json([]);
  }

  const entries = await VehicleEntry.find({
    vehicleNumber: { $in: vehicles }
  })
    .populate('mall', 'name location')
    .populate('parkingSpace', 'name vehicleType')
    .sort({ entryTime: -1 });

  res.json(entries);
});


// @desc    Record vehicle exit and process payment
// @route   POST /api/parking/exit
// @access  Private/Staff
const recordExit = asyncHandler(async (req, res) => {
  const { vehicleNumber, paymentMethod, razorpayPaymentId, utrNumber } = req.body;

  if (!paymentMethod || !['Cash', 'UPI'].includes(paymentMethod)) {
    res.status(400); throw new Error('Valid payment method (Cash/UPI) is required for exit');
  }

  const entry = await VehicleEntry.findOne({ vehicleNumber, status: 'Parked' });
  if (!entry) { res.status(404); throw new Error('Vehicle not found or already exited'); }

  entry.exitTime = new Date();
  entry.status = 'Exited';

  const space = await ParkingSpace.findById(entry.parkingSpace);
  let hours = 0;
  let feePerHour = 0;
  if (space) {
    hours = Math.max(Math.ceil((entry.exitTime - entry.entryTime) / (1000 * 60 * 60)), 1);
    feePerHour = space.parkingFeePerHour || 0;
    entry.fee = hours * feePerHour;
  }
  
  entry.paymentStatus = 'Paid';
  entry.paymentMethod = paymentMethod;
  if (paymentMethod === 'UPI') {
    if (razorpayPaymentId) entry.razorpayPaymentId = razorpayPaymentId;
    if (utrNumber) entry.utrNumber = utrNumber;
    entry.paymentDate = new Date();
  }
  await entry.save();

  const bay = await ParkingBay.findById(entry.parkingBay);
  if (bay) { bay.status = 'Available'; await bay.save(); }

  if (space) {
    space.occupiedSpaces = Math.max(space.occupiedSpaces - 1, 0);
    space.availableSpaces = space.totalCapacity - space.occupiedSpaces;
    space.status = space.availableSpaces > 0 ? 'Available' : 'Full';
    await space.save();

    // Find customer(s) who own this vehicle and create targeted notification
    const owners = await User.find({ vehicleNumbers: vehicleNumber });
    const mallInfo = await mongoose.model('Mall').findById(space.mall);
    const mallName = mallInfo ? mallInfo.name : 'Smart Mall';

    // Send parking notification to staff / general system
    await Notification.create({
      title: 'Parking Update',
      message: `Vehicle ${vehicleNumber} exited. Fee: ₹${entry.fee}. Bay is now available.`,
      type: 'Parking',
      mall: space.mall,
    });

    for (const owner of owners) {
      await Notification.create({
        user: owner._id,
        title: 'Parking Payment Successful',
        message: `Your vehicle ${vehicleNumber} has successfully exited ${mallName}. Fee Paid: ₹${entry.fee} via ${paymentMethod}.`,
        type: 'Parking',
        mall: space.mall,
      });
    }

    const io = req.app.get('io');
    if (io) io.emit('parking_update', { mallId: space.mall, spaceId: space._id, bayId: bay?._id, status: 'Available' });
  }

  res.json({
    message: 'Vehicle exited and payment processed successfully',
    summary: {
      vehicleNumber: entry.vehicleNumber,
      entryTime: entry.entryTime,
      exitTime: entry.exitTime,
      durationHours: hours,
      feePerHour: feePerHour,
      totalFee: entry.fee,
      paymentMethod: entry.paymentMethod,
      paymentStatus: entry.paymentStatus,
      transactionId: entry.razorpayPaymentId
    }
  });
});
export { getMallParkingStatus, getParkingStats, getParkingSpaces, createParkingSpace, updateParkingSpace, getParkingBays, recordEntry, recordExit, initParkingPayment, getMyParkingHistory };
