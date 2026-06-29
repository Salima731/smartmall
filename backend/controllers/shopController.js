import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Shop from '../models/shopModel.js';
import Product from '../models/productModel.js';
import Offer from '../models/offerModel.js';
import User from '../models/userModel.js';
import Mall from '../models/mallModel.js';

// @desc    Get shops by mall
// @route   GET /api/shops/mall/:mallId
// @access  Public
const getShopsByMall = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.mallId)) {
    res.status(400);
    throw new Error('Invalid mall id');
  }

  const shops = await Shop.find({ mall: req.params.mallId });
  res.json(shops);
});

// @desc    Get shops the current admin is allowed to manage
// @route   GET /api/shops/managed
// @access  Private/Mall Admin/Super Admin
const getManagedShops = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  if (req.user.role === 'Mall Admin') {
    if (!req.user.mall) {
      res.status(400);
      throw new Error('Your account is not assigned to a mall.');
    }

    const shops = await Shop.find({ ...keyword, mall: req.user.mall })
      .populate('mall', 'name')
      .populate('owner', 'name email role');
    return res.json(shops);
  }

  const shops = await Shop.find({ ...keyword })
    .populate('mall', 'name')
    .populate('owner', 'name email role');
  res.json(shops);
});

// @desc    Get the shop owned by the signed-in shop owner
// @route   GET /api/shops/my-shop
// @access  Private/Shop Owner
const getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id })
    .populate('mall', 'name')
    .populate('owner', 'name email role');

  if (!shop) {
    res.status(404);
    throw new Error('No shop is assigned to this account.');
  }

  res.json(shop);
});

// @desc    Global Search (Shops, Products, Offers, Malls)
// @route   GET /api/shops/search
// @access  Public
const globalSearch = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword;

  if (!keyword) {
    res.status(400);
    throw new Error('Please provide a search keyword');
  }

  const query = { $regex: keyword, $options: 'i' };

  const products = await Product.find({ name: query })
    .populate('shop', 'name')
    .populate('mall', 'name');
  
  const shops = await Shop.find({ name: query })
    .populate('mall', 'name');

  const offers = await Offer.find({ title: query })
    .populate('shop', 'name')
    .populate('mall', 'name');

  const malls = await Mall.find({
    $or: [
      { name: query },
      { district: query }
    ]
  });

  res.json({ products, shops, offers, malls });
});

// @desc    Create a shop
// @route   POST /api/shops
// @access  Private/Mall Admin
const createShop = asyncHandler(async (req, res) => {
  const { name, mallId, ownerId, category, shopType, floor, image } = req.body;
  const effectiveMallId = req.user.role === 'Mall Admin' ? req.user.mall : mallId;

  if (!effectiveMallId) {
    res.status(400);
    throw new Error(
      req.user.role === 'Mall Admin'
        ? 'Your account is not assigned to a mall. Please contact a Super Admin.'
        : 'Please select a mall for this shop.'
    );
  }

  if (ownerId) {
    const owner = await User.findById(ownerId);
    if (!owner || !['Shop Owner', 'User'].includes(owner.role)) {
      res.status(400);
      throw new Error('Selected shop owner is invalid.');
    }

    if (owner.mall && owner.mall.toString() !== effectiveMallId.toString()) {
      res.status(400);
      throw new Error('Selected shop owner belongs to another mall.');
    }
  }

  const shop = new Shop({
    name,
    mall: effectiveMallId,
    owner: ownerId || undefined,
    category,
    shopType: shopType || 'Retail',
    floor,
    image,
  });

  const createdShop = await shop.save();

  if (ownerId) {
    await User.findByIdAndUpdate(ownerId, { mall: effectiveMallId, role: 'Shop Owner' });
  }

  res.status(201).json(createdShop);
});

// @desc    Get all shops (with optional search)
// @route   GET /api/shops
// @access  Public
const getShops = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const shops = await Shop.find({ ...keyword })
    .populate('mall', 'name')
    .populate('owner', 'name email role');
  res.json(shops);
});

// @desc    Update a shop
// @route   PUT /api/shops/:id
// @access  Private/Shop Owner/Mall Admin/Super Admin
const updateShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  // RBAC check
  if (req.user.role === 'Mall Admin') {
    if (shop.mall?.toString() !== req.user.mall?.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify shops outside your assigned mall');
    }
  } else if (req.user.role === 'Shop Owner') {
    if (shop.owner?.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this shop');
    }
  } else if (req.user.role !== 'Super Admin') {
    res.status(403);
    throw new Error('Not authorized to modify this shop');
  }

  if (req.body.owner !== undefined) {
    const nextOwnerId = req.body.owner || null;
    const currentOwnerId = shop.owner;

    if (!nextOwnerId) {
      req.body.owner = null;
    } else {
      const owner = await User.findById(nextOwnerId);
      if (!owner || !['Shop Owner', 'User'].includes(owner.role)) {
        res.status(400);
        throw new Error('Selected shop owner is invalid.');
      }

      if (owner.mall && owner.mall.toString() !== shop.mall.toString()) {
        res.status(400);
        throw new Error('Selected shop owner belongs to another mall.');
      }

      await User.findByIdAndUpdate(nextOwnerId, { mall: shop.mall, role: 'Shop Owner' });
    }

    if (currentOwnerId && currentOwnerId.toString() !== nextOwnerId?.toString()) {
      const stillOwnsAnotherShop = await Shop.exists({
        _id: { $ne: shop._id },
        owner: currentOwnerId,
      });

      if (!stillOwnsAnotherShop) {
        await User.findByIdAndUpdate(currentOwnerId, { role: 'User' });
      }
    }
  }

  const updatedShop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('mall', 'name')
    .populate('owner', 'name email role');
  res.json(updatedShop);
});

// @desc    Delete a shop
// @route   DELETE /api/shops/:id
// @access  Private/Mall Admin/Super Admin
const deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  // RBAC check - Shop owners cannot delete their own shop, only Admins
  if (req.user.role !== 'Super Admin') {
    if (req.user.role === 'Mall Admin' && shop.mall?.toString() !== req.user.mall?.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this shop');
    } else if (req.user.role !== 'Mall Admin') {
      res.status(403);
      throw new Error('Not authorized to delete this shop');
    }
  }

  await Shop.deleteOne({ _id: shop._id });
  res.json({ message: 'Shop removed' });
});

// @desc    Get shop by ID
// @route   GET /api/shops/:id
// @access  Public
const getShopById = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id)
    .populate('mall', 'name')
    .populate('owner', 'name email role');
  if (shop) {
    res.json(shop);
  } else {
    res.status(404);
    throw new Error('Shop not found');
  }
});

export { getShopsByMall, getManagedShops, getMyShop, globalSearch, createShop, getShops, updateShop, deleteShop, getShopById };
