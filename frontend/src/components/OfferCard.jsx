import { useState, useEffect } from 'react';
import { Tag, Store, MapPin, Calendar, Clock, Copy, Heart, Share2, QrCode, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const OfferCard = ({ offer }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(offer.endDate) - new Date();
      if (difference <= 0) return 'Expired';

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      return `${days}d ${hours}h ${minutes}m`;
    };

    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000 * 60);
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [offer.endDate]);

  const copyCode = () => {
    if (!offer.couponCode) return;
    navigator.clipboard.writeText(offer.couponCode);
    toast.success('Coupon code copied!');
  };

  const handleNavigate = () => {
    if (offer.product?._id) {
      navigate(`/product/${offer.product._id}`);
      return;
    }

    if (offer.shop?._id) {
      navigate(`/shop/${offer.shop._id}`);
      return;
    }

    navigate(`/products?offer=${offer._id}&title=${encodeURIComponent(offer.title)}`);
  };

  const isExpiringSoon = timeLeft.startsWith('0d') && !timeLeft.includes('-');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -10 }}
      className="glass-card rounded-[2.5rem] overflow-hidden group hover:border-primary-500 transition-all flex flex-col shadow-xl relative bg-bg-card"
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />

      {/* Header with Background */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 p-8 text-white relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex justify-between items-start">
             <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20">
              {offer.category}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
              className={`p-2 rounded-full backdrop-blur-md border transition-all ${isFavorite ? 'bg-red-500 border-red-400 text-white' : 'bg-white/10 border-white/20 text-white/70 hover:text-white'}`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          <h2 className="text-5xl font-black tracking-tighter leading-none">{offer.discountPercentage}% OFF</h2>
          <p className="text-xl font-bold tracking-tight line-clamp-1">{offer.title}</p>
        </div>
        
        {/* Flash Sale Badge */}
        {offer.discountPercentage >= 40 && (
          <div className="absolute -right-8 top-10 rotate-45 bg-red-500 text-white px-12 py-1 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse shadow-lg z-20">
            FLASH
          </div>
        )}

        <Tag className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 -rotate-12" />
      </div>

      {/* Body */}
      <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-primary-500">
               <Clock className="w-4 h-4 mr-2" /> {timeLeft === 'Expired' ? 'Offer Ended' : `Ends in: ${timeLeft}`}
             </div>
             {isExpiringSoon && (
               <span className="text-[10px] font-black text-red-500 animate-pulse uppercase">Expiring Soon!</span>
             )}
          </div>

          <p className="text-text-muted text-sm font-medium leading-relaxed line-clamp-2 italic">"{offer.description}"</p>
          
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => offer.shop?._id && navigate(`/shop/${offer.shop._id}`)}
              className="flex items-center text-left text-sm font-black text-text-main group-hover:text-primary-500 transition-colors cursor-pointer"
            >
              <Store className="w-5 h-5 mr-3 text-primary-500" /> {offer.shop?.name || 'Mall Exclusive'}
            </button>
            <button
              type="button"
              onClick={() => offer.mall?._id && navigate(`/mall/${offer.mall._id}`)}
              className="flex items-center text-left text-xs font-bold text-text-muted hover:text-primary-500 transition-colors"
            >
              <MapPin className="w-5 h-5 mr-3 text-primary-500/50" /> {offer.mall?.name}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Coupon Section */}
          {offer.couponCode && (
            <div className="flex items-center space-x-2 bg-bg-sub border border-dashed border-primary-500/30 p-2 rounded-xl">
              <span className="flex-1 text-center font-black text-primary-500 tracking-widest uppercase">{offer.couponCode}</span>
              <button 
                onClick={copyCode}
                className="p-2 hover:bg-primary-500 hover:text-white rounded-lg transition-all text-primary-500"
                title="Copy Code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button 
              onClick={handleNavigate}
              className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2"
            >
              SHOP NOW <ExternalLink className="w-4 h-4" />
            </button>
            <button className="p-4 bg-bg-sub hover:bg-bg-sub/80 rounded-2xl border border-border-main text-text-muted hover:text-text-main transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OfferCard;
