import RazorpayPackage from 'razorpay';
const Razorpay = RazorpayPackage.default || RazorpayPackage;

import crypto from 'crypto';
import asyncHandler from 'express-async-handler';

// @desc    Create Razorpay Order
// @route   POST /api/payments/order
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const instance = new Razorpay({
    key_id: 'rzp_test_Smo4dv2jns6Tpu',
    key_secret: 'dgbY8bdqw3o4VNOGvvs7lYew',
  });

  const options = {
    amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await instance.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('RAZORPAY ERROR:', error);
    res.status(500).json({ message: error.description || 'Order creation failed', error });
  }
});

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const secret = 'dgbY8bdqw3o4VNOGvvs7lYew';
  const sha = crypto.createHmac('sha256', secret);
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest('hex');

  if (digest !== razorpay_signature) {
    res.status(400);
    throw new Error('Transaction is not legit!');
  }

  res.json({
    msg: 'success',
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
});

export { createOrder, verifyPayment };
