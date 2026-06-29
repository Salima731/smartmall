import { Link, useParams } from 'react-router-dom';
import { useGetMallByIdQuery } from '../features/malls/mallApiSlice';
import { useGetShopsByMallQuery } from '../features/shops/shopApiSlice';
import { useGetParkingStatusQuery } from '../features/parking/parkingApiSlice';
import { useGetRestroomsQuery } from '../features/restrooms/restroomApiSlice';
import { 
  Car, 
  Users, 
  Trash2, 
  ShoppingBag, 
  Clock, 
  MapPin, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

import EmergencyAlertBanner from '../components/EmergencyAlertBanner';
import ReviewWidget from '../components/ReviewWidget';

const MallDetails = () => {
  const { id } = useParams();
  const { data: mall, isLoading: mallLoading } = useGetMallByIdQuery(id);
  const { data: shops, isLoading: shopsLoading } = useGetShopsByMallQuery(id);
  const { data: parking } = useGetParkingStatusQuery(id);
  const { data: restrooms } = useGetRestroomsQuery(id);

  if (mallLoading) return <div className="animate-pulse h-96 bg-bg-card rounded-[2.5rem]" />;

  return (
    <div className="space-y-10">
      {/* Emergency Alerts */}
      <EmergencyAlertBanner mallId={id} />

      {/* Header */}
      <div className="relative h-80 rounded-3xl overflow-hidden shadow-xl bg-bg-card">
        <img src={mall?.image} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <h1 className="text-4xl font-bold">{mall?.name}</h1>
          <p className="flex items-center text-white/80 mt-2 font-medium">
            <MapPin className="w-4 h-4 mr-1 text-primary-500" /> {mall?.address}, {mall?.district}
          </p>
        </div>
      </div>

      {/* Services Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ServiceCard 
          icon={<Car className="w-6 h-6 text-blue-500" />}
          title="Smart Parking"
          value={`${parking?.available || 0} Slots`}
          subtext="Available now"
          statusColor="bg-blue-500"
        />
        <ServiceCard 
          icon={<ShoppingBag className="w-6 h-6 text-purple-500" />}
          title="Active Food Orders"
          value="Wait: ~10m"
          subtext="Ready to pickup"
          statusColor="bg-purple-500"
        />
        <ServiceCard 
          icon={<Trash2 className="w-6 h-6 text-green-500" />}
          title="Restrooms"
          value="Clean"
          subtext="Updated 5m ago"
          statusColor="bg-green-500"
        />
      </div>

      {/* Tabs / Sections */}
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-black flex items-center text-text-main">
              <ShoppingBag className="w-8 h-8 mr-4 text-primary-500" /> Shops in Mall
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {shops?.map(shop => (
                <Link
                  key={shop._id}
                  to={`/shop/${shop._id}`}
                  className="glass-card p-6 rounded-[2rem] flex items-center space-x-5 hover:border-primary-500/30 transition-all cursor-pointer group bg-bg-card"
                >
                  <div className="w-16 h-16 bg-primary-600/10 rounded-2xl flex items-center justify-center font-black text-2xl text-primary-500 group-hover:scale-110 transition-transform shadow-inner border border-border-main">
                    {shop.name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-text-main">{shop.name}</h4>
                    <p className="text-sm text-text-muted font-medium">{shop.category} • {shop.floor}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="glass-card p-8 rounded-[2.5rem] space-y-6 bg-bg-card">
            <h3 className="text-xl font-black flex items-center text-text-main">
              <Clock className="w-6 h-6 mr-3 text-primary-500" /> Real-time Updates
            </h3>
            <div className="space-y-4">
              {restrooms?.map(restroom => (
                <div key={restroom._id} className="flex items-center justify-between p-4 bg-bg-sub rounded-2xl border border-border-main shadow-sm">
                   <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${restroom.status === 'Available' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`} />
                      <span className="text-sm font-bold text-text-main">{restroom.location} • {restroom.gender}</span>
                   </div>
                   <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${restroom.status === 'Available' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {restroom.status}
                   </span>
                </div>
              ))}
            </div>

          </section>

          <ReviewWidget targetType="Mall" targetId={id} mallId={id} />
        </aside>
      </div>
    </div>
  );
};

const ServiceCard = ({ icon, title, value, subtext, statusColor }) => (
  <div className="glass-card p-8 rounded-[2.5rem] hover:border-primary-500/30 transition-all group bg-bg-card">
    <div className="flex items-center justify-between mb-6">
      <div className="p-4 bg-bg-sub rounded-2xl group-hover:bg-primary-500/10 transition-colors border border-border-main">{icon}</div>
      <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
    </div>
    <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
    <h4 className="text-3xl font-black mt-2 tracking-tighter text-text-main">{value}</h4>
    <p className="text-text-muted text-xs mt-3 flex items-center font-medium">
      <CheckCircle2 className="w-4 h-4 mr-2 text-primary-500" /> {subtext}
    </p>
  </div>
);

export default MallDetails;
