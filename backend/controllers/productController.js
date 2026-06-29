import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import Shop from '../models/shopModel.js';
import Mall from '../models/mallModel.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const attachMallFromShop = (product) => ({
  ...product,
  mall: product.shop?.mall || null,
});

const verifyShopOwnership = async (product, userId) => {
  const shop = await Shop.findById(product.shop);
  return shop && shop.owner?.toString() === userId.toString();
};

const verifyMallAdminAccess = async (product, mallId) => {
  const shop = await Shop.findById(product.shop);
  return shop && shop.mall?.toString() === mallId?.toString();
};

// @desc    Get products by shop
// @route   GET /api/products/shop/:shopId
// @access  Public
const getProductsByShop = asyncHandler(async (req, res) => {
  const products = await Product.find({ shop: req.params.shopId })
    .populate({
      path: 'shop',
      select: 'name shopType mall',
      populate: { path: 'mall', select: 'name address district image' },
    })
    .lean();
  res.json(products.map(attachMallFromShop));
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Shop Owner
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, image, gallery, category, brand, shopId, countInStock, status, tags } = req.body;
  const product = new Product({
    name, description,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    image,
    gallery: gallery || [],
    category, brand,
    shop: shopId,
    countInStock: Number(countInStock),
    status: status || 'Active',
    tags: tags || [],
  });
  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Get all products (search / shop filter; mall filter derived via shops)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const filters = [];

  if (req.query.keyword?.trim()) {
    const keywordRegex = new RegExp(escapeRegex(req.query.keyword.trim()), 'i');
    const mallIds = await Mall.find({
      $or: [
        { name: keywordRegex },
        { address: keywordRegex },
        { district: keywordRegex },
      ],
    }).distinct('_id');

    const shopIds = await Shop.find({
      $or: [
        { name: keywordRegex },
        { category: keywordRegex },
        { shopType: keywordRegex },
        { floor: keywordRegex },
        { mall: { $in: mallIds } },
      ],
    }).distinct('_id');

    filters.push({
      $or: [
        { name: keywordRegex },
        { description: keywordRegex },
        { category: keywordRegex },
        { brand: keywordRegex },
        { tags: keywordRegex },
        { shop: { $in: shopIds } },
      ],
    });
  }

  if (req.query.shop) filters.push({ shop: req.query.shop });

  if (req.query.mall) {
    const shopIds = await Shop.find({ mall: req.query.mall }).distinct('_id');
    filters.push({ shop: { $in: shopIds } });
  }

  const filter = filters.length > 0 ? { $and: filters } : {};

  const products = await Product.find(filter)
    .populate({
      path: 'shop',
      select: 'name shopType mall',
      populate: { path: 'mall', select: 'name address district image' },
    })
    .lean();
  res.json(products.map(attachMallFromShop));
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Shop Owner/Mall Admin/Super Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  if (req.user.role === 'Shop Owner') {
    if (!(await verifyShopOwnership(product, req.user._id))) {
      res.status(403); throw new Error('Not authorized to modify this product');
    }
  } else if (req.user.role === 'Mall Admin') {
    if (!(await verifyMallAdminAccess(product, req.user.mall))) {
      res.status(403); throw new Error('Not authorized to modify this product');
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Shop Owner/Mall Admin/Super Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  if (req.user.role === 'Shop Owner') {
    if (!(await verifyShopOwnership(product, req.user._id))) {
      res.status(403); throw new Error('Not authorized to delete this product');
    }
  } else if (req.user.role === 'Mall Admin') {
    if (!(await verifyMallAdminAccess(product, req.user.mall))) {
      res.status(403); throw new Error('Not authorized to delete this product');
    }
  }

  await Product.deleteOne({ _id: product._id });
  res.json({ message: 'Product removed' });
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate({
      path: 'shop',
      select: 'name shopType mall',
      populate: { path: 'mall', select: 'name address district image' },
    })
    .lean();
  if (product) { res.json(attachMallFromShop(product)); }
  else { res.status(404); throw new Error('Product not found'); }
});

export { getProductsByShop, createProduct, getProducts, updateProduct, deleteProduct, getProductById };
