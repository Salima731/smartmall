import asyncHandler from 'express-async-handler';
import Review from '../models/reviewModel.js';
import ActivityLog from '../models/activityLogModel.js';
import Product from '../models/productModel.js';
import Shop from '../models/shopModel.js';
import mongoose from 'mongoose';

// @desc    Get reviews for a target (shop, mall, restroom, parking, product)
// @route   GET /api/reviews/:targetType/:targetId
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  // Auto-approve pending reviews for development testing convenience
  await Review.updateMany({ status: 'Pending' }, { status: 'Approved' });

  const query = {
    targetType: req.params.targetType,
    targetId: req.params.targetId,
  };

  // If public or non-admin user, only show Approved reviews
  if (!req.user || (req.user.role !== 'Super Admin' && req.user.role !== 'Mall Admin')) {
    query.status = 'Approved'; // Adjust to whatever status logic is needed
  } else if (req.user && req.user.role === 'Mall Admin') {
    // Mall Admin can see all reviews for their mall
    query.mall = req.user.mall;
  }

  const reviews = await Review.find(query).populate('user', 'name avatar').sort({ createdAt: -1 });
  res.json(reviews);
});

// @desc    Get all reviews (for Admin/Shop Owner Dashboard)
// @route   GET /api/reviews
// @access  Private (Admin / Shop Owner)
const getAllReviews = asyncHandler(async (req, res) => {
  let filter = {};
  
  if (req.user.role === 'Mall Admin') {
    filter.mall = req.user.mall;
  } else if (req.user.role === 'Shop Owner') {
    const ownedShop = await Shop.findOne({ owner: req.user._id }).select('_id');
    if (!ownedShop) {
      res.json([]);
      return;
    }
    // Fetch product IDs belonging to the shop owner's shop
    const products = await Product.find({ shop: ownedShop._id }).select('_id');
    const productIds = products.map(p => p._id);

    filter = {
      $or: [
        { targetType: 'Shop', targetId: ownedShop._id },
        { targetType: 'Product', targetId: { $in: productIds } }
      ]
    };
  } else if (req.user.role === 'User' || req.user.role === 'Staff') {
    res.status(403);
    throw new Error('Not authorized to view all reviews');
  }

  const reviews = await Review.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json(reviews);
});

// @desc    Submit a review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { targetType, targetId, mallId, rating, comment } = req.body;

  const existing = await Review.findOne({
    user: req.user._id,
    targetType,
    targetId,
  });

  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this.');
  }

  const review = await Review.create({
    user: req.user._id,
    targetType,
    targetId,
    mall: mallId,
    rating,
    comment,
    status: 'Approved' // Auto-approved for developer testing convenience
  });

  await ActivityLog.create({
    user: req.user._id,
    action: 'SUBMIT_REVIEW',
    details: `Submitted a ${rating}-star review for ${targetType}`,
    targetModel: 'Review',
    targetId: review._id,
    mall: mallId
  });

  res.status(201).json(review);
});

// @desc    Moderate a review (approve/reject)
// @route   PUT /api/reviews/:id/moderate
// @access  Private (Admins)
const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (req.user.role === 'Mall Admin' && review.mall?.toString() !== req.user.mall?.toString()) {
    res.status(403);
    throw new Error('Not authorized to moderate this review');
  }

  review.status = req.body.status || review.status;
  const updatedReview = await review.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'MODERATE_REVIEW',
    details: `Moderated review to status: ${updatedReview.status}`,
    targetModel: 'Review',
    targetId: review._id,
    mall: review.mall
  });

  res.json(updatedReview);
});

// @desc    Get reviews submitted by the logged-in user
// @route   GET /api/reviews/myreviews
// @access  Private
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 });
  res.json(reviews);
});

// @desc    Get average rating for a target
// @route   GET /api/reviews/avg/:targetType/:targetId
// @access  Public
const getAverageRating = asyncHandler(async (req, res) => {
  const result = await Review.aggregate([
    {
      $match: {
        targetType: req.params.targetType,
        targetId: { $eq: new mongoose.Types.ObjectId(req.params.targetId) },
        status: 'Approved' // Only calculate avg from approved reviews
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    avgRating: result[0]?.avgRating?.toFixed(1) || 0,
    count: result[0]?.count || 0,
  });
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Ensure logged-in user is the owner of the review
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
    res.status(403);
    throw new Error('Not authorized to edit this review');
  }

  review.rating = req.body.rating !== undefined ? req.body.rating : review.rating;
  review.comment = req.body.comment !== undefined ? req.body.comment : review.comment;
  review.status = 'Approved'; // Auto-approve on update for testing convenience

  const updatedReview = await review.save();
  res.json(updatedReview);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Ensure logged-in user is the owner or an Admin
  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'Super Admin' &&
    req.user.role !== 'Mall Admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  await Review.deleteOne({ _id: review._id });
  res.json({ message: 'Review removed successfully' });
});

export { 
  getReviews, 
  getAllReviews, 
  createReview, 
  moderateReview, 
  getAverageRating, 
  getMyReviews,
  updateReview,
  deleteReview
};
