import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useGetParkingStatusQuery, useGetParkingStatsQuery, useRecordEntryMutation, useRecordExitMutation, useInitParkingPaymentMutation } from '../features/parking/parkingApiSlice';
import { Car, Loader2, TrendingDown, Activity, Map, ArrowRightLeft, CreditCard, X, Calendar, Clock, ShieldAlert, IndianRupee, Info, Check, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

const ParkingManager = ({ mallId, role }) => {
  const isAdmin = role === 'Mall Admin' || role === 'Super Admin';
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedVehicleSlot, setSelectedVehicleSlot] = useState(null);
  const [preCheckoutVehicle, setPreCheckoutVehicle] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [mode, setMode] = useState('entry'); // 'entry' | 'exit'
  const [filterFloor, setFilterFloor] = useState('All');

  const { data: parking, isLoading, refetch } = useGetParkingStatusQuery(mallId, {
    pollingInterval: 60000,
    skip: !mallId
  });
  const { data: stats, refetch: refetchStats } = useGetParkingStatsQuery(mallId, {
    pollingInterval: 60000,
    skip: !mallId
  });
  const [recordEntry, { isLoading: recordingEntry }] = useRecordEntryMutation();
  const [recordExit, { isLoading: recordingExit }] = useRecordExitMutation();
  const [initParkingPayment, { isLoading: initializingPayment }] = useInitParkingPaymentMutation();
  const [upiSession, setUpiSession] = useState(null);  // holds { upiQrString, razorpayOrderId, totalFee, vehicleNumber, ... }
  const [utrNumber, setUtrNumber] = useState('');       // UTR entered by staff after customer pays

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5020');
    socket.on('parking_update', (data) => {
      if (data.mallId === mallId) {
        refetch();
        refetchStats();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [mallId, refetch]);

  const handleEntry = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return toast.error('Please select a parking slot');
    
    try {
      await recordEntry({ mallId, slotId: selectedSlot, vehicleNumber }).unwrap();
      toast.success('Vehicle entry recorded successfully');
      setVehicleNumber('');
      setSelectedSlot('');
      refetch();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record entry');
    }
  };

  const handlePreExit = (e) => {
    e.preventDefault();
    const slot = parking?.slots?.find(s => s.isOccupied && s.currentVehicle?.vehicleNumber === vehicleNumber);
    if (!slot) return toast.error('Vehicle not found in active parking sessions');
    
    const space = parking?.spaces?.find(sp => sp._id === slot.parkingSpace);
    const entryTime = new Date(slot.currentVehicle.entryTime);
    const hours = Math.max(Math.ceil((Date.now() - entryTime.getTime()) / (1000 * 60 * 60)), 1);
    const feePerHour = space?.parkingFeePerHour || 0;
    const totalFee = hours * feePerHour;
    
    setPreCheckoutVehicle({ vehicleNumber, entryTime: slot.currentVehicle.entryTime, durationHours: hours, feePerHour, totalFee });
  };

  // Cash: confirm immediately
  const handleCashConfirm = async () => {
    try {
      const res = await recordExit({ vehicleNumber: preCheckoutVehicle.vehicleNumber, paymentMethod: 'Cash' }).unwrap();
      if (res.summary) { setPreCheckoutVehicle(null); setCheckoutSummary(res.summary); }
      setVehicleNumber('');
      refetch(); refetchStats();
    } catch (err) { toast.error(err?.data?.message || 'Failed to record exit'); }
  };

  // UPI: call backend to generate QR, then show it
  const handleUpiInit = async () => {
    try {
      const data = await initParkingPayment({ vehicleNumber: preCheckoutVehicle.vehicleNumber }).unwrap();
      setUpiSession(data);
      setUtrNumber('');
    } catch (err) { toast.error(err?.data?.message || 'Failed to generate payment QR'); }
  };

  // UPI: staff enters UTR after customer pays, confirm exit
  const handleUpiConfirm = async () => {
    try {
      const res = await recordExit({
        vehicleNumber: preCheckoutVehicle.vehicleNumber,
        paymentMethod: 'UPI',
        utrNumber: utrNumber || undefined,
      }).unwrap();
      if (res.summary) { setPreCheckoutVehicle(null); setUpiSession(null); setCheckoutSummary(res.summary); }
      setVehicleNumber('');
      refetch(); refetchStats();
    } catch (err) { toast.error(err?.data?.message || 'Failed to complete exit'); }
  };

  if (!mallId) return (
    <div className="glass-card p-16 rounded-[2.5rem] border border-border-main bg-bg-card flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
      <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-3xl flex items-center justify-center">
        <Car className="w-8 h-8 text-yellow-500" />
      </div>
      <h3 className="text-xl font-black text-text-main">No Mall Assigned</h3>
      <p className="text-sm text-text-muted max-w-sm font-medium">
        Your account has not been linked to a mall yet. Please contact your Mall Admin to get assigned.
      </p>
    </div>
  );

  if (isLoading) return <div className="animate-pulse h-96 glass-card bg-bg-card rounded-[2.5rem]" />;

  const slots = parking?.slots || [];
  const occupiedSlots = slots.filter(s => s.isOccupied);
  const availableSlots = slots.filter(s => !s.isOccupied);
  const occupancyRate = slots.length ? Math.round((occupiedSlots.length / slots.length) * 100) : 0;
  
  // Floor grouping simulation based on slot numbering logic (e.g. A1 -> Floor A)
  const floors = [...new Set(slots.map(s => s.slotNumber.charAt(0)))];
  
  const displayedSlots = slots.filter(s => filterFloor === 'All' || s.slotNumber.startsWith(filterFloor));

  return (
    <div className="space-y-6">
      {/* Revenue & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-[2rem] border border-border-main space-y-4 bg-bg-card">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-primary-500/10 text-primary-500 rounded-2xl"><Activity className="w-6 h-6" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Occupancy</span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-text-main">{stats?.occupancyPercentage || 0}%</h3>
            <div className="w-full bg-bg-sub h-1.5 rounded-full mt-3 overflow-hidden border border-border-main">
              <div className={`h-full rounded-full ${(stats?.occupancyPercentage || 0) > 80 ? 'bg-red-500' : (stats?.occupancyPercentage || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${stats?.occupancyPercentage || 0}%` }} />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem] border border-border-main space-y-4 bg-bg-card">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl"><IndianRupee className="w-6 h-6" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Revenue</span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-text-main">₹{stats?.totalPaidRevenue || 0}</h3>
            <p className="text-xs text-text-muted mt-1 font-bold">Paid today</p>
          </div>
          {(stats?.pendingPayments > 0) && (
            <div className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 inline-block">
              + ₹{stats.pendingPayments} pending
            </div>
          )}
        </div>

        <div className="glass-card p-6 rounded-[2rem] border border-border-main space-y-4 bg-bg-card">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><Car className="w-6 h-6" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Parked Now</span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-text-main">{stats?.activeVehicles || 0}</h3>
            <p className="text-xs text-text-muted mt-1 font-bold">Active sessions</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem] border border-border-main space-y-4 bg-bg-card">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl"><Map className="w-6 h-6" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Today</span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-text-main">{stats?.totalVehiclesToday || 0}</h3>
            <p className="text-xs text-text-muted mt-1 font-bold">Vehicles processed</p>
          </div>
        </div>
      </div>

      {/* Parking Spaces Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-text-main">Parking Zones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parking?.spaces?.map(space => (
            <div key={space._id} className="glass-card p-6 rounded-[2rem] border border-border-main bg-bg-card flex flex-col justify-between hover:border-primary-500/50 transition-colors">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-xl text-text-main">{space.name}</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-bg-sub rounded-lg text-text-muted mt-2 inline-block">
                      {space.vehicleType}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                    space.status === 'Available' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    space.status === 'Full' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {space.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-bg-sub rounded-xl border border-border-main">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-black">Capacity</p>
                    <p className="text-lg font-black text-text-main mt-1">{space.totalCapacity}</p>
                  </div>
                  <div className="p-3 bg-bg-sub rounded-xl border border-border-main">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-black">Available</p>
                    <p className="text-lg font-black text-primary-500 mt-1">{space.availableSpaces}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border-main flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                  <Info className="w-4 h-4" /> Parking Fee
                </span>
                <span className="font-black text-text-main">₹{space.parkingFeePerHour}/hr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Panel */}
        {!isAdmin && (
          <div className="glass-card p-8 rounded-[2.5rem] border border-border-main space-y-6 flex flex-col bg-bg-card">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-text-main flex items-center">
                <ArrowRightLeft className="w-6 h-6 mr-3 text-primary-500" /> Terminal
              </h3>
            </div>

            <div className="flex p-1 bg-bg-sub rounded-2xl border border-border-main">
              <button 
                onClick={() => setMode('entry')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'entry' ? 'bg-primary-500 text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
              >
                Check In
              </button>
              <button 
                onClick={() => setMode('exit')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'exit' ? 'bg-red-500 text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
              >
                Check Out
              </button>
            </div>

            {mode === 'entry' ? (
              <form onSubmit={handleEntry} className="space-y-5 flex-1 flex flex-col">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">License Plate</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CreditCard className="w-4 h-4 text-text-muted" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. KA-01-HH-1234"
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-11 pr-4 focus:ring-2 ring-primary-500 outline-none uppercase font-bold text-sm text-text-main placeholder:text-text-muted"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Assign Bay ({selectedSlot ? 'Selected' : 'Required'})</label>
                  <div className="p-4 rounded-2xl border border-border-main bg-bg-sub h-full min-h-[120px] flex items-center justify-center text-center">
                    {selectedSlot ? (
                      <div className="space-y-2">
                        <div className="text-3xl font-black text-primary-500">
                          {slots.find(s => s._id === selectedSlot)?.slotNumber}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                          Rate: ₹{parking.spaces?.find(sp => sp._id === slots.find(sl => sl._id === selectedSlot)?.parkingSpace)?.parkingFeePerHour || 0}/hr
                        </div>
                        <button type="button" onClick={() => setSelectedSlot('')} className="text-[10px] font-black text-primary-500 hover:text-primary-600 uppercase tracking-widest underline mt-2">Change Bay</button>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-text-muted">Please select an available (green) bay from the map.</p>
                    )}
                  </div>
                </div>

                <button 
                  disabled={recordingEntry || !selectedSlot || !vehicleNumber}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex justify-center items-center shadow-xl shadow-primary-500/20"
                >
                  {recordingEntry ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize Entry'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePreExit} className="space-y-5 flex-1 flex flex-col">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">License Plate</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CreditCard className="w-4 h-4 text-text-muted" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. KA-01-HH-1234"
                      className="w-full bg-bg-sub border border-border-main rounded-2xl py-3.5 pl-11 pr-4 focus:ring-2 ring-red-500 outline-none uppercase font-bold text-sm text-text-main placeholder:text-text-muted"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-main rounded-2xl text-center space-y-3 bg-bg-sub">
                  <TrendingDown className="w-10 h-10 text-red-500/50" />
                  <div>
                    <h4 className="text-sm font-black text-text-main">Exit Clearance</h4>
                    <p className="text-xs text-text-muted mt-1">Scanning license plate against active sessions...</p>
                  </div>
                </div>

                <button 
                  disabled={recordingExit || !vehicleNumber}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex justify-center items-center shadow-xl shadow-red-500/20"
                >
                  {recordingExit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Process Exit'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Live Slot Map */}
        <div className={`${isAdmin ? 'lg:col-span-3' : 'lg:col-span-2'} glass-card p-6 lg:p-8 rounded-[2.5rem] border border-border-main space-y-6 bg-bg-card flex flex-col h-full min-h-[560px]`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-text-main flex items-center">
                <Map className="w-6 h-6 mr-3 text-primary-500" /> Bay Map
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 bg-bg-sub p-1.5 rounded-2xl border border-border-main">
              {['All', ...floors].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilterFloor(f)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterFloor === f ? 'bg-primary-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
                >
                  {f === 'All' ? 'All' : `FL ${f}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 bg-bg-sub p-6 lg:p-8 rounded-[2.5rem] border border-border-main flex-1 overflow-y-auto custom-scrollbar content-start shadow-inner min-h-[380px]">
            {displayedSlots.map(slot => {
              const isAvailable = slot.status === 'Available' || (!slot.isOccupied && !slot.status);
              const isOccupied = slot.status === 'Occupied' || slot.isOccupied;
              const isReserved = slot.status === 'Reserved';
              const isVIP = slot.status === 'VIP';
              const isMaintenance = slot.status === 'Maintenance';

              let statusColor = 'bg-green-500/10 border-green-500/30 text-green-500 shadow-green-500/10 hover:border-green-500 hover:bg-green-500/20';
              let neonGlow = 'shadow-[0_0_15px_rgba(34,197,94,0.15)]';
              if (isOccupied) {
                statusColor = 'bg-red-500/10 border-red-500/30 text-red-500 shadow-red-500/10 hover:border-red-500 hover:bg-red-500/20';
                neonGlow = 'shadow-[0_0_15px_rgba(239,68,68,0.15)]';
              } else if (isReserved) {
                statusColor = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-yellow-500/10 hover:border-yellow-500 hover:bg-yellow-500/20';
                neonGlow = 'shadow-[0_0_15px_rgba(234,179,8,0.15)]';
              } else if (isVIP) {
                statusColor = 'bg-purple-500/10 border-purple-500/30 text-purple-500 shadow-purple-500/10 hover:border-purple-500 hover:bg-purple-500/20';
                neonGlow = 'shadow-[0_0_15px_rgba(168,85,247,0.15)]';
              } else if (isMaintenance) {
                statusColor = 'bg-gray-500/10 border-gray-500/30 text-gray-500 shadow-gray-500/10 hover:border-gray-500 hover:bg-gray-500/20';
                neonGlow = 'shadow-[0_0_15px_rgba(107,114,128,0.15)]';
              }

              if (selectedSlot === slot._id && !isAdmin) {
                statusColor = 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/50';
                neonGlow = 'shadow-[0_0_20px_rgba(14,165,233,0.4)]';
              }

              return (
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={slot._id}
                  onClick={() => {
                    if (isOccupied || isReserved || isVIP || isMaintenance || isAdmin) {
                      setSelectedVehicleSlot(slot);
                    } else if (!isAdmin && isAvailable) {
                      setSelectedSlot(slot._id);
                    }
                  }}
                  className={`relative aspect-[3/4] rounded-2xl flex flex-col items-center justify-center transition-all border-2 group cursor-pointer ${statusColor} ${neonGlow}`}
                >
                  <span className={`text-xs font-black uppercase tracking-widest z-10 ${selectedSlot === slot._id ? 'text-white' : ''}`}>
                    {slot.slotNumber}
                  </span>
                  
                  {isOccupied && (
                    <div className="flex flex-col items-center mt-2 space-y-1">
                      <Car className="w-6 h-6 text-red-500 animate-pulse" />
                      {slot.currentVehicle?.vehicleNumber && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500/20 rounded border border-red-500/30 text-red-500 truncate max-w-[70px]">
                          {slot.currentVehicle.vehicleNumber}
                        </span>
                      )}
                    </div>
                  )}

                  {isVIP && !isOccupied && (
                    <span className="text-[9px] font-black tracking-widest uppercase mt-2 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-500">
                      VIP
                    </span>
                  )}

                  {isReserved && !isOccupied && (
                    <span className="text-[9px] font-black tracking-widest uppercase mt-2 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-500">
                      RSV
                    </span>
                  )}

                  {isMaintenance && (
                    <ShieldAlert className="w-5 h-5 text-gray-500 mt-2" />
                  )}
                  
                  {isAvailable && selectedSlot !== slot._id && !isAdmin && (
                    <span className="absolute bottom-2 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-green-500">
                      Select
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 pt-2 bg-bg-sub p-4 rounded-2xl border border-border-main">
             <div className="flex items-center gap-2 text-xs font-bold text-text-muted"><div className="w-3.5 h-3.5 rounded-lg bg-green-500/20 border border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.3)]"></div> Available</div>
             <div className="flex items-center gap-2 text-xs font-bold text-text-muted"><div className="w-3.5 h-3.5 rounded-lg bg-red-500/20 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.3)]"></div> Occupied</div>
             <div className="flex items-center gap-2 text-xs font-bold text-text-muted"><div className="w-3.5 h-3.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30 shadow-[0_0_8px_rgba(234,179,8,0.3)]"></div> Reserved</div>
             <div className="flex items-center gap-2 text-xs font-bold text-text-muted"><div className="w-3.5 h-3.5 rounded-lg bg-purple-500/20 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.3)]"></div> VIP</div>
             <div className="flex items-center gap-2 text-xs font-bold text-text-muted"><div className="w-3.5 h-3.5 rounded-lg bg-gray-500/20 border border-gray-500/30 shadow-[0_0_8px_rgba(107,114,128,0.3)]"></div> Maint</div>
             <div className="flex items-center gap-2 text-xs font-bold text-text-muted"><div className="w-3.5 h-3.5 rounded-lg bg-primary-500 border border-primary-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div> Selected</div>
          </div>
        </div>
      </div>

      {/* Vehicle Details Modal */}
      <AnimatePresence>
        {selectedVehicleSlot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedVehicleSlot(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card border border-border-main rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full space-y-6 relative shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-bg-card my-auto"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedVehicleSlot(null)}
                className="absolute top-6 right-6 p-2 bg-bg-sub hover:bg-bg-sub/80 rounded-full transition-colors text-text-muted hover:text-text-main border border-border-main"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl ${
                  selectedVehicleSlot.status === 'Occupied' || selectedVehicleSlot.isOccupied ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                  selectedVehicleSlot.status === 'VIP' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                  selectedVehicleSlot.status === 'Reserved' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                  'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                }`}>
                  <Car className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-text-main">Bay {selectedVehicleSlot.slotNumber}</h3>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{selectedVehicleSlot.status || (selectedVehicleSlot.isOccupied ? 'Occupied' : 'Available')}</span>
                </div>
              </div>

              {selectedVehicleSlot.currentVehicle ? (
                <div className="space-y-4 bg-bg-sub p-6 rounded-3xl border border-border-main">
                  <div className="flex justify-between items-center pb-4 border-b border-border-main">
                    <span className="text-xs font-bold text-text-muted flex items-center"><CreditCard className="w-4 h-4 mr-2 text-primary-500" /> License Plate</span>
                    <span className="text-sm font-black text-text-main px-3 py-1 bg-bg-card rounded-xl border border-border-main">{selectedVehicleSlot.currentVehicle.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border-main">
                    <span className="text-xs font-bold text-text-muted flex items-center"><Calendar className="w-4 h-4 mr-2 text-primary-500" /> Entry Time</span>
                    <span className="text-sm font-bold text-text-main">{new Date(selectedVehicleSlot.currentVehicle.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-muted flex items-center"><Clock className="w-4 h-4 mr-2 text-primary-500" /> Duration</span>
                    <span className="text-sm font-bold text-primary-500">
                      {Math.max(1, Math.round((Date.now() - new Date(selectedVehicleSlot.currentVehicle.entryTime).getTime()) / (1000 * 60)))} mins
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-bg-sub rounded-3xl border border-border-main text-center space-y-2">
                  <p className="text-sm font-bold text-text-main">No active vehicle session</p>
                  <p className="text-xs text-text-muted">This bay is currently marked as {selectedVehicleSlot.status}.</p>
                </div>
              )}

              <button 
                onClick={() => setSelectedVehicleSlot(null)}
                className="w-full bg-bg-sub hover:bg-bg-sub/80 border border-border-main hover:border-primary-500 text-text-main py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl"
              >
                Close Inspector
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Summary Modal */}
      <AnimatePresence>
        {checkoutSummary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setCheckoutSummary(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card border border-border-main rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full space-y-6 relative shadow-2xl bg-bg-card"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20 mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-text-main">Payment Receipt</h3>
                <p className="text-xs text-text-muted font-bold">Vehicle {checkoutSummary.vehicleNumber} checked out.</p>
              </div>

              <div className="bg-bg-sub rounded-3xl p-6 space-y-4 border border-border-main">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-text-muted">Payment Method</span>
                  <span className="font-black text-primary-500 uppercase tracking-widest">{checkoutSummary.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-text-muted">Payment Status</span>
                  <span className="font-black text-green-500 uppercase tracking-widest">{checkoutSummary.paymentStatus}</span>
                </div>
                <div className="border-t border-border-main my-2"></div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-text-muted">Entry Time</span>
                  <span className="font-black text-text-main">{new Date(checkoutSummary.entryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-text-muted">Exit Time</span>
                  <span className="font-black text-text-main">{new Date(checkoutSummary.exitTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-text-muted">Duration</span>
                  <span className="font-black text-text-main">{checkoutSummary.durationHours} Hour{checkoutSummary.durationHours > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-4 border-b border-border-main">
                  <span className="font-bold text-text-muted">Rate</span>
                  <span className="font-black text-text-main">₹{checkoutSummary.feePerHour}/hr</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-text-muted">Total Fee</span>
                  <span className="text-2xl font-black text-primary-500">₹{checkoutSummary.totalFee}</span>
                </div>
                {checkoutSummary.transactionId && (
                  <div className="flex justify-between items-center text-sm pt-4 border-t border-border-main">
                    <span className="font-bold text-text-muted">Transaction ID</span>
                    <span className="font-mono text-xs text-text-main">{checkoutSummary.transactionId}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setCheckoutSummary(null)}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-Checkout Payment Modal — method selection */}
      <AnimatePresence>
        {preCheckoutVehicle && !upiSession && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setPreCheckoutVehicle(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-card border border-border-main rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full space-y-6 relative shadow-2xl bg-bg-card"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border-main pb-4">
                <h3 className="text-xl font-black text-text-main flex items-center">
                  <CreditCard className="w-6 h-6 mr-3 text-primary-500" /> Collect Payment
                </h3>
                <button onClick={() => setPreCheckoutVehicle(null)} className="p-2 hover:bg-bg-sub rounded-full text-text-muted hover:text-text-main transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fee Summary */}
              <div className="bg-bg-sub rounded-3xl p-5 space-y-3 border border-border-main">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-text-muted">Vehicle</span>
                  <span className="font-black text-text-main px-2 py-1 bg-bg-card rounded-lg border border-border-main font-mono">{preCheckoutVehicle.vehicleNumber}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-text-muted">Duration</span>
                  <span className="font-black text-text-main">{preCheckoutVehicle.durationHours} Hour{preCheckoutVehicle.durationHours > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-3 border-b border-border-main">
                  <span className="font-bold text-text-muted">Rate</span>
                  <span className="font-black text-text-main">₹{preCheckoutVehicle.feePerHour}/hr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text-muted">Total Due</span>
                  <span className="text-3xl font-black text-primary-500">₹{preCheckoutVehicle.totalFee}</span>
                </div>
              </div>

              {/* Payment Method Buttons */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Select Payment Method</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleCashConfirm}
                    disabled={recordingExit}
                    className="py-5 rounded-2xl font-black text-sm transition-all border-2 bg-green-500/10 border-green-500/40 text-green-500 hover:bg-green-500/20 hover:border-green-500 flex flex-col items-center justify-center gap-2 shadow-lg"
                  >
                    {recordingExit ? <Loader2 className="w-5 h-5 animate-spin" /> : <IndianRupee className="w-6 h-6" />}
                    <span>Cash</span>
                    <span className="text-[9px] font-bold opacity-70">Confirm Received</span>
                  </button>
                  <button 
                    onClick={handleUpiInit}
                    disabled={initializingPayment}
                    className="py-5 rounded-2xl font-black text-sm transition-all border-2 bg-primary-500/10 border-primary-500/40 text-primary-500 hover:bg-primary-500/20 hover:border-primary-500 flex flex-col items-center justify-center gap-2 shadow-lg"
                  >
                    {initializingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-6 h-6" />}
                    <span>UPI / Online</span>
                    <span className="text-[9px] font-bold opacity-70">Show QR to Customer</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPI QR Screen — customer scans, staff confirms */}
      <AnimatePresence>
        {upiSession && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[160] flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-card border border-border-main rounded-[2.5rem] p-6 sm:p-8 max-w-sm w-full space-y-5 shadow-2xl bg-bg-card"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-main pb-4">
                <h3 className="text-lg font-black text-text-main flex items-center">
                  <Smartphone className="w-5 h-5 mr-2 text-primary-500" /> UPI Payment
                </h3>
                <button 
                  onClick={() => { setUpiSession(null); }} 
                  className="p-2 hover:bg-bg-sub rounded-full text-text-muted hover:text-text-main transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount */}
              <div className="text-center">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Amount to Collect</p>
                <p className="text-5xl font-black text-primary-500 mt-1">₹{upiSession.totalFee}</p>
                <p className="text-xs font-bold text-text-muted mt-1 font-mono">{upiSession.vehicleNumber}</p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 bg-white rounded-2xl shadow-xl">
                  {upiSession.upiQrString ? (
                    <QRCodeSVG
                      value={upiSession.upiQrString}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#0f172a"
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center bg-bg-sub rounded-xl">
                      <p className="text-xs text-text-muted text-center">No QR — confirm manually</p>
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-text-muted text-center">
                  Ask the customer to scan this QR with any UPI app (GPay, PhonePe, Paytm)
                </p>
              </div>

              {/* UTR Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  UTR / Transaction ID <span className="text-text-muted/50">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter UTR shown on customer's screen"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full bg-bg-sub border border-border-main rounded-2xl py-3 px-4 focus:ring-2 ring-primary-500 outline-none font-mono text-sm text-text-main placeholder:text-text-muted"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setUpiSession(null); }}
                  className="flex-1 py-3 rounded-2xl border border-border-main text-text-muted hover:text-text-main font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:bg-bg-sub"
                >
                  <RefreshCw className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={handleUpiConfirm}
                  disabled={recordingExit}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg"
                >
                  {recordingExit ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Confirm Paid</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParkingManager;
