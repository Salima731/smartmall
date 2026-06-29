import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation, useVerifyOTPMutation } from '../features/auth/authApiSlice';
import { setCredentials } from '../features/auth/authSlice';
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, Sparkles, Shield, Building, Store, KeyRound, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import LoadingScreen from '../components/LoadingScreen';
import { useGetMallsQuery } from '../features/malls/mallApiSlice';
import { useGetShopsByMallQuery } from '../features/shops/shopApiSlice';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [role, setRole] = useState('User');
  const [mall, setMall] = useState('');
  const [shop, setShop] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [register, { isLoading, error }] = useRegisterMutation();
  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const { data: malls } = useGetMallsQuery();
  const { data: shops } = useGetShopsByMallQuery(mall, { skip: !mall });

  useEffect(() => {
    if (userInfo && !isTransitioning) {
      navigate('/dashboard');
    }
  }, [navigate, userInfo, isTransitioning]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await register({ name, email, password, role, mall, shop, adminSecretKey }).unwrap();
      toast.success('OTP sent to your email!');
      setShowOTP(true);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const verifyHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await verifyOTP({ email, otp }).unwrap();
      dispatch(setCredentials({ ...res }));
      toast.success('Email verified successfully!');
      setIsTransitioning(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3500);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  if (isTransitioning) {
    return <LoadingScreen onFinished={() => navigate('/dashboard')} />;
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 rounded-[2.5rem] w-full max-w-lg shadow-xl space-y-10 relative z-10 bg-bg-card"
      >
        <div className="text-center space-y-3">
          <div className="bg-gradient-to-br from-purple-500 to-primary-600 w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-500/20 border border-border-main">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-text-main">Join SmartMall</h1>
          <p className="text-text-muted font-medium">Create your next-gen retail account</p>
        </div>

        {!showOTP ? (
          <form onSubmit={submitHandler} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-primary-500 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-4 pl-14 pr-6 focus:ring-2 ring-primary-500 outline-none transition-all font-bold placeholder:text-text-muted"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-primary-500 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                <input 
                  type="email" 
                  placeholder="name@ecosystem.com"
                  className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-4 pl-14 pr-6 focus:ring-2 ring-primary-500 outline-none transition-all font-bold placeholder:text-text-muted"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-primary-500 ml-1">Access Level</label>
              <div className="relative group">
                <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                <select 
                  className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-4 pl-14 pr-6 focus:ring-2 ring-primary-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setMall('');
                    setShop('');
                    setAdminSecretKey('');
                  }}
                >
                  <option value="User" className="bg-bg-card">User / Shopper</option>
                  <option value="Mall Admin" className="bg-bg-card">Mall Admin</option>
                  <option value="Shop Owner" className="bg-bg-card">Shop Owner</option>
                  <option value="Staff" className="bg-bg-card">Operations Staff</option>
                  <option value="Super Admin" className="bg-bg-card">Super Admin</option>
                </select>
              </div>
            </div>

            {role !== 'User' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 md:col-span-2"
              >
                <label className="text-xs font-black uppercase tracking-widest text-red-500 ml-1">Admin Authorization Key</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-red-500 transition-colors" />
                  <input 
                    type={showAdminKey ? "text" : "password"}
                    placeholder="Enter secure authorization key"
                    className="w-full bg-red-500/5 border border-red-500/20 text-text-main rounded-2xl py-4 pl-14 pr-12 focus:ring-2 ring-red-500 outline-none transition-all font-bold placeholder:text-text-muted"
                    value={adminSecretKey}
                    onChange={(e) => setAdminSecretKey(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowAdminKey(!showAdminKey)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-500 transition-colors focus:outline-none"
                  >
                    {showAdminKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[10px] text-text-muted px-2 italic">A valid key is required to register for administrative roles.</p>
              </motion.div>
            )}

            {(role === 'Mall Admin' || role === 'Shop Owner' || role === 'Staff') && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 md:col-span-2"
              >
                <label className="text-xs font-black uppercase tracking-widest text-primary-500 ml-1">Assign Mall</label>
                <div className="relative group">
                  <Building className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                  <select 
                    className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-4 pl-14 pr-6 focus:ring-2 ring-primary-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                    value={mall}
                    onChange={(e) => setMall(e.target.value)}
                    required
                  >
                    <option value="" className="bg-bg-card">Select Mall...</option>
                    {malls?.map(m => (
                      <option key={m._id} value={m._id} className="bg-bg-card">{m.name}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {role === 'Shop Owner' && mall && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 md:col-span-2"
              >
                <label className="text-xs font-black uppercase tracking-widest text-primary-500 ml-1">Assign Shop</label>
                <div className="relative group">
                  <Store className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                  <select 
                    className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-4 pl-14 pr-6 focus:ring-2 ring-primary-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    required
                  >
                    <option value="" className="bg-bg-card">Select Shop...</option>
                    {shops?.map(s => (
                      <option key={s._id} value={s._id} className="bg-bg-card">{s.name}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-primary-500 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-4 pl-14 pr-12 focus:ring-2 ring-primary-500 outline-none transition-all font-bold placeholder:text-text-muted"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-primary-500 ml-1">Confirm</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-4 pl-14 pr-12 focus:ring-2 ring-primary-500 outline-none transition-all font-bold placeholder:text-text-muted"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="md:col-span-2 flex items-center text-red-500 text-xs font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  {error?.data?.message || 'Initialization failed. Please check your data.'}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={isLoading}
              className="md:col-span-2 w-full bg-primary-500 hover:bg-primary-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Initializing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Register Now</span>
                </>
              )}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={verifyHandler} className="space-y-8">
            <div className="text-center space-y-2">
              <p className="text-text-muted text-sm">We've sent a 6-digit verification code to</p>
              <p className="text-primary-500 font-bold">{email}</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-primary-500 ml-1">Verification Code</label>
              <div className="relative group">
                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="000000"
                  maxLength="6"
                  className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-4 pl-14 pr-6 focus:ring-2 ring-primary-500 outline-none transition-all font-bold placeholder:text-text-muted text-center tracking-[1em]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={isVerifying}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Verify & Access</span>
                </>
              )}
            </motion.button>

            <button 
              type="button"
              onClick={() => setShowOTP(false)}
              className="w-full text-text-muted hover:text-primary-500 text-xs font-bold transition-colors"
            >
              ← Back to Registration
            </button>
          </form>
        )}

        <div className="text-center">
          <p className="text-xs font-bold text-text-muted">
            Already a member? <Link to="/login" className="text-primary-500 hover:text-primary-600">Secure Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
