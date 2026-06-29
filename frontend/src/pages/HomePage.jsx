import { useState, useEffect } from 'react';
import { useGetProductsQuery } from '../features/products/productApiSlice';
import { useGetMallsQuery } from '../features/malls/mallApiSlice';
import ProductCard from '../components/ProductCard';
import MallCard from '../components/MallCard';
import { MapPin, Search as SearchIcon, Navigation, Store, Tag, ChevronRight, Zap, TrendingUp, Sparkles, Clock, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const CATEGORIES = [
  { name: 'All', icon: <Store className="w-5 h-5" /> },
  { name: 'Fashion', icon: <Tag className="w-5 h-5" /> },
  { name: 'Electronics', icon: <Zap className="w-5 h-5" /> },
  { name: 'Beauty', icon: <Sparkles className="w-5 h-5" /> },
  { name: 'Shoes', icon: <Navigation className="w-5 h-5" /> },
  { name: 'Grocery', icon: <Store className="w-5 h-5" /> },
  { name: 'Food', icon: <MapPin className="w-5 h-5" /> },
  { name: 'Gaming', icon: <Zap className="w-5 h-5" /> },
  { name: 'Home', icon: <Store className="w-5 h-5" /> },
  { name: 'Sports', icon: <TrendingUp className="w-5 h-5" /> },
];

const PROMO_BANNERS = [
  { id: 1, title: 'Summer Sale', desc: 'Up to 50% Off on Fashion', bg: 'from-orange-500 to-rose-500', img: 'https://placehold.co/600x300/ff6b6b/ffffff?text=Summer+Sale' },
  { id: 2, title: 'Flash Deals', desc: 'Electronics at Rock Bottom Prices', bg: 'from-blue-500 to-cyan-500', img: 'https://placehold.co/600x300/4facfe/ffffff?text=Flash+Deals' },
  { id: 3, title: 'Weekend Offers', desc: 'Buy 1 Get 1 Free on Groceries', bg: 'from-green-500 to-emerald-500', img: 'https://placehold.co/600x300/43e97b/ffffff?text=Weekend+Offers' },
  { id: 4, title: 'Trending Now', desc: 'Discover New Arrivals', bg: 'from-purple-500 to-pink-500', img: 'https://placehold.co/600x300/b19cd9/ffffff?text=Trending+Now' },
];

const HomePage = () => {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  
  const { data: allProducts, isLoading } = useGetProductsQuery('');
  const { data: malls, isLoading: mallsLoading } = useGetMallsQuery('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?search=${keyword}`);
    }
  };

  const handleCategoryClick = (category) => {
    if (category === 'All') {
      navigate('/products');
    } else {
      navigate(`/products?category=${category.toLowerCase()}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.2 }}
      className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12"
    >
      {/* 1. Hero / Search Section */}
      <section className="pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-text-muted">
            <MapPin className="w-5 h-5 mr-2 text-primary-500" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary-500">Deliver to</p>
              <p className="text-sm font-medium text-text-main cursor-pointer hover:text-primary-500 transition-colors">Select Location &gt;</p>
            </div>
          </div>
          <Link to="/offers" className="flex items-center bg-primary-600/10 text-primary-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-primary-500/20 hover:bg-primary-500 hover:text-white transition-all shadow-lg shadow-primary-500/10">
            <Tag className="w-4 h-4 mr-2" /> Deals Zone
          </Link>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search for products, shops, brands..."
            className="w-full bg-bg-card border border-border-main rounded-2xl py-4 pl-14 pr-4 outline-none focus:ring-2 ring-primary-500/50 focus:border-primary-500 transition-all shadow-xl text-text-main placeholder:text-text-muted"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </form>
      </section>

      {/* 2. Category Filter Section */}
      <section className="overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex space-x-4 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              className="flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl bg-bg-card border border-border-main hover:bg-primary-600/10 hover:border-primary-500/30 transition-all min-w-[80px] group shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-bg-main flex items-center justify-center text-text-muted group-hover:text-primary-500 group-hover:scale-110 transition-all shadow-inner border border-border-main">
                {cat.icon}
              </div>
              <span className="text-xs font-bold text-text-main group-hover:text-primary-500 transition-colors">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Promotional Banner Section */}
      <section className="rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 border border-border-main relative group">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          className="w-full h-[200px] md:h-[300px]"
        >
          {PROMO_BANNERS.map((banner) => (
            <SwiperSlide key={banner.id}>
              <div className={`relative w-full h-full bg-gradient-to-r ${banner.bg} p-8 flex items-center justify-between overflow-hidden`}>
                <div className="relative z-10 space-y-4 max-w-sm">
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">{banner.title}</h2>
                  <p className="text-white/90 font-bold text-sm md:text-base drop-shadow-md">{banner.desc}</p>
                  <button className="bg-white text-black px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                    Shop Now
                  </button>
                </div>
                <img src={banner.img} alt={banner.title} className="absolute right-0 top-0 h-full w-2/3 object-cover opacity-50 mix-blend-overlay" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* 4. Featured Malls Section */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black flex items-center tracking-tight text-text-main">
            <Building2 className="w-6 h-6 mr-2 text-primary-500" />
            Featured Malls
          </h2>
          <Link to="/malls" className="text-xs font-black text-primary-500 uppercase tracking-widest hover:text-primary-400 flex items-center cursor-pointer">
            View All Malls <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {mallsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-80 bg-bg-card rounded-2xl border border-border-main" />
            ))}
          </div>
        ) : malls && malls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {malls.slice(0, 3).map((mall) => (
              <MallCard key={mall._id} mall={mall} nearby={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-muted bg-bg-card rounded-2xl border border-border-main">
            No malls found.
          </div>
        )}
      </section>

      {/* 5. Today's Top Deals Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black flex items-center tracking-tight text-text-main">
            <Zap className="w-6 h-6 mr-2 text-yellow-500 fill-current animate-pulse" /> 
            Today's Top Deals
          </h2>
          <Link to="/products" className="text-xs font-black text-primary-500 uppercase tracking-widest hover:text-primary-400 flex items-center cursor-pointer">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex space-x-6 min-w-max">
            {isLoading ? (
              <div className="flex space-x-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-[280px] h-[340px] bg-bg-card border border-border-main/50 animate-pulse rounded-[2rem]" />
                ))}
              </div>
            ) : allProducts && allProducts.length > 0 ? (
              allProducts.slice(0, 6).map((product, idx) => {
                const discountPct = 25 + (idx * 7) % 20; // Generate realistic discounts (25%, 32%, 39% etc.)
                const originalPrice = Math.round(product.price * (1 + discountPct / 100));
                
                return (
                  <motion.div 
                    key={product._id}
                    whileHover={{ y: -5 }}
                    onClick={() => navigate('/products')}
                    className="w-[280px] glass-card rounded-[2rem] p-4 relative border border-border-main hover:border-primary-500/30 transition-all group shadow-xl bg-bg-card cursor-pointer"
                  >
                    <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-lg">
                      {discountPct}% OFF
                    </div>
                    <div className="h-[200px] bg-bg-sub rounded-[1.5rem] mb-4 overflow-hidden relative border border-border-main">
                      <img 
                        src={product.image || 'https://placehold.co/300x300/1e293b/ffffff?text=Smart+Product'} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> 12:30:45
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-text-muted font-black uppercase tracking-wider">
                        {product.shop?.name || 'Exclusive Mall Store'}
                      </p>
                      <h3 className="font-bold text-sm text-text-main leading-tight line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      <div className="flex items-end gap-2 pt-1">
                        <span className="text-lg font-black text-primary-500">₹{product.price}</span>
                        <span className="text-xs text-text-muted line-through mb-0.5">₹{originalPrice}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="w-full py-12 text-center text-text-muted">
                No active deals found.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Random Featured Products (Recommended For You) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black flex items-center tracking-tight text-text-main">
            <Sparkles className="w-6 h-6 mr-2 text-primary-500" /> 
            Recommended For You
          </h2>
          <Link to="/products" className="text-xs font-black text-text-muted uppercase tracking-widest hover:text-text-main flex items-center">
            See More <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {allProducts?.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
            {(!allProducts || allProducts.length === 0) && (
              <div className="col-span-full text-center py-20 text-text-muted glass-card rounded-[2rem] border-dashed border-border-main bg-bg-card">
                <Store className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
                <p>No recommended products available at the moment.</p>
              </div>
            )}
          </div>
        )}
      </section>
      
      {/* 6. Horizontal Scroll Sections: Featured Shops */}
      <section className="space-y-6 pt-8 border-t border-border-main">
        <h2 className="text-2xl font-black flex items-center tracking-tight text-text-main">
          <Store className="w-6 h-6 mr-2 text-primary-500" /> 
          Featured Shops
        </h2>
        <div className="overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex space-x-4 min-w-max">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-3 w-[100px] cursor-pointer group">
                <div className="w-[80px] h-[80px] rounded-full overflow-hidden border-2 border-border-main group-hover:border-primary-500 transition-all p-1 shadow-lg shadow-black/10 bg-bg-card">
                  <div className="w-full h-full bg-bg-sub rounded-full flex items-center justify-center overflow-hidden border border-border-main">
                    <img src={`https://placehold.co/80x80/0ea5e9/ffffff?text=Shop${i}`} alt="Shop" className="object-cover w-full h-full group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <span className="text-xs font-bold text-text-muted group-hover:text-text-main truncate w-full text-center">Brand {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </motion.div>
  );
};

export default HomePage;
