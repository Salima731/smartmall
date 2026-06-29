import asyncHandler from 'express-async-handler';
import Offer from '../models/offerModel.js';
import Shop from '../models/shopModel.js';
import Notification from '../models/notificationModel.js';

// Helper: resolve the Shop document from an offer (handles both direct shop link and legacy product link)
const resolveShopFromOffer = async (offer) => {
  if (offer.shop) {
    return Shop.findById(offer.shop);
  }
  // Legacy: offer linked to a product -> navigate to its shop
  if (offer.product) {
    const Product = (await import('../models/productModel.js')).default;
    const product = await Product.findById(offer.product);
    if (!product) return null;
    return Shop.findById(product.shop);
  }
  return null;
};

// @desc    Get all / filtered offers
// @route   GET /api/offers
// @access  Public
const getOffers = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.product)  query.product = req.query.product;
  if (req.query.shop)     query.shop    = req.query.shop;
  if (req.query.status && req.query.status !== 'all')   query.status  = req.query.status;
  if (req.query.category && req.query.category !== 'All') query.category = req.query.category;

  if (req.query.mall) {
    const shopIds = await Shop.find({ mall: req.query.mall }).distinct('_id');
    query.shop = { $in: shopIds };
  }

  // Default: only show active offers unless a specific filter was requested (like status = 'all')
  if (!req.query.product && !req.query.status) {
    query.$or = [{ status: 'Active' }, { status: 'Approved' }];
  }

  const offers = await Offer.find(query)
    .populate({
      path: 'shop',
      select: 'name mall',
      populate: { path: 'mall', select: 'name location address district image' },
    })
    .populate({
      path: 'product',
      select: 'name image price shop',
      populate: {
        path: 'shop',
        select: 'name mall',
        populate: { path: 'mall', select: 'name location address district image' },
      },
    })
    .lean()
    .sort({ createdAt: -1 });

  res.json(offers.map((offer) => ({
    ...offer,
    mall: offer.shop?.mall || offer.product?.shop?.mall || null,
  })));
});

// @desc    Create an offer
// @route   POST /api/offers
// @access  Private/Shop Owner/Mall Admin/Super Admin
const createOffer = asyncHandler(async (req, res) => {
  const {
    title, description, discountPercentage, productId, shopId, mallId,
    offerType, category, couponCode, audience, banner, isFeatured,
    redemptionLimit, termsAndConditions, relatedProducts, sendNotification,
    startDate, endDate, status,
  } = req.body;

  // Determine effective shop
  let effectiveShopId = shopId || null;

  // Shop Owner: must use their own shop
  if (req.user.role === 'Shop Owner') {
    const ownedShop = await Shop.findOne({ owner: req.user._id }).select('_id');
    effectiveShopId = ownedShop?._id || shopId;
    if (!effectiveShopId) {
      res.status(400); throw new Error('Shop Owner must have an assigned shop');
    }
  }

  const offer = await Offer.create({
    title,
    description,
    discountPercentage: discountPercentage || 10,
    product: productId || null,
    shop: effectiveShopId || null,
    offerType: offerType || 'Festival Offer',
    category: category || 'General',
    couponCode: couponCode || '',
    audience: audience || 'All Users',
    banner: banner || '',
    isFeatured: isFeatured || false,
    redemptionLimit: redemptionLimit ? Number(redemptionLimit) : null,
    termsAndConditions: termsAndConditions || '',
    relatedProducts: relatedProducts || [],
    sendNotification: sendNotification || false,
    startDate,
    endDate,
    status: status || 'Active',
  });

  if (sendNotification) {
    await Notification.create({
      title: 'New Offer Available!',
      message: `${title} — ${discountPercentage || 0}% OFF is now live!`,
      type: 'Offer',
    });
  }

  res.status(201).json(offer);
});

// @desc    Update an offer
// @route   PUT /api/offers/:id
// @access  Private/Shop Owner/Mall Admin/Super Admin
const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) { res.status(404); throw new Error('Offer not found'); }

  // Authorization: Shop Owners and Mall Admins can only touch their own offers
  if (req.user.role === 'Shop Owner' || req.user.role === 'Mall Admin') {
    const shop = await resolveShopFromOffer(offer);

    // If offer has no shop link at all, allow Super Admin only
    if (!shop) {
      if (req.user.role !== 'Super Admin') {
        res.status(403); throw new Error('Not authorized to modify this offer');
      }
    } else {
      if (req.user.role === 'Shop Owner' && shop.owner?.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('Not authorized to modify this offer');
      }
      if (req.user.role === 'Mall Admin' && shop.mall?.toString() !== req.user.mall?.toString()) {
        res.status(403); throw new Error('Not authorized to modify this offer');
      }
    }
  }

  const updatedOffer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('shop', 'name mall')
    .populate('mall', 'name location');
  res.json(updatedOffer);
});

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private/Shop Owner/Mall Admin/Super Admin
const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) { res.status(404); throw new Error('Offer not found'); }

  if (req.user.role === 'Shop Owner' || req.user.role === 'Mall Admin') {
    const shop = await resolveShopFromOffer(offer);

    if (!shop) {
      if (req.user.role !== 'Super Admin') {
        res.status(403); throw new Error('Not authorized to delete this offer');
      }
    } else {
      if (req.user.role === 'Shop Owner' && shop.owner?.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('Not authorized to delete this offer');
      }
      if (req.user.role === 'Mall Admin' && shop.mall?.toString() !== req.user.mall?.toString()) {
        res.status(403); throw new Error('Not authorized to delete this offer');
      }
    }
  }

  await Offer.deleteOne({ _id: offer._id });
  res.json({ message: 'Offer removed' });
});

export { getOffers, createOffer, updateOffer, deleteOffer };
