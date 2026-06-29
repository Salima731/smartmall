import { useState } from 'react';
import { useGetAlertsQuery, useCreateAlertMutation, useDeactivateAlertMutation } from '../features/alerts/alertApiSlice';
import { useSelector } from 'react-redux';
import { AlertTriangle, X, Siren, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const ALERT_COLORS = {
  Fire: 'bg-red-900/80 border-red-500 text-red-100',
  Medical: 'bg-orange-900/80 border-orange-500 text-orange-100',
  'Lost Child': 'bg-yellow-900/80 border-yellow-500 text-yellow-100',
  'Parking Blocked': 'bg-blue-900/80 border-blue-500 text-blue-100',
  General: 'bg-bg-sub/80 border-border-main text-text-main',
};

const ALERT_ICONS = {
  Fire: '🔥',
  Medical: '🚑',
  'Lost Child': '🧒',
  'Parking Blocked': '🚗',
  General: '📢',
};

const EmergencyAlertBanner = ({ mallId }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const isAdmin = userInfo?.role === 'Mall Admin' || userInfo?.role === 'Super Admin';

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('General');
  const [message, setMessage] = useState('');

  const { data: alerts } = useGetAlertsQuery(mallId, { skip: !mallId, pollingInterval: 15000 });
  const [createAlert, { isLoading: creating }] = useCreateAlertMutation();
  const [deactivateAlert] = useDeactivateAlertMutation();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error('Please enter an alert message');
    try {
      await createAlert({ mallId, type, message }).unwrap();
      toast.success('Alert broadcasted!');
      setMessage('');
      setShowForm(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send alert');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivateAlert(id).unwrap();
      toast.success('Alert dismissed');
    } catch {
      toast.error('Failed to dismiss alert');
    }
  };

  if (!mallId) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {alerts?.map((alert) => (
          <motion.div
            key={alert._id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl border backdrop-blur-sm ${ALERT_COLORS[alert.type]}`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{ALERT_ICONS[alert.type]}</span>
              <div>
                <p className="font-bold text-sm flex items-center">
                  <Siren className="w-4 h-4 mr-1 animate-pulse" />
                  {alert.type} Alert
                </p>
                <p className="text-xs opacity-80">{alert.message}</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDeactivate(alert._id)}
                className="p-1 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isAdmin && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-5 py-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl font-bold text-xs transition-all border border-red-500/20 shadow-sm w-fit"
            >
              <AlertTriangle className="w-4 h-4 mr-2" /> Broadcast Emergency Alert
            </button>
          ) : (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleCreate}
              className="bg-bg-card border border-red-500/40 rounded-2xl p-4 space-y-3 mt-2 shadow-lg"
            >
              <p className="text-sm font-bold text-red-500 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" /> Emergency Broadcast
              </p>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-bg-sub border border-border-main text-text-main rounded-xl py-2 px-3 text-sm outline-none focus:ring-2 ring-red-500"
              >
                {['Fire', 'Medical', 'Lost Child', 'Parking Blocked', 'General'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Alert message..."
                className="w-full bg-bg-sub border border-border-main text-text-main rounded-xl py-2 px-3 text-sm outline-none focus:ring-2 ring-red-500 placeholder:text-text-muted"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Broadcast</>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs text-text-muted hover:text-text-main rounded-xl bg-bg-sub transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </div>
      )}
    </div>
  );
};

export default EmergencyAlertBanner;
