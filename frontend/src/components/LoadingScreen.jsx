import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const LoadingScreen = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinished, 800);
          return 100;
        }
        return prev + 1; // Slower for "a few seconds" feel
      });
    }, 40);
    return () => clearInterval(timer);
  }, [onFinished]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
      transition={{ duration: 1, ease: 'circOut' }}
      className="fixed inset-0 z-[9999] bg-bg-main flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-700" />

      {/* Main Content */}
      <div className="relative flex flex-col items-center space-y-12">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: 'backOut' }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary-500 rounded-[2.5rem] blur-3xl opacity-30 animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 p-8 rounded-[2.5rem] shadow-2xl shadow-primary-500/40 border border-white/20">
            <ShoppingBag className="w-20 h-20 text-white" />
          </div>
          
          {/* Orbiting Rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-[-30px] border-2 border-primary-500/30 rounded-[3rem] border-t-transparent"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-[-60px] border border-purple-500/20 rounded-full border-b-transparent"
          />
        </motion.div>

        {/* Branding */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-text-main via-primary-400 to-primary-600 bg-clip-text text-transparent italic">
              SMART MALL
            </h1>
            <p className="text-primary-500/80 font-mono text-xs uppercase tracking-[0.5em] mt-3">
              Initializing Digital Infrastructure
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col items-center space-y-6"
          >
            <div className="flex items-center space-x-3 text-text-muted text-sm font-black italic tracking-wide">
              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
              <span className="bg-gradient-to-r from-text-main to-text-muted bg-clip-text text-transparent">
                Preparing Your Smart Mall Experience...
              </span>
            </div>

            {/* Progress Bar - Premium Design */}
            <div className="w-72 h-1.5 bg-bg-sub rounded-full overflow-hidden border border-border-main p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-600 via-primary-400 to-purple-600 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between w-72 px-1">
               <span className="text-[10px] font-black font-mono text-primary-500/50 uppercase tracking-widest">Protocol Active</span>
               <span className="text-[10px] font-black font-mono text-primary-500/50">{progress}%</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Lines */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="h-px w-full bg-gradient-to-r from-transparent via-border-main to-transparent top-1/4 absolute" />
         <div className="h-px w-full bg-gradient-to-r from-transparent via-border-main to-transparent top-3/4 absolute" />
         <div className="w-px h-full bg-gradient-to-b from-transparent via-border-main to-transparent left-1/4 absolute" />
         <div className="w-px h-full bg-gradient-to-b from-transparent via-border-main to-transparent left-3/4 absolute" />
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
