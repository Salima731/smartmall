import { Link } from 'react-router-dom';
import { Store, MapPin, ArrowRight, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const ShopCard = ({ shop }) => {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="glass-card rounded-[2.5rem] overflow-hidden group hover:border-primary-500/50 transition-all shadow-xl bg-bg-card"
    >
      <div className="relative h-56 overflow-hidden">
        <img 
          src={shop.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'} 
          alt={shop.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md border border-white/20 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
          {shop.category}
        </div>
      </div>
      
      <div className="p-8 space-y-6">
        <div>
          <h3 className="text-2xl font-black group-hover:text-primary-500 transition-colors text-text-main tracking-tight leading-none">{shop.name}</h3>
          <p className="flex items-center text-text-muted text-sm font-bold mt-2 uppercase tracking-widest opacity-60">
            <MapPin className="w-4 h-4 mr-2 text-primary-500" /> {shop.mall?.name} • Floor {shop.floor || 'G'}
          </p>
        </div>

        <Link 
          to={`/shop/${shop._id}`}
          className="flex items-center justify-center w-full py-4 bg-bg-sub hover:bg-primary-500 text-text-main hover:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all group-hover:shadow-xl group-hover:shadow-primary-500/20 border border-border-main"
        >
          ENTER STORE
          <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
};

export default ShopCard;
