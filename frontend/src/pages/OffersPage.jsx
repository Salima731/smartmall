import { useState } from 'react';
import { useGetOffersQuery } from '../features/offers/offerApiSlice';
import { Tag, Loader2, Sparkles, Store, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OfferCard from '../components/OfferCard';

const CATEGORIES = ['All', 'Fashion', 'Electronics', 'Food', 'Shoes', 'Gaming', 'General'];

const OffersPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: offers, isLoading } = useGetOffersQuery(selectedCategory);

  if (isLoading) {
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 px-4 pb-20">
      {/* Header Section */}
      <div className="text-center space-y-4 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary-600/5 blur-[100px] pointer-events-none" />
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black flex items-center justify-center tracking-tighter text-text-main"
        >
          <Sparkles className="w-10 h-10 md:w-14 md:h-14 mr-4 text-primary-500 animate-pulse" />
          MEGA OFFERS
        </motion.h1>
        <p className="text-text-muted max-w-2xl mx-auto text-lg font-medium">
          Exclusive deals curated just for you. Save big on your favorite brands across all Smart Malls.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
              selectedCategory === cat
                ? 'bg-primary-500 border-primary-500 text-white shadow-xl shadow-primary-500/30'
                : 'bg-bg-sub border-border-main text-text-muted hover:bg-bg-sub/80 hover:text-text-main'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Offers Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {offers?.length > 0 ? (
            offers.map((offer) => (
              <OfferCard key={offer._id} offer={offer} />
            ))
          ) : (
            <div className="col-span-full text-center py-32 glass-card rounded-[3rem] border-dashed border-border-main bg-bg-card">
              <Tag className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
              <p className="text-xl font-bold text-text-muted">No {selectedCategory} offers found.</p>
              <p className="text-sm text-text-muted opacity-60">Check back later for fresh deals!</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* AI Recommendations (Mock) */}
      <section className="pt-20 space-y-8">
         <div className="flex items-center space-x-3">
           <div className="h-px flex-1 bg-border-main" />
           <h2 className="text-xl font-black uppercase tracking-[0.3em] text-primary-500">Recommended For You</h2>
           <div className="h-px flex-1 bg-border-main" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            {/* These would be populated by AI service later */}
            <p className="col-span-full text-center text-xs text-text-muted italic">Smart AI is analyzing your preferences...</p>
         </div>
      </section>
    </div>
  );
};

export default OffersPage;
