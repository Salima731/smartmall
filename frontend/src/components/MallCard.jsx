import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Store } from 'lucide-react';
import { motion } from 'framer-motion';

const MallCard = ({ mall, nearby }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card border border-border-main rounded-2xl overflow-hidden group hover:border-primary-500/50 transition-all shadow-xl bg-bg-card flex flex-col h-full"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={mall.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'} 
          alt={mall.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {nearby && (
          <div className="absolute top-4 left-4 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md z-10">
            Nearby
          </div>
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold group-hover:text-primary-500 transition-colors text-text-main leading-snug line-clamp-1">{mall.name}</h3>
            {mall.distance !== undefined && (
              <span className="text-xs font-black text-primary-500 bg-primary-500/10 px-2 py-1 rounded-lg border border-primary-500/20 shrink-0">
                {mall.distance} km
              </span>
            )}
          </div>
          
          <p className="text-text-muted text-xs font-medium line-clamp-2">
            {mall.address}
          </p>

          <div className="flex items-center justify-between text-text-muted text-xs font-bold pt-2">
            <p className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-primary-500" /> {mall.district}
            </p>
            {mall.shopCount !== undefined && (
              <p className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-primary-500" /> {mall.shopCount} Shops
              </p>
            )}
          </div>
        </div>

        <Link 
          to={`/mall/${mall._id}`}
          className="flex items-center justify-between w-full py-3 px-4 bg-bg-sub hover:bg-primary-500 text-text-main hover:text-white rounded-xl font-bold text-sm transition-all group-hover:shadow-lg group-hover:shadow-primary-500/20 border border-border-main mt-auto"
        >
          <span>View Mall</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
};

export default MallCard;
