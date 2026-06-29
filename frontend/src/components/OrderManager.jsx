import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetShopOrdersQuery, useUpdateOrderStatusMutation, useGetMyOrdersQuery } from '../features/orders/orderApiSlice';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Package, 
  User, 
  Play, 
  ChevronRight, 
  ChevronLeft,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const OrderManager = ({ role, mallId, shopId }) => {
  const [activeTab, setActiveTab] = useState('Confirmed');
  const { userInfo } = useSelector((state) => state.auth);
  const isUser = role === 'User';
  const isShopOwner = role === 'Shop Owner';
  const isAdmin = role === 'Mall Admin' || role === 'Super Admin';
  const shouldSkipShopOrders = isUser || (isShopOwner && !shopId);

  // State for Socket Connection
  const [socket, setSocket] = useState(null);

  // Queries — admin/staff see all orders for their scope; shop owner sees their shop only
  const { data: shopOrders, refetch: refetchShopOrders } = useGetShopOrdersQuery(
    shopId ? { shopId } : undefined,
    { skip: shouldSkipShopOrders }
  );
  
  const { data: myOrders, refetch: refetchMyOrders } = useGetMyOrdersQuery(
    undefined,
    { skip: !isUser }
  );

  const [updateOrderStatus, { isLoading: updatingStatus }] = useUpdateOrderStatusMutation();

  // Socket setup for real-time updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5020';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Join relevant rooms for real-time events
    newSocket.emit('join', {
      userId: userInfo?._id,
      role: role,
      shopId: shopId || userInfo?.shop,
      mallId: userInfo?.mall || mallId,
    });

    newSocket.on('order_update', (data) => {
      if (data.newOrder) {
        toast.info('New order received!');
      } else if (data.orderStatus) {
        toast.info(`Order status: ${data.orderStatus}`);
      }
      if (isUser) {
        refetchMyOrders();
      } else if (!shouldSkipShopOrders) {
        refetchShopOrders();
      }
    });

    return () => newSocket.disconnect();
  }, [isUser, shouldSkipShopOrders, userInfo, role, shopId, mallId, refetchMyOrders, refetchShopOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({ id: orderId, orderStatus: newStatus }).unwrap();
      toast.success(`Order moved to ${newStatus}`);
      if (!shouldSkipShopOrders) {
        refetchShopOrders();
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Preparing': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Ready': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Completed': return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  // 1. User View: My Orders History & Tracking
  if (isUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 border-b border-border-main pb-4">
          <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main">My Food Orders</h3>
            <p className="text-xs text-text-muted">Track and manage your real-time food orders</p>
          </div>
        </div>

        {myOrders?.length === 0 ? (
          <div className="text-center py-20 bg-bg-card border border-border-main rounded-[2rem] space-y-4">
            <Package className="w-16 h-16 text-text-muted mx-auto opacity-20 animate-pulse" />
            <h4 className="font-bold text-lg text-text-main">No orders placed yet</h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto">Explore shop catalogs and order food directly to get live updates here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {myOrders?.map((order) => {
              const isFoodShop = ['Restaurant', 'Food Court', 'Cafe', 'Bakery', 'Juice Bar'].includes(order.shop?.shopType);
              return (
                <motion.div 
                  key={order._id}
                  layout
                  className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card space-y-6 shadow-xl relative overflow-hidden"
                >
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-main/50 pb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-text-muted font-bold">ORDER ID: #{order._id}</span>
                      <h4 className="text-lg font-black text-text-main flex items-center">
                        <ShoppingBag className="w-4 h-4 mr-2 text-primary-500" /> {order.shop?.name || 'Shop'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                        order.paymentStatus === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Items & Total amount */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Items Ordered</span>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs font-bold text-text-main">
                            <span>{item.product?.name} <span className="text-text-muted">x{item.quantity}</span></span>
                            <span>₹{item.subtotal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Order Progress / Details */}
                    <div className="flex flex-col justify-between items-end">
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block">Total Amount</span>
                        <span className="text-3xl font-black text-text-main">₹{order.totalAmount}</span>
                      </div>

                      {/* Progress tracking line */}
                      {order.orderStatus !== 'Cancelled' && isFoodShop && (
                        <div className="w-full mt-4 pt-4 border-t border-border-main/50">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                            <span>Pending</span>
                            <span>Preparing</span>
                            <span>Ready</span>
                          </div>
                          <div className="w-full bg-bg-sub h-2.5 rounded-full overflow-hidden border border-border-main">
                            <div 
                              className={`h-full bg-gradient-to-r from-primary-500 to-green-500 transition-all duration-500 ${
                                order.orderStatus === 'Pending' ? 'w-1/3' :
                                order.orderStatus === 'Preparing' ? 'w-2/3' : 'w-full'
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 2. Shop Owner Order Management View
  if (isShopOwner || role === 'Super Admin') {
    const tabs = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
    const filteredOrders = shopOrders?.filter((o) => o.orderStatus === activeTab) || [];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border-main pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-text-main">Shop Orders Manager</h3>
              <p className="text-xs text-text-muted">Manage active food order processing and updates</p>
            </div>
          </div>
        </div>

        {isShopOwner && !shopId ? (
          <div className="text-center py-20 bg-bg-card border border-border-main rounded-[2rem] space-y-4">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto opacity-80" />
            <h4 className="font-bold text-lg text-text-main">No Shop Assigned</h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              This owner account is not linked to a shop yet. Assign this user as the shop owner from Shop Management, then sign in again to receive food orders here.
            </p>
          </div>
        ) : (
          <>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const count = shopOrders?.filter((o) => o.orderStatus === tab).length || 0;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                  activeTab === tab
                    ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                    : 'bg-bg-card border-border-main text-text-muted hover:border-primary-500/30'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-bg-card border border-border-main rounded-[2rem] space-y-4">
            <ShoppingBag className="w-16 h-16 text-text-muted mx-auto opacity-20" />
            <h4 className="font-bold text-lg text-text-main">No {activeTab} Orders</h4>
            <p className="text-xs text-text-muted">New orders matching this status will automatically refresh here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map((order) => (
              <motion.div
                key={order._id}
                layout
                className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card space-y-6 shadow-xl relative overflow-hidden"
              >
                {/* Info row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-main/50 pb-4">
                  <div>
                    <span className="text-[10px] text-text-muted font-bold">ORDER ID: #{order._id}</span>
                    <h4 className="text-lg font-black text-text-main flex items-center">
                      <User className="w-4 h-4 mr-2 text-primary-500" /> {order.user?.name}
                    </h4>
                    <p className="text-xs text-text-muted">{order.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block">Total Amount</span>
                    <span className="text-2xl font-black text-text-main">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Items & Status progression */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block">Items</span>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-text-main bg-bg-sub/50 p-2.5 rounded-xl border border-border-main/50">
                          <span>{item.product?.name} <span className="text-text-muted">x{item.quantity}</span></span>
                          <span>₹{item.subtotal}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress action button */}
                    <div className="flex flex-col justify-end items-end">
                      {activeTab === 'Confirmed' && (
                        <button
                          onClick={() => handleStatusChange(order._id, 'Preparing')}
                          disabled={updatingStatus}
                          className="w-full sm:w-auto px-6 py-3.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" /> Start Preparing
                        </button>
                      )}
                      {activeTab === 'Preparing' && (
                        <button
                          onClick={() => handleStatusChange(order._id, 'Ready')}
                          disabled={updatingStatus}
                          className="w-full sm:w-auto px-6 py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark as Ready
                        </button>
                      )}
                      {activeTab === 'Ready' && (
                        <button
                          onClick={() => handleStatusChange(order._id, 'Completed')}
                          disabled={updatingStatus}
                          className="w-full sm:w-auto px-6 py-3.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Complete Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
          )}
          </>
        )}
      </div>
    );
  }

  // 3. Admin / Super Admin aggregate view
  if (isAdmin && role !== 'Super Admin') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 border-b border-border-main pb-4">
          <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main">Operations Orders Monitor</h3>
            <p className="text-xs text-text-muted">Global tracking of food ordering transactions and status updates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 bg-bg-card border border-border-main rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Total Sales</p>
              <h4 className="text-2xl font-black text-text-main mt-1">
                ₹{shopOrders?.reduce((acc, curr) => acc + curr.totalAmount, 0) || 0}
              </h4>
            </div>
            <DollarSign className="w-8 h-8 text-green-500 opacity-20" />
          </div>
          
          <div className="glass-card p-6 bg-bg-card border border-border-main rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Total Orders</p>
              <h4 className="text-2xl font-black text-text-main mt-1">
                {shopOrders?.length || 0}
              </h4>
            </div>
            <Package className="w-8 h-8 text-primary-500 opacity-20" />
          </div>

          <div className="glass-card p-6 bg-bg-card border border-border-main rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Active Preparing</p>
              <h4 className="text-2xl font-black text-text-main mt-1">
                {shopOrders?.filter(o => o.orderStatus === 'Preparing').length || 0}
              </h4>
            </div>
            <Clock className="w-8 h-8 text-purple-500 opacity-20" />
          </div>
        </div>

        {/* Global orders table */}
        <div className="bg-bg-card border border-border-main rounded-[2rem] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-sub border-b border-border-main text-text-muted font-black text-[10px] uppercase tracking-widest">
                <th className="p-4 pl-6">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Order Status</th>
                <th className="p-4">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {shopOrders?.map((order) => (
                <tr key={order._id} className="border-b border-border-main/50 hover:bg-bg-sub/30 transition-all text-xs font-bold text-text-main">
                  <td className="p-4 pl-6 font-mono text-[10px]">#{order._id}</td>
                  <td className="p-4">{order.user?.name}</td>
                  <td className="p-4">₹{order.totalAmount}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1.5 rounded-lg border text-[9px] uppercase tracking-widest font-black ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1.5 rounded-lg border text-[9px] uppercase tracking-widest font-black ${
                      order.paymentStatus === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};

export default OrderManager;
