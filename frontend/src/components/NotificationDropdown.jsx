import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Bell, X, Check, Megaphone, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useGetNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllAsReadMutation 
} from '../features/notifications/notificationApiSlice';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const NOTIFICATION_ICONS = {
  Offer: <Megaphone className="w-4 h-4 text-emerald-400" />,
  System: <Bell className="w-4 h-4 text-blue-400" />,
  Order: <Bell className="w-4 h-4 text-purple-400" />,
  Parking: <Bell className="w-4 h-4 text-indigo-400" />,
  Restroom: <Bell className="w-4 h-4 text-amber-400" />,
  Emergency: <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />,
};

const NotificationDropdown = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { data: notifications = [], refetch } = useGetNotificationsQuery(undefined, {
    skip: !userInfo,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!userInfo) return;

    // Connect to Socket.IO server
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5020');

    // Join channels
    socket.emit('join', {
      userId: userInfo._id,
      role: userInfo.role,
      mallId: userInfo.mall,
    });

    socket.on('notification', (newNotif) => {
      refetch();
      if (newNotif.type === 'Emergency') {
        toast.error(`EMERGENCY: ${newNotif.title} - ${newNotif.message}`, {
          autoClose: false,
          icon: <ShieldAlert className="w-6 h-6 text-red-500" />,
        });
      } else {
        toast.info(`${newNotif.title}: ${newNotif.message}`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userInfo, refetch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
    } catch (err) {
      toast.error('Error marking read');
    }
  };

  if (!userInfo) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-bg-sub rounded-xl text-text-muted hover:text-primary-500 transition-colors border border-border-main shadow-sm cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-pulse border border-bg-main shadow-lg">
            {unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-bg-card border border-border-main rounded-2xl shadow-2xl p-4 space-y-4 z-[200] max-h-[80vh] flex flex-col justify-between overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border-main pb-3">
              <div>
                <h4 className="font-black text-sm text-text-main">Notifications</h4>
                <p className="text-[10px] text-text-muted mt-0.5">
                  You have {unreadCount} unread messages
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[10px] font-black text-primary-500 hover:text-primary-400 uppercase tracking-wider cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] space-y-2 pr-1">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all relative group ${
                      notif.isRead
                        ? 'bg-bg-sub/30 border-border-main/40 opacity-70'
                        : 'bg-primary-500/5 border-primary-500/20'
                    }`}
                  >
                    <div className="p-2 bg-bg-sub rounded-lg border border-border-main shadow-sm flex-shrink-0">
                      {NOTIFICATION_ICONS[notif.type] || <Bell className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-xs font-black ${notif.isRead ? 'text-text-main' : 'text-primary-400'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkRead(notif._id)}
                            className="p-1 hover:bg-bg-sub rounded text-text-muted hover:text-text-main cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-text-muted leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex justify-between items-center pt-1 text-[9px] text-text-muted/60 font-bold">
                        <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {notif.sender && (
                          <span className="bg-bg-sub/80 px-1.5 py-0.5 rounded border border-border-main text-[8px]">
                            {notif.sender.name} ({notif.sender.role})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-text-muted flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 opacity-20" />
                  <p className="text-xs font-bold">No notifications yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
