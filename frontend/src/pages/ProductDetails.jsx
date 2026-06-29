import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Loader2, 
  Store, 
  MapPin, 
  Star, 
  AlertCircle, 
  Award, 
  Check, 
  Send, 
  Tag, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useGetProductDetailsQuery } from '../features/products/productApiSlice';
import { useCreateOrderMutation, useVerifyPaymentMutation } from '../features/payments/paymentApiSlice';
import { usePlaceOrderMutation, useConfirmPaymentMutation } from '../features/orders/orderApiSlice';
import { useGetReviewsQuery, useCreateReviewMutation } from '../features/reviews/reviewApiSlice';
import { useGetOffersQuery } from '../features/offers/offerApiSlice';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewManager from '../components/ReviewManager';
import { isFoodProduct } from '../utils/foodDetection';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const ProductDetails = () => {
  const { id, productId } = useParams();
  const targetId = productId || id;
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  
  // Only 'User' role (customers) can purchase. Guests also see it (redirect to login)
  const canPurchase = !userInfo || userInfo.role === 'User';

  // API Queries & Mutations
  const { data: product, isLoading, error } = useGetProductDetailsQuery(targetId);
  const isFoodShop = isFoodProduct(product);
  const stockCount = product?.countInStock ?? product?.stock ?? 0;
  
  const [placeOrder, { isLoading: placingOrder }] = usePlaceOrderMutation();
  const [confirmPayment] = useConfirmPaymentMutation();
  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const { data: reviews, isLoading: loadingReviews, refetch: refetchReviews } = useGetReviewsQuery(
    { targetType: 'Product', targetId: targetId },
    { skip: !targetId }
  );
  const [createReview, { isLoading: creatingReview }] = useCreateReviewMutation();
  const { data: offers } = useGetOffersQuery('All', { skip: !product?.shop?._id });

  // Gallery Active Image
  const [activeImage, setActiveImage] = useState('');

  // New Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (product?.image) {
      setActiveImage(product.image);
    }
  }, [product]);

  const handlePayment = async () => {
    if (!userInfo) {
      toast.info('Please login to purchase products');
      return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      return;
    }

    try {
      // 1. Create order on backend (Database)
      const dbOrder = await placeOrder({
        shopId: product.shop?._id || product.shop,
        items: [{ productId: product._id, quantity: 1 }]
      }).unwrap();

      // 2. Create Razorpay order
      const order = await createOrder({ amount: dbOrder.totalAmount }).unwrap();

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        console.error('RAZORPAY KEY IS MISSING FROM ENVIRONMENT');
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: razorpayKey || 'rzp_test_Smo4dv2jns6Tpu',
        amount: order.amount,
        currency: order.currency,
        name: 'Smart Mall',
        description: `Purchase ${product.name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // 4. Verify payment signature on backend
            await verifyPayment(response).unwrap();
            
            // 5. Confirm order payment status
            await confirmPayment(dbOrder._id).unwrap();
            
            toast.success('Payment Successful! Order Placed.');
            navigate('/dashboard?tab=Orders');
          } catch (err) {
            toast.error('Payment verification failed!');
          }
        },
        prefill: {
          name: userInfo?.name || '',
          email: userInfo?.email || '',
        },
        theme: {
          color: '#0ea5e9',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to initialize payment');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      toast.info('Please login to post a rating review');
      return;
    }
    if (!comment.trim()) {
      toast.warning('Please enter a feedback message');
      return;
    }

    try {
      await createReview({
        targetType: 'Product',
        targetId: product._id,
        mallId: product.mall?._id,
        rating,
        comment,
      }).unwrap();
      
      toast.success('Review submitted successfully for moderation!');
      setComment('');
      setRating(5);
      refetchReviews();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to lodge review');
    }
  };

  // Filter offers specific to this shop or product
  const relatedOffers = offers?.filter((o) => {
    const offerShopId = o.shop?._id || o.shop;
    const relatedProducts = o.relatedProducts?.map((item) => item?._id || item) || [];
    return offerShopId === product?.shop?._id || relatedProducts.includes(targetId);
  }) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-40 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-sm font-black text-text-muted uppercase tracking-widest animate-pulse">Fetching Product Details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto text-center py-20 glass-card rounded-[2.5rem] border border-border-main p-8 space-y-6 bg-bg-card">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto opacity-80" />
        <h2 className="text-2xl font-black text-text-main">Product Not Found</h2>
        <p className="text-text-muted text-sm leading-relaxed">
          The requested product ID does not exist or has been removed from the platform inventory.
        </p>
        <Link 
          to="/products"
          className="inline-flex items-center px-6 py-3 bg-bg-sub border border-border-main rounded-xl text-xs font-black uppercase tracking-widest hover:bg-bg-sub/80 text-text-main"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Link>
      </div>
    );
  }

  // Realistic Discounts
  const hasDiscount = !!product.discountPrice;
  const sellingPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const originalPrice = hasDiscount ? product.price : null;

  // Average Rating & Star Percentages Calculations
  const validReviews = reviews?.filter(r => r.status === 'Approved') || [];
  const totalCount = validReviews.length;
  
  const averageRating = totalCount > 0
    ? (validReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
    : '0.0';

  const count5 = validReviews.filter(r => r.rating === 5).length;
  const count4 = validReviews.filter(r => r.rating === 4).length;
  const count3 = validReviews.filter(r => r.rating === 3).length;
  const count2 = validReviews.filter(r => r.rating === 2).length;
  const count1 = validReviews.filter(r => r.rating === 1).length;

  const pct5 = totalCount > 0 ? Math.round((count5 / totalCount) * 100) : 0;
  const pct4 = totalCount > 0 ? Math.round((count4 / totalCount) * 100) : 0;
  const pct3 = totalCount > 0 ? Math.round((count3 / totalCount) * 100) : 0;
  const pct2 = totalCount > 0 ? Math.round((count2 / totalCount) * 100) : 0;
  const pct1 = totalCount > 0 ? Math.round((count1 / totalCount) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8 pb-20 pt-4"
    >
      {/* Navigation breadcrumbs */}
      <div className="flex items-center justify-between border-b border-border-main/50 pb-6">
        <Link 
          to="/products"
          className="inline-flex items-center text-xs font-black uppercase tracking-widest text-text-muted hover:text-primary-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Link>
        <div className="flex items-center space-x-2 text-xs font-bold text-text-muted">
          <span>Home</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Products</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary-500 truncate max-w-[150px]">{product.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT COLUMN: Image Gallery & Rating Overview */}
        <div className="lg:col-span-5 space-y-8">
          {/* Main Focus Image Frame */}
          <div className="w-full h-[400px] md:h-[500px] bg-bg-card border border-border-main rounded-[2.5rem] overflow-hidden relative shadow-2xl group">
            <img 
              src={activeImage || 'https://placehold.co/600x600/1e293b/ffffff?text=Smart+Product'} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            {/* Absolute Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              {hasDiscount && (
                <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg">
                  {discountPct}% OFF
                </span>
              )}
              <span className="bg-gradient-to-r from-primary-600 to-primary-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Featured Deal
              </span>
            </div>
          </div>

          {/* Gallery Thumbnails List */}
          <div className="grid grid-cols-4 gap-4">
            {/* Main image preview */}
            <div 
              onClick={() => setActiveImage(product.image)}
              className={`h-24 bg-bg-card rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                activeImage === product.image ? 'border-primary-500 scale-95 shadow-lg' : 'border-border-main hover:border-text-muted'
              }`}
            >
              <img src={product.image || 'https://placehold.co/150x150/1e293b/ffffff'} alt="Main" className="w-full h-full object-cover" />
            </div>
            
            {/* Pseudo gallery slots */}
            {[1, 2, 3].map((slot) => {
              const dummyUrl = `https://placehold.co/600x600/1e293b/ffffff?text=Gallery+Slot+${slot}`;
              return (
                <div 
                  key={slot}
                  onClick={() => setActiveImage(dummyUrl)}
                  className={`h-24 bg-bg-card rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                    activeImage === dummyUrl ? 'border-primary-500 scale-95 shadow-lg' : 'border-border-main hover:border-text-muted'
                  }`}
                >
                  <img src={dummyUrl} alt={`Slot ${slot}`} className="w-full h-full object-cover" />
                </div>
              );
            })}
          </div>

          {/* Rating Summary Box */}
          <div className="glass-card border border-border-main p-6 rounded-[2rem] bg-bg-card space-y-5">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">Ratings & Reviews Summary</h4>
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <div className="text-center p-5 bg-bg-sub/60 rounded-3xl border border-border-main/50 min-w-[120px] flex flex-col justify-center items-center shadow-inner">
                <p className="text-5xl font-black text-text-main leading-none">{averageRating}</p>
                <div className="flex justify-center text-yellow-500 mt-2 gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`w-4 h-4 ${s <= Math.round(Number(averageRating)) ? 'text-amber-500 fill-amber-500' : 'text-text-muted opacity-20'}`} 
                    />
                  ))}
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-2">{validReviews.length} Reviews</p>
              </div>
              <div className="flex-1 space-y-2 text-xs font-bold text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="w-10">5 Star</span>
                  <div className="flex-1 h-2 bg-border-main rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${pct5}%` }} />
                  </div>
                  <span className="w-8 text-right">{pct5}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10">4 Star</span>
                  <div className="flex-1 h-2 bg-border-main rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500/80 transition-all duration-500" style={{ width: `${pct4}%` }} />
                  </div>
                  <span className="w-8 text-right">{pct4}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10">3 Star</span>
                  <div className="flex-1 h-2 bg-border-main rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500/60 transition-all duration-500" style={{ width: `${pct3}%` }} />
                  </div>
                  <span className="w-8 text-right">{pct3}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10">2 Star</span>
                  <div className="flex-1 h-2 bg-border-main rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500/40 transition-all duration-500" style={{ width: `${pct2}%` }} />
                  </div>
                  <span className="w-8 text-right">{pct2}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10">1 Star</span>
                  <div className="flex-1 h-2 bg-border-main rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/40 transition-all duration-500" style={{ width: `${pct1}%` }} />
                  </div>
                  <span className="w-8 text-right">{pct1}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Info details, active offers, checkout, and live comments */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Main Specs & Direct Buy Controls */}
          <div className="glass-card border border-border-main p-8 rounded-[2.5rem] bg-bg-card space-y-6 shadow-2xl relative overflow-hidden">
            {/* Top Absolute Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4">
              <span className="inline-flex px-3 py-1 bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                {product.category}
              </span>
              
              <h2 className="text-3xl md:text-4xl font-black text-text-main tracking-tight leading-none">
                {product.name}
              </h2>

              {/* Vendors locations references */}
              <div className="flex flex-wrap gap-6 text-xs font-bold text-text-muted">
                <Link 
                  to={`/shop/${product.shop?._id}`}
                  className="flex items-center gap-2 cursor-pointer hover:text-primary-500 transition-colors"
                >
                  <Store className="w-4 h-4 text-primary-500" />
                  <span>Shop: <span className="underline font-black text-text-main">{product.shop?.name || 'Smart Mall Store'}</span></span>
                </Link>
                <Link 
                  to={`/mall/${product.mall?._id}`}
                  className="flex items-center gap-2 cursor-pointer hover:text-primary-500 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-primary-500" />
                  <span>Location: <span className="underline font-black text-text-main">{product.mall?.name || 'Grand Mall'}</span></span>
                </Link>
              </div>
            </div>

            {/* Price Tags */}
            <div className="border-t border-b border-border-main/50 py-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Direct Retail Price</p>
                <div className="flex items-end gap-3">
                  {hasDiscount ? (
                    <>
                      <span className="text-4xl font-black text-text-main leading-none">₹{sellingPrice}</span>
                      <span className="text-base text-text-muted line-through mb-1">₹{originalPrice}</span>
                    </>
                  ) : (
                    <span className="text-4xl font-black text-text-main leading-none">₹{product.price}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                {stockCount <= 5 ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5 animate-bounce" /> Low Stock ({stockCount} left)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                    <Award className="w-3.5 h-3.5" /> In Stock ({stockCount} units)
                  </span>
                )}
              </div>
            </div>

            {/* Item Description details */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Product Specifications</h4>
              <p className="text-sm font-medium text-text-muted leading-relaxed">
                {product.description || 'No direct product specifications declared in details file. Visit the designated store location inside the Smart Mall network to inspect live display samples or request personalized support.'}
              </p>
            </div>

            {/* Buying Action triggers */}
            {canPurchase && (
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button 
                  onClick={handlePayment}
                  disabled={creatingOrder || placingOrder}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary-500/20 transition-all flex items-center justify-center space-x-2 border border-primary-400/20 cursor-pointer active:scale-95"
                >
                  {creatingOrder || placingOrder ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 shrink-0" />
                      <span>{isFoodShop ? 'Order Now' : 'Buy Now'}</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          {/* Related Offers vouchers */}
          {relatedOffers.length > 0 && (
            <div className="glass-card border border-border-main p-6 rounded-[2rem] bg-bg-card space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary-500" /> Active Shop Coupons
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedOffers.map((offer) => (
                  <div key={offer._id} className="p-4 bg-bg-sub/60 rounded-2xl border border-border-main/50 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/5 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary-500/10 text-primary-500 rounded border border-primary-500/20">
                        {offer.couponCode || `${offer.discountPercentage}% OFF`}
                      </span>
                      <h5 className="font-black text-sm text-text-main mt-2 leading-tight">{offer.title}</h5>
                      <p className="text-[10px] text-text-muted mt-1 line-clamp-2">{offer.description}</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (offer.couponCode) {
                          navigator.clipboard.writeText(offer.couponCode);
                          toast.success(`Code ${offer.couponCode} copied!`);
                        } else {
                          toast.info('This offer is applied at the shop.');
                        }
                      }}
                      className="mt-3 w-full py-2 bg-bg-card hover:bg-bg-sub border border-border-main rounded-xl text-[9px] font-black uppercase tracking-widest text-text-main"
                    >
                      Copy Coupon Code
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments stream list */}
          <ReviewManager targetType="Product" targetId={targetId} />

        </div>

      </div>

    </motion.div>
  );
};

export default ProductDetails;
