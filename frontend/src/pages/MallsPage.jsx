import { useState, useEffect } from 'react';
import { useGetMallsQuery, useGetNearbyMallsQuery } from '../features/malls/mallApiSlice';
import MallCard from '../components/MallCard';
import { Search, MapPin, Building2, Store, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MallsPage = () => {
  const [keyword, setKeyword] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [locationRequested, setLocationRequested] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationRequested(true);
        },
        (error) => {
          console.log('Geolocation permission denied or error:', error);
          setLocationRequested(true);
        }
      );
    } else {
      setLocationRequested(true);
    }
  }, []);

  const { data: nearbyMalls, isLoading: nearbyLoading } = useGetNearbyMallsQuery(
    coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : {},
    { skip: !coordinates }
  );

  const { data: allMalls, isLoading: allLoading } = useGetMallsQuery(keyword);

  const isNearbySectionVisible = coordinates && nearbyMalls && nearbyMalls.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-12 px-4 pb-24">
      {/* Page Header and Search */}
      <div className="text-center space-y-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black flex items-center justify-center tracking-tighter text-text-main"
        >
          <Building2 className="w-10 h-10 md:w-14 md:h-14 mr-4 text-primary-500" />
          EXPLORE MALLS
        </motion.h1>
        <p className="text-text-muted max-w-xl mx-auto font-medium">
          Discover modern shopping spaces, view direct paths, browse stores, and locate amenities.
        </p>

        {/* Real-time Search Input */}
        <div className="max-w-2xl mx-auto mt-8 relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search malls by name or location..."
            className="w-full bg-bg-card border border-border-main rounded-[2rem] py-5 pl-16 pr-8 text-lg outline-none focus:ring-4 ring-primary-500/20 focus:border-primary-500 transition-all shadow-xl text-text-main placeholder:text-text-muted"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      {/* Geolocation Loading / Nearby Malls Section */}
      <AnimatePresence>
        {isNearbySectionVisible && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-black flex items-center tracking-tight text-text-main">
              <MapPin className="w-6 h-6 mr-2 text-primary-500 animate-bounce" /> 
              Nearby Malls
            </h2>
            
            {nearbyLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-80 bg-bg-card rounded-2xl border border-border-main" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {nearbyMalls.map((mall) => (
                  <MallCard key={mall._id} mall={mall} nearby={true} />
                ))}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <hr className="border-border-main" />

      {/* All Malls Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black flex items-center tracking-tight text-text-main">
          <Building2 className="w-6 h-6 mr-2 text-primary-500" /> 
          All Malls
        </h2>

        {allLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse h-80 bg-bg-card rounded-2xl border border-border-main" />
            ))}
          </div>
        ) : allMalls && allMalls.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {allMalls.map((mall) => (
              <MallCard key={mall._id} mall={mall} nearby={false} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-bg-card rounded-[2.5rem] border border-dashed border-border-main shadow-sm max-w-2xl mx-auto">
            <Store className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-25" />
            <p className="text-xl font-bold text-text-muted">No malls found matching "{keyword}"</p>
            <p className="text-xs text-text-muted/65 mt-2">Try double checking your search spelling or query details.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MallsPage;
