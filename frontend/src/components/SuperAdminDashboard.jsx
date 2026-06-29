import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon path issue for React apps
if (typeof window !== 'undefined' && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  Building, Users, Store, ShoppingBag, Tag, Car, HelpCircle, 
  Settings as SettingsIcon, Bell, ShieldCheck, MapPin, Eye, Check, X, 
  Trash2, AlertTriangle, Play, Pause, RefreshCw, Layers, Shield, 
  Activity, ArrowUpRight, ArrowDownRight, Globe, Lock, Cpu, Mail,
  UploadCloud, Loader2, Plus, MoreVertical
} from 'lucide-react';
import { 
  useGetAdminStatsQuery,
  useGetAdminLogsQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useSendAnnouncementMutation,
  useAssignMallAdminMutation,
  useUpdateMallStatusMutation,
  useUpdateShopStatusMutation,
  useUpdateProductStatusMutation,
  useUpdateOfferStatusMutation,
  useGetMonitoringOpsQuery
} from '../features/api/adminApiSlice';
import { useGetUsersQuery, useUpdateUserRoleMutation, useDeleteUserMutation, useRegisterMutation } from '../features/auth/authApiSlice';
import { useGetMallsQuery, useCreateMallMutation, useUpdateMallMutation, useDeleteMallMutation } from '../features/malls/mallApiSlice';
import { useGetShopsQuery, useDeleteShopMutation } from '../features/shops/shopApiSlice';
import { useGetProductsQuery, useDeleteProductMutation } from '../features/products/productApiSlice';
import { useGetOffersQuery, useDeleteOfferMutation } from '../features/offers/offerApiSlice';

export const SuperAdminDashboard = ({ userInfo, activeTab, onSelectTab }) => {
  // Queries
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetAdminStatsQuery(undefined, {
    pollingInterval: 15000 // Real-time poll every 15s
  });
  const { data: users, error: usersError, isLoading: usersLoading, refetch: refetchUsers } = useGetUsersQuery();
  const { data: malls, refetch: refetchMalls } = useGetMallsQuery();
  const { data: shops, refetch: refetchShops } = useGetShopsQuery();
  const { data: products, refetch: refetchProducts } = useGetProductsQuery();
  const { data: offers, refetch: refetchOffers } = useGetOffersQuery('All');
  const { data: opsData, isLoading: opsLoading, refetch: refetchOps } = useGetMonitoringOpsQuery(undefined, {
    pollingInterval: 10000 // Ops details real-time poll 10s
  });
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useGetAdminLogsQuery({ page: 1, limit: 100 });
  const { data: settings, refetch: refetchSettings } = useGetAdminSettingsQuery();

  // Mutations
  const [updateMallStatus] = useUpdateMallStatusMutation();
  const [updateShopStatus] = useUpdateShopStatusMutation();
  const [updateProductStatus] = useUpdateProductStatusMutation();
  const [updateOfferStatus] = useUpdateOfferStatusMutation();
  const [assignMallAdmin] = useAssignMallAdminMutation();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [deleteMall] = useDeleteMallMutation();
  const [updateMall] = useUpdateMallMutation();
  const [registerUser] = useRegisterMutation();
  const [deleteShop] = useDeleteShopMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteOffer] = useDeleteOfferMutation();

  const handleRefreshAll = () => {
    refetchStats();
    refetchUsers();
    refetchMalls();
    refetchShops();
    refetchProducts();
    refetchOffers();
    refetchOps();
    refetchLogs();
    refetchSettings();
    toast.success('All system parameters re-synchronized!');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <OverviewTab 
            stats={statsData} 
            usersCount={users?.length || 0}
            mallsCount={malls?.length || 0}
            shopsCount={shops?.length || 0}
            productsCount={products?.length || 0}
            offersCount={offers?.length || 0}
            loading={statsLoading} 
            onRefresh={handleRefreshAll}
          />
        );
      case 'Malls':
        return (
          <MallsTab 
            malls={malls} 
            users={users} 
            onUpdateStatus={updateMallStatus}
            onUpdateMall={updateMall}
            onDelete={deleteMall}
            onAssignAdmin={assignMallAdmin}
            onRegisterUser={registerUser}
            refetch={handleRefreshAll}
          />
        );
      case 'Users':
        return (
          <div className="space-y-4">
            {usersLoading && (
              <div className="p-4 bg-bg-card border border-border-main rounded-xl text-xs text-text-muted flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span>Loading users database...</span>
              </div>
            )}
            {usersError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold space-y-1">
                <p>⚠️ Failed to fetch users from database!</p>
                <pre className="text-[10px] overflow-x-auto">{JSON.stringify(usersError, null, 2)}</pre>
              </div>
            )}
            <UsersTab 
              users={users} 
              malls={malls}
              userInfo={userInfo}
              onUpdateRole={updateUserRole}
              onDelete={deleteUser}
              onBlockToggle={async (id, isBlocked) => {
                try {
                  await updateUserRole({ id, isBlocked }).unwrap();
                  toast.success(`User account ${isBlocked ? 'suspended' : 'activated'} successfully`);
                  refetchUsers();
                } catch (e) {
                  toast.error('Failed to update block status');
                }
              }}
              refetch={handleRefreshAll}
            />
          </div>
        );
      case 'Shops':
        return (
          <ShopsTab 
            shops={shops} 
            onUpdateStatus={updateShopStatus}
            onDelete={deleteShop}
            refetch={handleRefreshAll}
          />
        );
      case 'Products':
        return (
          <ProductsTab 
            products={products} 
            onUpdateStatus={updateProductStatus}
            onDelete={deleteProduct}
            refetch={handleRefreshAll}
          />
        );
      case 'Offers':
        return (
          <OffersTab 
            offers={offers} 
            onUpdateStatus={updateOfferStatus}
            onDelete={deleteOffer}
            refetch={handleRefreshAll}
          />
        );
      case 'Operations':
        return (
          <OperationsTab 
            ops={opsData} 
            malls={malls}
            loading={opsLoading}
            refetch={handleRefreshAll}
          />
        );
      case 'Announcements':
        return (
          <AnnouncementsTab 
            malls={malls}
            refetch={handleRefreshAll}
          />
        );
      case 'Audit Logs':
        return (
          <AuditLogsTab 
            logs={logsData?.logs || []} 
            loading={logsLoading}
            refetch={handleRefreshAll}
          />
        );
      case 'Settings':
        return (
          <SettingsTab 
            settings={settings}
            onUpdate={useUpdateAdminSettingsMutation}
            refetch={handleRefreshAll}
          />
        );
      default:
        return (
          <div className="text-center p-12 glass-card rounded-[2.5rem] bg-bg-card border border-border-main">
            <Cpu className="w-12 h-12 text-primary-500 mx-auto animate-spin mb-4" />
            <h3 className="font-black text-text-main text-lg uppercase tracking-widest">Routing Module...</h3>
          </div>
        );
    }
  };

  return (
    <div className="w-full min-w-0">
      {renderContent()}
    </div>
  );
};

/* ==========================================
   SUB-TABS IMPLEMENTATIONS
   ========================================== */

// 1. OVERVIEW TAB
const OverviewTab = ({ stats, usersCount, mallsCount, shopsCount, productsCount, offersCount, loading, onRefresh }) => {
  if (loading) return <div className="animate-pulse h-96 bg-bg-sub rounded-3xl" />;

  const metricCards = [
    { title: 'Total Malls', value: mallsCount, icon: Globe, change: '+12%', isPositive: true, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
    { title: 'Platform Users', value: usersCount, icon: Users, change: '+24%', isPositive: true, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { title: 'Registered Stores', value: shopsCount, icon: Store, change: '+8%', isPositive: true, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    { title: 'Moderated Products', value: productsCount, icon: ShoppingBag, change: '+32%', isPositive: true, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Active Offers', value: offersCount, icon: Tag, change: '+15%', isPositive: true, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { title: 'Parking Slots', value: stats?.metrics?.parking?.total || 250, icon: Car, change: `${stats?.metrics?.parking?.rate || 62}% Occupied`, isPositive: false, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' }
  ];

  return (
    <div className="space-y-8 min-w-0">
      {/* Action Row */}
      <div className="flex justify-between items-center bg-bg-card p-6 rounded-[2rem] border border-border-main shadow-lg">
        <div>
          <h2 className="text-xl font-black text-text-main flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" /> Platform Operational Control
          </h2>
          <p className="text-xs text-text-muted mt-1">Real-time status metrics and platform performance aggregates.</p>
        </div>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-2 px-5 py-2.5 bg-bg-sub border border-border-main hover:border-primary-500/40 text-text-main hover:text-primary-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
        >
          <RefreshCw className="w-4 h-4 animate-pulse" /> Sync Nodes
        </button>
      </div>

      {/* Grid KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((card, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-[2.2rem] border border-border-main bg-bg-card shadow-lg flex items-center justify-between"
          >
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{card.title}</p>
              <h3 className="text-3xl font-black text-text-main tracking-tight">{card.value}</h3>
              <div className="flex items-center space-x-1">
                {card.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-primary-500" />
                )}
                <span className={`text-[10px] font-black ${card.isPositive ? 'text-green-500' : 'text-primary-400'}`}>
                  {card.change}
                </span>
              </div>
            </div>
            <div className={`p-4 rounded-2xl border ${card.color} shadow-inner`}>
              <card.icon className="w-6 h-6" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* SVG Executive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Smooth Area Visitor Traffic & Revenue */}
        <div className="glass-card p-8 rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-text-main uppercase tracking-wider">Visitor Traffic & Platform Activity</h3>
              <p className="text-xs text-text-muted">Monthly count comparison of platform operations</p>
            </div>
            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 font-black text-[10px] uppercase tracking-wider rounded-lg">
              Live Feed
            </span>
          </div>

          {/* SVG Custom Area Chart */}
          <div className="w-full h-64 relative flex items-end">
            <svg className="w-full h-full" viewBox="0 0 500 200">
              <defs>
                <linearGradient id="visitorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="5" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="5" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.05)" strokeDasharray="5" />
              
              {/* Visitor Path Area */}
              <path d="M 0 170 Q 100 130 200 150 T 400 90 L 500 60 L 500 200 L 0 200 Z" fill="url(#visitorGrad)" />
              <path d="M 0 170 Q 100 130 200 150 T 400 90 L 500 60" fill="none" stroke="#6366f1" strokeWidth="3" />

              {/* Revenue Path Area */}
              <path d="M 0 190 Q 100 150 200 110 T 400 130 L 500 80 L 500 200 L 0 200 Z" fill="url(#revGrad)" />
              <path d="M 0 190 Q 100 150 200 110 T 400 130 L 500 80" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="3" />

              {/* Glowing Dots */}
              <circle cx="200" cy="150" r="5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
              <circle cx="500" cy="80" r="5" fill="#a855f7" stroke="#fff" strokeWidth="1.5" />
            </svg>
            
            {/* Chart X Labels */}
            <div className="absolute bottom-0 inset-x-0 flex justify-between px-2 text-[10px] text-text-muted font-bold pt-4">
              <span>Dec</span>
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
            </div>
          </div>
          <div className="flex justify-start space-x-6 text-[10px] font-black uppercase tracking-wider">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-indigo-500 rounded-full" />
              <span className="text-text-main">Visitor footfalls</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-purple-500 rounded-full border border-dashed border-purple-300" />
              <span className="text-text-main">Tenant Revenue flow</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Dynamic Operational Load Grid */}
        <div className="glass-card p-8 rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-text-main uppercase tracking-wider">Operations Load Balancer</h3>
              <p className="text-xs text-text-muted">Live metrics of Virtual Queues & Smart Parking slot rates</p>
            </div>
            <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-500 font-black text-[10px] uppercase tracking-wider rounded-lg">
              Ops Balanced
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Avg Queue Waiting</p>
              <h4 className="text-3xl font-black text-text-main">8.4 Min</h4>
              <p className="text-xs text-green-500 font-bold">▼ 1.2m vs yesterday</p>
              <div className="h-2 bg-border-main rounded-full overflow-hidden">
                <div className="w-[42%] h-full bg-indigo-500" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Parking Occupancy</p>
              <h4 className="text-3xl font-black text-text-main">62.8%</h4>
              <p className="text-xs text-primary-400 font-bold">▲ 4.5% vs yesterday</p>
              <div className="h-2 bg-border-main rounded-full overflow-hidden">
                <div className="w-[62%] h-full bg-purple-500" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Restroom Cleanliness</p>
              <h4 className="text-3xl font-black text-text-main">96.5%</h4>
              <p className="text-xs text-green-500 font-bold">▲ 0.5% vs yesterday</p>
              <div className="h-2 bg-border-main rounded-full overflow-hidden">
                <div className="w-[96%] h-full bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* Infrastructure Health Status */}
          <div className="border-t border-border-main pt-6 space-y-4">
            <p className="text-xs font-black text-text-main uppercase tracking-wider">Cloud Network Nodes</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 bg-bg-sub border border-border-main rounded-xl p-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <div>
                  <p className="text-[10px] font-black text-text-main">DB CLUSTER</p>
                  <p className="text-[9px] text-text-muted">Latency 8ms • Connected</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-bg-sub border border-border-main rounded-xl p-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <div>
                  <p className="text-[10px] font-black text-text-main">SOCKET ENGINE</p>
                  <p className="text-[9px] text-text-muted">Port 5020 • Broadcast Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// IMAGE UPLOAD SUBSYSTEMS (Multer/Drag & Drop)
// ==========================================

const ImageUploadZone = ({ 
  label, 
  value, 
  onChange, 
  onRemove, 
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      const msg = 'Unsupported file format! Please upload JPG, PNG, or WEBP.';
      setError(msg);
      toast.error(msg);
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      const msg = `File is too large! Maximum limit is ${maxSizeMB}MB.`;
      setError(msg);
      toast.error(msg);
      return false;
    }
    setError('');
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const performUpload = (file) => {
    setIsUploading(true);
    setProgress(0);
    setError('');

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('image', file);
    const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:5020/api').replace(/\/$/, '');
    xhr.open('POST', `${baseApi}/upload/single`, true);
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
      xhr.setRequestHeader('Authorization', `Bearer ${userInfo.token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        onChange(response.url);
        toast.success(`${label} uploaded successfully!`);
      } else {
        let msg = 'Upload failed';
        try {
          const resp = JSON.parse(xhr.responseText);
          msg = resp.message || msg;
        } catch (e) {}
        setError(msg);
        toast.error(msg);
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setError('Network error during upload');
      toast.error('Network error during upload');
    };

    xhr.send(formData);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        performUpload(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        performUpload(file);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase tracking-widest text-text-muted">{label}</label>
        <span className="text-[10px] text-text-muted font-bold">Max: {maxSizeMB}MB</span>
      </div>

      {!value && !isUploading && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-36 ${
            dragActive 
              ? 'border-primary-500 bg-primary-500/10 scale-[0.99] shadow-inner' 
              : error 
                ? 'border-red-500 bg-red-500/5' 
                : 'border-border-main hover:border-primary-500/40 hover:bg-bg-sub/50'
          }`}
        >
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/jpg, image/webp" 
            onChange={handleFileChange} 
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
          />
          <UploadCloud className={`w-8 h-8 mb-2 transition-colors ${dragActive ? 'text-primary-500' : 'text-text-muted'}`} />
          <p className="text-[11px] font-black text-text-main uppercase tracking-wider">Drag & drop image</p>
          <p className="text-[9px] text-text-muted font-bold mt-0.5">or click to browse</p>
          {error && <p className="text-[9px] text-red-500 font-bold mt-1.5">{error}</p>}
        </div>
      )}

      {isUploading && (
        <div className="border border-border-main rounded-3xl p-6 bg-bg-sub flex flex-col items-center justify-center space-y-3 h-36">
          <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          <div className="w-full space-y-1.5">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-text-muted">
              <span>Uploading {label}...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-border-main rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {value && !isUploading && (
        <div className="relative group overflow-hidden border border-border-main rounded-3xl bg-bg-sub h-36 flex items-center justify-center">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <button 
              type="button" 
              onClick={onRemove}
              className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-transform hover:scale-110 shadow-lg"
              title="Remove photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const GalleryUploadZone = ({ label, value = [], onChange, onRemoveImage }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Unsupported file format! Please upload JPG, PNG, or WEBP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File is too large! Maximum limit is 5MB.');
        return;
      }

      setIsUploading(true);
      setProgress(0);

      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('image', file);
      const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:5020/api').replace(/\/$/, '');
      xhr.open('POST', `${baseApi}/upload/single`, true);

      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo && userInfo.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${userInfo.token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onChange([...value, response.url]);
          toast.success('Gallery photo added!');
        } else {
          let msg = 'Upload failed';
          try {
            const resp = JSON.parse(xhr.responseText);
            msg = resp.message || msg;
          } catch (e) {}
          toast.error(msg);
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        toast.error('Network connection error during upload');
      };

      xhr.send(formData);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase tracking-widest text-text-muted">{label}</label>
        <span className="text-[10px] text-text-muted font-bold">{value.length} / 8 images</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {value.map((url, index) => (
          <div key={index} className="relative group overflow-hidden border border-border-main rounded-2xl bg-bg-sub h-24 flex items-center justify-center">
            <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-transform scale-0 group-hover:scale-100 shadow-md"
              title="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {isUploading && (
          <div className="border border-border-main rounded-2xl bg-bg-sub h-24 flex flex-col items-center justify-center p-3 space-y-2">
            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
            <span className="text-[9px] font-black text-text-muted">{progress}%</span>
          </div>
        )}

        {value.length < 8 && !isUploading && (
          <div className="relative border-2 border-dashed border-border-main hover:border-primary-500/40 hover:bg-bg-sub/50 rounded-2xl h-24 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg, image/webp" 
              onChange={handleFileChange} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
            />
            <Plus className="w-5 h-5 text-text-muted hover:text-primary-500 transition-colors" />
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1">Add Image</span>
          </div>
        )}
      </div>
    </div>
  );
};

const MapPicker = ({ lat, lng, onChange, address, district }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Use current coordinate or fallback to center of LA/US
    const initialLat = parseFloat(lat) || 34.0522;
    const initialLng = parseFloat(lng) || -118.2437;

    // Create Leaflet Map instance
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([initialLat, initialLng], 13);
    mapInstanceRef.current = map;

    // Add CartoDB Voyager tile layer for dark & light mode friendly premium interface
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Create marker
    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    markerInstanceRef.current = marker;

    // Event: Update coordinates on drag
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onChange(position.lat.toFixed(6), position.lng.toFixed(6));
    });

    // Event: Click on map to place marker
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    });

    // Clean up
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync external coordinates changes (e.g. Geocoding)
  useEffect(() => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) return;

    if (mapInstanceRef.current && markerInstanceRef.current) {
      const currentPos = markerInstanceRef.current.getLatLng();
      if (Math.abs(currentPos.lat - parsedLat) > 0.0001 || Math.abs(currentPos.lng - parsedLng) > 0.0001) {
        markerInstanceRef.current.setLatLng([parsedLat, parsedLng]);
        mapInstanceRef.current.setView([parsedLat, parsedLng], 14);
      }
    }
  }, [lat, lng]);

  const handleAutoFetch = async () => {
    const query = [address, district].filter(Boolean).join(', ');
    if (!query) {
      toast.error('Please enter a Mall Address or District first!');
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SmartMallSystem-Admin'
          }
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const foundLat = parseFloat(data[0].lat);
        const foundLng = parseFloat(data[0].lon);
        onChange(foundLat.toFixed(6), foundLng.toFixed(6));
        toast.success(`Location coordinates synced!`);
      } else {
        toast.warn('Detailed address not resolved. Pinpointing region instead...');
        if (district) {
          const fallbackResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(district)}&limit=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'SmartMallSystem-Admin'
              }
            }
          );
          const fallbackData = await fallbackResponse.json();
          if (fallbackData && fallbackData.length > 0) {
            const foundLat = parseFloat(fallbackData[0].lat);
            const foundLng = parseFloat(fallbackData[0].lon);
            onChange(foundLat.toFixed(6), foundLng.toFixed(6));
            toast.success(`District center coordinates resolved!`);
          } else {
            toast.error('Location could not be geocoded automatically. Please select on map.');
          }
        } else {
          toast.error('Location could not be geocoded automatically. Please select on map.');
        }
      }
    } catch (error) {
      toast.error('Geocoding service unavailable. Please try manually placing map marker.');
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-bg-sub border border-border-main p-3.5 rounded-2xl gap-3 text-left">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-ping shrink-0" />
          <span className="text-[11px] font-bold text-text-main">
            Coordinates: {lat ? `${lat}, ${lng}` : 'Not Selected'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAutoFetch}
          disabled={isGeocoding}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-500/10 border border-primary-500/20 hover:bg-primary-500 hover:text-white text-primary-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {isGeocoding ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
            </>
          ) : (
            'Auto Fetch Coordinates'
          )}
        </button>
      </div>

      <div 
        ref={mapRef} 
        className="w-full h-60 rounded-[1.5rem] border border-border-main overflow-hidden relative z-10 shadow-inner bg-bg-sub" 
        style={{ minHeight: '240px' }}
      />
      <p className="text-[9px] text-text-muted italic text-center uppercase tracking-wider">
        📍 drag pin or click map to calibrate exact geolocation
      </p>
    </div>
  );
};

// 2. MALLS TAB
const MallsTab = ({ malls, users, onUpdateStatus, onUpdateMall, onDelete, onAssignAdmin, onRegisterUser, refetch }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [image, setImage] = useState('');
  const [logo, setLogo] = useState('');
  const [gallery, setGallery] = useState([]);
  const [adminId, setAdminId] = useState('');

  // Edit Mall State
  const [editingMall, setEditingMall] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editGallery, setEditGallery] = useState([]);
  const [editAdminId, setEditAdminId] = useState('');

  // Quick Register Mall Admin states
  const [showQuickAdminForm, setShowQuickAdminForm] = useState(false);
  const [quickAdminName, setQuickAdminName] = useState('');
  const [quickAdminEmail, setQuickAdminEmail] = useState('');
  const [quickAdminPassword, setQuickAdminPassword] = useState('');
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);
  const [pendingAdminEmail, setPendingAdminEmail] = useState('');

  // Assign Mall Admin State
  const [assigningMallId, setAssigningMallId] = useState(null);
  const [selectedAdminId, setSelectedAdminId] = useState('');

  const [createMall, { isLoading: creating }] = useCreateMallMutation();

  // Memoize eligible Mall Admins (exclude Super Admins, and users already assigned to other malls)
  const eligibleAdmins = useMemo(() => {
    return users?.filter(u => {
      if (u.role === 'Super Admin') return false;
      const isAssignedToOtherMall = malls?.some(m => 
        (m.admin?._id === u._id || m.admin === u._id) && 
        (!editingMall || (editingMall.admin?._id !== u._id && editingMall.admin !== u._id))
      );
      return !isAssignedToOtherMall;
    }) || [];
  }, [users, malls, editingMall]);

  // Auto-select pending admin when users list is refetched
  useEffect(() => {
    if (pendingAdminEmail && users) {
      const foundUser = users.find(u => u.email.toLowerCase() === pendingAdminEmail.toLowerCase());
      if (foundUser) {
        if (editingMall) {
          setEditAdminId(foundUser._id);
        } else {
          setAdminId(foundUser._id);
        }
        setPendingAdminEmail('');
        toast.success(`Automatically linked "${foundUser.name}" as assigned admin!`);
      }
    }
  }, [users, pendingAdminEmail, editingMall]);

  // Quick Admin creation handler
  const handleQuickRegisterAdmin = async (e) => {
    e.preventDefault();
    if (!quickAdminName || !quickAdminEmail || !quickAdminPassword) {
      toast.error('All profile credentials are required!');
      return;
    }
    setIsRegisteringAdmin(true);
    try {
      await onRegisterUser({
        name: quickAdminName,
        email: quickAdminEmail,
        password: quickAdminPassword,
        role: 'User'
      }).unwrap();
      
      toast.success(`Account "${quickAdminName}" registered! Linking as Mall Admin...`);
      refetch();
      setShowQuickAdminForm(false);
      setQuickAdminName('');
      setQuickAdminPassword('');
      setPendingAdminEmail(quickAdminEmail);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to register Mall Admin account');
    } finally {
      setIsRegisteringAdmin(false);
    }
  };

  const handleStartEdit = (mall) => {
    setEditingMall(mall);
    setEditName(mall.name || '');
    setEditDistrict(mall.district || '');
    setEditAddress(mall.address || '');
    setEditLat(mall.location?.coordinates?.[1] || '');
    setEditLng(mall.location?.coordinates?.[0] || '');
    setEditImage(mall.image || '');
    setEditLogo(mall.logo || '');
    setEditGallery(mall.gallery || []);
    setEditAdminId(mall.admin?._id || mall.admin || '');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editLogo) {
      toast.error('Mall Logo is required!');
      return;
    }
    if (!editImage) {
      toast.error('Mall Cover Banner is required!');
      return;
    }
    try {
      await onUpdateMall({
        id: editingMall._id,
        name: editName,
        district: editDistrict,
        address: editAddress,
        location: {
          type: 'Point',
          coordinates: [parseFloat(editLng) || 0, parseFloat(editLat) || 0]
        },
        image: editImage,
        logo: editLogo,
        gallery: editGallery,
        adminId: editAdminId || null
      }).unwrap();
      toast.success('Smart Mall configuration updated successfully!');
      setEditingMall(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update mall details');
    }
  };

  const handleCreateMall = async (e) => {
    e.preventDefault();
    
    // File validation
    if (!logo) {
      toast.error('Mall Logo is required! Please upload a logo.');
      return;
    }
    if (!image) {
      toast.error('Mall Cover Banner is required! Please upload a banner cover.');
      return;
    }

    try {
      await createMall({
        name,
        district,
        address,
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
        image,
        logo,
        gallery,
        adminId: adminId || undefined
      }).unwrap();
      toast.success('Smart Mall deployed successfully into the network!');
      setShowAddForm(false);
      setName(''); 
      setDistrict(''); 
      setAddress(''); 
      setLat(''); 
      setLng(''); 
      setImage(''); 
      setLogo(''); 
      setGallery([]);
      setAdminId('');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create mall');
    }
  };

  const handleAssignAdminSubmit = async (mallId) => {
    if (!selectedAdminId) {
      toast.error('Please select an Administrator');
      return;
    }
    try {
      await onAssignAdmin({ mallId, adminId: selectedAdminId }).unwrap();
      toast.success('Mall Administrator assigned successfully!');
      setAssigningMallId(null);
      setSelectedAdminId('');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to assign Administrator');
    }
  };

  const handleToggleStatus = async (id, currentActive) => {
    try {
      await onUpdateStatus({ id, isActive: !currentActive }).unwrap();
      toast.success(`Mall ${!currentActive ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (err) {
      toast.error('Failed to change mall activation status');
    }
  };

  const handleDeleteMall = async (id, mallName) => {
    if (window.confirm(`Permanently remove Mall "${mallName}"? All associated shops and stats will be orphaned.`)) {
      try {
        await onDelete(id).unwrap();
        toast.success('Mall removed successfully');
        refetch();
      } catch (err) {
        toast.error('Failed to delete mall');
      }
    }
  };

  // Filter users with Mall Admin role
  const mallAdminsList = useMemo(() => {
    return users?.filter(u => u.role === 'Mall Admin') || [];
  }, [users]);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-bg-card p-6 rounded-[2rem] border border-border-main shadow-lg">
        <div>
          <h2 className="text-xl font-black text-text-main flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-500" /> Malls Network Control
          </h2>
          <p className="text-xs text-text-muted mt-1">Register new shopping complexes, assign administrators, and toggle active status.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-primary-500/20"
        >
          {showAddForm ? 'Cancel Registration' : 'Register New Mall'}
        </button>
      </div>

      {/* Add Mall Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCreateMall}
            className="glass-card p-8 rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl space-y-6"
          >
            <h3 className="text-lg font-black text-primary-500 flex items-center gap-2 border-b border-border-main pb-3">
              📌 Smart Mall Registration
            </h3>

            {/* Split layout: Inputs (Left) and Live Preview (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Side: Inputs */}
              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Mall Name</label>
                    <input 
                      type="text" value={name} onChange={e => setName(e.target.value)} required
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="e.g. Smart Mall Westwood"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">District / Region</label>
                    <input 
                      type="text" value={district} onChange={e => setDistrict(e.target.value)} required
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="e.g. Los Angeles"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Complete Address</label>
                    <input 
                      type="text" value={address} onChange={e => setAddress(e.target.value)} required
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="e.g. 104 Westwood Blvd, Los Angeles, CA"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-4 pt-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Geographical Location & Coordinates</label>
                    <MapPicker 
                      lat={lat} 
                      lng={lng} 
                      onChange={(newLat, newLng) => {
                        setLat(newLat);
                        setLng(newLng);
                      }}
                      address={address}
                      district={district}
                    />
                  </div>

                  {/* Mall Admin Assignment */}
                  <div className="md:col-span-2 space-y-4 border-t border-border-main/50 pt-6">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted">
                        Assign Mall Administrator
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowQuickAdminForm(!showQuickAdminForm)}
                        className="text-[10px] font-black text-primary-500 hover:text-primary-400 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        {showQuickAdminForm ? '✕ Close Quick Register' : '＋ Create New Mall Admin'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showQuickAdminForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-bg-sub/50 border border-border-main/60 rounded-2xl p-5 space-y-4 overflow-hidden text-left w-full"
                        >
                          <p className="text-[10px] font-black uppercase tracking-wider text-primary-500">
                            Quick Register Mall Admin Account
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-text-muted uppercase">Full Name</label>
                              <input
                                type="text"
                                value={quickAdminName}
                                onChange={e => setQuickAdminName(e.target.value)}
                                className="w-full bg-bg-card border border-border-main rounded-xl py-2 px-3 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
                                placeholder="e.g. John Doe"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-text-muted uppercase">Email Address</label>
                              <input
                                type="email"
                                value={quickAdminEmail}
                                onChange={e => setQuickAdminEmail(e.target.value)}
                                className="w-full bg-bg-card border border-border-main rounded-xl py-2 px-3 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
                                placeholder="e.g. john@smartmall.com"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-text-muted uppercase">Secure Password</label>
                              <input
                                type="password"
                                value={quickAdminPassword}
                                onChange={e => setQuickAdminPassword(e.target.value)}
                                className="w-full bg-bg-card border border-border-main rounded-xl py-2 px-3 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
                                placeholder="••••••••"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={handleQuickRegisterAdmin}
                              disabled={isRegisteringAdmin}
                              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {isRegisteringAdmin ? 'Registering...' : 'Register & Assign Admin'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <select
                      value={adminId}
                      onChange={e => setAdminId(e.target.value)}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main cursor-pointer"
                    >
                      <option value="">-- Select an Administrator (Optional) --</option>
                      {eligibleAdmins.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email}) - {u.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image Upload Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border-main/50 pt-6">
                  <ImageUploadZone 
                    label="Mall Logo (Required)"
                    value={logo}
                    onChange={setLogo}
                    onRemove={() => setLogo('')}
                  />
                  <ImageUploadZone 
                    label="Mall Banner Cover (Required)"
                    value={image}
                    onChange={setImage}
                    onRemove={() => setImage('')}
                  />
                </div>

                {/* Multiple Gallery Upload Zone */}
                <div className="border-t border-border-main/50 pt-6">
                  <GalleryUploadZone 
                    label="Mall Gallery (Optional Showcase)"
                    value={gallery}
                    onChange={setGallery}
                    onRemoveImage={(idx) => setGallery(gallery.filter((_, i) => i !== idx))}
                  />
                </div>
              </div>

              {/* Right Side: Interactive Live Preview Section */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-border-main/50 pt-6 lg:pt-0 lg:pl-8 space-y-6">
                <div className="sticky top-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">Live Preview Card</h4>
                    <span className="px-2.5 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-500 font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm">Real-time</span>
                  </div>

                  {/* Glassmorphic Mall Preview Card */}
                  <div className="glass-card overflow-hidden rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl flex flex-col relative h-full">
                    
                    {/* Banner Cover Preview */}
                    <div className="h-40 relative bg-bg-sub overflow-hidden flex items-center justify-center">
                      {image ? (
                        <img src={image} alt="Mall Cover Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-text-muted/40">
                          <Globe className="w-10 h-10 mb-1" />
                          <span className="text-[9px] font-black uppercase tracking-wider">No Cover Image</span>
                        </div>
                      )}
                      <span className="absolute top-4 right-4 px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider border bg-green-500/10 border-green-500/20 text-green-500 shadow-md">
                        Active Node
                      </span>
                    </div>

                    {/* Logo Overlay Preview */}
                    <div className="absolute top-28 left-6 w-14 h-14 rounded-2xl bg-bg-card border border-border-main p-1 shadow-2xl flex items-center justify-center overflow-hidden z-10">
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Building className="w-6 h-6 text-primary-500/20" />
                      )}
                    </div>

                    {/* Information Section */}
                    <div className="p-6 pt-8 space-y-4">
                      <div>
                        <span className="text-[9px] text-primary-500 font-black uppercase tracking-widest">
                          {district || 'Westwood District'}
                        </span>
                        <h4 className="text-base font-black text-text-main mt-1 leading-snug truncate">
                          {name || 'Westwood Smart Mall'}
                        </h4>
                        <p className="text-xs text-text-muted mt-2 font-medium leading-relaxed flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                          <span className="truncate">{address || '104 Westwood Blvd, Los Angeles, CA'}</span>
                        </p>
                      </div>

                      {/* Mini Coordinates Badge */}
                      <div className="flex gap-4 text-[9px] font-black text-text-muted uppercase tracking-widest border-t border-border-main/50 pt-3">
                        <span>Lat: {lat || '34.0522'}</span>
                        <span>Lng: {lng || '-118.2437'}</span>
                      </div>

                      {/* Mini Gallery Showcase */}
                      {gallery && gallery.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Gallery Showcase</p>
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {gallery.map((url, idx) => (
                              <div key={idx} className="w-8 h-8 rounded-lg overflow-hidden border border-border-main/50 shrink-0">
                                <img src={url} alt={`Gallery Mini ${idx}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="flex justify-end gap-4 border-t border-border-main/50 pt-4">
              <button 
                type="button" onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-border-main"
              >
                Cancel
              </button>
              <button 
                type="submit" disabled={creating}
                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10"
              >
                {creating ? 'Registering...' : 'Deploy Smart Mall'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Malls List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {malls?.map(mall => {
          const mallAdminDetails = users?.find(u => u._id === (mall.admin?._id || mall.admin));
          
          return (
            <motion.div 
              key={mall._id}
              whileHover={{ y: -4 }}
              className="glass-card overflow-hidden rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl flex flex-col justify-between relative"
            >
              <div>
                <div className="relative">
                  <div className="h-44 relative bg-bg-sub overflow-hidden flex items-center justify-center">
                    {mall.image ? (
                      <img src={mall.image} alt={mall.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-12 h-12 text-primary-500/30" />
                    )}
                    <span className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                      mall.isActive 
                        ? 'bg-green-500/10 border-green-500/20 text-green-500'
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                      {mall.isActive ? 'Active Node' : 'Suspended'}
                    </span>
                  </div>

                  {/* Overlaid Logo */}
                  <div className="absolute top-36 left-6 w-14 h-14 rounded-2xl bg-bg-card border border-border-main p-1 shadow-2xl flex items-center justify-center overflow-hidden z-10">
                    {mall.logo ? (
                      <img src={mall.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building className="w-6 h-6 text-primary-500/20" />
                    )}
                  </div>
                </div>

                <div className="p-6 pt-8 space-y-4">
                  <div>
                    <span className="text-[10px] text-primary-500 font-black uppercase tracking-widest">{mall.district}</span>
                    <h4 className="text-lg font-black text-text-main mt-1 leading-snug truncate">{mall.name}</h4>
                    <p className="text-xs text-text-muted mt-2 font-medium leading-relaxed flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                      <span className="truncate">{mall.address}</span>
                    </p>
                  </div>

                  {/* Mini Gallery scroll lists inside cards */}
                  {mall.gallery && mall.gallery.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Gallery Showcase</p>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {mall.gallery.map((url, idx) => (
                          <div key={idx} className="w-8 h-8 rounded-lg overflow-hidden border border-border-main/50 shrink-0">
                            <img src={url} alt={`Gallery Mini ${idx}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Admin Details */}
                  <div className="p-4 bg-bg-sub border border-border-main rounded-2xl space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Assigned Administrator</p>
                    {mallAdminDetails ? (
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="font-bold text-xs text-text-main truncate">{mallAdminDetails.name}</p>
                          <p className="text-[10px] text-text-muted truncate">{mallAdminDetails.email}</p>
                        </div>
                        <button 
                          onClick={() => setAssigningMallId(mall._id)}
                          className="px-2.5 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-primary-500 hover:text-white transition-all shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted font-bold italic">No Admin Linked</span>
                        <button 
                          onClick={() => setAssigningMallId(mall._id)}
                          className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-amber-500 hover:text-white transition-all shrink-0"
                        >
                          Link Admin
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-border-main flex justify-between items-center bg-bg-sub/30 gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleStartEdit(mall)}
                    className="px-4 py-2 bg-primary-500/10 hover:bg-primary-500 text-primary-500 hover:text-white rounded-xl border border-primary-500/20 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(mall._id, mall.isActive)}
                    className={`px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      mall.isActive
                        ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
                        : 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'
                    }`}
                  >
                    {mall.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                <button 
                  onClick={() => handleDeleteMall(mall._id, mall.name)}
                  className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Assign Admin Overlay Modal inside Card */}
              {assigningMallId === mall._id && (
                <div className="absolute inset-0 bg-bg-main/95 backdrop-blur-md p-6 flex flex-col justify-center space-y-4 z-20">
                  <div className="space-y-1">
                    <h5 className="font-black text-sm text-text-main uppercase">Select Mall Admin</h5>
                    <p className="text-[10px] text-text-muted leading-relaxed">Choose an administrator to manage this complex.</p>
                  </div>
                  <select 
                    value={selectedAdminId} 
                    onChange={e => setSelectedAdminId(e.target.value)}
                    className="w-full bg-bg-sub border border-border-main rounded-xl p-3 outline-none focus:ring-1 ring-primary-500 font-bold text-xs text-text-main cursor-pointer"
                  >
                    <option value="">-- Choose Administrator --</option>
                    {mallAdminsList.map(adm => (
                      <option key={adm._id} value={adm._id}>
                        {adm.name} ({adm.email})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAssigningMallId(null)}
                      className="flex-1 py-2.5 bg-bg-sub border border-border-main rounded-xl text-[10px] font-black uppercase tracking-wider text-text-main"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleAssignAdminSubmit(mall._id)}
                      className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary-500/20"
                    >
                      Link Admin
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Edit Mall Modal */}
      <AnimatePresence>
        {editingMall && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl overflow-y-auto">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleEditSubmit}
              className="bg-bg-card w-full max-w-5xl rounded-[2.5rem] border border-border-main shadow-2xl p-8 space-y-6 relative max-h-[90vh] overflow-y-auto text-left"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border-main pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-500 font-bold animate-pulse">
                    📝
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-main">Edit Mall Configuration</h3>
                    <p className="text-xs text-text-muted">Modify smart parameters, logos, covers and gallery details</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEditingMall(null)} 
                  className="p-2 hover:bg-bg-sub rounded-full transition-colors text-text-muted hover:text-text-main"
                >
                  ✕
                </button>
              </div>

              {/* Split layout: Inputs (Left) and Live Preview (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Inputs */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted">Mall Name</label>
                      <input 
                        type="text" value={editName} onChange={e => setEditName(e.target.value)} required
                        className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                        placeholder="e.g. Smart Mall Westwood"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted">District / Region</label>
                      <input 
                        type="text" value={editDistrict} onChange={e => setEditDistrict(e.target.value)} required
                        className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                        placeholder="e.g. Los Angeles"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted">Complete Address</label>
                      <input 
                        type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} required
                        className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                        placeholder="e.g. 104 Westwood Blvd, Los Angeles, CA"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-4 pt-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted">Geographical Location & Coordinates</label>
                      <MapPicker 
                        lat={editLat} 
                        lng={editLng} 
                        onChange={(newLat, newLng) => {
                          setEditLat(newLat);
                          setEditLng(newLng);
                        }}
                        address={editAddress}
                        district={editDistrict}
                      />
                    </div>

                    {/* Mall Admin Assignment */}
                    <div className="md:col-span-2 space-y-4 border-t border-border-main/50 pt-6">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black uppercase tracking-widest text-text-muted">
                          Assign Mall Administrator
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowQuickAdminForm(!showQuickAdminForm)}
                          className="text-[10px] font-black text-primary-500 hover:text-primary-400 uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          {showQuickAdminForm ? '✕ Close Quick Register' : '＋ Create New Mall Admin'}
                        </button>
                      </div>

                      <AnimatePresence>
                        {showQuickAdminForm && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-bg-sub/50 border border-border-main/60 rounded-2xl p-5 space-y-4 overflow-hidden text-left w-full"
                          >
                            <p className="text-[10px] font-black uppercase tracking-wider text-primary-500">
                              Quick Register Mall Admin Account
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-text-muted uppercase">Full Name</label>
                                <input
                                  type="text"
                                  value={quickAdminName}
                                  onChange={e => setQuickAdminName(e.target.value)}
                                  className="w-full bg-bg-card border border-border-main rounded-xl py-2 px-3 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
                                  placeholder="e.g. John Doe"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-text-muted uppercase">Email Address</label>
                                <input
                                  type="email"
                                  value={quickAdminEmail}
                                  onChange={e => setQuickAdminEmail(e.target.value)}
                                  className="w-full bg-bg-card border border-border-main rounded-xl py-2 px-3 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
                                  placeholder="e.g. john@smartmall.com"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-text-muted uppercase">Secure Password</label>
                                <input
                                  type="password"
                                  value={quickAdminPassword}
                                  onChange={e => setQuickAdminPassword(e.target.value)}
                                  className="w-full bg-bg-card border border-border-main rounded-xl py-2 px-3 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
                                  placeholder="••••••••"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={handleQuickRegisterAdmin}
                                disabled={isRegisteringAdmin}
                                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {isRegisteringAdmin ? 'Registering...' : 'Register & Assign Admin'}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <select
                        value={editAdminId}
                        onChange={e => setEditAdminId(e.target.value)}
                        className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main cursor-pointer"
                      >
                        <option value="">-- Select an Administrator (Optional) --</option>
                        {eligibleAdmins.map(u => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.email}) - {u.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Image Upload Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border-main/50 pt-6">
                    <ImageUploadZone 
                      label="Mall Logo (Required)"
                      value={editLogo}
                      onChange={setEditLogo}
                      onRemove={() => setEditLogo('')}
                    />
                    <ImageUploadZone 
                      label="Mall Banner Cover (Required)"
                      value={editImage}
                      onChange={setEditImage}
                      onRemove={() => setEditImage('')}
                    />
                  </div>

                  {/* Multiple Gallery Upload Zone */}
                  <div className="border-t border-border-main/50 pt-6">
                    <GalleryUploadZone 
                      label="Mall Gallery (Optional Showcase)"
                      value={editGallery}
                      onChange={setEditGallery}
                      onRemoveImage={(idx) => setEditGallery(editGallery.filter((_, i) => i !== idx))}
                    />
                  </div>
                </div>

                {/* Right Side: Interactive Live Preview Section */}
                <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-border-main/50 pt-6 lg:pt-0 lg:pl-8 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">Live Preview Card</h4>
                      <span className="px-2.5 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-500 font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm">Real-time</span>
                    </div>

                    {/* Glassmorphic Mall Preview Card */}
                    <div className="glass-card overflow-hidden rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl flex flex-col relative h-full">
                      
                      {/* Banner Cover Preview */}
                      <div className="h-40 relative bg-bg-sub overflow-hidden flex items-center justify-center">
                        {editImage ? (
                          <img src={editImage} alt="Mall Cover Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-text-muted/40">
                            <Globe className="w-10 h-10 mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-wider">No Cover Image</span>
                          </div>
                        )}
                        <span className="absolute top-4 right-4 px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider border bg-green-500/10 border-green-500/20 text-green-500 shadow-md">
                          Active Node
                        </span>
                      </div>

                      {/* Logo Overlay Preview */}
                      <div className="absolute top-28 left-6 w-14 h-14 rounded-2xl bg-bg-card border border-border-main p-1 shadow-2xl flex items-center justify-center overflow-hidden z-10">
                        {editLogo ? (
                          <img src={editLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Building className="w-6 h-6 text-primary-500/20" />
                        )}
                      </div>

                      {/* Information Section */}
                      <div className="p-6 pt-8 space-y-4 text-left">
                        <div>
                          <span className="text-[9px] text-primary-500 font-black uppercase tracking-widest">
                            {editDistrict || 'Westwood District'}
                          </span>
                          <h4 className="text-base font-black text-text-main mt-1 leading-snug truncate">
                            {editName || 'Westwood Smart Mall'}
                          </h4>
                          <p className="text-xs text-text-muted mt-2 font-medium leading-relaxed flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                            <span className="truncate">{editAddress || '104 Westwood Blvd, Los Angeles, CA'}</span>
                          </p>
                        </div>

                        {/* Mini Coordinates Badge */}
                        <div className="flex gap-4 text-[9px] font-black text-text-muted uppercase tracking-widest border-t border-border-main/50 pt-3">
                          <span>Lat: {editLat || '34.0522'}</span>
                          <span>Lng: {editLng || '-118.2437'}</span>
                        </div>

                        {/* Mini Gallery Showcase */}
                        {editGallery && editGallery.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Gallery Showcase</p>
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                              {editGallery.map((url, idx) => (
                                <div key={idx} className="w-8 h-8 rounded-lg overflow-hidden border border-border-main/50 shrink-0">
                                  <img src={url} alt={`Gallery Mini ${idx}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submission Actions */}
              <div className="flex justify-end gap-4 border-t border-border-main/50 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingMall(null)}
                  className="px-6 py-3.5 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-border-main"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10"
                >
                  Save Changes
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 3. USERS & RBAC TAB
const UsersTab = ({ users, malls, userInfo, onUpdateRole, onDelete, onBlockToggle, refetch }) => {
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dropdown & Modal states
  const [activeDropdownUserId, setActiveDropdownUserId] = useState(null);
  const [blockingUser, setBlockingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  
  // Edit Profile States
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('');

  // Handle Search and Filters
  const filteredUsers = useMemo(() => {
    return users?.filter(user => {
      const matchKeyword = user.name.toLowerCase().includes(keyword.toLowerCase()) || user.email.toLowerCase().includes(keyword.toLowerCase());
      const matchRole = roleFilter ? user.role === roleFilter : true;
      const matchStatus = statusFilter 
        ? (statusFilter === 'Blocked' ? user.isBlocked : !user.isBlocked)
        : true;
      return matchKeyword && matchRole && matchStatus;
    }) || [];
  }, [users, keyword, roleFilter, statusFilter]);

  const handleRoleChange = async (userId, role) => {
    try {
      await onUpdateRole({ id: userId, role }).unwrap();
      toast.success('User credentials updated successfully!');
      refetch();
    } catch (err) {
      toast.error('Failed to change user authorization');
    }
  };

  const handleToggleBlock = async (user) => {
    try {
      await onBlockToggle(user._id, !user.isBlocked);
      refetch();
    } catch (e) {
      toast.error('Block operation failed');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    try {
      await onDelete(userId).unwrap();
      toast.success('User account wiped successfully');
      refetch();
    } catch (err) {
      toast.error('Failed to remove user account');
    }
  };

  const handleStartEditUser = (user) => {
    setEditingUser(user);
    setEditUserName(user.name || '');
    setEditUserEmail(user.email || '');
    setEditUserRole(user.role || 'User');
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await onUpdateRole({
        id: editingUser._id,
        name: editUserName,
        email: editUserEmail,
        role: editUserRole
      }).unwrap();
      toast.success('User profile updated successfully!');
      setEditingUser(null);
      refetch();
    } catch (err) {
      toast.error('Failed to update user profile');
    }
  };

  return (
    <div className="space-y-8">
      {/* Search and filter header */}
      <div className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card shadow-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <input 
          type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
          placeholder="Search by name, email..."
        />
        <select 
          value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-muted cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="User">User</option>
          <option value="Staff">Staff</option>
          <option value="Shop Owner">Shop Owner</option>
          <option value="Mall Admin">Mall Admin</option>
          <option value="Super Admin">Super Admin</option>
        </select>
        <select 
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-muted cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active Users</option>
          <option value="Blocked">Blocked Users</option>
        </select>
      </div>

      {/* Users Grid */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl">
        <h3 className="text-base font-black text-text-main uppercase tracking-wider mb-6">User Database & Operations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-main text-primary-500 text-[10px] font-black uppercase tracking-widest">
                <th className="py-4 px-6">User Details</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Access Level</th>
                <th className="py-4 px-6">Platform Node</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50 text-xs font-bold text-text-main">
              {filteredUsers.map(user => {
                const userMall = malls?.find(m => m._id === (user.mall?._id || user.mall));
                
                return (
                  <tr key={user._id} className="hover:bg-bg-sub/40 transition-colors">
                    <td className="py-4 px-6 flex items-center space-x-3">
                      <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center font-black text-xs text-white overflow-hidden shadow-inner">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-text-main">{user.name}</p>
                        <p className={`text-[9px] font-black uppercase ${user.isBlocked ? 'text-red-500' : 'text-green-500'}`}>
                          {user.isBlocked ? 'Suspended' : 'Verified'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-text-muted">{user.email}</td>
                    <td className="py-4 px-6">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={user._id === userInfo?._id}
                        className="bg-bg-sub border border-border-main rounded-xl px-3 py-1.5 outline-none focus:ring-1 ring-primary-500 font-black text-[10px] text-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="User">User</option>
                        <option value="Staff">Staff</option>
                        <option value="Shop Owner">Shop Owner</option>
                        <option value="Mall Admin">Mall Admin</option>
                        <option value="Super Admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-text-muted">
                      {user.role === 'Staff' && user.department ? `${user.department} Dept` : ''}
                      {userMall ? `Mall: ${userMall.name}` : ''}
                      {!userMall && (!user.department || user.role !== 'Staff') ? 'Platform General' : ''}
                    </td>
                    <td className="py-4 px-6 text-right relative">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setActiveDropdownUserId(activeDropdownUserId === user._id ? null : user._id)}
                          className="p-2 hover:bg-bg-sub rounded-xl transition-colors text-text-muted hover:text-text-main cursor-pointer"
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {activeDropdownUserId === user._id && (
                            <>
                              {/* Backdrop click closer */}
                              <div 
                                className="fixed inset-0 z-40 cursor-default" 
                                onClick={() => setActiveDropdownUserId(null)}
                              />
                              
                              {/* Glassmorphic Dropdown Box */}
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-6 top-10 z-50 w-52 bg-bg-card/95 backdrop-blur-xl border border-border-main rounded-2xl shadow-2xl p-2 text-left space-y-1 overflow-hidden"
                              >
                                <div className="px-3.5 py-2 border-b border-border-main/50 mb-1">
                                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Account Control</p>
                                </div>

                                {/* Edit User Option */}
                                <button
                                  onClick={() => {
                                    setActiveDropdownUserId(null);
                                    handleStartEditUser(user);
                                  }}
                                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-text-main hover:bg-bg-sub transition-colors cursor-pointer"
                                >
                                  <SettingsIcon className="w-3.5 h-3.5 text-primary-500" />
                                  <span>Edit Profile</span>
                                </button>

                                {/* Reset Password Option */}
                                <button
                                  onClick={() => {
                                    setActiveDropdownUserId(null);
                                    setResettingUser(user);
                                  }}
                                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-text-main hover:bg-bg-sub transition-colors cursor-pointer"
                                >
                                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Reset Password</span>
                                </button>

                                {/* Block/Unblock Option */}
                                <button
                                  onClick={() => {
                                    setActiveDropdownUserId(null);
                                    setBlockingUser(user);
                                  }}
                                  disabled={user._id === userInfo?._id || user.role === 'Super Admin'}
                                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-text-main hover:bg-bg-sub transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {user.isBlocked ? (
                                    <>
                                      <Play className="w-3.5 h-3.5 text-green-500" />
                                      <span>Activate Account</span>
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Suspend Account</span>
                                    </>
                                  )}
                                </button>

                                <div className="border-t border-border-main/50 my-1 pt-1" />

                                {/* Delete Option */}
                                <button
                                  onClick={() => {
                                    setActiveDropdownUserId(null);
                                    setDeletingUser(user);
                                  }}
                                  disabled={user._id === userInfo?._id || user.role === 'Super Admin'}
                                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Wipe Account</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      <AnimatePresence>
        {blockingUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-card max-w-md w-full rounded-[2rem] border border-border-main p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-amber-500">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <h4 className="font-black text-base uppercase tracking-wider text-text-main">
                  {blockingUser.isBlocked ? 'Activate Account' : 'Suspend Account'}
                </h4>
              </div>
              <p className="text-xs text-text-muted leading-relaxed text-left">
                Are you sure you want to {blockingUser.isBlocked ? 're-activate' : 'temporarily suspend'} the credentials for <strong>{blockingUser.name}</strong> ({blockingUser.email})? 
                {!blockingUser.isBlocked && " Suspended users will be immediately locked out of all Mall nodes and the payment hub."}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setBlockingUser(null)}
                  className="px-5 py-2.5 bg-bg-sub hover:bg-bg-sub/80 border border-border-main rounded-xl text-[10px] font-black uppercase tracking-widest text-text-main cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleToggleBlock(blockingUser);
                    setBlockingUser(null);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg cursor-pointer ${
                    blockingUser.isBlocked
                      ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20'
                      : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  }`}
                >
                  Confirm Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Wipe Account Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-card max-w-md w-full rounded-[2rem] border border-border-main p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-red-500">
                <Trash2 className="w-6 h-6 animate-bounce" />
                <h4 className="font-black text-base uppercase tracking-wider text-text-main">Wipe Out Account</h4>
              </div>
              <p className="text-xs text-text-muted leading-relaxed text-left">
                You are about to permanently and irreversibly wipe out the account for <strong>{deletingUser.name}</strong> ({deletingUser.email}). All user configurations, transaction history, and associated nodes will be instantly purged from the cluster.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="px-5 py-2.5 bg-bg-sub hover:bg-bg-sub/80 border border-border-main rounded-xl text-[10px] font-black uppercase tracking-widest text-text-main cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleDeleteUser(deletingUser._id, deletingUser.name);
                    setDeletingUser(null);
                  }}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white cursor-pointer"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Simulation Modal */}
      <AnimatePresence>
        {resettingUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-card max-w-md w-full rounded-[2rem] border border-border-main p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-blue-500">
                <Lock className="w-6 h-6" />
                <h4 className="font-black text-base uppercase tracking-wider text-text-main">Reset User Password</h4>
              </div>
              <p className="text-xs text-text-muted leading-relaxed text-left">
                Confirm resetting the password for <strong>{resettingUser.name}</strong>. A secure temporary password link will be generated or dispatched.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setResettingUser(null)}
                  className="px-5 py-2.5 bg-bg-sub hover:bg-bg-sub/80 border border-border-main rounded-xl text-[10px] font-black uppercase tracking-widest text-text-main cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success(`Password reset dispatch completed successfully for ${resettingUser.name}!`);
                    setResettingUser(null);
                  }}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white cursor-pointer"
                >
                  Reset Password
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl">
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleEditUserSubmit}
              className="bg-bg-card max-w-lg w-full rounded-[2.5rem] border border-border-main p-8 shadow-2xl space-y-6 text-left relative"
            >
              <div className="flex items-center justify-between border-b border-border-main pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-500 font-bold">
                    👤
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-text-main">Edit User Profile</h3>
                    <p className="text-xs text-text-muted">Modify access levels, account names, and permissions</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)} 
                  className="p-2 hover:bg-bg-sub rounded-full transition-colors text-text-muted hover:text-text-main"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Full Name</label>
                  <input 
                    type="text" 
                    value={editUserName} 
                    onChange={e => setEditUserName(e.target.value)} 
                    required
                    className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Email Address</label>
                  <input 
                    type="email" 
                    value={editUserEmail} 
                    onChange={e => setEditUserEmail(e.target.value)} 
                    required
                    className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Access Level / Role</label>
                  <select
                    value={editUserRole}
                    onChange={e => setEditUserRole(e.target.value)}
                    disabled={editingUser._id === userInfo?._id}
                    className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="User">User</option>
                    <option value="Staff">Staff</option>
                    <option value="Shop Owner">Shop Owner</option>
                    <option value="Mall Admin">Mall Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border-main/50 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-6 py-3 bg-bg-sub hover:bg-bg-sub/80 border border-border-main rounded-xl text-[10px] font-black uppercase tracking-widest text-text-main cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/10 cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 4. SHOPS TAB
const ShopsTab = ({ shops, onUpdateStatus, onDelete, refetch }) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredShops = useMemo(() => {
    return shops?.filter(shop => {
      const matchKeyword = shop.name.toLowerCase().includes(keyword.toLowerCase());
      const matchStatus = statusFilter ? shop.status === statusFilter : true;
      return matchKeyword && matchStatus;
    }) || [];
  }, [shops, keyword, statusFilter]);

  const handleStatusChange = async (shopId, newStatus) => {
    try {
      await onUpdateStatus({ id: shopId, status: newStatus }).unwrap();
      toast.success(`Shop status set to ${newStatus}`);
      refetch();
    } catch (e) {
      toast.error('Failed to change shop status');
    }
  };

  const handleToggleFeatured = async (shopId, currentFeatured) => {
    try {
      await onUpdateStatus({ id: shopId, isFeatured: !currentFeatured }).unwrap();
      toast.success(`Shop ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
      refetch();
    } catch (e) {
      toast.error('Failed to toggle featured status');
    }
  };

  const handleDeleteShop = async (shopId, name) => {
    if (window.confirm(`Permanently remove shop "${name}"? all products of this shop will be orphan.`)) {
      try {
        await onDelete(shopId).unwrap();
        toast.success('Shop removed successfully');
        refetch();
      } catch (e) {
        toast.error('Failed to remove shop');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card shadow-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <input 
          type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
          placeholder="Search shops by brand name..."
        />
        <select 
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-muted cursor-pointer"
        >
          <option value="">All Shop Statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending Approval</option>
          <option value="Suspended">Suspended</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl">
        <h3 className="text-base font-black text-text-main uppercase tracking-wider mb-6">Shop Approvals & Moderation</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-main text-primary-500 text-[10px] font-black uppercase tracking-widest">
                <th className="py-4 px-6">Brand / Shop</th>
                <th className="py-4 px-6">Smart Mall</th>
                <th className="py-4 px-6">Floor & Category</th>
                <th className="py-4 px-6">Premium Featured</th>
                <th className="py-4 px-6">Operation status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50 text-xs font-bold text-text-main">
              {filteredShops.map(shop => (
                <tr key={shop._id} className="hover:bg-bg-sub/40 transition-colors">
                  <td className="py-4 px-6 flex items-center space-x-3">
                    <div className="w-9 h-9 bg-bg-sub rounded-xl flex items-center justify-center font-black text-xs overflow-hidden border border-border-main shadow-inner">
                      {shop.image ? <img src={shop.image} className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-primary-500" />}
                    </div>
                    <span>{shop.name}</span>
                  </td>
                  <td className="py-4 px-6 text-text-muted">{shop.mall?.name || 'Unassigned'}</td>
                  <td className="py-4 px-6 text-text-muted">
                    {shop.floor || 'G Floor'} • <span className="text-[10px] font-black uppercase text-primary-400">{shop.category}</span>
                  </td>
                  <td className="py-4 px-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" checked={shop.isFeatured || false} 
                        onChange={() => handleToggleFeatured(shop._id, shop.isFeatured)}
                        className="w-4 h-4 rounded border-border-main text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Premium</span>
                    </label>
                  </td>
                  <td className="py-4 px-6">
                    <select 
                      value={shop.status || 'Active'} 
                      onChange={(e) => handleStatusChange(shop._id, e.target.value)}
                      className={`bg-bg-sub border border-border-main rounded-xl px-2.5 py-1.5 outline-none font-black text-[10px] cursor-pointer ${
                        shop.status === 'Active' ? 'text-green-500' :
                        shop.status === 'Pending' ? 'text-amber-500 animate-pulse' :
                        'text-red-500'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending Approval</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => handleDeleteShop(shop._id, shop.name)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-[10px] font-black rounded-xl border border-red-500/20 transition-all"
                    >
                      Shut Shop
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 5. PRODUCTS TAB
const ProductsTab = ({ products, onUpdateStatus, onDelete, refetch }) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredProducts = useMemo(() => {
    return products?.filter(prod => {
      const matchKeyword = prod.name.toLowerCase().includes(keyword.toLowerCase());
      const matchStatus = statusFilter ? prod.status === statusFilter : true;
      return matchKeyword && matchStatus;
    }) || [];
  }, [products, keyword, statusFilter]);

  const handleToggleHide = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Hidden' ? 'Active' : 'Hidden';
    try {
      await onUpdateStatus({ id, status: nextStatus }).unwrap();
      toast.success(`Product is now ${nextStatus === 'Hidden' ? 'hidden from shoppers' : 'published'}`);
      refetch();
    } catch (e) {
      toast.error('Moderation operation failed');
    }
  };

  const handleToggleSuspend = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
    try {
      await onUpdateStatus({ id, status: nextStatus }).unwrap();
      toast.success(`Product is now ${nextStatus === 'Suspended' ? 'suspended' : 'active'}`);
      refetch();
    } catch (e) {
      toast.error('Moderation operation failed');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Delete product "${name}" permanently?`)) {
      try {
        await onDelete(id).unwrap();
        toast.success('Product wiped out successfully');
        refetch();
      } catch (e) {
        toast.error('Wipe operation failed');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card shadow-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <input 
          type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
          placeholder="Search products by tag or name..."
        />
        <select 
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-muted cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Hidden">Hidden</option>
          <option value="Suspended">Suspended</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Grid */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl">
        <h3 className="text-base font-black text-text-main uppercase tracking-wider mb-6">Product Moderation Grid</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(prod => (
            <div key={prod._id} className="bg-bg-sub border border-border-main rounded-3xl p-5 flex flex-col justify-between space-y-4 group">
              <div>
                <div className="h-32 bg-bg-card border border-border-main rounded-2xl overflow-hidden flex items-center justify-center relative">
                  {prod.image ? (
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-primary-500/20" />
                  )}
                  <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider border ${
                    prod.status === 'Active' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                    prod.status === 'Hidden' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                    'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    {prod.status}
                  </span>
                </div>
                <div className="space-y-1 mt-4">
                  <span className="text-[9px] text-primary-500 font-black uppercase tracking-widest">{prod.category}</span>
                  <h4 className="font-bold text-sm text-text-main leading-tight truncate">{prod.name}</h4>
                  <p className="text-xs text-text-muted font-bold">${prod.price}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-border-main/50">
                <button
                  onClick={() => handleToggleHide(prod._id, prod.status)}
                  className={`flex-1 py-2 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                    prod.status === 'Hidden'
                      ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white'
                  }`}
                >
                  {prod.status === 'Hidden' ? 'Publish' : 'Censor'}
                </button>
                <button
                  onClick={() => handleToggleSuspend(prod._id, prod.status)}
                  className={`flex-1 py-2 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                    prod.status === 'Suspended'
                      ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'
                      : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  {prod.status === 'Suspended' ? 'Reinstate' : 'Ban'}
                </button>
                <button
                  onClick={() => handleDeleteProduct(prod._id, prod.name)}
                  className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 6. OFFERS TAB
const OffersTab = ({ offers, onUpdateStatus, onDelete, refetch }) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredOffers = useMemo(() => {
    return offers?.filter(off => {
      const matchKeyword = off.title.toLowerCase().includes(keyword.toLowerCase()) || off.couponCode?.toLowerCase().includes(keyword.toLowerCase());
      const matchStatus = statusFilter ? off.status === statusFilter : true;
      return matchKeyword && matchStatus;
    }) || [];
  }, [offers, keyword, statusFilter]);

  const handleStatusChange = async (offerId, newStatus) => {
    try {
      await onUpdateStatus({ id: offerId, status: newStatus }).unwrap();
      toast.success(`Offer status successfully set to ${newStatus}`);
      refetch();
    } catch (e) {
      toast.error('Moderation operation failed');
    }
  };

  const handleToggleFeatured = async (offerId, currentFeatured) => {
    try {
      await onUpdateStatus({ id: offerId, isFeatured: !currentFeatured }).unwrap();
      toast.success(`Offer homepage placement toggled successfully`);
      refetch();
    } catch (e) {
      toast.error('Failed to change homepage placement');
    }
  };

  const handleDeleteOffer = async (id, title) => {
    if (window.confirm(`Remove promotion offer "${title}" from the platform?`)) {
      try {
        await onDelete(id).unwrap();
        toast.success('Offer removed successfully');
        refetch();
      } catch (e) {
        toast.error('Failed to delete offer');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card shadow-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <input 
          type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
          placeholder="Search offers or coupon codes..."
        />
        <select 
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-muted cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Under Review">Under Review</option>
          <option value="Rejected">Rejected</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {/* Grid */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl">
        <h3 className="text-base font-black text-text-main uppercase tracking-wider mb-6">Offers & Promotion Vouchers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-main text-primary-500 text-[10px] font-black uppercase tracking-widest">
                <th className="py-4 px-6">Offer / Promo Title</th>
                <th className="py-4 px-6">Coupon Code</th>
                <th className="py-4 px-6">Target Mall</th>
                <th className="py-4 px-6">Featured Placement</th>
                <th className="py-4 px-6">Approval Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50 text-xs font-bold text-text-main">
              {filteredOffers.map(off => (
                <tr key={off._id} className="hover:bg-bg-sub/40 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-bold text-text-main">{off.title}</p>
                      <p className="text-[9px] text-text-muted">{off.discountPercentage}% Discount • {off.offerType}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-primary-500 uppercase">{off.couponCode || 'N/A'}</td>
                  <td className="py-4 px-6 text-text-muted">{(off.mall?.name || off.mall) || 'Platform'}</td>
                  <td className="py-4 px-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" checked={off.isFeatured || false} 
                        onChange={() => handleToggleFeatured(off._id, off.isFeatured)}
                        className="w-4 h-4 rounded border-border-main text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Featured</span>
                    </label>
                  </td>
                  <td className="py-4 px-6">
                    <select 
                      value={off.status || 'Active'} 
                      onChange={(e) => handleStatusChange(off._id, e.target.value)}
                      className={`bg-bg-sub border border-border-main rounded-xl px-2.5 py-1.5 outline-none font-black text-[10px] cursor-pointer ${
                        off.status === 'Active' ? 'text-green-500' :
                        off.status === 'Under Review' ? 'text-amber-500 animate-pulse' :
                        'text-red-500'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => handleDeleteOffer(off._id, off.title)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-[10px] font-black rounded-xl border border-red-500/20 transition-all"
                    >
                      Vanish Offer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 7. OPERATIONS TAB (PARKING, QUEUE, RESTROOM MONITORING)
const OperationsTab = ({ ops, malls, loading, refetch }) => {
  if (loading) return <div className="animate-pulse h-96 bg-bg-sub rounded-3xl" />;

  return (
    <div className="space-y-8">
      {/* Headline */}
      <div className="flex justify-between items-center bg-bg-card p-6 rounded-[2rem] border border-border-main shadow-lg">
        <div>
          <h2 className="text-xl font-black text-text-main flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500 animate-pulse" /> Live Infrastructure Operations
          </h2>
          <p className="text-xs text-text-muted mt-1">Consolidated active monitors for Mall Parking levels, virtual billing queues, and restrooms cleanliness.</p>
        </div>
        <button 
          onClick={refetch}
          className="flex items-center gap-2 px-5 py-2.5 bg-bg-sub border border-border-main text-text-main rounded-xl text-xs font-bold uppercase transition-all hover:border-primary-500/40"
        >
          <RefreshCw className="w-4 h-4 animate-spin" /> Live Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* A. PARKING SYSTEM MONITOR */}
        <div className="glass-card p-6 rounded-[2.2rem] border border-border-main bg-bg-card shadow-xl space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-border-main">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-500 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-text-main uppercase">Parking System Occupancy</h4>
              <p className="text-[10px] text-text-muted">Live occupied levels per complex</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {ops?.parking?.map((park, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-text-main">
                  <span>{park.mall.name}</span>
                  <span className="text-sky-500 font-black">{park.occupancyRate}%</span>
                </div>
                <div className="h-3 bg-bg-sub border border-border-main rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full transition-all duration-500" 
                    style={{ width: `${park.occupancyRate}%` }} 
                  />
                </div>
                <p className="text-[10px] text-text-muted">{park.availableSlots} slots available of {park.totalSlots} total</p>
              </div>
            ))}
            {(!ops?.parking || ops.parking.length === 0) && (
              <p className="text-xs text-text-muted italic text-center py-6">No parking grids online.</p>
            )}
          </div>
        </div>

        {/* B. VIRTUAL QUEUE MONITOR */}
        <div className="glass-card p-6 rounded-[2.2rem] border border-border-main bg-bg-card shadow-xl space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-border-main">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-text-main uppercase">Billing Queues & Counters</h4>
              <p className="text-[10px] text-text-muted">Active waiting shopper lines</p>
            </div>
          </div>

          <div className="space-y-4">
            {ops?.queues?.map((q, idx) => (
              <div key={idx} className="bg-bg-sub border border-border-main rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-purple-500 font-black uppercase">{q.type}</span>
                    <h5 className="font-bold text-xs text-text-main">{q.shop?.name || 'Customer Billing Counter'}</h5>
                  </div>
                  <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-[8px] font-black uppercase">
                    {q.status}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-text-muted font-bold">
                  <span>Shopper: {q.user?.name}</span>
                  <span className="text-purple-500">Token #{q.tokenNumber}</span>
                </div>
                <p className="text-[9px] text-text-muted">Assigned Cashier: {q.staff?.name || 'Self Billing Auto Counter'}</p>
              </div>
            ))}
            {(!ops?.queues || ops.queues.length === 0) && (
              <p className="text-xs text-text-muted italic text-center py-6">No virtual queues active right now.</p>
            )}
          </div>
        </div>

        {/* C. RESTROOMS CLEANLINESS MONITOR */}
        <div className="glass-card p-6 rounded-[2.2rem] border border-border-main bg-bg-card shadow-xl space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-border-main">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-text-main uppercase">Restrooms Inspection</h4>
              <p className="text-[10px] text-text-muted">Hygiene status logs</p>
            </div>
          </div>

          <div className="space-y-4">
            {ops?.restrooms?.map((res, idx) => (
              <div key={idx} className="bg-bg-sub border border-border-main rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-text-main">{res.mall?.name} • {res.floor}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    res.status === 'Clean' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                    res.status === 'Needs Cleaning' ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' :
                    'bg-bg-sub text-text-muted border border-border-main'
                  }`}>
                    {res.status}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted">Location: {res.location} ({res.gender})</p>
                <div className="flex justify-between items-center pt-2 border-t border-border-main/50 text-[9px] text-text-muted">
                  <span>Assigned Custodian: {res.staff?.name || 'None Assigned'}</span>
                  <span>Rating: ⭐{res.averageRating || '4.8'}</span>
                </div>
              </div>
            ))}
            {(!ops?.restrooms || ops.restrooms.length === 0) && (
              <p className="text-xs text-text-muted italic text-center py-6">No hygiene tracking online.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// 8. ANNOUNCEMENTS TAB
const AnnouncementsTab = ({ malls, refetch }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('General');
  const [mallId, setMallId] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  const [sendAnnouncement, { isLoading: sending }] = useSendAnnouncementMutation();

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Announcements must contain title and message details');
      return;
    }
    if (isEmergency && !mallId) {
      toast.error('Emergency lockdowns require specifying a Target Mall node');
      return;
    }

    try {
      await sendAnnouncement({
        title,
        message,
        type,
        isEmergency,
        mallId: mallId || undefined
      }).unwrap();
      
      toast.success(isEmergency ? '⚠️ Emergency Lockdown Alert broadcasted!' : '📢 Global announcement transmitted!');
      setTitle(''); setMessage(''); setType('General'); setMallId(''); setIsEmergency(false);
      if (refetch) refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Broadcast execution failed');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Composer */}
      <form 
        onSubmit={handleBroadcast} 
        className={`glass-card p-8 rounded-[2.5rem] border bg-bg-card shadow-2xl space-y-6 transition-all duration-300 ${
          isEmergency ? 'border-red-500/50 shadow-red-500/10' : 'border-border-main'
        }`}
      >
        <div className="flex items-center space-x-3 border-b border-border-main pb-4">
          <div className={`p-3 rounded-xl ${isEmergency ? 'bg-red-500/20 text-red-500' : 'bg-primary-500/20 text-primary-500'}`}>
            <Bell className={`w-6 h-6 ${isEmergency ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h3 className={`text-xl font-black uppercase ${isEmergency ? 'text-red-500' : 'text-text-main'}`}>
              {isEmergency ? '⚠️ Emergency Siren alert Broadcast' : '📢 Platform Alerts Transmitter'}
            </h3>
            <p className="text-xs text-text-muted">Transmit notifications immediately to customer applications and digital signs.</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4 items-center bg-bg-sub border border-border-main rounded-2xl p-4">
          <label className="flex items-center space-x-2 cursor-pointer font-bold text-xs">
            <input 
              type="checkbox" checked={isEmergency} onChange={e => setIsEmergency(e.target.checked)}
              className="w-4 h-4 rounded border-border-main text-red-600 focus:ring-red-500"
            />
            <span className={isEmergency ? 'text-red-500 font-black' : 'text-text-muted'}>
              🚨 HIGH PRIORITY EMERGENCY
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Broadcast Title</label>
            <input 
              type="text" value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
              placeholder={isEmergency ? 'e.g. Fire alarm lockdown' : 'e.g. Festival sales are live!'}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Target Mall Complex</label>
            <select 
              value={mallId} onChange={e => setMallId(e.target.value)}
              className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-muted cursor-pointer"
            >
              <option value="">All Malls (Global Broadcast)</option>
              {malls?.map(mall => (
                <option key={mall._id} value={mall._id}>{mall.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Alert Message Details</label>
            <textarea 
              value={message} onChange={e => setMessage(e.target.value)} required rows="4"
              className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
              placeholder="State evacuation instructions or promotional deal terms clearly..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" disabled={sending}
            className={`px-8 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${
              isEmergency 
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-500/20' 
                : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 shadow-primary-500/20'
            }`}
          >
            {sending ? 'Transmitting...' : (isEmergency ? 'Broadcast SIREN Lockdown' : 'Dispatch Alert')}
          </button>
        </div>
      </form>
    </div>
  );
};

// 9. AUDIT LOGS TAB
const AuditLogsTab = ({ logs, loading, refetch }) => {
  const [keyword, setKeyword] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filteredLogs = useMemo(() => {
    return logs?.filter(log => {
      const matchKeyword = log.details.toLowerCase().includes(keyword.toLowerCase()) || log.user?.name.toLowerCase().includes(keyword.toLowerCase());
      const matchAction = actionFilter ? log.action === actionFilter : true;
      return matchKeyword && matchAction;
    }) || [];
  }, [logs, keyword, actionFilter]);

  if (loading) return <div className="animate-pulse h-96 bg-bg-sub rounded-3xl" />;

  const uniqueActions = ['LOGIN', 'CREATE_MALL', 'UPDATE_SHOP_STATUS', 'MODERATE_PRODUCT', 'MODERATE_OFFER', 'UPDATE_SETTINGS', 'GLOBAL_ANNOUNCEMENT', 'EMERGENCY_ALERT'];

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card shadow-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <input 
          type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-main"
          placeholder="Search logs by action or user name..."
        />
        <select 
          value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-xl py-3 px-4 outline-none focus:ring-1 ring-primary-500 text-xs font-bold text-text-muted cursor-pointer"
        >
          <option value="">All Action Types</option>
          {uniqueActions.map((act, idx) => (
            <option key={idx} value={act}>{act}</option>
          ))}
        </select>
      </div>

      {/* Log Feed */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl">
        <h3 className="text-base font-black text-text-main uppercase tracking-wider mb-6 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary-500" /> Platform Security & Audit Trail
        </h3>
        <div className="overflow-y-auto max-h-[500px] space-y-4 pr-2 scrollbar-thin">
          {filteredLogs.map(log => (
            <div key={log._id} className="p-4 bg-bg-sub border border-border-main rounded-2xl flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    log.action === 'LOGIN' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                    log.action.includes('EMERGENCY') ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    'bg-green-500/10 text-green-500 border border-green-500/20'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-[10px] text-text-muted font-bold">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs font-bold text-text-main">{log.details}</p>
                <div className="flex items-center space-x-4 text-[9px] text-text-muted font-bold">
                  <span>Audited Operator: {log.user?.name || 'Platform Node'} ({log.user?.role || 'Guest'})</span>
                  <span>IP: {log.ipAddress || 'Internal Loopback'}</span>
                </div>
              </div>
              <div className="p-2 bg-bg-card border border-border-main rounded-lg text-[9px] text-text-muted font-bold font-mono shrink-0">
                {log.userAgent ? log.userAgent.split(' ')[0] : 'System API'}
              </div>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <p className="text-center text-xs text-text-muted italic py-12">No security audit logs match search criteria.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// 10. SETTINGS TAB
const SettingsTab = ({ settings, onUpdate, refetch }) => {
  const [appName, setAppName] = useState(settings?.appName || 'Smart Mall Platform');
  const [systemStatus, setSystemStatus] = useState(settings?.systemStatus || 'Online');
  
  // Toggles
  const [parkingActive, setParkingActive] = useState(settings?.featureToggles?.parkingSystem ?? true);
  const [queueActive, setQueueActive] = useState(settings?.featureToggles?.queueSystem ?? true);
  const [restroomActive, setRestroomActive] = useState(settings?.featureToggles?.restroomSystem ?? true);
  const [offersActive, setOffersActive] = useState(settings?.featureToggles?.offersSystem ?? true);
  
  // Theme state
  const [primaryColor, setPrimaryColor] = useState(settings?.themeSettings?.primaryColor || '#6366f1');

  const [updateSettings, { isLoading: saving }] = onUpdate();

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({
        appName,
        systemStatus,
        featureToggles: {
          parkingSystem: parkingActive,
          queueSystem: queueActive,
          restroomSystem: restroomActive,
          offersSystem: offersActive
        },
        themeSettings: {
          primaryColor,
          defaultTheme: 'dark'
        }
      }).unwrap();
      toast.success('System settings re-configured successfully!');
      refetch();
    } catch (e) {
      toast.error('Failed to configure platform settings');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <form onSubmit={handleSaveSettings} className="glass-card p-8 rounded-[2.5rem] border border-border-main bg-bg-card shadow-2xl space-y-8">
        <div className="flex items-center space-x-3 border-b border-border-main pb-4">
          <div className="p-3 bg-primary-500/20 text-primary-500 rounded-xl">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main uppercase">Global Configurations & Feature Toggles</h3>
            <p className="text-xs text-text-muted">Manage real-time features, API parameters, and system operation status.</p>
          </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Platform Title Name</label>
            <input 
              type="text" value={appName} onChange={e => setAppName(e.target.value)} required
              className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Platform Nodes Status</label>
            <select 
              value={systemStatus} onChange={e => setSystemStatus(e.target.value)} required
              className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main cursor-pointer"
            >
              <option value="Online">Online (Operational)</option>
              <option value="Maintenance">Maintenance Lockdown</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-4 pt-4 border-t border-border-main/50">
          <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Modular Feature Toggles</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 bg-bg-sub border border-border-main rounded-2xl cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-text-main">Smart Parking Grids</span>
                <p className="text-[9px] text-text-muted">ANPR tracking and vacancy levels online</p>
              </div>
              <input 
                type="checkbox" checked={parkingActive} onChange={e => setParkingActive(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-border-main"
              />
            </label>
            <label className="flex items-center justify-between p-4 bg-bg-sub border border-border-main rounded-2xl cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-text-main">Virtual Queues Balancer</span>
                <p className="text-[9px] text-text-muted">Live SMS counters and virtual tokens active</p>
              </div>
              <input 
                type="checkbox" checked={queueActive} onChange={e => setQueueActive(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-border-main"
              />
            </label>
            <label className="flex items-center justify-between p-4 bg-bg-sub border border-border-main rounded-2xl cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-text-main">Restrooms Hygiene Metrics</span>
                <p className="text-[9px] text-text-muted">QR feedback complaints and cleaning intervals</p>
              </div>
              <input 
                type="checkbox" checked={restroomActive} onChange={e => setRestroomActive(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-border-main"
              />
            </label>
            <label className="flex items-center justify-between p-4 bg-bg-sub border border-border-main rounded-2xl cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-text-main">Tenant Offer Campaign Slices</span>
                <p className="text-[9px] text-text-muted">Promotional vouchers and redemption engines</p>
              </div>
              <input 
                type="checkbox" checked={offersActive} onChange={e => setOffersActive(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-border-main"
              />
            </label>
          </div>
        </div>

        {/* Themes and Styling */}
        <div className="space-y-4 pt-4 border-t border-border-main/50">
          <h4 className="text-xs font-black text-text-main uppercase tracking-wider">HSL Tailwind Theme Palettes</h4>
          <div className="flex space-x-4">
            {['#6366f1', '#a855f7', '#10b981', '#0ea5e9'].map(col => (
              <button
                key={col} type="button" onClick={() => setPrimaryColor(col)}
                className={`w-10 h-10 rounded-full border-2 transition-transform ${
                  primaryColor === col ? 'scale-110 border-white shadow-lg' : 'border-transparent'
                }`}
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" disabled={saving}
            className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10"
          >
            {saving ? 'Saving...' : 'Deploy Global Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

// HELPER STATE CARD COMPONENT
const StatCard = ({ title, value, icon }) => (
  <div className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card shadow-xl flex items-center justify-between">
    <div className="space-y-1">
      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-text-main">{value}</h3>
    </div>
    <div className="p-3 bg-bg-sub border border-border-main rounded-xl">
      {icon}
    </div>
  </div>
);

const OpButton = ({ label, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 bg-bg-sub hover:bg-bg-sub/80 border border-border-main hover:border-primary-500/40 rounded-2xl transition-all space-y-2 group shadow-sm text-center"
  >
    <div className="p-3 bg-bg-card border border-border-main rounded-xl shadow-inner group-hover:scale-105 transition-transform">
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-wider text-text-main">{label}</span>
  </button>
);
