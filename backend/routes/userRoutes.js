import express from 'express';
import {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  authGoogle,
  verifyOTP,
  getUsers,
  updateUser,
  deleteUser,
  createStaff,
  updateStaffDepartment,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser).get(protect, authorize('Mall Admin', 'Super Admin'), getUsers);
router.post('/login', authUser);
router.post('/google', authGoogle);
router.post('/verify', verifyOTP);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Mall Admin / Super Admin only routes
router.post('/staff', protect, authorize('Mall Admin', 'Super Admin'), createStaff);
router.put('/staff/:id/department', protect, authorize('Mall Admin', 'Super Admin'), updateStaffDepartment);

router.route('/:id')
  .put(protect, authorize('Mall Admin', 'Super Admin'), updateUser)
  .delete(protect, authorize('Mall Admin', 'Super Admin'), deleteUser);

export default router;
