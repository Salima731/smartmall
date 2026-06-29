import express from 'express';
import {
  getMallParkingStatus,
  getParkingStats,
  getParkingSpaces,
  createParkingSpace,
  updateParkingSpace,
  getParkingBays,
  recordEntry,
  recordExit,
  initParkingPayment,
  getMyParkingHistory,
} from '../controllers/parkingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Aggregated mall-level status (used by ParkingManager component)
router.get('/mall/:mallId', protect, getMallParkingStatus);

// Parking stats
router.get('/stats/:mallId', protect, getParkingStats);

// Parking Spaces (zones)
router.get('/spaces/:mallId', getParkingSpaces);
router.post('/spaces', protect, authorize('Mall Admin', 'Super Admin'), createParkingSpace);
router.put('/spaces/:id', protect, authorize('Mall Admin', 'Super Admin'), updateParkingSpace);

// Parking Bays (individual slots)
router.get('/bays/:spaceId', getParkingBays);

// Vehicle Entry / Exit
router.post('/entry', protect, authorize('Staff', 'Mall Admin', 'Super Admin'), recordEntry);
router.post('/exit', protect, authorize('Staff', 'Mall Admin', 'Super Admin'), recordExit);

// Customer-facing parking payments & history
router.get('/my-history', protect, getMyParkingHistory);

// Online Payment Init (generates UPI QR for customer to scan)
router.post('/payment/init', protect, authorize('Staff', 'Mall Admin', 'Super Admin'), initParkingPayment);

export default router;
