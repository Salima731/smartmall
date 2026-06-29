import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useCreateOfferMutation, useGetOffersQuery, useGetOffersByMallQuery, useGetOffersByShopQuery, useUpdateOfferMutation, useDeleteOfferMutation } from '../features/offers/offerApiSlice';
import { useGetProductsByShopQuery } from '../features/products/productApiSlice';
import { useGetShopsByMallQuery } from '../features/shops/shopApiSlice';
import { 
  Bell, Plus, Loader2, Image as ImageIcon, Sparkles, Tag, 
  Calendar, Clock, Target, ShieldAlert, Check, X, Store, ShoppingBag,
  Zap, UploadCloud, Edit, Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';

const CATEGORIES = ['Fashion', 'Electronics', 'Food', 'Shoes', 'Gaming', 'General'];
const OFFER_TYPES = ['Flash Sale', 'Festival Offer', 'Buy 1 Get 1', 'Weekend Deal', 'Clearance Sale'];
const STATUSES = ['Draft', 'Active', 'Scheduled', 'Expired'];
const AUDIENCES = ['All Users', 'Premium Users', 'New Users'];

const OfferStudioModal = ({ shopId, mallId, onClose, initialData = null }) => {
  const [createOffer, { isLoading: isCreating }] = useCreateOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const isLoading = isCreating || isUpdating;

  const { data: shops } = useGetShopsByMallQuery(mallId, { skip: !!shopId || !mallId });
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      startDate: initialData.startDate?.split('T')[0] || '',
      endDate: initialData.endDate?.split('T')[0] || '',
      shopId: initialData.shop?._id || shopId || '',
      relatedProducts: initialData.relatedProducts || []
    } : {
      title: '',
      description: '',
      discountPercentage: 10,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      category: 'General',
      couponCode: '',
      offerType: 'Festival Offer',
      status: 'Active',
      redemptionLimit: '',
      termsAndConditions: '',
      isFeatured: false,
      sendNotification: true,
      audience: 'All Users',
      banner: '',
      shopId: shopId || '',
      relatedProducts: []
    }
  });

  const watchAllFields = watch();
  const selectedShopId = watch('shopId');
  const { data: products } = useGetProductsByShopQuery(selectedShopId, { skip: !selectedShopId });
  
  const [previewImage, setPreviewImage] = useState(initialData?.banner || null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setValue('banner', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (initialData) {
        await updateOffer({
          id: initialData._id,
          ...data,
          mallId,
          redemptionLimit: data.redemptionLimit ? Number(data.redemptionLimit) : undefined,
        }).unwrap();
        toast.success('Offer successfully updated!');
      } else {
        await createOffer({
          ...data,
          mallId,
          redemptionLimit: data.redemptionLimit ? Number(data.redemptionLimit) : undefined,
        }).unwrap();
        toast.success('Offer successfully deployed!');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to deploy offer');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-bg-card w-full max-w-7xl max-h-[90vh] rounded-[2.5rem] border border-border-main shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-main bg-bg-sub">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-main">Offer Studio Pro</h2>
              <p className="text-xs text-text-muted">Create high-conversion promotional campaigns</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-sub/80 rounded-full transition-colors text-text-muted hover:text-text-main border border-border-main">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 xl:grid-cols-12 gap-8">
          <form id="offerForm" onSubmit={handleSubmit(onSubmit)} className="xl:col-span-8 space-y-8">
            
            {/* Banner Upload */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-primary-500">Campaign Banner</label>
              <div className="relative border-2 border-dashed border-border-main hover:border-primary-500/50 rounded-[2rem] p-10 text-center transition-all group bg-bg-sub cursor-pointer">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" onChange={handleImageUpload} />
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="h-40 mx-auto rounded-xl object-cover shadow-lg" />
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8 text-primary-500" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-text-main">Drag & Drop Image</p>
                      <p className="text-xs text-text-muted">or click to browse from device</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Offer Title</label>
                <input {...register('title', { required: true })} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main placeholder:text-text-muted" placeholder="e.g., Cyber Monday Blockbuster" />
                {errors.title && <span className="text-xs text-red-500">Title is required</span>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Discount %</label>
                <input type="number" {...register('discountPercentage')} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-primary-500 placeholder:text-text-muted" placeholder="50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Start Date</label>
                <input type="date" {...register('startDate')} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">End Date</label>
                <input type="date" {...register('endDate')} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Coupon Code</label>
                <input {...register('couponCode')} className="w-full bg-bg-sub border border-dashed border-primary-500/50 rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-black text-center uppercase tracking-widest text-primary-500 placeholder:text-text-muted" placeholder="CYBER50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Category</label>
                <select {...register('category')} className="w-full bg-bg-card border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main cursor-pointer">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-bg-card">{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Offer Type</label>
                <select {...register('offerType')} className="w-full bg-bg-card border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main cursor-pointer">
                  {OFFER_TYPES.map(t => <option key={t} value={t} className="bg-bg-card">{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Audience</label>
                <select {...register('audience')} className="w-full bg-bg-card border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main cursor-pointer">
                  {AUDIENCES.map(a => <option key={a} value={a} className="bg-bg-card">{a}</option>)}
                </select>
              </div>
            </div>

            {/* Shop Selection for Mall Admin */}
            {!shopId && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Select Shop (Optional)</label>
                <select {...register('shopId')} className="w-full bg-bg-card border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main cursor-pointer">
                  <option value="" className="bg-bg-card">Mall Exclusive (No specific shop)</option>
                  {shops?.map(s => <option key={s._id} value={s._id} className="bg-bg-card">{s.name}</option>)}
                </select>
              </div>
            )}

            {/* Related Products Multi-Select */}
            {products && products.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-primary-500">Target Products</label>
                <div className="bg-bg-sub border border-border-main rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2">
                  {products.map(product => (
                    <label key={product._id} className="flex items-center p-3 hover:bg-bg-card rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border-main">
                      <input type="checkbox" value={product._id} {...register('relatedProducts')} className="w-5 h-5 rounded border-border-main text-primary-500 focus:ring-primary-500 bg-bg-sub" />
                      <div className="ml-3 flex-1 flex justify-between items-center">
                        <span className="font-bold text-sm text-text-main">{product.name}</span>
                        <span className="text-xs font-black text-primary-500">${product.price}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Marketing Copy (Description)</label>
              <textarea {...register('description', { required: true })} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none h-24 font-medium leading-relaxed placeholder:text-text-muted text-text-main" placeholder="Convince your customers..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Redemption Limit</label>
                <input type="number" {...register('redemptionLimit')} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main placeholder:text-text-muted" placeholder="e.g. 100" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Status</label>
                <select {...register('status')} className="w-full bg-bg-card border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main cursor-pointer">
                  {STATUSES.map(s => <option key={s} value={s} className="bg-bg-card">{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Terms & Conditions</label>
              <textarea {...register('termsAndConditions')} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none h-20 text-xs text-text-muted placeholder:text-text-muted" placeholder="Valid until supplies last. One per customer." />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-primary-600/5 border border-primary-500/20 rounded-2xl">
              <label className="flex items-center space-x-3 cursor-pointer flex-1">
                <input type="checkbox" {...register('isFeatured')} className="w-5 h-5 rounded text-primary-500" />
                <span className="font-bold text-sm text-text-main">Feature on Homepage</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer flex-1">
                <input type="checkbox" {...register('sendNotification')} className="w-5 h-5 rounded text-primary-500" />
                <span className="font-bold text-sm text-text-main">Send Push Notification</span>
              </label>
            </div>
          </form>

          {/* Right Column: Live Preview */}
          <div className="xl:col-span-4 space-y-6 relative">
            <div className="sticky top-0 space-y-6">
              
              {/* Live Preview Card */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary-500 flex items-center"><Target className="w-4 h-4 mr-2" /> Live Preview</h3>
                <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-border-main relative bg-bg-card">
                  <div className="h-40 bg-gradient-to-br from-primary-600 to-purple-800 relative overflow-hidden flex items-center justify-center">
                    {previewImage ? (
                      <img src={previewImage} alt="Banner" className="w-full h-full object-cover opacity-80 mix-blend-overlay" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-white/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 z-10">
                       <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/20">
                         {watchAllFields.offerType || 'Offer'}
                       </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="text-3xl font-black text-primary-500 tracking-tighter leading-none">{watchAllFields.discountPercentage || 0}% OFF</h4>
                      <p className="text-lg font-bold text-text-main mt-1 truncate">{watchAllFields.title || 'Your Offer Title'}</p>
                    </div>
                    <p className="text-xs text-text-muted line-clamp-2">{watchAllFields.description || 'Description will appear here...'}</p>
                    
                    {watchAllFields.couponCode && (
                      <div className="py-2 px-4 border border-dashed border-primary-500/50 rounded-xl bg-primary-500/5 text-center">
                        <span className="font-black tracking-widest text-primary-500 uppercase">{watchAllFields.couponCode}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                      <Clock className="w-3 h-3 mr-1" /> Ends: {watchAllFields.endDate || 'TBD'}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Assistant */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black flex items-center text-indigo-500">
                  <Sparkles className="w-4 h-4 mr-2" /> AI Smart Suggestions
                </h3>
                <ul className="space-y-3 text-xs font-medium text-text-muted">
                  <li className="flex items-start"><Check className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Consider adding a "Clearance Sale" tag for out-of-season items.</li>
                  <li className="flex items-start"><Check className="w-4 h-4 mr-2 text-green-500 shrink-0" /> 20-30% discounts have the highest conversion rate for {watchAllFields.category || 'this category'}.</li>
                  <li className="flex items-start"><Check className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Target "Premium Users" to reward loyalty.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-main bg-bg-sub flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-text-muted hover:text-text-main hover:bg-bg-card transition-colors border border-border-main shadow-sm">
            Cancel
          </button>
          <button type="submit" form="offerForm" disabled={isLoading} className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl font-black shadow-xl shadow-primary-500/20 flex items-center space-x-2 transition-all">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            <span>Deploy Campaign</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const OfferManager = ({ shopId, mallId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const { userInfo } = useSelector((state) => state.auth);
  
  const { data: offers } = useGetOffersQuery('All');
  const { data: mallOffers } = useGetOffersByMallQuery(mallId, { skip: !mallId || !!shopId });
  const { data: shopOffers } = useGetOffersByShopQuery(shopId, { skip: !shopId });
  
  const [deleteOffer] = useDeleteOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();

  const isSuperAdmin = userInfo?.role === 'Super Admin';
  const isMallAdmin = (!shopId && !!mallId) || isSuperAdmin;
  const myOffers = (shopId ? shopOffers : (mallId ? mallOffers : offers)) || [];

  const handleModerateOffer = async (offer, newStatus, isFeatured = undefined) => {
    try {
      const payload = { id: offer._id };
      if (newStatus) payload.status = newStatus;
      if (isFeatured !== undefined) payload.isFeatured = isFeatured;
      await updateOffer(payload).unwrap();
      toast.success('Offer updated successfully');
    } catch (err) {
      toast.error('Failed to update offer');
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await deleteOffer(id).unwrap();
        toast.success('Offer deleted');
      } catch (err) {
        toast.error('Failed to delete offer');
      }
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingOffer(null);
  };

  return (
    <div className="space-y-8">
      {!isMallAdmin && (
        <div 
          onClick={() => { setEditingOffer(null); setIsModalOpen(true); }}
          className="glass-card border border-border-main rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-primary-500/50 transition-all group cursor-pointer bg-bg-card shadow-xl"
        >
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary-500/20 border border-primary-500/20">
            <Sparkles className="w-10 h-10 text-primary-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-text-main group-hover:text-primary-500 transition-colors">Offer Studio Pro</h3>
            <p className="text-text-muted mt-2 font-medium">Design, preview, and launch AI-optimized offers.</p>
          </div>
          <button className="mt-4 px-8 py-3 bg-bg-sub border border-border-main group-hover:bg-primary-600 group-hover:border-primary-500 group-hover:text-white text-text-main rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl">
            Launch Studio
          </button>
        </div>
      )}

      {myOffers.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-text-main">Active Campaigns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {myOffers.map(offer => (
              <div key={offer._id} className="glass-card p-6 rounded-3xl border border-border-main flex flex-col justify-between group relative overflow-hidden bg-bg-card shadow-xl">
                <div className="absolute top-0 right-0 p-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {isMallAdmin && (
                    <>
                      <button onClick={() => handleModerateOffer(offer, 'Approved')} className="p-2 bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-colors" title="Approve">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleModerateOffer(offer, 'Suspended')} className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-colors" title="Suspend">
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleModerateOffer(offer, null, !offer.isFeatured)} className={`p-2 hover:text-white rounded-xl transition-colors ${offer.isFeatured ? 'bg-yellow-500 text-white' : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500'}`} title={offer.isFeatured ? 'Unfeature' : 'Feature'}>
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {!isMallAdmin && (
                    <>
                      <button onClick={() => handleEdit(offer)} className="p-2 bg-primary-500/20 hover:bg-primary-500 text-primary-500 hover:text-white rounded-xl transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(offer._id)} className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-primary-500/20 text-primary-500 text-[10px] font-black uppercase rounded-md">{offer.offerType || 'Offer'}</span>
                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md ${
                      (offer.status === 'Active' || offer.status === 'Approved') ? 'bg-green-500/20 text-green-500' : 
                      offer.status === 'Suspended' ? 'bg-red-500/20 text-red-500' : 
                      offer.status === 'Under Review' ? 'bg-orange-500/20 text-orange-500' : 
                      'bg-bg-sub text-text-muted border border-border-main'}`}>
                      {offer.status === 'Approved' ? 'Verified by Mall Admin' : (offer.status || 'Active')}
                    </span>
                    {offer.isFeatured && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase rounded-md">
                        Featured
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-black text-text-main">{offer.title}</h4>
                  <p className="text-3xl font-black text-primary-500 mt-2">{offer.discountPercentage}% OFF</p>
                </div>
                <div className="mt-4 pt-4 border-t border-border-main flex justify-between items-center text-xs text-text-muted">
                  <span className="flex items-center"><Tag className="w-3 h-3 mr-1" /> {offer.couponCode || 'No Code'}</span>
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(offer.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 rounded-[2.5rem] border border-border-main text-center bg-bg-card shadow-xl">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Tag className="w-10 h-10 text-primary-500" />
          </div>
          <h3 className="text-2xl font-black text-text-main mb-2">
            {isMallAdmin ? 'No Offers to Monitor' : 'No Active Campaigns'}
          </h3>
          <p className="text-text-muted max-w-md mx-auto font-medium">
            {isMallAdmin 
              ? "There are currently no promotional offers from any shops in your mall. When shop owners deploy campaigns, they will appear here for your moderation." 
              : "You don't have any promotional offers running at the moment. Launch the Offer Studio Pro above to deploy your first campaign!"}
          </p>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <OfferStudioModal 
            shopId={shopId} 
            mallId={mallId} 
            initialData={editingOffer}
            onClose={handleClose} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfferManager;
