import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGetProductsQuery } from '../features/products/productApiSlice';
import { useGetOffersQuery } from '../features/offers/offerApiSlice';
import ProductCard from '../components/ProductCard';
import { Search, Loader2, X, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Fashion', 'Electronics', 'Beauty', 'Shoes', 'Grocery', 'Food', 'Gaming', 'Home', 'Sports'];
const SEARCH_DEBOUNCE_MS = 350;

const ProductsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const urlCategory = queryParams.get('category') || 'All';
  const urlSearch = queryParams.get('search') || '';
  const urlOfferId = queryParams.get('offer');
  const urlTitle = queryParams.get('title');
  
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState(
    CATEGORIES.find(c => c.toLowerCase() === urlCategory.toLowerCase()) || 'All'
  );
  
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState('Recommended');

  const resultsRef = useRef(null);
  const [isHighlighting, setIsHighlighting] = useState(false);

  // Sync state with URL changes
  useEffect(() => {
    setSelectedCategory(CATEGORIES.find(c => c.toLowerCase() === urlCategory.toLowerCase()) || 'All');
    setSearchTerm(urlSearch);
    setDebouncedSearchTerm(urlSearch);
  }, [urlCategory, urlSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const scrollToResults = useCallback(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsHighlighting(true);
      const timer = setTimeout(() => setIsHighlighting(false), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const { data: products, isLoading } = useGetProductsQuery(debouncedSearchTerm);
  const { data: offers } = useGetOffersQuery('All', { skip: !urlOfferId });

  const relatedProductIds = useMemo(() => {
    if (!urlOfferId || !offers) return null;
    const targetOffer = offers.find(o => o._id === urlOfferId);
    return new Set(targetOffer?.relatedProducts?.map(item => item?._id || item) || []);
  }, [offers, urlOfferId]);

  const productsWithSearchIndex = useMemo(() => (products || []).map((product) => ({
    product,
    searchIndex: [
      product.name,
      product.description,
      product.brand,
      product.category,
      product.shop?.name,
      product.mall?.name,
    ].filter(Boolean).join(' ').toLowerCase(),
  })), [products]);

  const searchedProducts = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.toLowerCase();
    if (!normalizedSearch) return productsWithSearchIndex.map(({ product }) => product);
    return productsWithSearchIndex
      .filter(({ searchIndex }) => searchIndex.includes(normalizedSearch))
      .map(({ product }) => product);
  }, [debouncedSearchTerm, productsWithSearchIndex]);

  const categorizedProducts = useMemo(() => {
    if (selectedCategory === 'All') return searchedProducts;
    const normalizedCategory = selectedCategory.toLowerCase();
    return searchedProducts.filter(product => product.category?.toLowerCase() === normalizedCategory);
  }, [searchedProducts, selectedCategory]);

  const pricedProducts = useMemo(() => categorizedProducts.filter(product => (
    product.price >= priceRange[0] && product.price <= priceRange[1]
  )), [categorizedProducts, priceRange]);

  const offerFilteredProducts = useMemo(() => {
    if (!relatedProductIds || relatedProductIds.size === 0) return pricedProducts;
    return pricedProducts.filter(product => relatedProductIds.has(product._id));
  }, [pricedProducts, relatedProductIds]);

  const filteredProducts = useMemo(() => {
    const sortedProducts = [...offerFilteredProducts];
    if (sortBy === 'Price: Low to High') {
      sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      sortedProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Newest Arrivals') {
      sortedProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return sortedProducts;
  }, [offerFilteredProducts, sortBy]);

  const handleCategoryChange = useCallback((cat) => {
    setSelectedCategory(cat);
    const encodedSearch = encodeURIComponent(searchTerm.trim());
    if (cat === 'All') {
      navigate('/products' + (encodedSearch ? `?search=${encodedSearch}` : ''));
    } else {
      navigate(`/products?category=${cat.toLowerCase()}` + (encodedSearch ? `&search=${encodedSearch}` : ''));
    }
  }, [navigate, searchTerm]);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    const encodedSearch = encodeURIComponent(searchTerm.trim());
    if (selectedCategory === 'All') {
      navigate(encodedSearch ? `/products?search=${encodedSearch}` : '/products');
    } else {
      navigate(`/products?category=${selectedCategory.toLowerCase()}` + (encodedSearch ? `&search=${encodedSearch}` : ''));
    }
    scrollToResults();
  }, [navigate, scrollToResults, searchTerm, selectedCategory]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategory('All');
    setPriceRange([0, 10000]);
    setSortBy('Recommended');
    navigate('/products');
  }, [navigate]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 pb-20 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-main">
        <div>
          {urlOfferId && urlTitle ? (
            <h1 className="text-4xl md:text-5xl font-black flex items-center tracking-tighter capitalize bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
              {decodeURIComponent(urlTitle)}
            </h1>
          ) : (
            <h1 className="text-4xl md:text-5xl font-black flex items-center tracking-tighter capitalize text-text-main">
              {selectedCategory === 'All' ? 'All Products' : `${selectedCategory} Products`}
            </h1>
          )}
          <p className="text-text-muted mt-2 font-medium">
            {filteredProducts?.length || 0} items found {searchTerm ? `matching "${searchTerm}"` : ''}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 glass-card rounded-xl text-sm font-bold border border-border-main hover:bg-bg-sub transition-all lg:hidden bg-bg-card"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
          </button>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-bg-card border border-border-main rounded-xl px-4 py-2 pr-10 text-sm font-bold outline-none focus:ring-2 ring-primary-500/50 text-text-main cursor-pointer"
            >
              <option className="bg-bg-card">Recommended</option>
              <option className="bg-bg-card">Price: Low to High</option>
              <option className="bg-bg-card">Price: High to Low</option>
              <option className="bg-bg-card">Newest Arrivals</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Top Section: Full-Width Search Bar & Price Range Filter */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border border-border-main space-y-6 shadow-2xl bg-bg-card">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Full-width Search Bar */}
          <div className="lg:col-span-8 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-purple-500 rounded-2xl blur opacity-25 group-focus-within:opacity-75 transition duration-500" />
            <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-bg-sub border border-border-main rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 transition-all">
              <div className="pl-5 pr-3 py-4 text-text-muted group-focus-within:text-primary-500 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                placeholder={`Search in ${selectedCategory === 'All' ? 'all products' : selectedCategory}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent py-4 pr-6 outline-none text-sm font-bold text-text-main placeholder:text-text-muted/50"
              />
              {searchTerm && (
                <button type="button" onClick={handleClearFilters} className="pr-5 text-text-muted hover:text-text-main transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>

          {/* Price Range Filter */}
          <div className="lg:col-span-4 bg-bg-sub border border-border-main rounded-2xl p-4 space-y-2 flex flex-col justify-center shadow-inner">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
              <span className="text-text-muted flex items-center gap-1.5"><SlidersHorizontal className="w-3.5 h-3.5 text-primary-500" /> Max Price Ceiling</span>
              <span className="text-primary-500 px-2.5 py-1 bg-primary-500/10 rounded-lg border border-primary-500/20">₹{priceRange[1]}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10000" 
              step="100"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full h-2 bg-border-main rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <AnimatePresence>
          {(showFilters || window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:w-[280px] shrink-0 space-y-8 overflow-hidden lg:overflow-visible"
            >
              {/* Categories */}
              <div className="space-y-4">
                <h3 className="text-lg font-black tracking-tight text-text-main">Categories</h3>
                <div className="space-y-2">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${
                        selectedCategory.toLowerCase() === cat.toLowerCase()
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                          : 'text-text-muted hover:bg-bg-sub hover:text-text-main'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleClearFilters}
                className="w-full py-3 rounded-xl border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div ref={resultsRef} className={`flex-1 transition-all duration-700 p-6 rounded-[2.5rem] scroll-mt-8 ${isHighlighting ? 'ring-4 ring-primary-500/50 bg-primary-500/5 shadow-2xl' : ''}`}>
          {/* Search Result Feedback */}
          {searchTerm && (
            <div className="mb-8 p-6 glass-card rounded-2xl border border-primary-500/30 bg-primary-500/10 flex items-center justify-between shadow-lg backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-500">
                  <Search className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Active Search Filter</p>
                  <p className="text-base font-black text-text-main mt-0.5">
                    Showing results for: <span className="text-primary-500 font-black">"{searchTerm}"</span>
                  </p>
                </div>
              </div>
              <span className="text-xs font-black px-4 py-2 bg-bg-card rounded-xl border border-border-main text-text-main shadow-sm">
                {filteredProducts?.length || 0} products found
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
            </div>
          ) : (
            filteredProducts?.length > 0 ? (
              <VirtualizedProductGrid products={filteredProducts} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-32 glass-card rounded-[3rem] border-dashed border-border-main bg-bg-card"
              >
                <Filter className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
                <p className="text-xl font-bold text-text-muted">No products found matching your filters.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 px-6 py-2 bg-bg-sub rounded-full text-sm font-bold text-text-main hover:bg-bg-sub/80 transition-all border border-border-main"
                >
                  Clear Filters
                </button>
              </motion.div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const VirtualizedProductGrid = memo(({ products }) => {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const [metrics, setMetrics] = useState({
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
    top: 0,
  });

  const measure = useCallback(() => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const rect = containerRef.current?.getBoundingClientRect();
      setMetrics({
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        top: rect ? rect.top + window.scrollY : 0,
      });
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [measure]);

  useEffect(() => {
    measure();
  }, [measure, products.length]);

  const columns = metrics.viewportWidth >= 1280 ? 2 : 1;
  const gap = 24;
  const rowHeight = columns === 2 ? 330 : 350;
  const overscanRows = 3;
  const rowCount = Math.ceil(products.length / columns);
  const viewportStart = metrics.scrollY - metrics.top;
  const viewportEnd = viewportStart + metrics.viewportHeight;
  const startRow = Math.max(0, Math.floor(viewportStart / rowHeight) - overscanRows);
  const endRow = Math.min(rowCount - 1, Math.ceil(viewportEnd / rowHeight) + overscanRows);

  const visibleRows = useMemo(() => {
    const rows = [];
    for (let row = startRow; row <= endRow; row += 1) {
      const firstIndex = row * columns;
      rows.push({
        row,
        products: products.slice(firstIndex, firstIndex + columns),
      });
    }
    return rows;
  }, [columns, endRow, products, startRow]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: Math.max(rowCount * rowHeight, rowHeight) }}
    >
      {visibleRows.map(({ row, products: rowProducts }) => (
        <div
          key={row}
          className={columns === 2 ? 'absolute left-0 right-0 grid grid-cols-2 gap-6' : 'absolute left-0 right-0 grid grid-cols-1 gap-6'}
          style={{
            top: row * rowHeight,
            height: rowHeight - gap,
          }}
        >
          {rowProducts.map((product) => (
            <div key={product._id} className="h-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

export default ProductsPage;
