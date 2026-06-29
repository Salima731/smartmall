import { useState } from 'react';
import { useGlobalSearchQuery } from '../features/shops/shopApiSlice';
import { Search, ShoppingBag, Store, Tag, ArrowRight, Mic, MicOff, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import MallCard from '../components/MallCard';

const GlobalSearchPage = () => {
  const [keyword, setKeyword] = useState('');
  const [listening, setListening] = useState(false);

  const { data, isLoading } = useGlobalSearchQuery(keyword, {
    skip: keyword.length < 3,
  });

  // Voice Search via Web Speech API
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Try Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setKeyword(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 pt-6 pb-20">
      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-text-main">Global Search</h1>
        <div className="flex items-center bg-bg-card border border-border-main rounded-3xl p-5 focus-within:ring-2 ring-primary-500 transition-all shadow-xl">
          <Search className="w-6 h-6 text-text-muted mr-4 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search for products, shops, or offers..."
            className="bg-transparent border-none focus:ring-0 w-full text-lg text-text-main placeholder:text-text-muted outline-none font-medium"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button
            onClick={startVoiceSearch}
            className={`ml-3 p-3 rounded-2xl transition-all flex-shrink-0 ${
              listening
                ? 'bg-red-500/20 text-red-500 animate-pulse'
                : 'bg-bg-sub text-text-muted hover:bg-bg-sub/80 hover:text-primary-500 border border-border-main shadow-sm'
            }`}
            title="Voice Search"
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-text-muted text-sm flex items-center gap-2 font-medium">
          Try searching for "Nike", "Shoes", or "Discount"
          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider bg-primary-600/10 text-primary-500 px-3 py-1 rounded-full border border-primary-500/20">
            <Mic className="w-3 h-3 mr-1" /> Voice active
          </span>
        </p>
      </div>

      {listening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-10 space-y-6"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex w-24 h-24 rounded-full bg-red-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl shadow-red-900/40">
              <Mic className="w-10 h-10 text-white" />
            </div>
          </div>
          <p className="text-text-main font-black uppercase tracking-widest text-xs">Listening for input...</p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-20"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500" />
          </motion.div>
        ) : data ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-10 pb-20"
          >
            {/* Malls */}
            {data.malls?.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary-500 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" /> Malls Found
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.malls.map((mall) => (
                    <MallCard key={mall._id} mall={mall} />
                  ))}
                </div>
              </div>
            )}

            {/* Shops */}
            {data.shops?.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary-500 flex items-center">
                  <Store className="w-4 h-4 mr-2" /> Shops Found
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.shops.map((shop) => (
                    <div
                      key={shop._id}
                      className="glass-card p-6 rounded-[2rem] flex items-center space-x-5 hover:border-primary-500/50 transition-all cursor-pointer group bg-bg-card"
                    >
                      <div className="bg-primary-500/10 p-4 rounded-2xl text-primary-500 flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner border border-border-main">
                        <Store className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg text-text-main">{shop.name}</h4>
                        <p className="text-sm text-text-muted font-medium">{shop.mall?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {data.products?.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary-500 flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-2" /> Products Found
                </h2>
                <div className="grid gap-4">
                  {data.products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Offers */}
            {data.offers?.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary-500 flex items-center">
                  <Tag className="w-4 h-4 mr-2" /> Live Offers
                </h2>
                <div className="grid gap-4">
                  {data.offers.map((offer) => (
                    <div
                      key={offer._id}
                      className="bg-gradient-to-r from-primary-600/10 to-purple-600/10 border border-primary-500/20 p-8 rounded-[2rem] flex items-center justify-between hover:border-primary-500/40 transition-all bg-bg-card"
                    >
                      <div>
                        <h4 className="text-2xl font-black text-text-main">{offer.title}</h4>
                        <p className="text-sm text-text-muted font-medium mt-1">{offer.shop?.name} • {offer.mall?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-black bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                          {offer.discountPercentage}% OFF
                        </span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-500 mt-1">Limited Deal</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.products?.length === 0 && data.shops?.length === 0 && data.offers?.length === 0 && (!data.malls || data.malls.length === 0) && (
              <div className="text-center py-20 bg-bg-card rounded-[2.5rem] border border-dashed border-border-main shadow-sm">
                <p className="text-text-muted font-bold">No results found for "{keyword}"</p>
                <p className="text-xs text-text-muted/50 mt-2">Try checking your spelling or use voice search.</p>
              </div>
            )}
          </motion.div>
        ) : keyword.length >= 3 ? (
          <div className="text-center py-20 text-text-muted animate-pulse font-bold tracking-widest text-xs uppercase">Initializing Search Protocol...</div>
        ) : (
           <div className="text-center py-20 bg-bg-card rounded-[2.5rem] border border-dashed border-border-main shadow-sm">
              <ShoppingBag className="w-12 h-12 text-border-main mx-auto mb-4" />
              <p className="text-text-muted font-bold">Start typing to search across the Smart Mall ecosystem.</p>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearchPage;
