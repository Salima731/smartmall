import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation, useGoogleLoginMutation } from '../features/auth/authApiSlice';
import { setCredentials } from '../features/auth/authSlice';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login, { isLoading, error }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const { userInfo } = useSelector((state) => state.auth);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (userInfo && !isTransitioning) {
      navigate('/dashboard');
    }
  }, [navigate, userInfo, isTransitioning]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await googleLogin({ credential: credentialResponse.credential }).unwrap();
      dispatch(setCredentials({ ...res }));
      setIsTransitioning(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3500);
    } catch (err) {
      console.error('Google login failed:', err);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ ...res }));
      setIsTransitioning(true);
      // Wait for the loader to finish its "magic"
      setTimeout(() => {
        navigate('/dashboard');
      }, 3500);
    } catch (err) {
      console.error(err);
    }
  };

  if (isTransitioning) {
    return <LoadingScreen onFinished={() => navigate('/dashboard')} />;
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 rounded-[2.5rem] w-full max-w-md shadow-xl space-y-10 relative z-10 bg-bg-card"
      >
        <div className="text-center space-y-3">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-500/20 border border-border-main">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-text-main">Welcome Back</h1>
          <p className="text-text-muted font-medium">Access your secure smart mall portal</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-primary-500 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
              <input 
                type="email" 
                placeholder="name@secure.com"
                className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-4 pl-14 pr-6 focus:ring-2 ring-primary-500 outline-none transition-all font-bold placeholder:text-text-muted"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

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

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center text-red-500 text-xs font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20"
              >
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {error?.data?.message || 'Authentication failed. Please verify credentials.'}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : (
              'Access Portal'
            )}
          </motion.button>
        </form>

        <div className="flex flex-col items-center space-y-4 pt-4 border-t border-border-main">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">Or connect with</p>
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Login Failed')}
              useOneTap
              theme="filled_black"
              shape="pill"
              width="100%"
            />
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-xs font-bold text-text-muted">
            Don't have an account? <Link to="/register" className="text-primary-500 hover:text-primary-600">Initialize Access</Link>
          </p>
          <div className="p-4 bg-primary-600/5 rounded-2xl border border-primary-500/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500/60">Demo Credentials</p>
            <p className="text-[10px] text-text-muted mt-1 font-bold italic">admin@example.com / password123</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
