import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { apiSlice } from '../features/api/apiSlice';
import { 
  ShoppingBag, 
  User, 
  LogOut, 
  MapPin, 
  Sun, 
  Moon, 
  Tag, 
  Store, 
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
  Settings
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!userInfo) {
      return [
        { to: '/', label: 'Home', icon: null },
        { to: '/malls', label: 'Malls', icon: MapPin },
        { to: '/shops', label: 'Shops', icon: Store },
        { to: '/products', label: 'Products', icon: ShoppingBag },
        { to: '/offers', label: 'Offers', icon: Tag },
      ];
    }

    switch (userInfo.role) {
      case 'Super Admin':
        return [
          { to: '/', label: 'Home', icon: null },
          { to: '/malls', label: 'Malls', icon: MapPin },
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/dashboard?tab=Malls', label: 'Manage Malls', icon: MapPin },
          { to: '/dashboard?tab=Shops', label: 'Manage Shops', icon: Store },
          { to: '/dashboard?tab=Users', label: 'Manage Users', icon: User },
        ];
      case 'Mall Admin':
        return [
          { to: '/', label: 'Home', icon: null },
          { to: '/malls', label: 'Malls', icon: MapPin },
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/dashboard?tab=Shops', label: 'My Shops', icon: Store },
          { to: '/dashboard?tab=Products', label: 'My Products', icon: ShoppingBag },
          { to: '/dashboard?tab=Offers', label: 'My Offers', icon: Tag },
        ];
      case 'Shop Owner':
        return [
          { to: '/', label: 'Home', icon: null },
          { to: '/malls', label: 'Malls', icon: MapPin },
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/dashboard?tab=Products', label: 'My Products', icon: ShoppingBag },
          { to: '/dashboard?tab=Offers', label: 'My Offers', icon: Tag },
          { to: '/dashboard?tab=Orders', label: 'My Orders', icon: ShoppingBag },
        ];
      default:
        return [
          { to: '/', label: 'Home', icon: null },
          { to: '/malls', label: 'Malls', icon: MapPin },
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/shops', label: 'Shops', icon: Store },
          { to: '/products', label: 'Products', icon: ShoppingBag },
          { to: '/offers', label: 'Offers', icon: Tag },
        ];
    }
  };

  const navLinks = getNavLinks();

  // Helper to determine if link is active
  const isActive = (to) => {
    if (to === '/') {
      return location.pathname === '/';
    }
    if (to.includes('?')) {
      return location.pathname + location.search === to;
    }
    if (to === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search;
    }
    return location.pathname === to;
  };

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-border-main/50 bg-bg-card/75 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto max-w-[1400px] px-6 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center space-x-3 group shrink-0">
          <motion.div 
            whileHover={{ rotate: 8, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-primary-500 to-primary-700 p-2.5 rounded-2xl shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all duration-300"
          >
            <ShoppingBag className="w-5.5 h-5.5 text-white" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-text-main via-text-main to-text-muted bg-clip-text text-transparent leading-none">
              SmartMall
            </span>
            <span className="text-[9px] font-black text-primary-500 tracking-[0.15em] uppercase mt-0.5 leading-none">
              Digital Platform
            </span>
          </div>
        </Link>

        {/* MIDDLE SECTION - NAVIGATION LINKS (DESKTOP) */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-bg-sub/40 p-1.5 rounded-2xl border border-border-main/40">
          {navLinks.map((link, idx) => {
            const active = isActive(link.to);
            return (
              <Link 
                key={idx} 
                to={link.to} 
                className={`relative px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  active 
                    ? 'text-white' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {active && (
                  <motion.div 
                    layoutId="activeNavPill"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg shadow-primary-500/10 -z-10"
                  />
                )}
                {link.icon && <link.icon className="w-3.5 h-3.5" />}
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* RIGHT SECTION - UTILITIES & PROFILE (DESKTOP) */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Quick theme mode toggler */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2.5 bg-bg-sub rounded-xl text-text-muted hover:text-primary-500 transition-all border border-border-main shadow-sm cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </motion.button>

          {userInfo ? (
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              
              <div className="h-6 w-px bg-border-main/70" />

              <div className="flex items-center space-x-4 pl-1">
                <Link to="/dashboard" className="flex items-center space-x-3 group">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center font-black text-white shadow-md shadow-primary-500/10 group-hover:scale-105 transition-transform duration-300">
                      {userInfo.name[0].toUpperCase()}
                    </div>
                    {/* Live indicator dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-bg-card rounded-full" />
                  </div>
                  <div className="hidden sm:block leading-tight">
                    <p className="text-xs font-black text-text-main group-hover:text-primary-500 transition-colors duration-300">{userInfo.name}</p>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary-500/10 text-primary-500 rounded text-[8px] font-black uppercase tracking-wider mt-0.5">
                      {userInfo.role}
                    </span>
                  </div>
                </Link>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="p-2.5 bg-red-500/10 rounded-xl text-red-500 hover:text-red-600 transition-all border border-red-500/20 shadow-sm cursor-pointer"
                  title="Logout Session"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-xs font-black uppercase tracking-widest text-text-muted hover:text-text-main transition-colors px-4 py-2"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-500/10"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE & TABLET HAMBURGER BUTTON */}
        <div className="flex items-center space-x-3 lg:hidden">
          {/* Quick theme switcher for mobile view */}
          <button 
            onClick={toggleTheme}
            className="p-2 bg-bg-sub rounded-xl text-text-muted border border-border-main cursor-pointer md:hidden"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {userInfo && (
            <div className="md:hidden">
              <NotificationDropdown />
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 bg-bg-sub border border-border-main text-text-main rounded-xl cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>

      </div>

      {/* MOBILE DRAWER MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden w-full border-t border-border-main bg-bg-card backdrop-blur-xl overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-6 space-y-6">
              
              {/* Profile Card inside drawer */}
              {userInfo && (
                <div className="flex items-center justify-between bg-bg-sub/60 p-4 rounded-2xl border border-border-main/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center font-black text-white">
                      {userInfo.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-text-main">{userInfo.name}</p>
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-primary-500/10 text-primary-500 rounded text-[8px] font-black uppercase tracking-wider mt-0.5">
                        {userInfo.role}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links list */}
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1 pl-2">Navigation Links</p>
                {navLinks.map((link, idx) => {
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={idx}
                      to={link.to}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-wider border transition-all ${
                        active
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-500/20'
                          : 'bg-bg-sub/20 border-border-main/40 text-text-muted hover:text-text-main hover:bg-bg-sub/40'
                      }`}
                    >
                      {link.icon ? <link.icon className="w-4 h-4 text-primary-500" /> : <Store className="w-4 h-4 text-primary-500" />}
                      {link.label}
                    </Link>
                  );
                })}
                {userInfo && (
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-wider border transition-all ${
                      isActive('/dashboard')
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-500/20'
                        : 'bg-bg-sub/20 border-border-main/40 text-primary-500 hover:text-primary-400 hover:bg-bg-sub/40'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
              </div>

              {/* Drawer Actions block */}
              <div className="flex flex-col gap-3 pt-4 border-t border-border-main/60">
                {userInfo ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest border border-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5" /> Logout Session
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link
                      to="/login"
                      className="py-3 text-center bg-bg-sub border border-border-main rounded-xl font-black text-xs uppercase tracking-widest text-text-main"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="py-3 text-center bg-primary-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/10"
                    >
                      Join Now
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </nav>
  );
};

export default Navbar;
