import { useParams, Link } from 'react-router-dom';
import { useGetShopByIdQuery } from '../features/shops/shopApiSlice';
import { useGetProductsByShopQuery } from '../features/products/productApiSlice';
import { useGetOffersByShopQuery } from '../features/offers/offerApiSlice';
import { useGetReviewsQuery } from '../features/reviews/reviewApiSlice';
import ProductCard from '../components/ProductCard';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Utensils,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';
import ReviewManager from '../components/ReviewManager';

const FOOD_SHOP_TYPES = ['Restaurant', 'Food Court', 'Cafe', 'Bakery', 'Juice Bar'];
const FOOD_KEYWORDS = ['food', 'restaurant', 'cafe', 'bakery', 'juice', 'burger', 'kfc', 'pizza', 'coffee'];

const containsFoodKeyword = (value) => FOOD_KEYWORDS.some((keyword) => (
  value?.toLowerCase().includes(keyword)
));

const ShopDetails = () => {
  const { id } = useParams();

  const { data: shop, isLoading: shopLoading, error: shopError } = useGetShopByIdQuery(id);
  const { data: products, isLoading: productsLoading } = useGetProductsByShopQuery(id);
  const { data: offers } = useGetOffersByShopQuery(id);
  const { data: reviews } = useGetReviewsQuery({ targetType: 'Shop', targetId: id }, { skip: !id });

  const isFoodShop = (
    FOOD_SHOP_TYPES.includes(shop?.shopType) ||
    containsFoodKeyword(shop?.category) ||
    containsFoodKeyword(shop?.name) ||
    products?.some((product) => containsFoodKeyword(product.category) || containsFoodKeyword(product.name))
  );
  const contactPhone = shop?.contactDetails?.phone || shop?.contactPhone;
  const contactEmail = shop?.contactDetails?.email || shop?.contactEmail;
  const activeOffers = offers?.filter((offer) => ['Active', 'Approved'].includes(offer.status)) || [];
  const approvedReviews = reviews?.filter((review) => review.status === 'Approved') || [];
  const averageRating = approvedReviews.length
    ? (approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length).toFixed(1)
    : 'New';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shop?.name || 'Smart Mall Store',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Store link copied to clipboard!');
    }
  };

  if (shopLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-sm font-bold text-text-muted animate-pulse">Loading store environment...</p>
      </div>
    );
  }

  if (shopError || !shop) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6 max-w-md mx-auto text-center px-4">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10">
          <Store className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-text-main tracking-tight">Store Not Found</h2>
          <p className="text-sm text-text-muted font-medium">The store you are looking for may have been closed, relocated, or the URL is incorrect.</p>
        </div>
        <Link
          to="/shops"
          className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-500/20 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Explore All Shops
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 px-4 sm:px-6 lg:px-8 pb-24 pt-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          to={shop.mall?._id ? `/mall/${shop.mall._id}` : '/malls'}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted hover:text-text-main transition-colors py-2 px-4 rounded-xl hover:bg-bg-sub border border-transparent hover:border-border-main"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Mall
        </Link>

        <button
          onClick={handleShare}
          className="p-3 bg-bg-card hover:bg-bg-sub border border-border-main rounded-2xl transition-all text-text-muted hover:text-text-main shadow-sm hover:shadow"
          title="Share Store"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="glass-card rounded-[3rem] border border-border-main overflow-hidden shadow-2xl bg-bg-card relative">
        <div className="h-64 sm:h-96 w-full relative overflow-hidden bg-bg-sub">
          <img
            src={shop.banner || shop.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-black/40 to-transparent opacity-90" />
          <div className="absolute top-6 left-6 sm:left-10 flex flex-wrap gap-3 z-10">
            <span className="text-xs font-black px-4 py-2 bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full uppercase tracking-widest shadow-lg">
              {shop.category}
            </span>
            <span className="text-xs font-black px-4 py-2 bg-primary-500/20 text-primary-200 border border-primary-500/30 backdrop-blur-md rounded-full uppercase tracking-widest shadow-lg">
              {shop.shopType || 'Retail'}
            </span>
            <span className={`text-xs font-black px-4 py-2 backdrop-blur-md rounded-full uppercase tracking-widest shadow-lg border ${
              shop.status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              shop.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {shop.status || 'Active'}
            </span>
          </div>
        </div>

        <div className="p-8 sm:p-12 pt-0 relative z-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 -mt-20 sm:-mt-28">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-8 w-full lg:w-auto">
            <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-[2.5rem] bg-bg-card border-4 border-bg-card shadow-2xl overflow-hidden shrink-0 relative group">
              <img
                src={shop.logo || shop.image || 'https://placehold.co/200x200/0ea5e9/ffffff?text=Logo'}
                alt={shop.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="space-y-3 pb-2">
              <h1 className="text-4xl sm:text-5xl font-black text-text-main tracking-tight leading-none">
                {shop.name}
              </h1>
              <p className="text-base text-text-muted font-medium max-w-xl leading-relaxed">
                {shop.description || 'Premium destination offering curated products, helpful staff, and a convenient in-mall shopping experience.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-text-muted pt-2">
                <span className="flex items-center gap-1.5 bg-bg-sub px-3 py-1.5 rounded-xl border border-border-main shadow-inner">
                  <MapPin className="w-4 h-4 text-primary-500" /> {shop.mall?.name || 'Smart Mall'} - Floor {shop.floor || 'G'}
                </span>
                <span className="flex items-center gap-1.5 bg-bg-sub px-3 py-1.5 rounded-xl border border-border-main shadow-inner">
                  <Clock className="w-4 h-4 text-primary-500" /> {shop.timings?.open && shop.timings?.close ? `${shop.timings.open} - ${shop.timings.close}` : '10:00 AM - 10:00 PM'}
                </span>
                <span className="flex items-center gap-1.5 bg-bg-sub px-3 py-1.5 rounded-xl border border-border-main shadow-inner">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {averageRating} {approvedReviews.length ? `(${approvedReviews.length})` : 'Rating'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t border-border-main lg:border-t-0 justify-between lg:justify-end">
            <div className="flex flex-col lg:items-end text-xs text-text-muted font-bold space-y-1">
              {contactPhone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary-500" /> {contactPhone}</span>}
              {contactEmail && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-primary-500" /> {contactEmail}</span>}
            </div>

            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="px-6 py-3 bg-bg-sub hover:bg-primary-500 text-text-main hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-border-main shadow-sm hover:shadow-xl hover:shadow-primary-500/20 flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5" /> Call Store
              </a>
            )}
          </div>
        </div>
      </div>

      {activeOffers.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-text-main flex items-center gap-3">
              <Tag className="w-6 h-6 text-primary-500" /> Current Offers
            </h2>
            <Link to="/offers" className="text-xs font-black uppercase tracking-widest text-primary-500 hover:text-primary-400">
              View All Offers
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {activeOffers.slice(0, 4).map((offer) => (
              <div key={offer._id} className="glass-card p-5 rounded-[2rem] bg-bg-card border border-border-main">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">{offer.discountPercentage}% Off</p>
                    <h3 className="font-black text-lg text-text-main mt-1">{offer.title}</h3>
                    <p className="text-xs text-text-muted mt-2 line-clamp-2">{offer.description}</p>
                  </div>
                  {offer.couponCode && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(offer.couponCode);
                        toast.success('Coupon code copied!');
                      }}
                      className="shrink-0 px-3 py-2 rounded-xl bg-primary-500/10 text-primary-500 border border-primary-500/20 text-[10px] font-black uppercase"
                    >
                      {offer.couponCode}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border-main">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-text-main tracking-tight flex items-center gap-3">
                {isFoodShop ? <Utensils className="w-8 h-8 text-primary-500" /> : <ShoppingBag className="w-8 h-8 text-primary-500" />}
                {isFoodShop ? 'Food Menu' : 'Store Products'}
              </h2>
              <p className="text-sm text-text-muted mt-1 font-medium">
                {isFoodShop
                  ? `Order from ${products?.length || 0} menu items at ${shop.name}.`
                  : `Explore ${products?.length || 0} products available at ${shop.name}.`}
              </p>
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-text-muted bg-bg-card px-4 py-2 rounded-xl border border-border-main shadow-sm">
              {isFoodShop ? 'Order Food' : 'Buy Products'}
            </span>
          </div>

          {productsLoading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
            </div>
          ) : products?.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {products.map((product) => (
                  <motion.div
                    key={product._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <ProductCard product={{ ...product, shop: { ...shop, shopType: isFoodShop ? (shop.shopType || 'Restaurant') : shop.shopType }, isFoodItem: isFoodShop }} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-32 glass-card rounded-[3rem] border-dashed border-border-main bg-bg-card space-y-4">
              <Filter className="w-16 h-16 text-text-muted mx-auto opacity-20" />
              <div className="space-y-1">
                <p className="text-xl font-bold text-text-main">{isFoodShop ? 'No Menu Items Listed Yet' : 'No Products Listed Yet'}</p>
                <p className="text-sm text-text-muted max-w-md mx-auto">Check back soon or visit the physical store on Floor {shop.floor || 'G'}.</p>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card space-y-5">
            <h3 className="text-xl font-black text-text-main flex items-center gap-3">
              <Award className="w-6 h-6 text-primary-500" /> Shop Highlights
            </h3>
            {[
              isFoodShop
                ? { title: 'Fast Pickup', desc: 'Place your order and collect it from the counter.' }
                : { title: 'Instant Store Pickup', desc: 'Buy online and collect at the store counter.' },
              { title: 'Verified Mall Store', desc: 'Located inside the Smart Mall network.' },
              { title: 'Customer Reviews', desc: 'Read ratings before you decide.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-4 bg-bg-sub rounded-2xl border border-border-main/50">
                <div className="w-8 h-8 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-text-main">{item.title}</h4>
                  <p className="text-xs text-text-muted font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <ReviewManager targetType="Shop" targetId={id} />
        </aside>
      </div>
    </div>
  );
};

export default ShopDetails;
