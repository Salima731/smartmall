import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Mall from '../models/mallModel.js';

// Permissions Matrix
const rolePermissions = {
  'Super Admin': [
    'manage_malls', 'manage_shops', 'manage_users', 'manage_products',
    'manage_offers', 'manage_parking', 'manage_orders', 'manage_notifications',
    'manage_analytics', 'manage_categories', 'manage_settings', 'view_all'
  ],
  'Mall Admin': [
    'view_shops', 'view_products', 'view_offers', 'approve_offers',
    'hide_products', 'feature_items', 'view_analytics', 'manage_parking_ops',
    'view_orders', 'send_announcements', 'manage_restrooms', 'approve_shops'
  ],
  'Shop Owner': [
    'manage_profile', 'manage_own_products', 'manage_own_offers', 
    'view_own_analytics', 'manage_own_shop'
  ],
  'Staff': [
    'manage_parking_slots', 'update_vehicles', 'manage_orders_staff',
    'update_restrooms', 'update_maintenance'
  ],
  'User': [
    'browse', 'place_orders', 'view_parking',
    'receive_notifications', 'book_events', 'redeem_offers'
  ]
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (req.user?.role === 'Mall Admin' && !req.user.mall) {
        const assignedMall = await Mall.findOne({ admin: req.user._id }).select('_id');
        if (assignedMall) {
          req.user.mall = assignedMall._id;
          await User.findByIdAndUpdate(req.user._id, { mall: assignedMall._id });
        }
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Role-Based Access Control Middleware (equivalent to roleMiddleware)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role ${req.user?.role || 'unknown'} is not authorized to access this route`);
    }
    next();
  };
};

// Permission-Based Access Control Middleware
const permissionMiddleware = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user context missing');
    }
    
    // Super Admin has full platform bypass
    if (req.user.role === 'Super Admin') {
      return next();
    }
    
    const userPermissions = rolePermissions[req.user.role] || [];
    const hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm));
    
    if (!hasPermission) {
      res.status(403);
      throw new Error(`Not authorized. Required permissions: ${requiredPermissions.join(', ')}`);
    }
    
    next();
  };
};

// MongoDB Resource Ownership Validation Middleware
const validateOwnership = (Model, idParam = 'id', ownerField = 'owner') => {
  return asyncHandler(async (req, res, next) => {
    // Super Admin bypasses ownership
    if (req.user.role === 'Super Admin') {
      return next();
    }
    
    const resource = await Model.findById(req.params[idParam]);
    if (!resource) {
      res.status(404);
      throw new Error('Resource not found');
    }
    
    const userId = req.user._id.toString();
    
    if (req.user.role === 'Shop Owner') {
      // Check ownership via shop.owner (user.shop removed from User model)
      let shopToCheck = null;
      if (Model.modelName === 'Product') {
        const Shop = (await import('../models/shopModel.js')).default;
        shopToCheck = await Shop.findById(resource.shop);
      } else {
        const resourceOwnerId = resource[ownerField]?.toString();
        if (resourceOwnerId !== userId) {
          res.status(403);
          throw new Error('Not authorized to access or modify this resource');
        }
      }
      if (shopToCheck && shopToCheck.owner?.toString() !== userId) {
        res.status(403);
        throw new Error('Not authorized to access or modify this resource');
      }
    } else if (req.user.role === 'Mall Admin') {
      // If Mall Admin, check if resource belongs to their mall
      if (resource.mall?.toString() !== req.user.mall?.toString()) {
        res.status(403);
        throw new Error('Not authorized to access resources outside your assigned mall');
      }
    } else {
      res.status(403);
      throw new Error('Not authorized to modify this resource');
    }
    
    next();
  });
};

export { protect, authorize, authorize as roleMiddleware, permissionMiddleware, validateOwnership };
