import { memo, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag, ArrowRight, Loader2, Store, MapPin, X, Award, AlertCircle } from 'lucide-react';
import { useCreateOrderMutation, useVerifyPaymentMutation } from '../features/payments/paymentApiSlice';
import { usePlaceOrderMutation, useConfirmPaymentMutation } from '../features/orders/orderApiSlice';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { userInfo } = useSelector((state) => state.auth);

  // Only 'User' role (customers) can purchase.
  // Guests (!userInfo) also see Buy Now and are redirected to login.
  // Staff, Shop Owner, Mall Admin, Super Admin cannot purchase.
  const canPurchase = !userInfo || userInfo.role === 'User';
  const isFoodShop = useMemo(() => isFoodProduct(product), [product]);
  const stockCount = product.countInStock ?? product.stock ?? 0;
  
  const [placeOrder, { isLoading: placingOrder }] = usePlaceOrderMutation();
  const [confirmPayment] = useConfirmPaymentMutation();
  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const handlePayment = useCallback(async () => {
    if (!userInfo) {
      toast.info('Please login to purchase items');
      return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      return;
    }

    try {
      // 1. Create order on backend
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
            // 4. Verify payment on backend
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
  }, [confirmPayment, createOrder, navigate, placeOrder, product, userInfo, verifyPayment]);

  const handleCardNavigate = useCallback(() => navigate(`/product/${product._id}`), [navigate, product._id]);

  return (
    <motion.div
      onClick={handleCardNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleCardNavigate();
      }}
      role="link"
      tabIndex={0}
      className="glass-card p-6 sm:p-8 rounded-[2.5rem] flex flex-col justify-between hover:border-primary-500/50 transition-all group bg-bg-card relative overflow-hidden shadow-xl h-full w-full cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary-500/20"
    >
      {/* Top Absolute Gradient Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary-500/10 transition-colors" />

      {/* Main Content Area: Image & Product Info */}
      <div className="flex items-start space-x-5">
        {/* Product Image */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-bg-sub rounded-[1.5rem] overflow-hidden relative border border-border-main shadow-inner shrink-0 group-hover:border-primary-500/40 transition-colors">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-bg-sub via-border-main/40 to-bg-sub" />
          )}
          <img 
            src={product.image || 'https://placehold.co/150x150/0ea5e9/ffffff?text=Product'} 
            alt={product.name} 
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
        </div>

        {/* Product Details */}
        <div className="space-y-2 flex-1 min-w-0 pt-1">
          <h4 className="font-black text-xl sm:text-2xl text-text-main tracking-tight group-hover:text-primary-500 transition-colors truncate w-full">
            {product.name}
          </h4>
          
          <div className="space-y-1 text-xs text-text-muted font-medium">
            <p className="flex items-center gap-1.5 truncate w-full">
              <Store className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span className="truncate">{product.shop?.name || 'Smart Mall Store'}</span>
            </p>
            <p className="flex items-center gap-1.5 truncate w-full">
              <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span className="truncate">{product.mall?.name || 'Grand Mall'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-primary-500/10 text-primary-500 rounded-full border border-primary-500/20 shadow-sm">
              {product.category}
            </span>
            {stockCount <= 5 && (
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 animate-pulse shadow-sm">
                Low Stock ({stockCount} left)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Area: Price & Action Buttons */}
      <div className="mt-6 pt-6 border-t border-border-main flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Price Display */}
        <div className="flex sm:flex-col items-baseline sm:items-start justify-between sm:justify-start">
          {product.discountPrice ? (
            <div className="flex items-baseline gap-2">
              <p className="text-3xl sm:text-4xl font-black text-text-main tracking-tight">₹{product.discountPrice}</p>
              <p className="text-sm text-text-muted line-through">₹{product.price}</p>
            </div>
          ) : (
            <p className="text-3xl sm:text-4xl font-black text-text-main tracking-tight">₹{product.price}</p>
          )}
          <p className="text-[10px] text-primary-500 font-bold uppercase tracking-widest ml-2 sm:ml-0 mt-0.5">Incl. Taxes</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleCardNavigate();
            }}
            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary-500 flex items-center justify-center transition-all group/btn px-3 py-2 rounded-xl hover:bg-bg-sub border border-transparent hover:border-border-main cursor-pointer"
          >
            <span>View Details</span> <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </button>

          {canPurchase && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handlePayment();
              }}
              disabled={creatingOrder || placingOrder}
              className="bg-primary-500 hover:bg-primary-600 text-white py-3 px-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all flex items-center justify-center space-x-2 border border-primary-400/30 active:scale-95 cursor-pointer"
            >
              {creatingOrder || placingOrder ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 shrink-0" /> 
                  <span>{isFoodShop ? 'Order Now' : 'Buy Now'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modern Details Modal */}
      <AnimatePresence>
        {showDetails && createPortal(
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[999] backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-card border border-border-main rounded-[2.5rem] max-w-xl w-full shadow-2xl relative max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Header / Title bar */}
              <div className="p-6 pb-4 border-b border-border-main/50 flex justify-between items-center bg-bg-card">
                <h3 className="text-xl font-black text-text-main truncate pr-8">
                  {product.name}
                </h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(false);
                  }}
                  className="p-2 bg-bg-sub hover:bg-bg-sub/80 border border-border-main rounded-xl text-text-muted hover:text-text-main cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Product Image */}
                <div className="w-full h-64 bg-bg-sub rounded-2xl overflow-hidden border border-border-main relative shadow-inner">
                  <img 
                    src={product.image || 'https://placehold.co/400x300/0ea5e9/ffffff?text=Smart+Product'} 
                    alt={product.name} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-4 left-4 bg-primary-500/10 text-primary-500 border border-primary-500/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                    {product.category}
                  </div>
                </div>

                {/* Details info */}
                <div className="space-y-4">
                  {/* Location Info */}
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-text-muted">
                    <div 
                      onClick={() => { setShowDetails(false); if(product.shop?._id) navigate(`/shop/${product.shop._id}`); }}
                      className="flex items-center gap-2 cursor-pointer hover:text-primary-500 transition-colors"
                    >
                      <Store className="w-4 h-4 text-primary-500" />
                      <span>Shop: <span className="underline">{product.shop?.name || 'Exclusive Mall Store'}</span></span>
                    </div>
                    <div 
                      onClick={() => { setShowDetails(false); if(product.mall?._id) navigate(`/mall/${product.mall._id}`); }}
                      className="flex items-center gap-2 cursor-pointer hover:text-primary-500 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-primary-500" />
                      <span>Location: <span className="underline">{product.mall?.name || 'Grand Mall'}</span></span>
                    </div>
                  </div>

                  {/* Stock Alert status bar */}
                  <div className="flex items-center gap-2">
                    {stockCount <= 5 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" /> High Demand (Only {stockCount} remaining)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest">
                        <Award className="w-3.5 h-3.5" /> In Stock ({stockCount} available)
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="border-t border-border-main/50 pt-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Item Description</p>
                    <p className="text-xs font-medium text-text-muted leading-relaxed">
                      {product.description || 'No direct product specifications declared. Visit the designated store location inside the Smart Mall network to inspect live display samples or request personalized support.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fixed Footer with pricing & checkout buttons */}
              <div className="p-6 border-t border-border-main/50 bg-bg-sub/30 flex items-center justify-between gap-6 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Direct Price</span>
                  {product.discountPrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-primary-500">₹{product.discountPrice}</span>
                      <span className="text-xs font-bold text-text-muted line-through">₹{product.price}</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-black text-text-main">₹{product.price}</span>
                  )}
                </div>

                {canPurchase ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowDetails(false); handlePayment(); }}
                    disabled={creatingOrder || placingOrder}
                    className="px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-primary-400/20 active:scale-95"
                  >
                    {creatingOrder || placingOrder ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" /> 
                        <span>{isFoodShop ? 'Order Now' : 'Buy Now'}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDetails(false); navigate(`/product/${product._id}`); }}
                    className="px-8 py-3.5 bg-bg-sub hover:bg-bg-card text-text-main rounded-xl font-black text-xs uppercase tracking-widest border border-border-main transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default memo(ProductCard);
