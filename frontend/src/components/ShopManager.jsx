import { useState } from 'react';
import { 
  useCreateShopMutation, 
  useGetManagedShopsQuery,
  useGetShopsQuery,
  useUpdateShopMutation,
  useDeleteShopMutation
} from '../features/shops/shopApiSlice';
import { useGetUsersQuery } from '../features/auth/authApiSlice';
import { useSelector } from 'react-redux';
import { 
  Store, Plus, Loader2, Trash2, MapPin, 
  Users, Tag, ShieldCheck, Search, Eye, Edit, Upload, Clock, Phone, Mail, FileText, Star, X, CheckCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

// Status badge helper
const ShopStatusBadge = ({ status, isActive }) => {
  const displayStatus = status || (isActive !== false ? 'Active' : 'Closed');
  const colorMap = {
    Active: 'bg-green-500/20 border-green-500/20 text-green-500',
    Pending: 'bg-yellow-500/20 border-yellow-500/20 text-yellow-500',
    Suspended: 'bg-orange-500/20 border-orange-500/20 text-orange-500',
    Closed: 'bg-red-500/20 border-red-500/20 text-red-500',
  };
  return (
    <span className={`px-2.5 py-1 text-[9px] font-black tracking-widest uppercase rounded-full border ${colorMap[displayStatus] || colorMap.Active}`}>
      {displayStatus}
    </span>
  );
};

const ShopManager = ({ mallId }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const isMallAdmin = userInfo?.role === 'Mall Admin';
  const hasMallContext = !isMallAdmin || !!userInfo?.mall;

  // Mall Admins fetch from a protected server-scoped endpoint so other malls' shops never appear.
  const { data: mallShops, isLoading: mallShopsLoading } = useGetManagedShopsQuery(
    undefined, { skip: !isMallAdmin || !hasMallContext }
  );
  const { data: allShops, isLoading: allShopsLoading } = useGetShopsQuery(
    undefined, { skip: isMallAdmin }
  );
  const shops = isMallAdmin ? mallShops : allShops;
  const isLoadingShops = mallShopsLoading || allShopsLoading;

  const [deleteShop, { isLoading: isDeleting }] = useDeleteShopMutation();
  const [createShop, { isLoading: isCreating }] = useCreateShopMutation();
  const [updateShop, { isLoading: isUpdating }] = useUpdateShopMutation();
  const { data: users } = useGetUsersQuery({ ownerCandidates: true });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [shopType, setShopType] = useState('Retail');
  const [floor, setFloor] = useState('');
  const [ownerId, setOwnerId] = useState('');

  // Edit Modal State
  const [editingShop, setEditingShop] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    shopType: 'Retail',
    floor: '',
    description: '',
    phone: '',
    email: '',
    openTime: '10:00 AM',
    closeTime: '10:00 PM',
    status: 'Active',
    isFeatured: false,
    ownerId: '',
    image: '', // logo
    banner: '',
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createShop({ name, category, shopType, floor, mallId, ownerId: ownerId || undefined }).unwrap();
      toast.success('Shop registered successfully!');
      setName(''); setCategory(''); setShopType('Retail'); setFloor(''); setOwnerId('');
      setShowCreateForm(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to register shop');
    }
  };

  const handleEditClick = (shop) => {
    setEditingShop(shop);
    setEditForm({
      name: shop.name || '',
      category: shop.category || '',
      shopType: shop.shopType || 'Retail',
      floor: shop.floor || '',
      description: shop.description || '',
      phone: shop.contactDetails?.phone || '',
      email: shop.contactDetails?.email || '',
      openTime: shop.timings?.open || '10:00 AM',
      closeTime: shop.timings?.close || '10:00 PM',
      status: shop.status || (shop.isActive !== false ? 'Active' : 'Closed'),
      isFeatured: shop.isFeatured || false,
      ownerId: shop.owner?._id || shop.owner || '',
      image: shop.image || '',
      banner: shop.banner || '',
    });
  };

  const handleUpdateShop = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error('Shop name is required');
      return;
    }
    try {
      await updateShop({
        id: editingShop._id,
        name: editForm.name,
        category: editForm.category,
        shopType: editForm.shopType,
        floor: editForm.floor,
        description: editForm.description,
        contactDetails: {
          phone: editForm.phone,
          email: editForm.email,
        },
        timings: {
          open: editForm.openTime,
          close: editForm.closeTime,
        },
        status: editForm.status,
        isFeatured: editForm.isFeatured,
        owner: editForm.ownerId || undefined,
        image: editForm.image,
        banner: editForm.banner,
      }).unwrap();
      toast.success('Shop updated successfully!');
      setEditingShop(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update shop');
    }
  };

  const handleQuickAction = async (shop, actionType, actionValue) => {
    try {
      const payload = { id: shop._id };
      if (actionType === 'status') payload.status = actionValue;
      if (actionType === 'featured') payload.isFeatured = actionValue;

      await updateShop(payload).unwrap();
      toast.success(`Shop ${actionType} updated successfully!`);
      if (editingShop && editingShop._id === shop._id) {
        setEditForm(prev => ({ ...prev, [actionType === 'status' ? 'status' : 'isFeatured']: actionValue }));
      }
    } catch (err) {
      toast.error(err?.data?.message || `Failed to update shop ${actionType}`);
    }
  };

  const handleDelete = async (shopId, shopName) => {
    if (!window.confirm(`Are you sure you want to remove "${shopName}"? This action is permanent.`)) return;
    try {
      await deleteShop(shopId).unwrap();
      toast.success('Shop removed successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove shop');
    }
  };

  const filteredShops = shops?.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8">
      {!hasMallContext && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-bold text-amber-600">
          Your Mall Admin account is not assigned to a mall yet. Ask a Super Admin to link your account to a mall.
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-text-main">
            {isMallAdmin ? 'Shops in My Mall' : 'All Shops Network'}
          </h3>
          <p className="text-sm text-text-muted mt-1">
            {isMallAdmin
              ? 'Monitor, moderate, and edit all shops registered in your mall'
              : 'Manage all shops across the entire platform'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isMallAdmin ? 'Register Shop' : 'Add Shop'}
          </button>
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.form
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onSubmit={handleCreate}
            className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 bg-bg-card shadow-xl"
          >
            <h4 className="text-lg font-black text-primary-500 flex items-center gap-2">
              <Store className="w-5 h-5" /> Register New Shop
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Shop Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main placeholder:text-text-muted"
                  placeholder="e.g. Nike Store"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main placeholder:text-text-muted"
                  placeholder="e.g. Fashion, Food"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Shop Type</label>
                <select
                  value={shopType}
                  onChange={(e) => setShopType(e.target.value)}
                  className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main cursor-pointer"
                >
                  <option value="Retail" className="bg-bg-card">Retail</option>
                  <option value="Restaurant" className="bg-bg-card">Restaurant</option>
                  <option value="Food Court" className="bg-bg-card">Food Court</option>
                  <option value="Cafe" className="bg-bg-card">Cafe</option>
                  <option value="Bakery" className="bg-bg-card">Bakery</option>
                  <option value="Juice Bar" className="bg-bg-card">Juice Bar</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Floor</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main placeholder:text-text-muted"
                  placeholder="e.g. Ground Floor, Floor 2"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Assign Shop Owner (Optional)</label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main cursor-pointer"
                >
                  <option value="" className="bg-bg-card">No owner yet</option>
                  {users?.map(u => (
                    <option key={u._id} value={u._id} className="bg-bg-card">
                      {u.name} ({u.email}){u.role === 'User' ? ' - promote to Shop Owner' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3.5 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-border-main"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
                Register Shop
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Search bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search shops by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main placeholder:text-text-muted"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-[1.5rem] border border-border-main flex items-center gap-4 bg-bg-card shadow-md">
          <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Total Shops</p>
            <p className="text-xl font-black text-text-main">{filteredShops.length}</p>
          </div>
        </div>
        <div className="glass-card p-5 rounded-[1.5rem] border border-border-main flex items-center gap-4 bg-bg-card shadow-md">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Active</p>
            <p className="text-xl font-black text-text-main">{filteredShops.filter(s => s.status === 'Active' || (s.isActive !== false && !s.status)).length}</p>
          </div>
        </div>
        <div className="glass-card p-5 rounded-[1.5rem] border border-border-main flex items-center gap-4 bg-bg-card shadow-md">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Featured</p>
            <p className="text-xl font-black text-text-main">{filteredShops.filter(s => s.isFeatured).length}</p>
          </div>
        </div>
        <div className="glass-card p-5 rounded-[1.5rem] border border-border-main flex items-center gap-4 bg-bg-card shadow-md">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Categories</p>
            <p className="text-xl font-black text-text-main">{new Set(filteredShops.map(s => s.category)).size}</p>
          </div>
        </div>
      </div>

      {/* Shops Grid */}
      {isLoadingShops ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-bg-sub rounded-[2rem] animate-pulse border border-border-main" />
          ))}
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border-main rounded-[2.5rem] bg-bg-sub space-y-4">
          <Store className="w-16 h-16 text-primary-500/40 mx-auto" />
          <h3 className="text-2xl font-black text-text-main">
            {searchQuery ? 'No shops matched your search' : 'No shops registered yet'}
          </h3>
          <p className="text-text-muted max-w-sm mx-auto font-medium">
            {isMallAdmin
              ? 'No shops have been registered in your mall yet. Click "Register Shop" to add the first one.'
              : 'No shops found on the platform.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map(shop => (
            <motion.div
              key={shop._id}
              whileHover={{ y: -4 }}
              className="glass-card rounded-[2rem] border border-border-main hover:border-primary-500/20 transition-all overflow-hidden group flex flex-col bg-bg-card shadow-xl relative"
            >
              {/* Featured Badge */}
              {shop.isFeatured && (
                <div className="absolute top-3 right-3 z-10 bg-yellow-500 text-white p-1.5 rounded-full shadow-lg shadow-yellow-500/20" title="Featured Shop">
                  <Star className="w-4 h-4 fill-white" />
                </div>
              )}

              {/* Banner / Image */}
              <div className="h-36 bg-bg-sub flex items-center justify-center relative overflow-hidden">
                {shop.banner || shop.image ? (
                  <img src={shop.banner || shop.image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Store className="w-10 h-10 text-primary-500/30" />
                )}
                <div className="absolute top-3 left-3 z-10">
                  <ShopStatusBadge status={shop.status} isActive={shop.isActive} />
                </div>
                {/* Logo Overlay */}
                {shop.image && shop.banner && (
                  <div className="absolute -bottom-6 left-5 w-12 h-12 rounded-xl border-2 border-bg-card overflow-hidden bg-bg-sub shadow-lg z-20">
                    <img src={shop.image} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className={shop.image && shop.banner ? "pt-2" : ""}>
                  <span className="text-[10px] text-primary-500 font-black uppercase tracking-widest">{shop.category}</span>
                  <h4 className="text-lg font-black text-text-main mt-1 truncate">{shop.name}</h4>
                  {shop.description && (
                    <p className="text-xs text-text-muted line-clamp-2 mt-1">{shop.description}</p>
                  )}
                  {shop.floor && (
                    <p className="text-xs text-text-muted font-medium flex items-center gap-1 mt-2">
                      <MapPin className="w-3 h-3 text-primary-500" /> {shop.floor}
                      {shop.timings?.open && (
                        <span className="ml-2 pl-2 border-l border-border-main flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary-500" /> {shop.timings.open} - {shop.timings.close}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border-main">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1 truncate max-w-[120px]">
                    <MapPin className="w-3 h-3" />
                    {shop.mall?.name || 'Unassigned'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(shop)}
                      className="px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500 hover:text-white text-primary-500 text-xs font-black rounded-xl transition-all border border-primary-500/20 flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(shop._id, shop.name)}
                      disabled={isDeleting}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-xs font-black rounded-xl transition-all border border-red-500/20 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Shop Modal */}
      <AnimatePresence>
        {editingShop && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-card w-full max-w-4xl rounded-[2.5rem] border border-border-main shadow-2xl p-8 space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border-main pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-500 font-bold">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-main">Edit Shop Configuration</h3>
                    <p className="text-xs text-text-muted">Modify store profile, branding, operational status, and tenant details</p>
                  </div>
                </div>
                <button onClick={() => setEditingShop(null)} className="p-2 hover:bg-bg-sub rounded-full transition-colors text-text-muted hover:text-text-main">✕</button>
              </div>

              {/* Quick Action Directives */}
              <div className="p-4 bg-bg-sub border border-border-main rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-text-main">Operational Status Directives</h4>
                  <p className="text-xs text-text-muted">Instantly change store visibility, verification, or feature placement</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAction(editingShop, 'status', 'Active')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      editForm.status === 'Active'
                        ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                        : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white'
                    }`}
                  >
                    Approve / Active
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction(editingShop, 'status', 'Suspended')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      editForm.status === 'Suspended'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                        : 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500 hover:text-white'
                    }`}
                  >
                    Suspend
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction(editingShop, 'status', 'Closed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      editForm.status === 'Closed'
                        ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    Close Store
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction(editingShop, 'featured', !editForm.isFeatured)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-1 ${
                      editForm.isFeatured
                        ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500 hover:text-white'
                    }`}
                  >
                    <Star className="w-3 h-3" /> {editForm.isFeatured ? 'Featured' : 'Feature Shop'}
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleUpdateShop} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Shop Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Shop Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="Shop Name"
                      required
                    />
                  </div>
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Category</label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="Category"
                      required
                    />
                  </div>
                  {/* Shop Type */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Shop Type</label>
                    <select
                      value={editForm.shopType}
                      onChange={(e) => setEditForm({ ...editForm, shopType: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main cursor-pointer"
                    >
                      <option value="Retail" className="bg-bg-card">Retail</option>
                      <option value="Restaurant" className="bg-bg-card">Restaurant</option>
                      <option value="Food Court" className="bg-bg-card">Food Court</option>
                      <option value="Cafe" className="bg-bg-card">Cafe</option>
                      <option value="Bakery" className="bg-bg-card">Bakery</option>
                      <option value="Juice Bar" className="bg-bg-card">Juice Bar</option>
                    </select>
                  </div>
                  {/* Floor */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Location / Floor</label>
                    <input
                      type="text"
                      value={editForm.floor}
                      onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="Floor Location"
                    />
                  </div>
                  {/* Owner */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Assigned Owner</label>
                    <select
                      value={editForm.ownerId}
                      onChange={(e) => setEditForm({ ...editForm, ownerId: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main cursor-pointer"
                    >
                      <option value="" className="bg-bg-card">Unassigned</option>
                      {users?.map(u => (
                        <option key={u._id} value={u._id} className="bg-bg-card">
                          {u.name} ({u.email}){u.role === 'User' ? ' - promote to Shop Owner' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Contact Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="e.g. +1 234 567 890"
                    />
                  </div>
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Contact Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="e.g. contact@store.com"
                    />
                  </div>
                  {/* Open Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Opening Time</label>
                    <input
                      type="text"
                      value={editForm.openTime}
                      onChange={(e) => setEditForm({ ...editForm, openTime: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="e.g. 10:00 AM"
                    />
                  </div>
                  {/* Close Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Closing Time</label>
                    <input
                      type="text"
                      value={editForm.closeTime}
                      onChange={(e) => setEditForm({ ...editForm, closeTime: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="e.g. 10:00 PM"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Shop Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                    placeholder="Provide a compelling description of the store, its offerings, and brand values..."
                  />
                </div>

                {/* Branding / Images */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Logo Upload Preview */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Shop Logo URL</label>
                    <input
                      type="text"
                      value={editForm.image}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="https://example.com/logo.png"
                    />
                    {editForm.image && (
                      <div className="mt-2 w-16 h-16 rounded-2xl border border-border-main overflow-hidden bg-bg-sub flex items-center justify-center shadow-md">
                        <img src={editForm.image} alt="Logo Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Banner Upload Preview */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted">Shop Banner URL</label>
                    <input
                      type="text"
                      value={editForm.banner}
                      onChange={(e) => setEditForm({ ...editForm, banner: e.target.value })}
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                      placeholder="https://example.com/banner.jpg"
                    />
                    {editForm.banner && (
                      <div className="mt-2 h-16 w-full rounded-2xl border border-border-main overflow-hidden bg-bg-sub flex items-center justify-center shadow-md">
                        <img src={editForm.banner} alt="Banner Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-2 pt-2 border-t border-border-main">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main cursor-pointer"
                  >
                    <option value="Active" className="bg-bg-card">Active</option>
                    <option value="Pending" className="bg-bg-card">Pending</option>
                    <option value="Suspended" className="bg-bg-card">Suspended</option>
                    <option value="Closed" className="bg-bg-card">Closed</option>
                  </select>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-border-main">
                  <button
                    type="button"
                    onClick={() => setEditingShop(null)}
                    className="px-6 py-3.5 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-border-main"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10 flex items-center gap-2"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopManager;
