import { useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { 
  useGetProductsByShopQuery, 
  useGetProductsByMallQuery,
  useGetProductsQuery,
  useCreateProductMutation, 
  useUpdateProductMutation, 
  useDeleteProductMutation 
} from '../features/products/productApiSlice';
import { useGetOffersQuery } from '../features/offers/offerApiSlice';
import { 
  ShoppingBag, Plus, Loader2, Image as ImageIcon, Sparkles, Tag, 
  Edit, Trash2, Search, Filter, SlidersHorizontal, Eye, IndianRupee, 
  Package, Check, X, Grid, List, TrendingUp, Heart, Calendar, 
  UploadCloud, ChevronLeft, ChevronRight, BarChart3, Info, ShieldAlert,
  EyeOff, RotateCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';

const CATEGORIES = ['Fashion', 'Electronics', 'Food', 'Shoes', 'Gaming', 'Home', 'Beauty', 'General'];
const STATUSES = ['Active', 'Out of Stock', 'Hidden', 'Draft'];

const ProductStudioModal = ({ shopId, mallId, onClose, initialData = null }) => {
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const isLoading = isCreating || isUpdating;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      price: initialData.price || 0,
      discountPrice: initialData.discountPrice || '',
      countInStock: initialData.countInStock || 0,
      tags: initialData.tags || [],
    } : {
      name: '',
      description: '',
      category: 'General',
      brand: '',
      price: '',
      discountPrice: '',
      countInStock: 50,
      status: 'Active',
      tags: [],
      image: '',
      gallery: []
    }
  });

  const watchAllFields = watch();
  const [previewImage, setPreviewImage] = useState(initialData?.image || null);
  const [galleryPreviews, setGalleryPreviews] = useState(initialData?.gallery || []);
  const [tagInput, setTagInput] = useState('');
  const tags = watch('tags') || [];

  const handleMainImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setValue('image', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews(prev => {
          const updated = [...prev, reader.result];
          setValue('gallery', updated);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index) => {
    setGalleryPreviews(prev => {
      const updated = prev.filter((_, i) => i !== index);
      setValue('gallery', updated);
      return updated;
    });
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        const updatedTags = [...tags, tagInput.trim()];
        setValue('tags', updatedTags);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setValue('tags', updatedTags);
  };

  const onSubmit = async (data) => {
    try {
      if (initialData) {
        await updateProduct({
          id: initialData._id,
          ...data,
          shopId,
          mallId,
          price: Number(data.price),
          discountPrice: data.discountPrice ? Number(data.discountPrice) : undefined,
          countInStock: Number(data.countInStock)
        }).unwrap();
        toast.success('Product updated successfully!');
      } else {
        await createProduct({
          ...data,
          shopId,
          mallId,
          price: Number(data.price),
          discountPrice: data.discountPrice ? Number(data.discountPrice) : undefined,
          countInStock: Number(data.countInStock)
        }).unwrap();
        toast.success('Product added successfully!');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save product');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-bg-main/90 backdrop-blur-xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-bg-card w-full max-w-7xl rounded-[2.5rem] border border-border-main shadow-2xl overflow-hidden flex flex-col relative my-8 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-main bg-bg-sub">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-main">{initialData ? 'Edit Product Studio' : 'Product Studio Pro'}</h2>
              <p className="text-xs text-text-muted">Launch and manage high-quality retail products</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-full transition-colors text-text-muted hover:text-text-main">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 xl:grid-cols-12 gap-8 bg-bg-main">
          <form id="productForm" onSubmit={handleSubmit(onSubmit)} className="xl:col-span-8 space-y-8">
            
            {/* Image & Gallery Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Image */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-primary-500">Main Product Image</label>
                <div className="relative border-2 border-dashed border-border-main hover:border-primary-500/50 rounded-[2rem] p-6 text-center transition-all group bg-bg-sub cursor-pointer h-48 flex flex-col justify-center items-center overflow-hidden">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" onChange={handleMainImageUpload} />
                  {previewImage ? (
                    <img src={previewImage} alt="Main Preview" className="absolute inset-0 w-full h-full object-cover rounded-[2rem] shadow-lg" />
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="w-8 h-8 text-primary-500 mx-auto group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="font-bold text-sm text-text-main">Upload Main Cover</p>
                        <p className="text-[10px] text-text-muted">JPG, PNG, WEBP supported</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery Images */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-primary-500">Product Gallery Upload</label>
                <div className="border border-border-main rounded-[2rem] p-4 bg-bg-sub min-h-[12rem] flex flex-col justify-between">
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                    {galleryPreviews.map((url, i) => (
                      <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-border-main group">
                        <img src={url} alt="gallery" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removeGalleryImage(i)}
                          className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {galleryPreviews.length === 0 && (
                      <p className="text-xs text-text-muted font-bold m-auto">No gallery images uploaded.</p>
                    )}
                  </div>
                  <div className="relative border border-dashed border-border-main hover:border-primary-500/50 rounded-xl py-3 text-center transition-all bg-bg-card cursor-pointer mt-2">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" multiple onChange={handleGalleryUpload} />
                    <span className="text-xs font-bold text-text-main flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4 text-primary-500" /> Add to Gallery
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Product Name</label>
                <input {...register('name', { required: true })} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main" placeholder="e.g. UltraBoost Running Shoes" />
                {errors.name && <span className="text-xs text-red-500">Name is required</span>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Brand Name</label>
                <input {...register('brand')} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main" placeholder="e.g. Adidas" />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Original Price (₹)</label>
                <input type="number" step="0.01" {...register('price', { required: true })} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main" placeholder="120.00" />
                {errors.price && <span className="text-xs text-red-500">Price is required</span>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Discount Price (₹)</label>
                <input type="number" step="0.01" {...register('discountPrice')} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-primary-500" placeholder="99.99" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Stock Quantity</label>
                <input type="number" {...register('countInStock', { required: true })} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main" placeholder="50" />
              </div>
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Category</label>
                <select {...register('category')} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Product Status</label>
                <select {...register('status')} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none font-bold text-text-main">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Product Tags</label>
              <div className="bg-bg-sub border border-border-main rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-primary-500/10 text-primary-500 text-xs font-bold rounded-full border border-primary-500/20">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-text-main transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-xs text-text-muted font-medium">No tags added yet.</span>
                  )}
                </div>
                <input 
                  type="text" 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full bg-transparent border-t border-border-main pt-3 outline-none font-medium text-xs text-text-main placeholder:text-text-muted" 
                  placeholder="Type tag and press Enter..." 
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Product Description</label>
              <textarea {...register('description', { required: true })} className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none h-32 font-medium leading-relaxed placeholder:text-text-muted/40 text-text-main" placeholder="Describe key product benefits and features..." />
              {errors.description && <span className="text-xs text-red-500">Description is required</span>}
            </div>

          </form>

          {/* Right Column: Live Card Preview */}
          <div className="xl:col-span-4 space-y-6 relative">
            <div className="sticky top-0 space-y-6">
              
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary-500 flex items-center"><Eye className="w-4 h-4 mr-2" /> Live Card Preview</h3>
                
                <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-border-main relative group">
                  <div className="h-60 bg-gradient-to-br from-primary-600 to-purple-800 relative overflow-hidden flex items-center justify-center">
                    {previewImage ? (
                      <img src={previewImage} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-white/20" />
                    )}
                    <div className="absolute top-4 left-4 z-10">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20 backdrop-blur-md text-white ${
                        watchAllFields.status === 'Active' ? 'bg-green-500/20 border-green-500/20 text-green-400' :
                        watchAllFields.status === 'Out of Stock' ? 'bg-red-500/20 border-red-500/20 text-red-400' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {watchAllFields.status || 'Active'}
                      </span>
                    </div>
                    {watchAllFields.brand && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="px-2.5 py-1 bg-black/60 rounded-lg text-[9px] font-black text-white tracking-widest uppercase">
                          {watchAllFields.brand}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 space-y-4 bg-bg-card">
                    <div>
                      <span className="text-[10px] text-primary-500 font-bold uppercase tracking-wider">{watchAllFields.category || 'Retail'}</span>
                      <h4 className="text-xl font-black text-text-main mt-1 truncate">{watchAllFields.name || 'UltraBoost Sneaker'}</h4>
                    </div>

                    <div className="flex items-baseline space-x-2">
                      {watchAllFields.discountPrice ? (
                        <>
                          <span className="text-2xl font-black text-primary-500">₹{watchAllFields.discountPrice}</span>
                          <span className="text-sm font-medium text-text-muted line-through">₹{watchAllFields.price || 0}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-black text-text-main">₹{watchAllFields.price || '0.00'}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted font-bold">
                      <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5 text-primary-500" /> Stock: {watchAllFields.countInStock || 0}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary-500" /> New Campaign</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black flex items-center text-indigo-500">
                  <Sparkles className="w-4 h-4 mr-2" /> Live Analytics Simulation
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-bg-sub rounded-2xl p-3 border border-border-main">
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Views Simulation</p>
                    <p className="text-xl font-black text-text-main mt-1">{initialData?.views || '0'}</p>
                  </div>
                  <div className="bg-bg-sub rounded-2xl p-3 border border-border-main">
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Est. Conversions</p>
                    <p className="text-xl font-black text-green-500 mt-1">{initialData?.sales || '0'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-main bg-bg-sub flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-text-muted hover:text-text-main hover:bg-bg-card transition-colors">
            Cancel
          </button>
          <button type="submit" form="productForm" disabled={isLoading} className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl font-black shadow-xl shadow-primary-500/20 flex items-center space-x-2 transition-all">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span>{initialData ? 'Save Product' : 'Deploy Product'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const DeleteConfirmationModal = ({ productName, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-xl">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-bg-card border border-red-500/20 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative"
    >
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <Trash2 className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-2xl font-black text-text-main">Delete Product?</h3>
      <p className="text-text-muted mt-2 font-medium">
        Are you sure you want to delete <span className="text-text-main font-bold">"{productName}"</span>? This action is permanent and cannot be undone.
      </p>
      <div className="mt-8 flex justify-end gap-4">
        <button onClick={onClose} className="px-5 py-2.5 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-xl font-bold transition-all border border-border-main">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black transition-all shadow-lg shadow-red-600/20">
          Confirm Delete
        </button>
      </div>
    </motion.div>
  </div>
);

const ProductManager = ({ shopId, mallId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(5000);

  const resultsRef = useRef(null);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const scrollToResults = () => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsHighlighting(true);
      const timer = setTimeout(() => setIsHighlighting(false), 1500);
      return () => clearTimeout(timer);
    }
  };

  // Fetch by shop (Shop Owner) OR by mall (Mall Admin)
  const { userInfo } = useSelector((state) => state.auth);

  // Fetch by shop (Shop Owner) OR by mall (Mall Admin) OR all (Super Admin)
  const { data: shopProducts, isLoading: shopLoading } = useGetProductsByShopQuery(shopId, { skip: !shopId });
  const { data: mallProducts, isLoading: mallLoading } = useGetProductsByMallQuery(mallId, { skip: !mallId || !!shopId });
  const { data: allProducts, isLoading: allLoading } = useGetProductsQuery(undefined, { skip: !!shopId || !!mallId });
  
  const products = shopId ? shopProducts : (mallId ? mallProducts : allProducts);
  const isLoading = shopLoading || mallLoading || allLoading;

  // Mall Admin or Super Admin cannot create/edit products — only moderate (hide/show)
  const isMallAdmin = (!shopId && !!mallId) || userInfo?.role === 'Super Admin';
  const { data: offers } = useGetOffersQuery('All');
  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  const handleModerateProduct = async (product, newStatus) => {
    try {
      await updateProduct({ id: product._id, status: newStatus }).unwrap();
      toast.success(`Product marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to moderate product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct._id).unwrap();
      toast.success('Product deleted successfully');
      setDeletingProduct(null);
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products
      .filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const matchesStatus = selectedStatus === 'All' || product.status === selectedStatus;
        const matchesPrice = (product.discountPrice || product.price || 0) <= maxPrice;
        return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return (a.discountPrice || a.price) - (b.discountPrice || b.price);
        if (sortBy === 'price-high') return (b.discountPrice || b.price) - (a.discountPrice || a.price);
        if (sortBy === 'popularity') return (b.views || 0) - (a.views || 0);
        return new Date(b.createdAt) - new Date(a.createdAt); // newest
      });
  }, [products, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Analytics helper calculations
  const analytics = useMemo(() => {
    if (!products) return { total: 0, outOfStock: 0, views: 0, sales: 0 };
    return {
      total: products.length,
      outOfStock: products.filter(p => p.status === 'Out of Stock' || p.countInStock <= 0).length,
      views: products.reduce((acc, curr) => acc + (curr.views || 0), 0),
      sales: products.reduce((acc, curr) => acc + (curr.sales || 0), 0),
    };
  }, [products]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-bg-sub rounded-3xl border border-border-main" />)}
        </div>
        <div className="h-96 bg-bg-sub rounded-3xl animate-pulse border border-border-main" />
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0">
      
      {/* Top Section: Full-Width Search Bar & Price Range Filter */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 shadow-2xl bg-bg-card">
        <div className="flex items-center space-x-3 border-b border-border-main pb-4">
          <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-500 font-bold">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main">Advanced Product Search & Filtering</h3>
            <p className="text-xs text-text-muted">Instantly query inventory by name, brand, tag, or price ceiling</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Full-width Search Bar */}
          <div className="lg:col-span-8 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-purple-500 rounded-2xl blur opacity-25 group-focus-within:opacity-75 transition duration-500" />
            <div className="relative flex items-center bg-bg-sub border border-border-main rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 transition-all">
              <div className="pl-5 pr-3 py-4 text-text-muted group-focus-within:text-primary-500 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Search products by name, tag, brand, description..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  scrollToResults();
                }}
                className="w-full bg-transparent py-4 pr-6 outline-none text-sm font-bold text-text-main placeholder:text-text-muted/50"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); scrollToResults(); }} className="pr-5 text-text-muted hover:text-text-main transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="lg:col-span-4 bg-bg-sub border border-border-main rounded-2xl p-4 space-y-2 flex flex-col justify-center shadow-inner">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
              <span className="text-text-muted flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-primary-500" /> Max Price Ceiling</span>
              <span className="text-primary-500 px-2.5 py-1 bg-primary-500/10 rounded-lg border border-primary-500/20">₹{maxPrice}</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="5000" 
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-2 bg-border-main rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Analytics Counter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-[2rem] border border-border-main flex items-center space-x-4 shadow-xl">
          <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Total Products</p>
            <p className="text-2xl font-black text-text-main mt-1">{analytics.total}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem] border border-border-main flex items-center space-x-4 shadow-xl">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Out of Stock</p>
            <p className="text-2xl font-black text-text-main mt-1">{analytics.outOfStock}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem] border border-border-main flex items-center space-x-4 shadow-xl">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Total Views</p>
            <p className="text-2xl font-black text-text-main mt-1">{analytics.views}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem] border border-border-main flex items-center space-x-4 shadow-xl">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Estimated Sales</p>
            <p className="text-2xl font-black text-green-500 mt-1">{analytics.sales}</p>
          </div>
        </div>
      </div>

      {/* Control Panel / Filters */}
      <div className="glass-card p-6 rounded-[2.5rem] border border-border-main space-y-6 shadow-xl">
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-500 font-bold">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-text-main">Catalog Management & Sorting</h3>
          </div>

          <div className="flex flex-wrap gap-4 items-center w-full xl:w-auto justify-end">
            {/* Category Filter */}
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none font-bold text-xs text-text-main"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            {/* Status Filter */}
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none font-bold text-xs text-text-main"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map(stat => <option key={stat} value={stat}>{stat}</option>)}
            </select>

            {/* Sort Filter */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-bg-sub border border-border-main rounded-2xl py-3.5 px-4 outline-none font-bold text-xs text-text-main"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popularity">Most Popular</option>
            </select>

            {/* Toggle View Mode */}
            <div className="flex items-center bg-bg-sub rounded-2xl p-1 border border-border-main">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-primary-500 text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Add product button — only visible for Shop Owner */}
            {!isMallAdmin && (
              <button 
                onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                className="px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl shadow-primary-500/10"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main product display */}
      <div ref={resultsRef} className={`transition-all duration-700 p-6 rounded-[2.5rem] scroll-mt-8 ${isHighlighting ? 'ring-4 ring-primary-500/50 bg-primary-500/5 shadow-2xl' : ''}`}>
        {/* Search Result Feedback */}
        {searchQuery && (
          <div className="mb-8 p-6 glass-card rounded-2xl border border-primary-500/30 bg-primary-500/10 flex items-center justify-between shadow-lg backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-500">
                <Search className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Active Search Filter</p>
                <p className="text-base font-black text-text-main mt-0.5">
                  Showing results for: <span className="text-primary-500 font-black">"{searchQuery}"</span>
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-4 py-2 bg-bg-card rounded-xl border border-border-main text-text-main shadow-sm">
              {filteredProducts.length} products found
            </span>
          </div>
        )}

        {filteredProducts.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProducts.map(product => {
                // Check if product is attached to any offers
                const attachedOffers = offers?.filter(o => o.relatedProducts?.includes(product._id)) || [];

                return (
                  <motion.div 
                    layout
                    key={product._id}
                    className="glass-card rounded-[2.5rem] border border-border-main overflow-hidden group hover:border-primary-500/40 transition-all flex flex-col justify-between shadow-xl relative bg-bg-card"
                  >
                    {/* Hover controls */}
                    <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isMallAdmin && (
                        <>
                          {/* Restore to Active — shown when product is Hidden or Suspended */}
                          {(product.status === 'Hidden' || product.status === 'Suspended') && (
                            <button 
                              onClick={() => handleModerateProduct(product, 'Active')}
                              className="p-2.5 bg-bg-sub/80 backdrop-blur-md border border-border-main hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-all shadow-lg"
                              title={`Restore to Active (currently ${product.status})`}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          {/* Hide — shown only when product is Active */}
                          {product.status === 'Active' && (
                            <button 
                              onClick={() => handleModerateProduct(product, 'Hidden')}
                              className="p-2.5 bg-bg-sub/80 backdrop-blur-md border border-border-main hover:bg-orange-500 text-text-main hover:text-white rounded-xl transition-all shadow-lg"
                              title="Hide Product"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          )}
                          {/* Suspend — shown only when product is Active */}
                          {product.status === 'Active' && (
                            <button 
                              onClick={() => handleModerateProduct(product, 'Suspended')}
                              className="p-2.5 bg-bg-sub/80 backdrop-blur-md border border-border-main hover:bg-red-600 text-text-main hover:text-white rounded-xl transition-all shadow-lg"
                              title="Suspend Product"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {!isMallAdmin && (
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2.5 bg-bg-sub/80 backdrop-blur-md border border-border-main hover:bg-primary-500 text-text-main hover:text-white rounded-xl transition-all shadow-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {!isMallAdmin && (
                        <button 
                          onClick={() => setDeletingProduct(product)}
                          className="p-2.5 bg-bg-sub/80 backdrop-blur-md border border-border-main hover:bg-red-600 text-text-main hover:text-white rounded-xl transition-all shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Image Area */}
                    <div className="h-56 bg-bg-sub relative overflow-hidden flex items-center justify-center border-b border-border-main">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-text-muted/30" />
                      )}
                      
                      <div className="absolute top-4 left-4 z-10">
                        <span className={`px-2.5 py-1 text-[9px] font-black tracking-widest uppercase rounded-full border backdrop-blur-md ${
                          product.status === 'Active' ? 'bg-green-500/20 border-green-500/30 text-green-500' :
                          product.status === 'Out of Stock' ? 'bg-red-500/20 border-red-500/30 text-red-500' :
                          product.status === 'Hidden' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' :
                          product.status === 'Suspended' ? 'bg-red-700/30 border-red-700/40 text-red-400' :
                          'bg-bg-sub/80 text-text-muted border-border-main'
                        }`}>
                          {product.status || 'Active'}
                        </span>
                      </div>

                      {product.brand && (
                        <div className="absolute bottom-4 left-4 z-10">
                          <span className="px-2.5 py-1 bg-bg-sub/90 backdrop-blur-md border border-border-main rounded-lg text-[9px] font-black text-text-main tracking-widest uppercase shadow-lg">
                            {product.brand}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info Area */}
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between bg-bg-card">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-primary-500 font-bold uppercase tracking-widest">{product.category}</span>
                          <span className="text-[10px] text-text-muted font-bold">{new Date(product.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-xl font-black text-text-main leading-tight truncate">{product.name}</h4>
                        <p className="text-xs text-text-muted line-clamp-2">{product.description}</p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-border-main">
                        <div className="flex justify-between items-center">
                          <div className="flex items-baseline space-x-2">
                            {product.discountPrice ? (
                              <>
                                <span className="text-2xl font-black text-primary-500">₹{product.discountPrice}</span>
                                <span className="text-xs font-bold text-text-muted line-through">₹{product.price}</span>
                              </>
                            ) : (
                              <span className="text-2xl font-black text-text-main">₹{product.price}</span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-text-muted bg-bg-sub border border-border-main px-2.5 py-1 rounded-lg">
                            Stock: {product.countInStock}
                          </span>
                        </div>

                        {/* Connected Offers Badge */}
                        {attachedOffers.length > 0 && (
                          <div className="flex items-center gap-1.5 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            <Tag className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest truncate">
                              Attached to: {attachedOffers[0].title}
                            </span>
                          </div>
                        )}

                        {/* Analytics Footer */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-main text-[10px] font-black uppercase tracking-widest text-text-muted">
                          <div className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-primary-500" /> {product.views || 0} Views</div>
                          <div className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-green-500" /> {product.sales || 0} Sales</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* Table View Mode */
          <div className="glass-card rounded-[2.5rem] border border-border-main overflow-hidden shadow-xl bg-bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-main bg-bg-sub text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <th className="p-6">Product</th>
                    <th className="p-6">Category</th>
                    <th className="p-6">Price</th>
                    <th className="p-6">Stock</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Performance</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {filteredProducts.map(product => (
                    <tr key={product._id} className="hover:bg-bg-sub/50 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-bg-sub overflow-hidden shrink-0 border border-border-main flex items-center justify-center">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-text-muted/40 m-auto" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-text-main">{product.name}</p>
                            <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">{product.brand || 'No Brand'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-sm font-bold text-text-main">{product.category}</td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          {product.discountPrice ? (
                            <>
                              <span className="text-sm font-black text-primary-500">₹{product.discountPrice}</span>
                              <span className="text-[10px] text-text-muted line-through">₹{product.price}</span>
                            </>
                          ) : (
                            <span className="text-sm font-black text-text-main">₹{product.price}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-6 text-sm font-bold text-text-main">
                        <span className={`px-2.5 py-1 rounded-lg text-xs border ${product.countInStock <= 5 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-bg-sub text-text-main border-border-main'}`}>
                          {product.countInStock}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={`px-2.5 py-1 text-[9px] font-black tracking-widest uppercase rounded-full border ${
                          product.status === 'Active' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                          product.status === 'Out of Stock' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                          product.status === 'Hidden' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                          product.status === 'Suspended' ? 'bg-red-700/10 border-red-700/20 text-red-400' :
                          'bg-bg-sub text-text-muted border-border-main'
                        }`}>
                          {product.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-6 text-xs text-text-muted font-bold">
                        <div className="flex flex-col gap-0.5">
                          <span>{product.views || 0} Views</span>
                          <span className="text-green-500">{product.sales || 0} Sales</span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isMallAdmin && (
                            <>
                              {/* Restore to Active */}
                              {(product.status === 'Hidden' || product.status === 'Suspended') && (
                                <button 
                                  onClick={() => handleModerateProduct(product, 'Active')}
                                  className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-colors text-xs font-black uppercase tracking-widest border border-green-500/20 shadow-sm flex items-center gap-1.5"
                                  title={`Restore to Active (currently ${product.status})`}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  {product.status === 'Hidden' ? 'Unhide' : 'Unsuspend'}
                                </button>
                              )}
                              {/* Hide — only when Active */}
                              {product.status === 'Active' && (
                                <button 
                                  onClick={() => handleModerateProduct(product, 'Hidden')}
                                  className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white rounded-xl transition-colors text-xs font-black uppercase tracking-widest border border-orange-500/20 shadow-sm flex items-center gap-1.5"
                                >
                                  <EyeOff className="w-3 h-3" /> Hide
                                </button>
                              )}
                              {/* Suspend — only when Active */}
                              {product.status === 'Active' && (
                                <button 
                                  onClick={() => handleModerateProduct(product, 'Suspended')}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-colors text-xs font-black uppercase tracking-widest border border-red-500/20 shadow-sm flex items-center gap-1.5"
                                >
                                  <ShieldAlert className="w-3 h-3" /> Suspend
                                </button>
                              )}
                            </>
                          )}
                          {!isMallAdmin && (
                            <button 
                              onClick={() => handleEdit(product)}
                              className="p-2 hover:bg-primary-500/10 text-text-muted hover:text-primary-500 rounded-lg transition-all border border-transparent hover:border-primary-500/20"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {!isMallAdmin && (
                            <button 
                              onClick={() => setDeletingProduct(product)}
                              className="p-2 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-border-main rounded-[2.5rem] bg-bg-sub space-y-4 shadow-xl">
          <ShoppingBag className="w-16 h-16 text-primary-500 mx-auto animate-bounce" />
          <h3 className="text-2xl font-black text-text-main">
            {isMallAdmin ? 'No products in this mall yet' : 'No products found'}
          </h3>
          <p className="text-text-muted max-w-sm mx-auto font-medium">
            {isMallAdmin 
              ? 'Shop owners in your mall have not listed any products yet.'
              : 'Try broadening your search query or launch your very first retail item right now!'}
          </p>
          {!isMallAdmin && (
            <button 
              onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
              className="px-6 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest mt-4 transition-all shadow-xl shadow-primary-500/20"
            >
              Deploy First Product
            </button>
          )}
        </div>
      )}
      </div>

      {/* Forms & Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <ProductStudioModal 
            shopId={shopId} 
            mallId={mallId} 
            initialData={editingProduct}
            onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingProduct && (
          <DeleteConfirmationModal 
            productName={deletingProduct.name}
            onConfirm={handleDeleteConfirm}
            onClose={() => setDeletingProduct(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProductManager;
