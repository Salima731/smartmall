import { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useGetCrowdDensityQuery } from '../features/malls/mallApiSlice';

// Simulated crowd data per zone (refreshes every 30s)
const ZONES = [
  { id: 1, name: 'Food Court', emoji: '🍔', base: 75 },
  { id: 2, name: 'Electronics', emoji: '💻', base: 45 },
  { id: 3, name: 'Fashion Zone', emoji: '👗', base: 60 },
  { id: 4, name: 'Parking', emoji: '🚗', base: 80 },
  { id: 5, name: 'Kids Area', emoji: '🎠', base: 30 },
  { id: 6, name: 'Entrance', emoji: '🚪', base: 55 },
];

const getLevel = (pct) => {
  if (pct >= 75) return { label: 'Crowded', color: 'text-red-500', bar: 'bg-red-500', icon: TrendingUp };
  if (pct >= 40) return { label: 'Moderate', color: 'text-yellow-500', bar: 'bg-yellow-500', icon: Minus };
  return { label: 'Quiet', color: 'text-green-500', bar: 'bg-green-500', icon: TrendingDown };
};

const randomize = (base) => Math.min(100, Math.max(5, base + Math.floor(Math.random() * 21) - 10));

const CrowdDensityMonitor = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const mallId = userInfo?.mall || 'default';

  const { data: dbZones = [], isLoading } = useGetCrowdDensityQuery(mallId, {
    pollingInterval: 30000,
  });

  const [zones, setZones] = useState(ZONES.map((z) => ({ ...z, pct: randomize(z.base) })));

  useEffect(() => {
    if (dbZones && dbZones.length > 0) {
      setZones(dbZones);
    }
  }, [dbZones]);

  useEffect(() => {
    if (!dbZones || dbZones.length === 0) {
      const interval = setInterval(() => {
        setZones((prev) => prev.map((z) => ({ ...z, pct: randomize(z.base) })));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [dbZones]);

  const avgCrowd = Math.round(zones.reduce((s, z) => s + z.pct, 0) / zones.length);

  return (
    <div className="bg-bg-card border border-border-main rounded-3xl p-6 space-y-5 shadow-xl glass-card">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center text-text-main">
          <Users className="w-6 h-6 mr-2 text-cyan-500" /> Live Crowd Density
        </h3>
        <span className="text-xs text-text-muted bg-bg-sub border border-border-main px-3 py-1 rounded-full font-bold">
          Updates every 30s
        </span>
      </div>

      {/* Overall meter */}
      <div className="bg-bg-sub border border-border-main rounded-2xl p-4 flex items-center space-x-4">
        <div className="text-4xl font-extrabold text-text-main">{avgCrowd}%</div>
        <div className="flex-1">
          <p className="text-xs text-text-muted mb-2 font-bold">Overall Mall Occupancy</p>
          <div className="h-3 bg-bg-card border border-border-main rounded-full overflow-hidden p-0.5">
            <motion.div
              animate={{ width: `${avgCrowd}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${getLevel(avgCrowd).bar}`}
            />
          </div>
        </div>
      </div>

      {/* Zone grid */}
      <div className="grid grid-cols-2 gap-3">
        {zones.map((zone) => {
          const level = getLevel(zone.pct);
          const Icon = level.icon;
          return (
            <div key={zone.id} className="bg-bg-sub border border-border-main rounded-2xl p-3 space-y-2 hover:border-primary-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1 text-text-main">
                  {zone.emoji} {zone.name}
                </span>
                <span className={`text-xs font-bold flex items-center ${level.color}`}>
                  <Icon className="w-3 h-3 mr-0.5" /> {level.label}
                </span>
              </div>
              <div className="h-2 bg-bg-card border border-border-main rounded-full overflow-hidden p-0.5">
                <motion.div
                  animate={{ width: `${zone.pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${level.bar}`}
                />
              </div>
              <p className="text-xs text-text-muted text-right font-mono font-bold">{zone.pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrowdDensityMonitor;
