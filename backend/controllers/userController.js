import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Shop from '../models/shopModel.js';
import Mall from '../models/mallModel.js';
import ActivityLog from '../models/activityLogModel.js';
import generateToken from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';
import sendEmail from '../utils/sendEmail.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: dynamically retrieve the shop ID for Shop Owners (without mutating User)
const resolveShopForUser = async (user) => {
  if (user.role === 'Shop Owner') {
    const ownedShop = await Shop.findOne({ owner: user._id }).select('_id');
    if (ownedShop) {
      return ownedShop._id;
    }
  }
  return null;
};

const resolveMallForUser = async (user) => {
  if (user.role !== 'Mall Admin' || user.mall) {
    return user.mall;
  }

  const assignedMall = await Mall.findOne({ admin: user._id }).select('_id');
  if (!assignedMall) {
    return null;
  }

  user.mall = assignedMall._id;
  await user.save();
  return assignedMall._id;
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (user.isBlocked) {
      res.status(403);
      throw new Error('Your account has been suspended by a Super Administrator.');
    }
    if (!user.isVerified && process.env.NODE_ENV !== 'development') {
      res.status(401);
      throw new Error('Account not verified. Please verify your email.');
    }
    try {
      await ActivityLog.create({
        user: user._id,
        action: 'LOGIN',
        details: `${user.name} logged in successfully via email/password.`,
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    } catch (err) {
      console.error('Failed to log login:', err);
    }

    const shopId = await resolveShopForUser(user);
    const mallId = await resolveMallForUser(user);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      mall: mallId,
      shop: shopId,
      vehicleNumbers: user.vehicleNumbers || [],
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, mall, shop, adminSecretKey } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Security: Prevent role escalation
  let finalRole = 'User';
  if (role && role !== 'User') {
    if (adminSecretKey?.trim() !== process.env.ADMIN_SECRET_KEY?.trim()) {
      res.status(401);
      throw new Error('Invalid Admin Secret Key. Role escalation denied.');
    }
    finalRole = role;
  }

  if (finalRole === 'Shop Owner') {
    if (!shop) {
      res.status(400);
      throw new Error('Please select a shop to manage.');
    }

    const targetShop = await Shop.findById(shop);
    if (!targetShop) {
      res.status(404);
      throw new Error('Selected shop not found.');
    }

    if (mall && targetShop.mall.toString() !== mall.toString()) {
      res.status(400);
      throw new Error('Selected shop does not belong to the selected mall.');
    }

    if (targetShop.owner) {
      res.status(400);
      throw new Error('This shop already has an owner assigned.');
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  const user = await User.create({
    name,
    email,
    password,
    role: finalRole,
    mall: mall || undefined,
    otp,
    otpExpiry,
    isVerified: process.env.NODE_ENV === 'development',
  });

  if (finalRole === 'Shop Owner' && shop) {
    await Shop.findByIdAndUpdate(shop, { owner: user._id });
  }

  if (user) {
    try {
      await sendEmail({
        email: user.email,
        subject: 'Smart Mall - Email Verification OTP',
        message: `Your verification OTP is: ${otp}. It will expire in 10 minutes.`,
        html: `<h1>Verify Your Email</h1><p>Your verification OTP is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
      });

      res.status(201).json({
        message: 'OTP sent to email. Please verify your account.',
        email: user.email,
      });
    } catch (error) {
      console.error(error);
      res.status(500);
      throw new Error('Email could not be sent');
    }
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const shopId = await resolveShopForUser(user);
    const mallId = await resolveMallForUser(user);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      mall: mallId,
      shop: shopId,
      avatar: user.avatar,
      vehicleNumbers: user.vehicleNumbers || [],
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.department) {
      user.department = req.body.department;
    }
    if (req.body.password) {
      user.password = req.body.password;
    }

    if (req.body.vehicleNumbers !== undefined) {
      user.vehicleNumbers = req.body.vehicleNumbers;
    }

    const updatedUser = await user.save();
    const shopId = await resolveShopForUser(updatedUser);
    const mallId = await resolveMallForUser(updatedUser);

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      mall: mallId,
      shop: shopId,
      avatar: updatedUser.avatar,
      vehicleNumbers: updatedUser.vehicleNumbers || [],
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Auth user with Google
// @route   POST /api/users/google
// @access  Public
const authGoogle = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { name, email, sub: googleId } = ticket.getPayload();

  let user = await User.findOne({ email });

  if (user) {
    if (!user.googleId) {
      // Use updateOne to patch only googleId — avoids running full-document
      // validation on existing users that may have a stale department value
      // (e.g. 'Queue') from a previous schema that is no longer in the enum.
      await User.updateOne({ _id: user._id }, { $set: { googleId } });
      user.googleId = googleId; // keep in-memory object in sync
    }
  } else {
    user = await User.create({
      name,
      email,
      googleId,
      password: Math.random().toString(36).slice(-10),
    });
  }

  try {
    await ActivityLog.create({
      user: user._id,
      action: 'LOGIN',
      details: `${user.name} logged in successfully via Google OAuth.`,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error('Failed to log login:', err);
  }

  const shopId = await resolveShopForUser(user);
  const mallId = await resolveMallForUser(user);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    mall: mallId,
    shop: shopId,
    token: generateToken(user._id),
  });
});

// @desc    Verify OTP
// @route   POST /api/users/verify
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
      mall: user.mall,
      shop: shopId,
      token: generateToken(user._id),
    });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const role = req.query.role;
  const ownerCandidates = req.query.ownerCandidates === 'true';
  let filter = role ? { role } : {};

  if (req.user && req.user.role === 'Mall Admin') {
    if (ownerCandidates || role === 'Shop Owner') {
      const ownerIdsInMall = await Shop.find({
        mall: req.user.mall,
        owner: { $exists: true, $ne: null },
      }).distinct('owner');

      filter = {
        $and: [
          ownerCandidates ? { role: { $in: ['Shop Owner', 'User'] } } : { role: 'Shop Owner' },
          {
            $or: [
              { mall: req.user.mall },
              { mall: { $exists: false } },
              { mall: null },
              { _id: { $in: ownerIdsInMall } },
            ],
          },
        ],
      };
    } else {
      filter.mall = req.user.mall;
    }

    if (!role) {
      filter.role = { $in: ['Staff', 'Shop Owner', 'User'] };
    }
  }

  const users = await User.find(filter).select('-password');
  res.json(users);
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.department = req.body.department || user.department;
    user.mall = req.body.mall !== undefined ? req.body.mall : user.mall;
    if (req.body.isBlocked !== undefined) {
      user.isBlocked = req.body.isBlocked;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      mall: updatedUser.mall,
      isBlocked: updatedUser.isBlocked,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.role === 'Super Admin') {
      res.status(400);
      throw new Error('Cannot delete a Super Admin user');
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed successfully' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Create a Staff account (by Mall Admin)
// @route   POST /api/users/staff
// @access  Private/Mall Admin
const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    res.status(400);
    throw new Error('Please provide name, email, password, and department');
  }

  const validDepartments = ['Parking', 'Restrooms', 'General'];
  if (!validDepartments.includes(department)) {
    res.status(400);
    throw new Error(`Invalid department. Must be one of: ${validDepartments.join(', ')}`);
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'Staff',
    department,
    mall: req.user.mall,
    isVerified: true,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      mall: user.mall,
      message: `Staff account created and assigned to ${department} department successfully.`,
    });
  } else {
    res.status(400);
    throw new Error('Invalid staff data');
  }
});

// @desc    Update staff department (by Mall Admin)
// @route   PUT /api/users/staff/:id/department
// @access  Private/Mall Admin
const updateStaffDepartment = asyncHandler(async (req, res) => {
  const { department } = req.body;
  const staff = await User.findById(req.params.id);

  if (!staff) {
    res.status(404);
    throw new Error('Staff member not found');
  }

  if (staff.role !== 'Staff') {
    res.status(400);
    throw new Error('This user is not a Staff member');
  }

  if (req.user.role !== 'Super Admin' && staff.mall?.toString() !== req.user.mall?.toString()) {
    res.status(403);
    throw new Error('Not authorized to manage staff outside your mall');
  }

  staff.department = department || staff.department;
  await staff.save();

  res.json({
    _id: staff._id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    department: staff.department,
    mall: staff.mall,
    message: `Department updated to ${staff.department}`,
  });
});

export {
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
};
