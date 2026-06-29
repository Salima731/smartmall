import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MallsPage from './pages/MallsPage';
import MallDetails from './pages/MallDetails';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GlobalSearchPage from './pages/GlobalSearchPage';
import Dashboard from './pages/Dashboard';

import OffersPage from './pages/OffersPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetails from './pages/ProductDetails';
import ShopsPage from './pages/ShopsPage';
import ShopDetails from './pages/ShopDetails';
import RestroomFeedbackPage from './pages/RestroomFeedbackPage';
import ProtectedRoute from './routes/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <Router>
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen key="loader" onFinished={() => setLoading(false)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-bg-main text-text-main transition-colors duration-300">
        <ToastContainer theme="dark" position="bottom-right" />
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/search" element={<GlobalSearchPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/malls" element={<MallsPage />} />
            <Route path="/mall/:id" element={<MallDetails />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:productId" element={<ProductDetails />} />
            <Route path="/products/:productId" element={<ProductDetails />} />
            <Route path="/shops" element={<ShopsPage />} />
            <Route path="/shop/:id" element={<ShopDetails />} />
            <Route path="/restroom/feedback/:id" element={<RestroomFeedbackPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />

            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
