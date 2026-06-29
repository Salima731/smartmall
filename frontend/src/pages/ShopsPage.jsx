import { useState } from 'react';
import { useGetShopsQuery } from '../features/shops/shopApiSlice';
import ShopCard from '../components/ShopCard';
import { Search, Store, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ShopsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: shops, isLoading } = useGetShopsQuery(searchTerm);

  return (
    <div className="max-w-7xl mx-auto space-y-10 px-4 pb-20">
      <div className="text-center space-y-4 py-10">
        <h1 className="text-4xl md:text-6xl font-black flex items-center justify-center tracking-tighter">
          <Store className="w-10 h-10 md:w-14 md:h-14 mr-4 text-primary-500" />
          EXPLORE SHOPS
        </h1>
        <p className="text-text-muted max-w-xl mx-auto font-medium">
          Find your favorite brands and outlets. Browse shops by name or category across our smart mall network.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mt-8 relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search shops by name..."
            className="w-full bg-bg-card border border-border-main rounded-[2rem] py-5 pl-16 pr-8 text-lg outline-none focus:ring-4 ring-primary-500/20 focus:border-primary-500 transition-all shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {shops?.length > 0 ? (
            shops.map((shop) => (
              <ShopCard key={shop._id} shop={shop} />
            ))
          ) : (
            <div className="col-span-full text-center py-32 glass-card rounded-[3rem] border-dashed border-border-main">
              <Store className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
              <p className="text-xl font-bold text-text-muted">No shops found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopsPage;
