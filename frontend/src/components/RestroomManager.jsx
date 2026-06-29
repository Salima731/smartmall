import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  useGetRestroomsQuery, 
  useUpdateRestroomMutation, 
  useAddMaintenanceReportMutation, 
  useAddComplaintMutation, 
  useEmergencyMaintenanceMutation,
  useCreateRestroomMutation,
  useDeleteRestroomMutation
} from '../features/restrooms/restroomApiSlice';
import { Trash2, AlertCircle, CheckCircle, RefreshCw, AlertTriangle, Droplet, Users, Wrench, Star, UserPlus, FileText, QrCode, Clock, Activity, Check, X, User, MapPin, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const RestroomManager = ({ mallId, role }) => {
  const isAdmin = role === 'Mall Admin' || role === 'Super Admin';
  const { data: restrooms, isLoading, refetch } = useGetRestroomsQuery(mallId, { pollingInterval: 30000 });
  const [updateRestroom, { isLoading: updating }] = useUpdateRestroomMutation();
  const [addMaintenanceReport] = useAddMaintenanceReportMutation();
  const [addComplaint] = useAddComplaintMutation();
  const [emergencyMaintenance, { isLoading: dispatching }] = useEmergencyMaintenanceMutation();
  const [createRestroom, { isLoading: creating }] = useCreateRestroomMutation();
  const [deleteRestroom, { isLoading: deleting }] = useDeleteRestroomMutation();

  const [selectedRestroom, setSelectedRestroom] = useState(null);
  const [newIssue, setNewIssue] = useState('');
  const [qrComplaintText, setQrComplaintText] = useState('');
  const [qrRating, setQrRating] = useState(5);
  const [activeModalTab, setActiveModalTab] = useState('overview'); // 'overview', 'maintenance', 'complaints'
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New Restroom Form State
  const [location, setLocation] = useState('');
  const [floor, setFloor] = useState('Ground Floor');
  const [gender, setGender] = useState('Unisex');

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5020');
    socket.on('restroom_update', (data) => {
      refetch();
      if (data.emergency) {
        toast.warn('Emergency cleaning protocol activated mall-wide!');
      } else if (data.maintenance) {
        toast.info('New maintenance report filed for facility.');
      } else if (data.rating) {
        toast.info(`New QR rating submitted. Current Avg: ${data.rating}★`);
      }
    });

    return () => socket.disconnect();
  }, [refetch]);

  const handleCreateRestroom = async (e) => {
    e.preventDefault();
    if (!location.trim()) return;
    try {
      await createRestroom({ mallId, location, floor, gender }).unwrap();
      toast.success('Restroom facility initialized successfully');
      setLocation('');
      setFloor('Ground Floor');
      setGender('Unisex');
      setShowCreateForm(false);
      refetch();
    } catch (err) {
      toast.error('Failed to create restroom facility');
    }
  };

  const handleDeleteRestroom = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action is permanent.`)) return;
    try {
      await deleteRestroom(id).unwrap();
      toast.success('Restroom facility removed successfully');
      setSelectedRestroom(null);
      refetch();
    } catch (err) {
      toast.error('Failed to remove restroom facility');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (isAdmin) {
      return toast.error('Mall Admins can only dispatch emergency cleaning or assign staff. Operations belong to Restroom Staff.');
    }
    try {
      await updateRestroom({ id, status }).unwrap();
      toast.success(`Restroom status updated to ${status}`);
      refetch();
      if (selectedRestroom && selectedRestroom._id === id) {
        setSelectedRestroom(prev => ({ ...prev, status }));
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const handleAssignStaff = async (id) => {
    try {
      await updateRestroom({ id, staffAssigned: true }).unwrap();
      toast.success('Restroom staff successfully assigned to facility');
      refetch();
    } catch (err) {
      toast.error('Failed to assign staff');
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!newIssue.trim()) return;
    try {
      await addMaintenanceReport({ id: selectedRestroom._id, issue: newIssue }).unwrap();
      toast.success('Maintenance report filed successfully');
      setNewIssue('');
      refetch();
      setSelectedRestroom(prev => ({
        ...prev,
        status: 'Maintenance',
        maintenanceReports: [...(prev.maintenanceReports || []), { issue: newIssue, reportedAt: new Date(), status: 'Pending', reportedBy: 'Staff' }]
      }));
    } catch (err) {
      toast.error('Failed to file maintenance report');
    }
  };

  const handleQRComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!qrComplaintText.trim()) return;
    try {
      await addComplaint({ id: selectedRestroom._id, complaint: qrComplaintText, rating: qrRating, qrCodeId: `QR-${selectedRestroom._id.slice(-4)}` }).unwrap();
      toast.success('QR Feedback & Rating submitted successfully');
      setQrComplaintText('');
      setQrRating(5);
      refetch();
    } catch (err) {
      toast.error('Failed to submit QR feedback');
    }
  };

  const handleEmergencyDispatch = async () => {
    try {
      await emergencyMaintenance(mallId).unwrap();
      toast.success('Emergency cleaning dispatched to all active facilities!');
      refetch();
    } catch (err) {
      toast.error('Failed to dispatch emergency cleaning');
    }
  };

  if (isLoading) return <div className="animate-pulse h-96 glass-card bg-bg-card rounded-[2.5rem]" />;

  const activeRestrooms = restrooms || [];
  const cleanCount = activeRestrooms.filter(r => r.status === 'Available' || r.status === 'Clean').length;
  const needsAttentionCount = activeRestrooms.filter(r => r.status === 'Needs Cleaning' || r.status === 'Closed for Cleaning' || r.status === 'Maintenance').length;
  const totalOccupancy = activeRestrooms.reduce((sum, r) => sum + (r.occupancy || 0), 0);
  const avgRatingAll = activeRestrooms.length ? (activeRestrooms.reduce((sum, r) => sum + (r.averageRating || 5), 0) / activeRestrooms.length).toFixed(1) : 'N/A';

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* Header Analytics & Emergency Dispatch - Expanded Width Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
        <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 shadow-xl bg-bg-card h-full flex flex-col justify-between w-full transition-all hover:border-primary-500/30">
          <div className="flex justify-between items-start w-full">
            <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl"><CheckCircle className="w-7 h-7" /></div>
            <span className="text-xs font-black uppercase tracking-widest text-text-muted bg-bg-sub px-4 py-2 rounded-xl border border-border-main shadow-sm">Clean & Ready</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-5xl font-black text-text-main tracking-tight">{cleanCount}</h3>
            <p className="text-sm text-text-muted font-bold">Facilities available</p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 shadow-xl bg-bg-card h-full flex flex-col justify-between w-full transition-all hover:border-primary-500/30">
          <div className="flex justify-between items-start w-full">
            <div className="p-4 bg-yellow-500/10 text-yellow-500 rounded-2xl"><AlertTriangle className="w-7 h-7" /></div>
            <span className="text-xs font-black uppercase tracking-widest text-text-muted bg-bg-sub px-4 py-2 rounded-xl border border-border-main shadow-sm">Attention Req</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-5xl font-black text-text-main tracking-tight">{needsAttentionCount}</h3>
            <p className="text-sm text-text-muted font-bold">Cleaning / Maintenance</p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 shadow-xl bg-bg-card h-full flex flex-col justify-between w-full transition-all hover:border-primary-500/30">
          <div className="flex justify-between items-start w-full">
            <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl"><Users className="w-7 h-7" /></div>
            <span className="text-xs font-black uppercase tracking-widest text-text-muted bg-bg-sub px-4 py-2 rounded-xl border border-border-main shadow-sm">Active Usage</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-5xl font-black text-text-main tracking-tight">{totalOccupancy}</h3>
            <p className="text-sm text-text-muted font-bold">Current occupancy load</p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 shadow-xl relative overflow-hidden group flex flex-col justify-between bg-bg-card h-full w-full transition-all hover:border-primary-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="relative z-10 space-y-2 w-full">
            <h3 className="text-2xl font-black text-text-main flex items-center tracking-tight">
              <Star className="w-6 h-6 mr-2.5 text-yellow-500" /> {avgRatingAll}{avgRatingAll !== 'N/A' && '★'} Score
            </h3>
            <p className="text-xs text-text-muted font-medium leading-relaxed">Based on real-time QR user feedback & ratings.</p>
          </div>
          <div className="relative z-10 flex justify-end mt-6 w-full">
            {isAdmin && (
              <button 
                onClick={handleEmergencyDispatch} 
                disabled={dispatching}
                className="w-full py-3.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/30 flex items-center justify-center shadow-xl shadow-red-500/10"
              >
                <AlertCircle className="w-4 h-4 mr-2" /> {dispatching ? 'Dispatching...' : 'Emergency Clean'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Restrooms Grid */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 shadow-xl bg-bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black flex items-center text-text-main">
              <Droplet className="w-6 h-6 mr-3 text-blue-500" /> Restroom Status & Operations
            </h3>
            <p className="text-xs text-text-muted mt-1">
              {isAdmin ? 'Mall Admin Mode: Initialize facilities, monitor cleanliness analytics, assign staff, and view maintenance logs.' : 'Restroom Staff Mode: Mark facilities cleaned, report issues, and manage maintenance.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Restroom
              </button>
            )}
            <button onClick={refetch} className="p-2.5 bg-bg-sub hover:bg-bg-sub/80 rounded-xl transition-colors text-text-muted hover:text-text-main border border-border-main flex items-center gap-2 text-xs font-bold">
              <RefreshCw className="w-4 h-4" /> Refresh Status
            </button>
          </div>
        </div>

        {/* Create Restroom Form */}
        <AnimatePresence>
          {showCreateForm && isAdmin && (
            <motion.form
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onSubmit={handleCreateRestroom}
              className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 bg-bg-sub shadow-xl"
            >
              <h4 className="text-lg font-black text-primary-500 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Initialize New Restroom Facility
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Facility Location / Wing</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-bg-card border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                    placeholder="e.g. North Wing Restroom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Floor Level</label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full bg-bg-card border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main"
                    placeholder="e.g. Ground Floor, Floor 2"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Gender Designation</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-bg-card border border-border-main rounded-2xl py-3.5 px-4 outline-none focus:ring-2 ring-primary-500 text-sm font-bold text-text-main cursor-pointer"
                  >
                    <option value="Male" className="bg-bg-card">Male</option>
                    <option value="Female" className="bg-bg-card">Female</option>
                    <option value="Unisex" className="bg-bg-card">Unisex</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3.5 bg-bg-card hover:bg-bg-card/80 text-text-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-border-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/10 flex items-center gap-2"
                >
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Create Facility
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {activeRestrooms.length > 0 ? (
              activeRestrooms.map((restroom) => {
                const isClean = restroom.status === 'Available' || restroom.status === 'Clean';
                const isNeedsCleaning = restroom.status === 'Needs Cleaning' || restroom.status === 'Closed for Cleaning';
                const isMaintenance = restroom.status === 'Maintenance';

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={restroom._id} 
                    onClick={() => { setSelectedRestroom(restroom); setActiveModalTab('overview'); }}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between h-56 relative overflow-hidden cursor-pointer group bg-bg-sub ${
                      isClean ? 'border-green-500/20 hover:border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.05)]' :
                      isNeedsCleaning ? 'border-yellow-500/30 hover:border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]' :
                      isMaintenance ? 'border-orange-500/30 hover:border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]' :
                      'border-red-500/30 hover:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    }`}
                  >
                    {!isClean && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] -mr-8 -mt-8 rounded-full blur-2xl pointer-events-none text-inherit" />
                    )}

                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${
                            restroom.gender === 'Male' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                            restroom.gender === 'Female' ? 'bg-pink-500/20 text-pink-500 border-pink-500/30' :
                            'bg-purple-500/20 text-purple-500 border-purple-500/30'
                          }`}>
                            {restroom.gender}
                          </span>
                          <span className="text-[10px] font-black px-2 py-1 bg-bg-card text-text-muted rounded-lg border border-border-main">
                            {restroom.floor || 'Floor 1'}
                          </span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg flex items-center gap-1">
                          <Star className="w-3 h-3" /> {restroom.averageRating || 4.8}
                        </span>
                      </div>
                      <h4 className="font-black text-lg text-text-main mt-3 group-hover:text-primary-500 transition-colors">{restroom.location}</h4>
                      <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-500" /> Staff: {restroom.staff?.name || 'Assigned Janitorial'}
                      </p>
                    </div>

                    <div className="space-y-3 border-t border-border-main pt-3 mt-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
                        <span>Last Cleaned: {new Date(restroom.lastCleanedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>Occupancy: {restroom.occupancy || 0} active</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-black uppercase tracking-widest flex items-center ${
                          isClean ? 'text-green-500' :
                          isNeedsCleaning ? 'text-yellow-500 animate-pulse' :
                          isMaintenance ? 'text-orange-500' : 'text-red-500'
                        }`}>
                          {isClean && <CheckCircle className="w-4 h-4 mr-1.5" />}
                          {isNeedsCleaning && <RefreshCw className="w-4 h-4 mr-1.5 animate-spin-slow" />}
                          {isMaintenance && <Wrench className="w-4 h-4 mr-1.5" />}
                          {restroom.status === 'Available' ? 'Clean' : restroom.status}
                        </span>

                        <span className="text-[10px] font-bold text-text-muted group-hover:text-text-main transition-colors underline">
                          Inspect & Manage →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-16 border-2 border-dashed border-border-main rounded-3xl bg-bg-sub">
                <Droplet className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-20" />
                <p className="text-text-muted font-bold">No restrooms initialized for this mall.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Restroom Details & Administration Modal */}
      <AnimatePresence>
        {selectedRestroom && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedRestroom(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card border border-border-main rounded-[2.5rem] p-6 sm:p-8 max-w-2xl w-full space-y-6 relative shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-bg-card my-auto"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedRestroom(null)}
                className="absolute top-6 right-6 p-2 bg-bg-sub hover:bg-bg-sub/80 rounded-full transition-colors text-text-muted hover:text-text-main border border-border-main"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center space-x-4 border-b border-border-main pb-6">
                <div className={`p-4 rounded-2xl ${
                  selectedRestroom.status === 'Available' || selectedRestroom.status === 'Clean' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                  selectedRestroom.status === 'Needs Cleaning' || selectedRestroom.status === 'Closed for Cleaning' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                  'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                }`}>
                  <Droplet className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-text-main">{selectedRestroom.location}</h3>
                    <span className="text-xs font-black px-2.5 py-0.5 bg-bg-sub text-text-muted rounded-lg border border-border-main uppercase tracking-widest">
                      {selectedRestroom.gender}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" /> {selectedRestroom.floor || 'Floor 1'} • Rating: {selectedRestroom.averageRating || 4.8}★
                  </span>
                </div>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="flex p-1 bg-bg-sub rounded-2xl border border-border-main">
                <button 
                  onClick={() => setActiveModalTab('overview')}
                  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeModalTab === 'overview' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-text-muted hover:text-text-main'}`}
                >
                  Overview & Ops
                </button>
                <button 
                  onClick={() => setActiveModalTab('maintenance')}
                  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeModalTab === 'maintenance' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-text-muted hover:text-text-main'}`}
                >
                  Maintenance Logs ({selectedRestroom.maintenanceReports?.length || 0})
                </button>
                <button 
                  onClick={() => setActiveModalTab('complaints')}
                  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeModalTab === 'complaints' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-text-muted hover:text-text-main'}`}
                >
                  QR Feedback ({selectedRestroom.complaints?.length || 0})
                </button>
              </div>

              {/* Tab 1: Overview & Operations */}
              {activeModalTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-bg-sub rounded-3xl border border-border-main space-y-3">
                      <span className="text-xs font-bold text-text-muted flex items-center"><UserPlus className="w-4 h-4 mr-2 text-primary-500" /> Assigned Custodian</span>
                      <p className="text-sm font-black text-text-main">{selectedRestroom.staff?.name || 'Assigned Janitorial Staff'}</p>
                      <p className="text-[10px] text-text-muted">{selectedRestroom.staff?.email || 'Facility Operations Dept'}</p>
                      {isAdmin && (
                        <button 
                          onClick={() => handleAssignStaff(selectedRestroom._id)}
                          className="w-full mt-2 py-2 bg-primary-500/20 hover:bg-primary-500 text-primary-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-primary-500/30 flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" /> Reassign Staff Member
                        </button>
                      )}
                    </div>

                    <div className="p-6 bg-bg-sub rounded-3xl border border-border-main space-y-3">
                      <span className="text-xs font-bold text-text-muted flex items-center"><Activity className="w-4 h-4 mr-2 text-primary-500" /> Current Status</span>
                      <p className="text-sm font-black text-text-main uppercase tracking-wider">{selectedRestroom.status === 'Available' ? 'Clean' : selectedRestroom.status}</p>
                      <p className="text-[10px] text-text-muted">Last cleaned: {new Date(selectedRestroom.lastCleanedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      
                      {!isAdmin && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button 
                            onClick={() => handleUpdateStatus(selectedRestroom._id, 'Clean')}
                            className="p-2 bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-green-500/30 flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Mark Clean
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(selectedRestroom._id, 'Needs Cleaning')}
                            className="p-2 bg-yellow-500/20 hover:bg-yellow-500 text-yellow-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-yellow-500/30 flex items-center justify-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Needs Clean
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Restroom Staff Actions: Report Issue */}
                  {!isAdmin && (
                    <form onSubmit={handleReportIssue} className="p-6 bg-bg-sub rounded-3xl border border-border-main space-y-4">
                      <h4 className="text-xs font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-orange-500" /> File Maintenance Report
                      </h4>
                      <div className="space-y-2">
                        <input 
                          type="text"
                          placeholder="e.g. Leaking faucet in stall #3, broken mirror"
                          value={newIssue}
                          onChange={e => setNewIssue(e.target.value)}
                          className="w-full bg-bg-card border border-border-main rounded-2xl py-3 px-4 focus:ring-2 ring-primary-500 outline-none text-sm font-medium text-text-main placeholder:text-text-muted"
                          required
                        />
                      </div>
                      <button type="submit" className="w-full py-3 bg-orange-500/20 hover:bg-orange-500 text-orange-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-orange-500/30 shadow-lg shadow-orange-500/10">
                        Submit Maintenance Report
                      </button>
                    </form>
                  )}

                  {/* Mall Admin Delete Facility Action */}
                  {isAdmin && (
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-sm text-red-500">Decommission Facility</h4>
                        <p className="text-xs text-text-muted mt-1">Permanently remove this restroom from mall tracking.</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteRestroom(selectedRestroom._id, selectedRestroom.location)} 
                        disabled={deleting}
                        className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> {deleting ? 'Removing...' : 'Delete Restroom'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Maintenance Logs */}
              {activeModalTab === 'maintenance' && (
                <div className="space-y-4">
                  {selectedRestroom.maintenanceReports?.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {selectedRestroom.maintenanceReports.map((report, idx) => (
                        <div key={idx} className="p-4 bg-bg-sub rounded-2xl border border-border-main flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-text-main">{report.issue}</p>
                            <p className="text-[10px] text-text-muted">Reported by {report.reportedBy} • {new Date(report.reportedAt).toLocaleDateString()} {new Date(report.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border ${
                            report.status === 'Resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            report.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}>
                            {report.status || 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-border-main rounded-3xl bg-bg-sub">
                      <Wrench className="w-10 h-10 mx-auto mb-2 text-text-muted opacity-20" />
                      <p className="text-xs text-text-muted font-bold">No maintenance issues reported for this facility.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: QR Complaints & User Feedback Simulator */}
              {activeModalTab === 'complaints' && (
                <div className="space-y-6">
                  {selectedRestroom.complaints?.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {selectedRestroom.complaints.map((comp, idx) => (
                        <div key={idx} className="p-4 bg-bg-sub rounded-2xl border border-border-main flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-text-main">{comp.complaint}</p>
                            <p className="text-[10px] text-text-muted">ID: {comp.qrCodeId || 'QR-Direct'} • {new Date(comp.submittedAt).toLocaleDateString()} {new Date(comp.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                            comp.rating >= 4 ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            comp.rating === 3 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            <Star className="w-3 h-3" /> {comp.rating}★
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-border-main rounded-3xl bg-bg-sub">
                      <QrCode className="w-10 h-10 mx-auto mb-2 text-text-muted opacity-20" />
                      <p className="text-xs text-text-muted font-bold">No QR feedback or complaints submitted yet.</p>
                    </div>
                  )}

                  {/* Simulate QR Submission */}
                  <form onSubmit={handleQRComplaintSubmit} className="p-6 bg-bg-sub rounded-3xl border border-border-main space-y-4">
                    <h4 className="text-xs font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-primary-500" /> Simulate QR User Feedback
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1">
                        <input 
                          type="text"
                          placeholder="e.g. Soap dispenser empty, floors wet"
                          value={qrComplaintText}
                          onChange={e => setQrComplaintText(e.target.value)}
                          className="w-full bg-bg-card border border-border-main rounded-2xl py-3 px-4 focus:ring-2 ring-primary-500 outline-none text-xs font-medium text-text-main placeholder:text-text-muted"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <select 
                          value={qrRating} 
                          onChange={e => setQrRating(Number(e.target.value))}
                          className="w-full bg-bg-card border border-border-main rounded-2xl py-3 px-4 focus:ring-2 ring-primary-500 outline-none text-xs font-bold text-text-main cursor-pointer"
                        >
                          <option value={5} className="bg-bg-card">5★ Excellent</option>
                          <option value={4} className="bg-bg-card">4★ Good</option>
                          <option value={3} className="bg-bg-card">3★ Average</option>
                          <option value={2} className="bg-bg-card">2★ Poor</option>
                          <option value={1} className="bg-bg-card">1★ Terrible</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-primary-500/20 hover:bg-primary-500 text-primary-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-primary-500/30 shadow-lg shadow-primary-500/10">
                      Submit Simulated QR Rating
                    </button>
                  </form>
                </div>
              )}

              <button 
                onClick={() => setSelectedRestroom(null)}
                className="w-full bg-bg-sub hover:bg-bg-sub/80 border border-border-main hover:border-primary-500 text-text-main py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl"
              >
                Close Inspector
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestroomManager;
