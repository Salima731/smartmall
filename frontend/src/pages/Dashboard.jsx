import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { 
  useUpdateProfileMutation, 
  useGetUsersQuery, 
  useGetProfileQuery,
  useUpdateUserRoleMutation, 
  useDeleteUserMutation,
  useCreateStaffMutation,
  useUpdateStaffDepartmentMutation
} from '../features/auth/authApiSlice';
import { 
  useUpdateShopMutation, 
  useGetShopByIdQuery,
  useGetShopsByMallQuery,
  useGetMyShopQuery
} from '../features/shops/shopApiSlice';
import { 
  useGetMallsQuery, 
  useCreateMallMutation, 
  useUpdateMallMutation, 
  useDeleteMallMutation 
} from '../features/malls/mallApiSlice';
import { toast } from 'react-toastify';
import { useGetProductsByShopQuery, useGetProductsByMallQuery } from '../features/products/productApiSlice';
import { useGetOffersQuery } from '../features/offers/offerApiSlice';
import { useGetShopOrdersQuery } from '../features/orders/orderApiSlice';
import { useGetMyParkingHistoryQuery, useGetParkingStatsQuery } from '../features/parking/parkingApiSlice';
import { useGetComplaintsQuery } from '../features/complaints/complaintApiSlice';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '../features/notifications/notificationApiSlice';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Car, 
  Users, 
  Settings, 
  Bell, 
  Plus, 
  BarChart3,
  Store,
  Map,
  Tag,
  ShieldCheck,
  Building,
  UploadCloud,
  Lock,
  Mail,
  User,
  Loader2,
  Check,
  Star,
  AlertOctagon,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import EmergencyAlertBanner from '../components/EmergencyAlertBanner';
import { SuperAdminDashboard } from '../components/SuperAdminDashboard';

// Lazy loading heavy management modules for optimized bundle splitting
const ParkingManager = lazy(() => import('../components/ParkingManager'));

const ProductManager = lazy(() => import('../components/ProductManager'));
const RestroomManager = lazy(() => import('../components/RestroomManager'));
const OfferManager = lazy(() => import('../components/OfferManager'));
const ShopManager = lazy(() => import('../components/ShopManager'));
const AuditLogManager = lazy(() => import('../components/AuditLogManager'));
const ReviewManager = lazy(() => import('../components/ReviewManager'));
const ComplaintManager = lazy(() => import('../components/ComplaintManager'));
const OrderManager = lazy(() => import('../components/OrderManager'));
const CrowdDensityMonitor = lazy(() => import('../components/CrowdDensityMonitor'));

const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[2.5rem] border border-border-main space-y-4 shadow-xl bg-bg-card">
    <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
    <p className="text-xs font-black uppercase tracking-widest text-text-muted">Loading Management Module...</p>
  </div>
);

const QuickActionModal = ({ userInfo, onClose, onSelectTab }) => {
  const getActions = () => {
    switch (userInfo?.role) {
      case 'Super Admin':
        return [
          { label: 'Register New Mall', tab: 'Malls', icon: Map, desc: 'Deploy a new retail center' },
          { label: 'Register New Shop', tab: 'Shops', icon: Store, desc: 'Add a store to the platform' },
          { label: 'Create User Account', tab: 'Users', icon: Users, desc: 'Provision a new administrative or owner account' },
        ];
      case 'Mall Admin':
        return [
          { label: 'Register New Shop', tab: 'Shops', icon: Store, desc: 'Onboard a new shop to your mall' },
          { label: 'Moderate Products', tab: 'Products', icon: ShoppingBag, desc: 'Review active store inventory' },
          { label: 'Manage Offers', tab: 'Offers', icon: Tag, desc: 'Create and verify promotional campaigns' },
          { label: 'Parking Operations', tab: 'Parking', icon: Car, desc: 'Check smart parking slots' },
        ];
      case 'Shop Owner':
        return [
          { label: 'Add New Product', tab: 'Products', icon: ShoppingBag, desc: 'List new inventory items in your store' },
          { label: 'Create Discount Offer', tab: 'Offers', icon: Tag, desc: 'Launch a promotional voucher or flash sale' },
          { label: 'Manage Food Orders', tab: 'Orders', icon: ShoppingBag, desc: 'View and fulfill active food orders' },
        ];
      case 'Staff':
        if (userInfo?.department === 'Parking') {
          return [
            { label: 'Parking Management', tab: 'Parking', icon: Car, desc: 'Monitor vehicle entry and exit' },
          ];
        }
        if (userInfo?.department === 'Restrooms') {
          return [
            { label: 'Restroom Inspection', tab: 'Restrooms', icon: Building, desc: 'Update cleanliness and maintenance status' },
          ];
        }
        // General / Unassigned
        return [
          { label: 'Parking Management', tab: 'Parking', icon: Car, desc: 'Monitor vehicle entry and exit' },
          { label: 'Restroom Inspection', tab: 'Restrooms', icon: Building, desc: 'Update cleanliness and maintenance status' },
        ];
      default:
        return [
          { label: 'View Profile Settings', tab: 'Settings', icon: Settings, desc: 'Update your personal credentials' },
          { label: 'Check Notifications', tab: 'Notifications', icon: Bell, desc: 'View latest system alerts' },
        ];
    }
  };

  const actions = getActions();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-bg-card w-full max-w-2xl rounded-[2.5rem] border border-border-main shadow-2xl p-8 space-y-6 relative"
      >
        <div className="flex items-center justify-between border-b border-border-main pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-500 font-bold">
              ⚡
            </div>
            <div>
              <h3 className="text-xl font-black text-text-main">Quick Action Center</h3>
              <p className="text-xs text-text-muted">Instantly jump to key administrative workflows</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-full transition-colors text-text-muted hover:text-text-main">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((act, idx) => (
            <motion.button 
              key={idx}
              whileHover={{ y: -4 }}
              onClick={() => { onSelectTab(act.tab); onClose(); }}
              className="p-6 bg-bg-sub border border-border-main hover:border-primary-500/50 rounded-2xl flex flex-col items-start text-left space-y-3 group transition-all shadow-md"
            >
              <div className="p-3 bg-primary-500/10 rounded-xl group-hover:bg-primary-500 group-hover:text-white text-primary-500 transition-colors border border-primary-500/20 shadow-sm">
                <act.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-base text-text-main group-hover:text-primary-500 transition-colors">{act.label}</h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">{act.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="pt-4 border-t border-border-main flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-border-main">
            Close Center
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: profileData } = useGetProfileQuery(undefined, { skip: !userInfo });
  const { data: myShopData } = useGetMyShopQuery(undefined, {
    skip: userInfo?.role !== 'Shop Owner' || !!userInfo?.shop,
  });

  useEffect(() => {
    if (profileData && userInfo && profileData._id === userInfo._id) {
      const getId = (value) => (value?._id || value || '').toString();
      const getListSignature = (value) => (value || []).join('|');
      const profileSignature = [
        getId(profileData.mall),
        getId(profileData.shop),
        profileData.department || '',
        getListSignature(profileData.vehicleNumbers),
      ].join('::');
      const userSignature = [
        getId(userInfo.mall),
        getId(userInfo.shop),
        userInfo.department || '',
        getListSignature(userInfo.vehicleNumbers),
      ].join('::');

      if (profileSignature !== userSignature) {
        dispatch(setCredentials({ ...userInfo, ...profileData }));
      }
    }
  }, [
    profileData,
    userInfo?._id,
    userInfo?.mall,
    userInfo?.shop,
    userInfo?.department,
    userInfo?.vehicleNumbers,
    dispatch,
  ]);

  useEffect(() => {
    if (myShopData && userInfo && userInfo.role === 'Shop Owner' && !userInfo.shop) {
      dispatch(setCredentials({
        ...userInfo,
        shop: myShopData._id,
        mall: myShopData.mall?._id || myShopData.mall || userInfo.mall,
      }));
    }
  }, [myShopData, userInfo, dispatch]);

  // Staff: default landing tab is their assigned department
  const getDefaultTab = () => {
    const urlTab = searchParams.get('tab');
    if (urlTab) {
      if (userInfo?.role === 'Staff' && userInfo?.department && userInfo?.department !== 'General') {
        const allowedTabs = [userInfo.department, 'Settings', 'Complaints', 'Audit Logs'];
        if (allowedTabs.includes(urlTab)) return urlTab;
      } else {
        return urlTab;
      }
    }
    if (userInfo?.role === 'Staff') {
      const dept = userInfo?.department;
      if (dept === 'Restrooms') return 'Restrooms';
      if (dept === 'Parking') return 'Parking';
      return 'Overview'; // Selector screen for General/unassigned staff
    }
    return 'Overview';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab);
  const [showQuickAction, setShowQuickAction] = useState(false);

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab) {
      if (userInfo?.role === 'Staff') {
        const allowedTabs = [userInfo.department, 'Settings', 'Complaints', 'Audit Logs'];
        if (!allowedTabs.includes(currentTab)) {
          // Reset to default tab to block URL tampering
          setActiveTab(userInfo.department);
          setSearchParams({ tab: userInfo.department });
          return;
        }
      }
      setActiveTab(currentTab);
    }
  }, [searchParams, userInfo]);

  const handleTabChange = (tabId) => {
    if (userInfo?.role === 'Staff') {
      const allowedTabs = [userInfo.department, 'Settings', 'Complaints', 'Audit Logs'];
      if (!allowedTabs.includes(tabId)) {
        return; // Prevent navigating to unauthorized tabs
      }
    }
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleQuickAction = () => {
    setShowQuickAction(true);
  };


  const getMenuItems = (role) => {
    switch (role) {
      case 'Super Admin':
        return [
          { id: 'Overview', icon: LayoutDashboard, label: 'System Overview' },
          { id: 'Malls', icon: Map, label: 'Malls Control' },
          { id: 'Users', icon: Users, label: 'Users & RBAC' },
          { id: 'Shops', icon: Store, label: 'Shops Moderation' },
          { id: 'Products', icon: ShoppingBag, label: 'Products Moderation' },
          { id: 'Offers', icon: Tag, label: 'Offers Moderation' },
          { id: 'Operations', icon: BarChart3, label: 'Live Operations' },
          { id: 'Announcements', icon: Bell, label: 'Global Broadcast' },
          { id: 'Audit Logs', icon: ShieldCheck, label: 'Security Audits' },
          { id: 'Reviews', icon: Star, label: 'Reviews Moderation' },
          { id: 'Complaints', icon: AlertOctagon, label: 'Complaints & Disputes' },
          { id: 'Settings', icon: Settings, label: 'System Settings' }
        ];
      case 'Mall Admin':
        return [
          { id: 'Overview', icon: LayoutDashboard, label: 'Mall Overview' },
          { id: 'Shops', icon: Store, label: 'Shops Management' },
          { id: 'Products', icon: ShoppingBag, label: 'Product Moderation' },
          { id: 'Offers', icon: Tag, label: 'Offer Management' },
          { id: 'Parking', icon: Car, label: 'Parking Operations' },
          { id: 'Orders', icon: ShoppingBag, label: 'Orders Monitor' },
          { id: 'Restrooms', icon: Building, label: 'Restrooms' },
          { id: 'Audit Logs', icon: ShieldCheck, label: 'Security Audits' },
          { id: 'Reviews', icon: Star, label: 'Reviews Moderation' },
          { id: 'Complaints', icon: AlertOctagon, label: 'Complaints & Disputes' },
          { id: 'Settings', icon: Settings, label: 'Settings' }
        ];
      case 'Shop Owner':
        return [
          { id: 'Overview', icon: LayoutDashboard, label: 'Shop Overview' },
          { id: 'Products', icon: ShoppingBag, label: 'My Products' },
          { id: 'Offers', icon: Tag, label: 'My Offers' },
          { id: 'Orders', icon: ShoppingBag, label: 'My Orders' },
          { id: 'Reviews', icon: Star, label: 'Shop Reviews' },
          { id: 'Complaints', icon: AlertOctagon, label: 'Shop Complaints' },
          { id: 'Audit Logs', icon: ShieldCheck, label: 'Activity Logs' },
          { id: 'Settings', icon: Settings, label: 'Settings' }
        ];
      case 'Staff':
        if (userInfo.department === 'Parking') {
          return [
            { id: 'Parking', icon: Car, label: 'Parking Operations' },
            { id: 'Complaints', icon: AlertOctagon, label: 'Department Complaints' },
            { id: 'Audit Logs', icon: ShieldCheck, label: 'My Activity Logs' },
            { id: 'Settings', icon: Settings, label: 'Settings' }
          ];
        }

        if (userInfo.department === 'Restrooms') {
          return [
            { id: 'Restrooms', icon: Building, label: 'Restroom Tasks' },
            { id: 'Complaints', icon: AlertOctagon, label: 'Department Complaints' },
            { id: 'Audit Logs', icon: ShieldCheck, label: 'My Activity Logs' },
            { id: 'Settings', icon: Settings, label: 'Settings' }
          ];
        }
        // General / Unassigned
        return [
          { id: 'Overview', icon: LayoutDashboard, label: 'Task Hub' },
          { id: 'Complaints', icon: AlertOctagon, label: 'Department Complaints' },
          { id: 'Audit Logs', icon: ShieldCheck, label: 'My Activity Logs' },
          { id: 'Settings', icon: Settings, label: 'Settings' }
        ];
      default:
        return [
          { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
          { id: 'Orders', icon: ShoppingBag, label: 'My Orders' },
          { id: 'Parking Payments', icon: Car, label: 'Parking Payments' },
          { id: 'Notifications', icon: Bell, label: 'Notifications' },
          { id: 'Reviews', icon: Star, label: 'My Reviews' },
          { id: 'Complaints', icon: AlertOctagon, label: 'My Complaints' },
          { id: 'Settings', icon: Settings, label: 'Settings' }
        ];
    }
  };

  const menuItems = getMenuItems(userInfo.role);

  const renderRoleDashboard = () => {
    if (activeTab === 'Settings') return <SettingsView userInfo={userInfo} />;
    if (activeTab === 'Audit Logs') return <AuditLogManager />;
    if (activeTab === 'Reviews') return <ReviewManager />;
    if (activeTab === 'Complaints') return <ComplaintManager />;

    switch (userInfo.role) {
      case 'Super Admin': return <SuperAdminView userInfo={userInfo} activeTab={activeTab} onSelectTab={handleTabChange} />;
      case 'Mall Admin': return <MallAdminView userInfo={userInfo} activeTab={activeTab} onSelectTab={handleTabChange} />;
      case 'Shop Owner': return <ShopOwnerView userInfo={userInfo} activeTab={activeTab} onSelectTab={handleTabChange} />;
      case 'Staff': return <StaffView userInfo={userInfo} activeTab={activeTab} onSelectTab={handleTabChange} />;
      default: return <UserView userInfo={userInfo} activeTab={activeTab} onSelectTab={handleTabChange} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 max-w-[1400px] mx-auto px-4 py-6 lg:py-8 min-w-0">
      {/* Sidebar - Premium Design */}
      <aside className="w-full lg:w-72 shrink-0 z-30">
        <div className="glass-card p-4 rounded-[2.5rem] sticky top-24 shadow-2xl shadow-black/20 border border-border-main bg-bg-card">
          <div className="px-4 py-4 lg:py-6 flex lg:flex-col items-center lg:items-start justify-between border-b lg:border-b-0 border-border-main mb-4 lg:mb-0">
            <div>
              <h2 className="text-[10px] font-black tracking-[0.2em] text-primary-500 uppercase flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" /> Role Control Center
              </h2>
              <p className="text-text-muted mt-1 lg:mt-2 text-xs lg:text-sm font-medium">Access Level: <span className="font-bold text-text-main">{userInfo.role}</span></p>
            </div>
            <div className="flex items-center space-x-2 lg:hidden">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Online</span>
            </div>
          </div>
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide w-full">
            {menuItems.map(item => (
              <SidebarLink 
                key={item.id}
                icon={<item.icon className="w-5 h-5" />} 
                label={item.label} 
                active={activeTab === item.id} 
                onClick={() => handleTabChange(item.id)}
              />
            ))}
          </div>
          <div className="mt-8 p-6 bg-gradient-to-br from-primary-600/10 to-transparent rounded-[2rem] border border-primary-500/10 hidden lg:block">
            <p className="text-[10px] text-primary-400 font-bold uppercase tracking-wider mb-2">System Health</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-xs font-medium text-text-muted">All Nodes Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-8 lg:space-y-10 min-w-0">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-bg-card p-6 lg:p-8 rounded-[2.5rem] border border-border-main shadow-2xl">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl lg:text-4xl font-black tracking-tight"
            >
              Welcome, <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">{userInfo.name}</span>
            </motion.h1>
            <p className="text-text-muted mt-2 font-medium flex items-center text-xs lg:text-sm">
              <span className="w-2 h-2 bg-primary-500 rounded-full mr-2 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
              Viewing <span className="text-text-main ml-1 font-bold">{activeTab}</span>
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleQuickAction}
            className="flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 px-6 lg:px-8 py-3.5 lg:py-4 rounded-2xl text-xs lg:text-sm font-black text-white transition-all shadow-xl shadow-primary-500/20 border border-border-main shrink-0 w-full sm:w-auto"
          >
             <Plus className="w-5 h-5" /> <span>QUICK ACTION</span>
          </motion.button>
        </header>

        {userInfo.mall && <EmergencyAlertBanner mallId={userInfo.mall} />}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<ModuleLoader />}>
              {renderRoleDashboard()}
            </Suspense>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {showQuickAction && (
            <QuickActionModal 
              userInfo={userInfo}
              onClose={() => setShowQuickAction(false)}
              onSelectTab={handleTabChange}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-auto lg:w-full shrink-0 flex items-center space-x-3 lg:space-x-4 px-5 lg:px-6 py-3.5 lg:py-4 rounded-2xl transition-all duration-300 ${
      active 
        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/20 font-black' 
        : 'text-text-muted hover:bg-bg-sub hover:text-text-main font-bold'
    }`}
  >
    <span className={`${active ? 'text-white' : 'text-primary-500'}`}>{icon}</span>
    <span className="text-xs lg:text-sm tracking-tight whitespace-nowrap">{label}</span>
  </button>
);

const SettingsView = ({ userInfo }) => {
  const dispatch = useDispatch();
  
  // Profile settings state
  const [name, setName] = useState(userInfo.name || '');
  const [email, setEmail] = useState(userInfo.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(userInfo.avatar || '');
  const [vehiclesStr, setVehiclesStr] = useState(userInfo.vehicleNumbers ? userInfo.vehicleNumbers.join(', ') : '');
  
  // Mutations
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [updateShop, { isLoading: isUpdatingShop }] = useUpdateShopMutation();
  
  // Shop details query (only for Shop Owner)
  const isShopOwner = userInfo.role === 'Shop Owner';
  const { data: shopData, isLoading: isLoadingShop } = useGetShopByIdQuery(userInfo.shop, {
    skip: !isShopOwner || !userInfo.shop
  });
  
  // Shop settings state
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [shopFloor, setShopFloor] = useState('');
  const [shopImage, setShopImage] = useState('');

  // Sync shop details once data is loaded
  useMemo(() => {
    if (shopData) {
      setShopName(shopData.name || '');
      setShopCategory(shopData.category || '');
      setShopFloor(shopData.floor || '');
      setShopImage(shopData.image || '');
    }
  }, [shopData]);

  // Avatar upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Shop Logo/Banner upload
  const handleShopImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    const vehicleNumbers = vehiclesStr
      .split(',')
      .map((v) => v.trim().toUpperCase())
      .filter((v) => v.length > 0);
    try {
      const res = await updateProfile({
        name,
        email,
        password: password || undefined,
        avatar,
        vehicleNumbers,
      }).unwrap();
      dispatch(setCredentials(res));
      toast.success('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update profile');
    }
  };

  const handleShopSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateShop({
        id: userInfo.shop,
        name: shopName,
        category: shopCategory,
        floor: shopFloor,
        image: shopImage
      }).unwrap();
      toast.success('Shop details updated successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update shop details');
    }
  };

  return (
    <div className="space-y-10 min-w-0">
      
      {/* Profile Settings Block */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-8 bg-bg-card">
        <div className="flex items-center space-x-3 border-b border-border-main pb-4">
          <div className="w-10 h-10 bg-primary-500/25 rounded-xl flex items-center justify-center text-primary-500">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main">Personal Account Settings</h3>
            <p className="text-xs text-text-muted">Manage your profile credentials and login identities</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Avatar Upload */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-4">
            <div className="relative group w-36 h-36 rounded-full overflow-hidden border-2 border-dashed border-border-main hover:border-primary-500/50 transition-colors flex items-center justify-center bg-bg-sub cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2">
                  <UploadCloud className="w-6 h-6 text-primary-500 mx-auto" />
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Avatar</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-text-muted font-medium text-center">Drag & drop or click to upload your personal avatar.</p>
          </div>

          {/* Right Column - Input Details */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main" 
                  placeholder="Your Name" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main" 
                  placeholder="Email" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main placeholder:text-text-muted/30" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main placeholder:text-text-muted/30" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            {userInfo.role === 'User' && (
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Registered Vehicles</label>
                <div className="relative">
                  <Car className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="text" 
                    value={vehiclesStr} 
                    onChange={(e) => setVehiclesStr(e.target.value)} 
                    className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main placeholder:text-text-muted/30" 
                    placeholder="e.g. MH12AB1234, DL3CAN5678 (comma separated)" 
                  />
                </div>
                <p className="text-[10px] text-text-muted">Register your vehicle plates here to automatically track parking entries, exits, fees, and view receipts on your dashboard.</p>
              </div>
            )}

            <div className="sm:col-span-2 pt-2 flex justify-end">
              <button 
                type="submit" 
                disabled={isUpdatingProfile}
                className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10 flex items-center gap-2"
              >
                {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Account Details
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Staff Department Info (read-only — assigned by Mall Admin) */}
      {userInfo.role === 'Staff' && (
        <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 bg-bg-card">
          <div className="flex items-center space-x-3 border-b border-border-main pb-4">
            <div className="w-10 h-10 bg-primary-500/25 rounded-xl flex items-center justify-center text-primary-500 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-text-main">Your Department Assignment</h3>
              <p className="text-xs text-text-muted">Assigned by your Mall Admin — contact them to change your department</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {['Parking', 'Restrooms', 'General'].map(dept => (
              <div
                key={dept}
                className={`px-6 py-4 rounded-2xl border font-black text-xs uppercase tracking-widest ${
                  userInfo.department === dept
                    ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                    : 'bg-bg-sub border-border-main text-text-muted opacity-40'
                }`}
              >
                {dept === 'General' ? 'Unassigned (General)' : `${dept} Dept.`}
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted font-medium pt-2 border-t border-border-main">Your current active department is: <span className="text-primary-500 font-black">{userInfo.department || 'General'}</span></p>
        </div>
      )}

      {/* Shop Details Settings (Only for Shop Owner) */}
      {isShopOwner && userInfo.shop && (
        <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-8 bg-bg-card">
          <div className="flex items-center space-x-3 border-b border-border-main pb-4">
            <div className="w-10 h-10 bg-orange-500/25 rounded-xl flex items-center justify-center text-orange-500">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-text-main">Shop Information Settings</h3>
              <p className="text-xs text-text-muted">Manage your retail brand presence, logo, banner, and shop configuration</p>
            </div>
          </div>

          {isLoadingShop ? (
            <div className="animate-pulse h-48 bg-bg-sub rounded-3xl" />
          ) : (
            <form onSubmit={handleShopSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column - Shop Image Upload */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-4">
                <div className="relative border-2 border-dashed border-border-main hover:border-orange-500/50 rounded-3xl p-6 text-center transition-all group bg-bg-sub cursor-pointer w-full h-44 flex flex-col justify-center items-center overflow-hidden">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleShopImageUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  {shopImage ? (
                    <img src={shopImage} alt="Shop Banner" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="w-8 h-8 text-orange-500 mx-auto" />
                      <div>
                        <p className="font-bold text-xs text-text-main">Upload Shop Banner / Logo</p>
                        <p className="text-[9px] text-text-muted">JPG, PNG, WEBP supported</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-text-muted font-medium text-center">Upload your shop's premium logo or store banner representation.</p>
              </div>

              {/* Right Column - Input Details */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Shop Name</label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="text" 
                      value={shopName} 
                      onChange={(e) => setShopName(e.target.value)} 
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 ring-orange-500 text-sm font-bold text-text-main" 
                      placeholder="Shop Name" 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Shop Category</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="text" 
                      value={shopCategory} 
                      onChange={(e) => setShopCategory(e.target.value)} 
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 ring-orange-500 text-sm font-bold text-text-main" 
                      placeholder="e.g. Fashion, Electronics" 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Floor Number</label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="text" 
                      value={shopFloor} 
                      onChange={(e) => setShopFloor(e.target.value)} 
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 ring-orange-500 text-sm font-bold text-text-main" 
                      placeholder="e.g. Ground Floor, Floor 2" 
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isUpdatingShop}
                    className="px-8 py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-500/10 flex items-center gap-2"
                  >
                    {isUpdatingShop ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Shop Details
                  </button>
                </div>
              </div>

            </form>
          )}
        </div>
      )}

    </div>
  );
};

// User Management Subsystem for Super Admin
const UserManagerSub = () => {
  const { data: users, isLoading } = useGetUsersQuery();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole({ id: userId, role: newRole }).unwrap();
      toast.success('User role updated successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user account?')) {
      try {
        await deleteUser(userId).unwrap();
        toast.success('User deleted successfully');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete user');
      }
    }
  };

  if (isLoading) return <div className="animate-pulse h-48 bg-bg-sub rounded-3xl" />;

  return (
    <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 bg-bg-card">
      <div className="flex justify-between items-center pb-4 border-b border-border-main">
        <div>
          <h3 className="text-xl font-black text-text-main">User Management Platform</h3>
          <p className="text-xs text-text-muted">Control global roles, permissions, and platform accounts</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-main text-primary-500 text-xs font-black uppercase tracking-widest">
              <th className="py-4 px-6">User</th>
              <th className="py-4 px-6">Email</th>
              <th className="py-4 px-6">Access Level</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main text-sm font-bold text-text-main">
            {users?.map(user => (
              <tr key={user._id} className="hover:bg-bg-sub transition-colors">
                <td className="py-4 px-6 flex items-center space-x-3">
                  <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center font-black text-xs text-white overflow-hidden">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name[0]}
                  </div>
                  <span>{user.name}</span>
                </td>
                <td className="py-4 px-6 text-text-muted">{user.email}</td>
                <td className="py-4 px-6">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className="bg-bg-sub border border-border-main rounded-xl px-3 py-1.5 outline-none focus:ring-1 ring-primary-500 font-black text-xs text-primary-500"
                  >
                    <option value="User" className="bg-bg-main text-text-main">User</option>
                    <option value="Staff" className="bg-bg-main text-text-main">Staff</option>
                    <option value="Shop Owner" className="bg-bg-main text-text-main">Shop Owner</option>
                    <option value="Mall Admin" className="bg-bg-main text-text-main">Mall Admin</option>
                    <option value="Super Admin" className="bg-bg-main text-text-main">Super Admin</option>
                  </select>
                </td>
                <td className="py-4 px-6 text-right">
                  <button 
                    onClick={() => handleDeleteUser(user._id)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 text-xs font-black rounded-xl transition-all"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Mall Management Subsystem for Super Admin
const MallManagerSub = () => {
  const { data: malls, isLoading } = useGetMallsQuery();
  const [createMall, { isLoading: isCreating }] = useCreateMallMutation();
  const [deleteMall] = useDeleteMallMutation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [image, setImage] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateMall = async (e) => {
    e.preventDefault();
    try {
      await createMall({
        name,
        district,
        address,
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
        image
      }).unwrap();
      toast.success('Mall registered successfully!');
      setShowAddForm(false);
      setName('');
      setDistrict('');
      setAddress('');
      setLat('');
      setLng('');
      setImage('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create mall');
    }
  };

  const handleDeleteMall = async (id) => {
    if (window.confirm('Are you sure you want to permanently remove this Mall from the network?')) {
      try {
        await deleteMall(id).unwrap();
        toast.success('Mall deleted successfully');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete mall');
      }
    }
  };

  if (isLoading) return <div className="animate-pulse h-48 bg-bg-sub rounded-3xl" />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-text-main">Malls Network Control</h3>
          <p className="text-sm text-text-muted">Manage global retail centers and active mall deployments</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Mall
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateMall} className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 bg-bg-card">
          <h4 className="text-lg font-black text-primary-500">Register New Smart Mall</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Mall Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main" 
                placeholder="Mall Name" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">District / State</label>
              <input 
                type="text" 
                value={district} 
                onChange={(e) => setDistrict(e.target.value)} 
                className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main" 
                placeholder="e.g. California" 
                required 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Full Address</label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main" 
                placeholder="123 Retail Ave, Shop City" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Latitude</label>
              <input 
                type="number" 
                step="any"
                value={lat} 
                onChange={(e) => setLat(e.target.value)} 
                className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main" 
                placeholder="e.g. 37.7749" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Longitude</label>
              <input 
                type="number" 
                step="any"
                value={lng} 
                onChange={(e) => setLng(e.target.value)} 
                className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main" 
                placeholder="e.g. -122.4194" 
                required 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Mall Banner Cover</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload} 
                className="w-full bg-bg-sub border border-border-main rounded-2xl py-3 px-4 outline-none text-xs font-bold text-text-muted" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3.5 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-border-main"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isCreating}
              className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10"
            >
              {isCreating ? 'Deploying...' : 'Deploy Mall'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {malls?.map(mall => (
          <div key={mall._id} className="glass-card overflow-hidden rounded-[2.5rem] border border-border-main hover:border-primary-500/20 transition-all flex flex-col group bg-bg-card">
            <div className="h-44 relative bg-bg-sub flex items-center justify-center overflow-hidden">
              {mall.image ? (
                <img src={mall.image} alt={mall.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <Map className="w-12 h-12 text-primary-500/30" />
              )}
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] text-primary-500 font-black uppercase tracking-widest">{mall.district}</span>
                <h4 className="text-lg font-black text-text-main mt-1">{mall.name}</h4>
                <p className="text-xs text-text-muted mt-2 font-medium leading-relaxed">{mall.address}</p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-border-main">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Coords: {mall.location?.coordinates?.join(', ')}</span>
                <button 
                  onClick={() => handleDeleteMall(mall._id)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-xs font-black rounded-xl transition-all border border-red-500/20"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Role Specific Views
// Staff Manager Modal — used by Mall Admin to create/manage staff
const StaffManagerModal = ({ mallStaff, mallId, onClose }) => {
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [updateStaffDepartment, { isLoading: changingDept }] = useUpdateStaffDepartmentMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [showForm, setShowForm] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffDept, setStaffDept] = useState('Parking');

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await createStaff({ name: staffName, email: staffEmail, password: staffPassword, department: staffDept }).unwrap();
      toast.success(`Staff account created! ${staffName} assigned to ${staffDept} department.`);
      setShowForm(false);
      setStaffName(''); setStaffEmail(''); setStaffPassword(''); setStaffDept('Parking');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create staff account');
    }
  };

  const handleChangeDept = async (staffId, dept) => {
    try {
      await updateStaffDepartment({ id: staffId, department: dept }).unwrap();
      toast.success(`Department updated to ${dept}`);
    } catch (err) {
      toast.error('Failed to update department');
    }
  };

  const handleDeleteStaff = async (staffId, name) => {
    if (!window.confirm(`Remove ${name} from the staff roster?`)) return;
    try {
      await deleteUser(staffId).unwrap();
      toast.success(`${name} removed from roster`);
    } catch (err) {
      toast.error('Failed to remove staff member');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-bg-card w-full max-w-5xl rounded-[2.5rem] border border-border-main shadow-2xl p-8 space-y-8 relative max-h-[95vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-main pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-text-main">Mall Staff Roster & Department Management</h3>
              <p className="text-xs text-text-muted mt-0.5">Create staff accounts and assign operational departments for your mall</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Add Staff'}
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-bg-sub rounded-xl transition-colors text-text-muted hover:text-text-main border border-border-main">✕</button>
          </div>
        </div>

        {/* Create Staff Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleCreateStaff}
              className="p-8 bg-bg-sub rounded-[2rem] border border-primary-500/30 space-y-6 shadow-xl"
            >
              <h4 className="text-lg font-black text-primary-500 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Create New Staff Account
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Full Name</label>
                  <input
                    type="text" value={staffName} onChange={e => setStaffName(e.target.value)} required
                    placeholder="e.g. John Doe"
                    className="w-full bg-bg-card border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Email Address</label>
                  <input
                    type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required
                    placeholder="staff@mallname.com"
                    className="w-full bg-bg-card border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Temporary Password</label>
                  <input
                    type="password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full bg-bg-card border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Assign Department</label>
                  <select
                    value={staffDept} onChange={e => setStaffDept(e.target.value)} required
                    className="w-full bg-bg-card border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                  >
                    <option value="Parking">🚗 Parking Operations</option>
                    <option value="Restrooms">🚻 Restroom Custodian</option>
                    <option value="General">⚙️ General (Unassigned)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit" disabled={creating}
                  className="px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/20 flex items-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Create Staff Account
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-border-main bg-bg-sub text-xs font-black uppercase tracking-widest text-text-muted">
                <th className="py-5 px-6 rounded-tl-2xl">Staff Member</th>
                <th className="py-5 px-6">Email</th>
                <th className="py-5 px-6">Department</th>
                <th className="py-5 px-6">Change Dept.</th>
                <th className="py-5 px-6 text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/60">
              {mallStaff.length > 0 ? mallStaff.map(staff => (
                <tr key={staff._id} className="hover:bg-bg-sub/60 transition-colors group">
                  <td className="py-5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-2xl flex items-center justify-center font-black text-sm text-purple-500 overflow-hidden border border-purple-500/20">
                        {staff.avatar ? <img src={staff.avatar} className="w-full h-full object-cover" /> : staff.name[0]}
                      </div>
                      <span className="font-bold text-text-main">{staff.name}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-sm text-text-muted font-medium">{staff.email}</td>
                  <td className="py-5 px-6">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                      staff.department === 'Parking' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      staff.department === 'Restrooms' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      'bg-bg-sub text-text-muted border-border-main'
                    }`}>
                      {staff.department || 'General'}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <select
                      defaultValue={staff.department || 'General'}
                      onChange={e => handleChangeDept(staff._id, e.target.value)}
                      disabled={changingDept}
                      className="bg-bg-sub border border-border-main rounded-xl px-3 py-2 outline-none focus:ring-1 ring-primary-500 font-black text-xs text-text-main cursor-pointer"
                    >
                      <option value="Parking">Parking</option>
                      <option value="Restrooms">Restrooms</option>
                      <option value="General">General</option>
                    </select>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <button
                      onClick={() => handleDeleteStaff(staff._id, staff.name)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-xs font-black rounded-xl transition-all border border-red-500/20"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-text-muted opacity-20" />
                      <p className="text-sm font-bold text-text-muted">No staff assigned to this mall yet.</p>
                      <p className="text-xs text-text-muted">Click "Add Staff" above to create the first staff account.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-border-main flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-border-main">Close Roster</button>
        </div>
      </motion.div>
    </div>
  );
};

// Role Specific Views
const SuperAdminView = ({ userInfo, activeTab, onSelectTab }) => {
  return <SuperAdminDashboard userInfo={userInfo} activeTab={activeTab} onSelectTab={onSelectTab} />;
};

const MallAdminView = ({ userInfo, activeTab, onSelectTab }) => {
  const { data: allOffers } = useGetOffersQuery('All');
  const { data: orders } = useGetShopOrdersQuery();
  const { data: malls } = useGetMallsQuery();
  const { data: users } = useGetUsersQuery();
  const { data: shops } = useGetShopsByMallQuery(userInfo.mall, { skip: !userInfo.mall });
  const { data: products } = useGetProductsByMallQuery(userInfo.mall, { skip: !userInfo.mall });
  const { data: parkingStats } = useGetParkingStatsQuery(userInfo.mall, { skip: !userInfo.mall });
  const { data: complaints } = useGetComplaintsQuery();
  const { data: notifications } = useGetNotificationsQuery();

  const [activeModal, setActiveModal] = useState(null);

  const myMall = malls?.find(m => m._id === userInfo.mall);
  const mallOffers = allOffers?.filter(o => (o.mall?._id || o.mall) === userInfo.mall) || [];
  const activeOffersCount = mallOffers.filter(o => o.status === 'Active' || o.isActive === true).length;
  const uniqueShopsCount = new Set(mallOffers.filter(o => o.status === 'Active').map(o => o.shop?._id || o.shop)).size;

  const mallOrders = orders?.filter(o => o.shop?.mall === userInfo.mall || o.shop?.mall?._id === userInfo.mall) || [];
  const activeOrdersCount = mallOrders.filter(o => o.orderStatus === 'Preparing' || o.orderStatus === 'Pending').length;
  const orderLoadText = activeOrdersCount > 10 ? 'High' : activeOrdersCount > 3 ? 'Moderate' : 'Low';
  const orderWaitTime = activeOrdersCount > 10 ? '~25 mins prep time' : activeOrdersCount > 3 ? '~12 mins prep time' : '~5 mins prep time';

  const baseFootfall = myMall?.footfall || 1240;
  const liveFootfall = baseFootfall + mallOrders.length * 2 + 15;

  const mallStaff = users?.filter(u => u.role === 'Staff' && (!u.mall || (u.mall?._id || u.mall) === userInfo.mall)) || [];

  // Dynamic Metrics for Executive Summary Reports
  const mallShops = shops || [];
  const activeShopsCount = mallShops.filter(s => s.status === 'Active' || s.isActive !== false).length;
  
  const mallProducts = products || [];
  const totalProductsCount = mallProducts.length;

  const totalOrdersCount = mallOrders.length;
  const completedOrdersCount = mallOrders.filter(o => o.orderStatus === 'Completed').length;
  const orderCompletionRate = totalOrdersCount > 0 ? ((completedOrdersCount / totalOrdersCount) * 100).toFixed(1) : '0.0';

  const parkingOccupancy = parkingStats?.occupancyPercentage || 0;
  const parkingRevenueToday = parkingStats?.todaysRevenue || 0;
  const parkingRevenueTotal = parkingStats?.totalPaidRevenue || 0;

  const mallComplaints = complaints || [];
  const totalComplaintsCount = mallComplaints.length;
  const pendingComplaintsCount = mallComplaints.filter(c => c.status === 'Pending').length;
  const resolvedComplaintsCount = mallComplaints.filter(c => c.status === 'Resolved').length;

  const mallNotifications = notifications?.filter(n => n.mall === userInfo.mall || n.mall?._id === userInfo.mall) || [];
  const totalNotificationsCount = mallNotifications.length;
  const emergencyAlertsCount = mallNotifications.filter(n => n.type === 'Emergency').length;

  const handleExportPDF = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      toast.error('Pop-up blocked! Please allow pop-ups to export the report.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const htmlContent = `
      <html>
        <head>
          <title>Monthly Operational Audit Report - ${myMall?.name || 'Smart Mall'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
              background-color: #ffffff;
            }
            .header {
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 900;
              letter-spacing: -0.025em;
              color: #0f172a;
              text-transform: uppercase;
            }
            .header p {
              margin: 5px 0 0 0;
              font-size: 14px;
              color: #64748b;
            }
            .date {
              font-size: 14px;
              font-weight: 600;
              color: #3b82f6;
            }
            .grid {
              display: grid;
              grid-template-cols: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 20px;
              background: #f8fafc;
            }
            .card h3 {
              margin: 0 0 10px 0;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
            }
            .card .value {
              font-size: 32px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
            }
            .card .sub {
              font-size: 12px;
              color: #3b82f6;
              margin: 5px 0 0 0;
              font-weight: 600;
            }
            .section-title {
              font-size: 18px;
              font-weight: 800;
              margin-bottom: 15px;
              color: #0f172a;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: -0.01em;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              text-align: left;
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
            }
            th {
              background-color: #f1f5f9;
              font-weight: 700;
              color: #475569;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
            }
            .badge-success { background-color: #dcfce7; color: #15803d; }
            .badge-warning { background-color: #fef9c3; color: #a16207; }
            .badge-danger { background-color: #fee2e2; color: #b91c1c; }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            @media print {
              body { margin: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${myMall?.name || 'Smart Mall'}</h1>
              <p>Monthly Executive Operational & Audit Report</p>
            </div>
            <div class="date">${todayStr}</div>
          </div>

          <div class="section-title">Operational Summary</div>
          <div class="grid">
            <div class="card">
              <h3>F&B Orders Placed</h3>
              <p class="value">${totalOrdersCount}</p>
              <p class="sub">${completedOrdersCount} orders successfully fulfilled (${orderCompletionRate}% completion rate)</p>
            </div>
            <div class="card">
              <h3>Active Tenant Shops</h3>
              <p class="value">${activeShopsCount}</p>
              <p class="sub">${totalProductsCount} active items currently listed in directory</p>
            </div>
            <div class="card">
              <h3>Parking Space Efficiency</h3>
              <p class="value">${parkingOccupancy}%</p>
              <p class="sub">Today's Revenue: ₹${parkingRevenueToday} / Total Revenue: ₹${parkingRevenueTotal}</p>
            </div>
            <div class="card">
              <h3>Tenant Campaigns</h3>
              <p class="value">${activeOffersCount}</p>
              <p class="sub">Active discount offers currently live on the customer platform</p>
            </div>
          </div>

          <div class="section-title">Customer Care & Dispute Audits</div>
          <table>
            <thead>
              <tr>
                <th>Dispute Metric</th>
                <th>Count</th>
                <th>Audit Insights</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pending Disputes</td>
                <td>${pendingComplaintsCount}</td>
                <td><span class="badge ${pendingComplaintsCount > 0 ? 'badge-danger' : 'badge-success'}">${pendingComplaintsCount > 0 ? 'Action Required' : 'Healthy'}</span></td>
              </tr>
              <tr>
                <td>Resolved Disputes</td>
                <td>${resolvedComplaintsCount}</td>
                <td><span class="badge badge-success">Audit Complete</span></td>
              </tr>
              <tr>
                <td>Total Disputes Logged</td>
                <td>${totalComplaintsCount}</td>
                <td>Based on actual user submissions</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">Operational Broadcasts & Notifications</div>
          <table>
            <thead>
              <tr>
                <th>Broadcast Type</th>
                <th>Volume</th>
                <th>Security Insights</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Emergency Notifications</td>
                <td>${emergencyAlertsCount}</td>
                <td><span class="badge ${emergencyAlertsCount > 0 ? 'badge-danger' : 'badge-success'}">${emergencyAlertsCount > 0 ? 'Critical Event Logged' : 'Secure State'}</span></td>
              </tr>
              <tr>
                <td>Standard Operational Alerts</td>
                <td>${totalNotificationsCount - emergencyAlertsCount}</td>
                <td>F&B status, announcements, and parking alerts</td>
              </tr>
              <tr>
                <td>Total Digital Logs</td>
                <td>${totalNotificationsCount}</td>
                <td>Generated across entire tenant roster</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Generated automatically by the Smart Mall digital administrative subsystem. Confidential - internal use only.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
    toast.success('Report print preview opened successfully!');
  };

  if (activeTab === 'Shops') return <ShopManager mallId={userInfo.mall} />;
  if (activeTab === 'Products') return <ProductManager mallId={userInfo.mall} />;
  if (activeTab === 'Offers') return <OfferManager mallId={userInfo.mall} />;
  if (activeTab === 'Orders') return <OrderManager role={userInfo.role} mallId={userInfo.mall} />;
  if (activeTab === 'Parking') return <ParkingManager mallId={userInfo.mall} role={userInfo.role} />;
  if (activeTab === 'Restrooms') return <RestroomManager mallId={userInfo.mall} role={userInfo.role} />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-[2rem] border border-border-main space-y-4 col-span-2 relative overflow-hidden group flex flex-col justify-between bg-bg-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 space-y-1">
            <h3 className="text-2xl font-black text-text-main flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-primary-500" /> Executive Analytics
            </h3>
            <p className="text-xs text-text-muted">Live view of mall operations, footfall, and tenant activity.</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-border-main relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Footfall Today</p>
              <h4 className="text-2xl font-black text-text-main mt-1">{liveFootfall.toLocaleString()}</h4>
              <p className="text-[10px] text-green-500 font-bold mt-1">▲ Live Sync Active</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Active Offers</p>
              <h4 className="text-2xl font-black text-text-main mt-1">{activeOffersCount}</h4>
              <p className="text-[10px] text-primary-500 font-bold mt-1">Across {uniqueShopsCount} shops</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Order Load</p>
              <h4 className="text-2xl font-black text-text-main mt-1">{orderLoadText}</h4>
              <p className="text-[10px] text-yellow-500 font-bold mt-1">{orderWaitTime}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem] border border-border-main space-y-4 relative overflow-hidden group bg-bg-card">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-text-main flex items-center">
                <Bell className="w-5 h-5 mr-2 text-orange-500" /> Notifications
              </h3>
              <p className="text-xs text-text-muted">Broadcast alerts to mall.</p>
            </div>
            <button onClick={() => setActiveModal('emergency')} className="w-full mt-4 py-3 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-orange-500/20">
              New Broadcast
            </button>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border-main shadow-2xl rounded-[2.5rem] p-8 glass-card">
        <h3 className="text-lg font-bold mb-6 text-text-main flex items-center">
          <Settings className="w-5 h-5 mr-2 text-text-muted" /> Operations Control
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          <OpButton label="Manage Staff" icon={<Users className="w-5 h-5 text-purple-500" />} onClick={() => setActiveModal('staff')} />
          <OpButton label="View Reports" icon={<BarChart3 className="w-5 h-5 text-blue-500" />} onClick={() => setActiveModal('reports')} />
          <OpButton label="Emergency Protocols" icon={<Lock className="w-5 h-5 text-red-500" />} onClick={() => setActiveModal('emergency')} />
          <OpButton label="Settings" icon={<Settings className="w-5 h-5 text-slate-500" />} onClick={() => onSelectTab('Settings')} />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'staff' && (
          <StaffManagerModal
            mallStaff={mallStaff}
            mallId={userInfo.mall}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'reports' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-card w-full max-w-4xl rounded-[2.5rem] border border-border-main shadow-2xl p-8 space-y-6 relative"
            >
              <div className="flex items-center justify-between border-b border-border-main pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 font-bold">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-main">Mall Operations Executive Summary</h3>
                    <p className="text-xs text-text-muted">Real-time performance metrics and exportable operational reports</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-bg-sub rounded-full transition-colors text-text-muted hover:text-text-main">✕</button>
              </div>

              {/* High Fidelity Dynamic Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Shops & Directory */}
                <div className="p-5 bg-bg-sub border border-border-main rounded-2xl space-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-2xl opacity-10">🏪</div>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Active Shops</p>
                  <p className="text-2xl font-black text-text-main">{activeShopsCount}</p>
                  <p className="text-xs text-primary-500 font-bold">{totalProductsCount} Products Listed</p>
                </div>

                {/* F&B Orders */}
                <div className="p-5 bg-bg-sub border border-border-main rounded-2xl space-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-2xl opacity-10">🍔</div>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">F&B Orders</p>
                  <p className="text-2xl font-black text-text-main">{totalOrdersCount}</p>
                  <p className="text-xs text-green-500 font-bold">{completedOrdersCount} Fulfilled ({orderCompletionRate}%)</p>
                </div>

                {/* Parking occupancy & revenue */}
                <div className="p-5 bg-bg-sub border border-border-main rounded-2xl space-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-2xl opacity-10">🚗</div>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Parking Occupancy</p>
                  <p className="text-2xl font-black text-text-main">{parkingOccupancy}%</p>
                  <p className="text-xs text-yellow-500 font-bold">Rev Today: ₹{parkingRevenueToday}</p>
                </div>

                {/* Offers & Campaigns */}
                <div className="p-5 bg-bg-sub border border-border-main rounded-2xl space-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-2xl opacity-10">🏷️</div>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Active Offers</p>
                  <p className="text-2xl font-black text-text-main">{activeOffersCount}</p>
                  <p className="text-xs text-purple-500 font-bold">Across {uniqueShopsCount} Shops</p>
                </div>

                {/* Complaints */}
                <div className="p-5 bg-bg-sub border border-border-main rounded-2xl space-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-2xl opacity-10">⚠️</div>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Active Disputes</p>
                  <p className="text-2xl font-black text-text-main">{totalComplaintsCount}</p>
                  <p className="text-xs text-red-500 font-bold">{pendingComplaintsCount} Pending Action</p>
                </div>

                {/* Broadcasts */}
                <div className="p-5 bg-bg-sub border border-border-main rounded-2xl space-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-2xl opacity-10">📢</div>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Broadcast Logs</p>
                  <p className="text-2xl font-black text-text-main">{totalNotificationsCount}</p>
                  <p className="text-xs text-orange-500 font-bold">{emergencyAlertsCount} Emergency Events</p>
                </div>

                {/* Total Parking Revenue */}
                <div className="p-5 bg-bg-sub border border-border-main rounded-2xl space-y-1 col-span-1 sm:col-span-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-2xl opacity-10">💰</div>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Total Parking Revenue Collected</p>
                  <p className="text-2xl font-black text-emerald-500">₹{parkingRevenueTotal}</p>
                  <p className="text-xs text-text-muted">Accumulated from vehicle entry logs</p>
                </div>
              </div>

              {/* Monthly Audit PDF Action */}
              <div className="p-6 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-text-main">Monthly Operational Audit Report</h4>
                  <p className="text-xs text-text-muted mt-1">Generate a dynamic PDF auditing ANPR, store directories, and tenant logs.</p>
                </div>
                <button onClick={handleExportPDF} className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20 transition-all">
                  Export PDF
                </button>
              </div>

              <div className="pt-4 border-t border-border-main flex justify-end">
                <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-border-main">Close Reports</button>
              </div>
            </motion.div>
          </div>
        )}



        {activeModal === 'emergency' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-card w-full max-w-2xl rounded-[2.5rem] border border-red-500/40 shadow-2xl p-8 space-y-6 relative"
            >
              <div className="flex items-center justify-between border-b border-border-main pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500 font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-main">Emergency Protocols & Platform Lockdown</h3>
                    <p className="text-xs text-text-muted">Instantly broadcast high-priority alarms or security directives across all digital mall displays</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-bg-sub rounded-full transition-colors text-text-muted hover:text-text-main">✕</button>
              </div>

              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-4">
                <h4 className="font-black text-sm text-red-500 flex items-center">
                  ⚠️ Critical Broadcast Directive
                </h4>
                <p className="text-xs text-text-main leading-relaxed font-medium">
                  Use the emergency alert panel below to transmit immediate siren notifications to all tenants, staff devices, and customer applications currently within the mall geofence.
                </p>
                <div className="pt-2">
                  <EmergencyAlertBanner mallId={userInfo.mall} />
                </div>
              </div>

              <div className="pt-4 border-t border-border-main flex justify-end">
                <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-border-main">Dismiss Panel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShopOwnerView = ({ userInfo, activeTab }) => {
  const { data: products } = useGetProductsByShopQuery(userInfo.shop, { skip: !userInfo.shop });
  const { data: allOffers } = useGetOffersQuery('All');
  const { data: orders } = useGetShopOrdersQuery({ shopId: userInfo.shop }, { skip: !userInfo.shop });

  const myOffers = allOffers?.filter(o => o.shop?._id === userInfo.shop) || [];
  const activeOffersCount = myOffers.filter(o => o.status === 'Active').length;
  const pendingOrdersCount = orders?.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed' || o.orderStatus === 'Preparing').length || 0;

  // Analytics Calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalOrdersCount = orders?.length || 0;
  const completedOrdersCount = orders?.filter(o => o.orderStatus === 'Completed').length || 0;
  
  const totalRevenue = orders?.filter(o => o.paymentStatus === 'Paid').reduce((acc, curr) => acc + curr.totalAmount, 0) || 0;
  const todayRevenue = orders?.filter(o => {
    const orderDate = new Date(o.createdAt);
    return o.paymentStatus === 'Paid' && orderDate >= today;
  }).reduce((acc, curr) => acc + curr.totalAmount, 0) || 0;

  if (activeTab === 'Products') return <ProductManager shopId={userInfo.shop} mallId={userInfo.mall} />;
  if (activeTab === 'Offers') return <OfferManager shopId={userInfo.shop} mallId={userInfo.mall} />;
  if (activeTab === 'Orders') return <OrderManager role={userInfo.role} shopId={userInfo.shop} />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Products" value={products?.length || 0} icon={<ShoppingBag className="text-primary-400" />} />
        <StatCard title="Active Offers" value={activeOffersCount} icon={<Tag className="text-yellow-400" />} />
        <StatCard title="Active Orders" value={pendingOrdersCount} icon={<Clock className="text-purple-400" />} />
      </div>
      
      <div className="glass-card p-10 rounded-[2.5rem] border border-border-main bg-bg-card space-y-8">
        <h3 className="text-xl font-black flex items-center text-text-main">
          <BarChart3 className="w-6 h-6 mr-3 text-primary-500" /> Shop Analytics Overview
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-bg-sub border border-border-main rounded-[2rem] hover:border-primary-500/50 transition-all flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Orders</p>
              <h4 className="text-3xl font-black text-text-main mt-1">{totalOrdersCount}</h4>
            </div>
          </div>

          <div className="p-6 bg-bg-sub border border-border-main rounded-[2rem] hover:border-green-500/50 transition-all flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Completed Orders</p>
              <h4 className="text-3xl font-black text-text-main mt-1">{completedOrdersCount}</h4>
            </div>
          </div>

          <div className="p-6 bg-bg-sub border border-border-main rounded-[2rem] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Revenue</p>
              <h4 className="text-3xl font-black text-text-main mt-1">₹{totalRevenue.toLocaleString()}</h4>
            </div>
          </div>

          <div className="p-6 bg-bg-sub border border-border-main rounded-[2rem] hover:border-orange-500/50 transition-all flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Today's Revenue</p>
              <h4 className="text-3xl font-black text-text-main mt-1">₹{todayRevenue.toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffView = ({ userInfo, activeTab }) => {
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const dispatch = useDispatch();

  const handleSelectDepartment = async (dept) => {
    try {
      const res = await updateProfile({ department: dept }).unwrap();
      dispatch(setCredentials(res));
      toast.success(`Assigned to ${dept} Department successfully`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to assign department');
    }
  };

  const isUnassigned = !userInfo?.department || userInfo?.department === 'General';

  if (activeTab === 'Parking' && (userInfo?.department === 'Parking' || isUnassigned)) {
    return <ParkingManager mallId={userInfo.mall} role={userInfo.role} />;
  }

  if (activeTab === 'Restrooms' && (userInfo?.department === 'Restrooms' || isUnassigned)) {
    return <RestroomManager mallId={userInfo.mall} role={userInfo.role} />;
  }

  return (
    <div className="space-y-8 min-w-0">
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 bg-bg-card shadow-2xl text-center">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center text-primary-500 font-bold mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-text-main tracking-tight">Staff Department Assignment</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Welcome to the Smart Mall Staff Operations Portal. Please select your assigned operational department below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => handleSelectDepartment('Parking')}
            className="p-8 bg-bg-sub border border-border-main hover:border-blue-500/50 rounded-[2rem] space-y-4 cursor-pointer group transition-all text-left flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 w-fit mb-4 border border-blue-500/20">
                <Car className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-black text-text-main group-hover:text-blue-500 transition-colors">Parking Operations</h3>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                Access ANPR check-in/check-out terminals, vehicle authorization, and live assigned parking bay monitoring.
              </p>
            </div>
            <button disabled={isUpdating} className="w-full py-3 bg-blue-500/10 group-hover:bg-blue-500 text-blue-500 group-hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all mt-6 border border-blue-500/20">
              {isUpdating ? 'Assigning...' : 'Select Parking Staff'}
            </button>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => handleSelectDepartment('Restrooms')}
            className="p-8 bg-bg-sub border border-border-main hover:border-green-500/50 rounded-[2rem] space-y-4 cursor-pointer group transition-all text-left flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="p-4 bg-green-500/10 rounded-2xl text-green-500 w-fit mb-4 border border-green-500/20">
                <Building className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-black text-text-main group-hover:text-green-500 transition-colors">Restroom Custodian</h3>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                Access assigned restroom hygiene logging, cleaning task completion, and maintenance incident reporting.
              </p>
            </div>
            <button disabled={isUpdating} className="w-full py-3 bg-green-500/10 group-hover:bg-green-500 text-green-500 group-hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all mt-6 border border-green-500/20">
              {isUpdating ? 'Assigning...' : 'Select Restroom Staff'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const UserView = ({ userInfo, activeTab }) => {
  if (activeTab === 'Notifications') return <NotificationsView />;
  if (activeTab === 'Orders') return <OrderManager role={userInfo.role} />;
  if (activeTab === 'Parking Payments') return <MyParkingView userInfo={userInfo} />;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-8 space-y-10">
        <CrowdDensityMonitor />
      </div>
      <div className="lg:col-span-4">
        <div className="glass-card p-8 rounded-[2.5rem] sticky top-24 space-y-8 border border-border-main bg-bg-card">
          <h3 className="text-xl font-black flex items-center text-text-main">
            <Bell className="w-6 h-6 mr-3 text-primary-500" /> Live Updates
          </h3>
          <div className="space-y-4">
            <NotificationItem title="New Offer" desc="20% off at Nike Store today only!" time="2m ago" />
            <NotificationItem title="Parking Update" desc="Your vehicle entry was recorded at Slot A-12" time="15m ago" />
            <NotificationItem title="Security" desc="Secure networks active across all zones" time="1h ago" />
          </div>
          <button className="w-full py-4 bg-bg-sub hover:bg-bg-sub/80 rounded-2xl text-xs font-black uppercase tracking-widest text-text-muted transition-all border border-border-main">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationsView = () => {
  return <RealNotificationsView />;
};

const RealNotificationsView = () => {
  const { data: notifications = [], isLoading, refetch } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id) => {
    try { await markAsRead(id).unwrap(); } 
    catch { toast.error('Failed to mark as read'); }
  };

  const handleMarkAllRead = async () => {
    try { 
      await markAllAsRead().unwrap(); 
      toast.success('All notifications marked as read');
    } catch { 
      toast.error('Failed to mark all as read'); 
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Order': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Offer': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Emergency': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Parking': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      default: return 'bg-primary-500/10 text-primary-500 border-primary-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[2.5rem] border border-border-main space-y-4 bg-bg-card">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-text-muted">Loading Notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main">Notification Center</h3>
            <p className="text-xs text-text-muted">
              {unreadCount > 0 ? <span className="text-primary-500 font-black">{unreadCount} unread</span> : 'All caught up'} · {notifications.length} total
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500/10 hover:bg-primary-500 text-primary-500 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all border border-primary-500/20"
          >
            <Check className="w-3.5 h-3.5" /> Mark All Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-[2rem] border border-border-main bg-bg-card space-y-4">
          <Bell className="w-16 h-16 text-text-muted mx-auto opacity-20" />
          <h4 className="font-bold text-lg text-text-main">No notifications yet</h4>
          <p className="text-xs text-text-muted">Your order updates, offers, and alerts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <motion.div
              key={notif._id}
              layout
              className={`glass-card p-5 rounded-[1.5rem] border flex items-start gap-4 transition-all ${
                notif.isRead
                  ? 'bg-bg-card border-border-main opacity-70'
                  : 'bg-primary-500/5 border-primary-500/20 shadow-lg shadow-primary-500/5'
              }`}
            >
              <div className={`p-2.5 rounded-xl border flex-shrink-0 ${getTypeColor(notif.type)}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className={`text-sm font-black truncate ${
                    notif.isRead ? 'text-text-main' : 'text-primary-400'
                  }`}>{notif.title}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${getTypeColor(notif.type)}`}>
                      {notif.type}
                    </span>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif._id)}
                        title="Mark as read"
                        className="p-1.5 hover:bg-bg-sub rounded-lg text-text-muted hover:text-text-main transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs font-medium text-text-muted leading-relaxed">{notif.message}</p>
                <p className="text-[10px] text-text-muted/50 font-bold">
                  {new Date(notif.createdAt).toLocaleString([], { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationItem = ({ title, desc, time }) => (
  <div className="p-5 bg-bg-sub border border-border-main rounded-2xl group hover:bg-bg-sub/80 transition-all cursor-pointer">
    <div className="flex justify-between items-start">
      <h4 className="text-sm font-black text-text-main group-hover:text-primary-500 transition-colors">{title}</h4>
      <span className="text-[10px] font-bold text-primary-500/50 uppercase tracking-tighter">{time}</span>
    </div>
    <p className="text-xs text-text-muted mt-2 font-medium leading-relaxed">{desc}</p>
  </div>
);

const StatCard = ({ title, value, icon }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card p-8 rounded-[2.5rem] shadow-2xl shadow-black/20 border border-border-main bg-bg-card h-full flex flex-col justify-between space-y-4"
  >
    <div className="flex justify-between items-start mb-2">
       <div className="p-4 bg-primary-600/10 rounded-2xl text-primary-500 shadow-inner">{icon}</div>
    </div>
    <div>
      <p className="text-primary-500/60 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-4xl font-black mt-1 tracking-tighter text-text-main">{value}</h3>
    </div>
  </motion.div>
);

const OpButton = ({ label, icon, onClick }) => (
  <button onClick={onClick} className="p-4 bg-bg-sub hover:bg-bg-sub/80 border border-transparent hover:border-border-main rounded-2xl text-sm font-bold transition-all text-center text-text-muted hover:text-text-main flex flex-col items-center justify-center gap-2">
    {icon && <div className="p-2 bg-bg-sub rounded-xl">{icon}</div>}
    {label}
  </button>
);

const MyParkingView = ({ userInfo }) => {
  const { data: history = [], isLoading, refetch } = useGetMyParkingHistoryQuery();
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5020');
    socket.on('parking_update', () => {
      refetch();
    });
    return () => socket.disconnect();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[2.5rem] border border-border-main space-y-4 shadow-xl bg-bg-card">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-text-muted">Loading Parking Records...</p>
      </div>
    );
  }

  const registeredVehicles = userInfo.vehicleNumbers || [];

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main bg-bg-card space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-text-main flex items-center">
              <Car className="w-7 h-7 mr-3 text-primary-500" /> Parking Payments & History
            </h3>
            <p className="text-xs text-text-muted">Track all parking visits, receipts, and payments across our network</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {registeredVehicles.length === 0 ? (
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
                ⚠️ No Vehicles Registered
              </span>
            ) : (
              registeredVehicles.map(v => (
                <span key={v} className="text-xs font-black text-primary-400 bg-primary-500/10 px-3.5 py-1.5 rounded-xl border border-primary-500/20 font-mono shadow-sm">
                  🚗 {v}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {registeredVehicles.length === 0 ? (
        <div className="glass-card p-10 rounded-[2.5rem] border border-border-main bg-bg-card text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
            <Car className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-black text-text-main">No Vehicles Registered</h4>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Please register your vehicle numbers in your profile settings tab. Once registered, your entry logs and payment history will appear here.
          </p>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-card p-10 rounded-[2.5rem] border border-border-main bg-bg-card text-center space-y-4">
          <div className="w-16 h-16 bg-primary-500/10 text-primary-500 rounded-2xl flex items-center justify-center mx-auto border border-primary-500/20">
            <Check className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-black text-text-main">No Parking Logs Found</h4>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            We haven't recorded any parking logs for vehicles: {registeredVehicles.join(', ')}. Ensure your license plates are registered correctly in Settings.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-[2.5rem] border border-border-main bg-bg-card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-main bg-bg-sub/50">
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Vehicle</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Mall Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Timing & Duration</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Fee Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Status / Method</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {history.map((entry) => {
                  const isPaid = entry.paymentStatus === 'Paid';
                  const entryDate = entry.entryTime ? new Date(entry.entryTime) : null;
                  const exitDate = entry.exitTime ? new Date(entry.exitTime) : null;
                  
                  const formatTime = (d) => d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
                  const formatDate = (d) => d ? d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '--';

                  let durationStr = 'Active Parking';
                  if (entry.entryTime && entry.exitTime) {
                    const hours = Math.max(Math.ceil((new Date(entry.exitTime) - new Date(entry.entryTime)) / (1000 * 60 * 60)), 1);
                    durationStr = `${hours} Hour${hours > 1 ? 's' : ''}`;
                  }

                  return (
                    <motion.tr 
                      key={entry._id}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                      className="transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono font-black text-text-main text-sm">
                        {entry.vehicleNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-text-main text-sm">{entry.mall?.name || 'Smart Mall'}</p>
                        <p className="text-[10px] text-text-muted">{entry.mall?.address || entry.mall?.district || 'Main Zone'}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-text-muted space-y-1">
                        <div>Entry: <span className="text-text-main font-bold">{formatDate(entryDate)} {formatTime(entryDate)}</span></div>
                        {exitDate && <div>Exit: <span className="text-text-main font-bold">{formatDate(exitDate)} {formatTime(exitDate)}</span></div>}
                        <div className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">{durationStr}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-text-main">
                        ₹{entry.fee}
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <div>
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            isPaid 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {entry.paymentStatus}
                          </span>
                        </div>
                        {isPaid && (
                          <div className="text-[10px] font-bold text-text-muted">
                            Method: <span className="text-text-main font-black">{entry.paymentMethod}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPaid ? (
                          <button
                            onClick={() => setSelectedReceipt(entry)}
                            className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-black bg-primary-500/10 hover:bg-primary-500 text-primary-400 hover:text-white transition-all border border-primary-500/20 group-hover:scale-105"
                          >
                            <span>Receipt</span> ➜
                          </button>
                        ) : (
                          <span className="text-xs text-text-muted/60 font-bold">Exiting Pending</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Premium Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4"
            onClick={() => setSelectedReceipt(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-bg-card border border-border-main rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Receipt Body */}
              <div className="text-center space-y-2 border-b border-border-main pb-5">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black text-text-main">PARKING PAYMENT</h4>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Transaction Successful</p>
              </div>

              {/* Items Details */}
              <div className="space-y-4 text-xs font-semibold text-text-muted">
                <div className="flex justify-between items-center">
                  <span>Vehicle Number</span>
                  <span className="font-mono font-black text-text-main text-sm">{selectedReceipt.vehicleNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Location</span>
                  <span className="font-bold text-text-main">{selectedReceipt.mall?.name || 'Smart Mall'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Entry Time</span>
                  <span className="font-bold text-text-main">{selectedReceipt.entryTime ? new Date(selectedReceipt.entryTime).toLocaleString() : '--'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Exit Time</span>
                  <span className="font-bold text-text-main">{selectedReceipt.exitTime ? new Date(selectedReceipt.exitTime).toLocaleString() : '--'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Duration</span>
                  <span className="font-bold text-text-main">
                    {(() => {
                      const hours = Math.max(Math.ceil((new Date(selectedReceipt.exitTime) - new Date(selectedReceipt.entryTime)) / (1000 * 60 * 60)), 1);
                      return `${hours} Hour${hours > 1 ? 's' : ''}`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Payment Method</span>
                  <span className="font-bold text-text-main">{selectedReceipt.paymentMethod}</span>
                </div>
                {selectedReceipt.paymentDate && (
                  <div className="flex justify-between items-center">
                    <span>Payment Date</span>
                    <span className="font-bold text-text-main">{new Date(selectedReceipt.paymentDate).toLocaleString()}</span>
                  </div>
                )}
                {(selectedReceipt.utrNumber || selectedReceipt.razorpayPaymentId) && (
                  <div className="flex justify-between items-center">
                    <span>Transaction ID</span>
                    <span className="font-bold text-text-main font-mono text-[10px]">
                      {selectedReceipt.utrNumber || selectedReceipt.razorpayPaymentId}
                    </span>
                  </div>
                )}
                
                <div className="border-t border-border-main pt-4 flex justify-between items-center">
                  <span className="text-sm font-black text-text-main">TOTAL FEE PAID</span>
                  <span className="text-2xl font-black text-emerald-500">₹{selectedReceipt.fee}</span>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="w-full py-3.5 bg-bg-sub hover:bg-bg-sub/80 border border-border-main text-text-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Dismiss Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
