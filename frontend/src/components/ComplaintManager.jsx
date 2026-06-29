import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  useGetComplaintsQuery, 
  useCreateComplaintMutation, 
  useUpdateComplaintMutation 
} from '../features/complaints/complaintApiSlice';
import { useGetMallsQuery } from '../features/malls/mallApiSlice';
import { AlertOctagon, Plus, Check, Clock, User, Building, MapPin, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const PRIORITY_COLORS = {
  Low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Medium: 'bg-green-500/10 text-green-500 border-green-500/20',
  High: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Emergency: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
};

const STATUS_ICONS = {
  Open: <Clock className="w-4 h-4 text-blue-400" />,
  'In Review': <AlertOctagon className="w-4 h-4 text-amber-400 animate-spin" />,
  Resolved: <Check className="w-4 h-4 text-emerald-400" />,
  Closed: <Check className="w-4 h-4 text-text-muted" />,
};

const ComplaintManager = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const isCustomer = userInfo?.role === 'User';
  const canUpdate = userInfo?.role === 'Super Admin' || userInfo?.role === 'Mall Admin' || userInfo?.role === 'Staff';

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // Add Form State
  const [mall, setMall] = useState('');
  const [department, setDepartment] = useState('Management');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');

  // Admin Resolution State
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');

  const { data: complaints = [], refetch } = useGetComplaintsQuery();
  const { data: malls = [] } = useGetMallsQuery();
  
  const [createComplaint, { isLoading: submitting }] = useCreateComplaintMutation();
  const [updateComplaint, { isLoading: updating }] = useUpdateComplaintMutation();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return toast.error('Fill in all fields');
    try {
      await createComplaint({
        mall: mall || null,
        department,
        subject,
        description,
        priority,
      }).unwrap();
      toast.success('Complaint lodged successfully');
      setSubject('');
      setDescription('');
      setShowAddForm(false);
      refetch();
    } catch (err) {
      toast.error('Failed to lodge complaint');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateComplaint({
        id: selectedComplaint._id,
        status: status || selectedComplaint.status,
        note: note.trim() ? note : undefined,
      }).unwrap();
      toast.success('Complaint status updated');
      setNote('');
      setSelectedComplaint(null);
      refetch();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-bg-card shadow-2xl relative overflow-hidden">
        <div className="flex items-center space-x-4 z-10">
          <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-main">Disputes & Complaints Board</h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              {isCustomer 
                ? 'Submit disputes regarding parking speeds, restroom maintenance, or order delays.'
                : 'Manage operational conflicts, view escalation timelines, and post resolution notes.'
              }
            </p>
          </div>
        </div>

        {isCustomer && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 cursor-pointer"
          >
            File Complaint
          </button>
        )}
      </div>

      {/* Lodging Form */}
      {showAddForm && (
        <motion.form
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="p-8 bg-bg-card border border-border-main rounded-[2.5rem] space-y-6 shadow-2xl"
        >
          <h3 className="text-lg font-black text-text-main">File a Dispute</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Target Mall</label>
              <select
                value={mall}
                onChange={(e) => setMall(e.target.value)}
                className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-3 px-4 outline-none focus:ring-2 ring-red-500 font-bold text-sm cursor-pointer"
              >
                <option value="">Select Mall (Optional)</option>
                {malls.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-3 px-4 outline-none focus:ring-2 ring-red-500 font-bold text-sm cursor-pointer"
              >
                <option value="Management">Management</option>
                <option value="Security">Security</option>
                <option value="Parking">Parking</option>
                <option value="Order">Order Operations</option>
                <option value="Restroom">Restrooms</option>
                <option value="Shop">Shop / Retailer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Escalation Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-3 px-4 outline-none focus:ring-2 ring-red-500 font-bold text-sm cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Emergency">Emergency Alert</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Subject</label>
            <input
              type="text"
              placeholder="e.g. Restroom water leaking, Parking gates not opening..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl p-4 outline-none focus:ring-2 ring-red-500 text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Elaborate Details</label>
            <textarea
              rows={4}
              placeholder="Provide context, floor numbers, ticket numbers, shop names, or timestamps..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl p-4 outline-none focus:ring-2 ring-red-500 text-sm font-medium"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 cursor-pointer"
            >
              {submitting ? 'Loding...' : 'File Dispute'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3.5 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-border-main cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* Complaints Feed */}
      <div className="grid grid-cols-1 gap-6">
        {complaints.length > 0 ? (
          complaints.map((comp) => (
            <div 
              key={comp._id}
              onClick={() => setSelectedComplaint(comp)}
              className="glass-card p-6 rounded-[2.5rem] border border-border-main bg-bg-card shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-red-500/30 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-wider ${PRIORITY_COLORS[comp.priority]}`}>
                    {comp.priority}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-sub/80 rounded-xl text-[10px] font-bold border border-border-main/50 text-text-muted">
                    {STATUS_ICONS[comp.status] || <Clock className="w-3.5 h-3.5" />} {comp.status}
                  </span>
                  <span className="text-[10px] text-text-muted font-bold">
                    Dept: {comp.department}
                  </span>
                </div>

                <h4 className="text-base font-black text-text-main leading-snug">{comp.subject}</h4>
                <p className="text-xs text-text-muted leading-relaxed font-medium line-clamp-2 max-w-2xl">
                  {comp.description}
                </p>

                <div className="flex items-center gap-3 pt-2 text-[10px] text-text-muted/70 font-bold">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {comp.user?.name}</span>
                  {comp.mall && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {comp.mall?.name}</span>}
                  <span>Loded: {new Date(comp.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Progress Tracker Widget */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Resolution Steps</p>
                <div className="flex items-center gap-1">
                  {['Open', 'In Review', 'Resolved'].map((step, idx) => {
                    const normalizedStatus = comp.status === 'In-Review' ? 'In Review' : comp.status;
                    const currentStepIdx = ['Open', 'In Review', 'Resolved', 'Closed'].indexOf(normalizedStatus);
                    const isCompleted = currentStepIdx >= idx;
                    return (
                      <div key={step} className="flex items-center">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] font-black transition-all ${
                          isCompleted 
                            ? 'bg-red-500 text-white border-red-500/20' 
                            : 'bg-bg-sub border-border-main text-text-muted'
                        }`}>
                          {idx + 1}
                        </div>
                        {idx < 2 && (
                          <div className={`w-6 h-0.5 transition-all ${
                            currentStepIdx > idx ? 'bg-red-500' : 'bg-border-main'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <AlertOctagon className="w-12 h-12 text-text-muted opacity-20" />
            <p className="text-sm font-bold text-text-muted">No operational complaints lodged.</p>
          </div>
        )}
      </div>

      {/* Details & Action Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[999] backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-card border border-border-main rounded-[2.5rem] max-w-2xl w-full p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="absolute right-6 top-6 p-2 hover:bg-bg-sub rounded-xl text-text-muted hover:text-text-main cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase border tracking-wider ${PRIORITY_COLORS[selectedComplaint.priority]}`}>
                    {selectedComplaint.priority}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 bg-bg-sub border border-border-main rounded-xl text-[10px] font-bold text-text-muted">
                    {STATUS_ICONS[selectedComplaint.status]} {selectedComplaint.status}
                  </span>
                </div>

                <h3 className="text-xl font-black text-text-main">{selectedComplaint.subject}</h3>
                <p className="text-sm font-medium text-text-muted leading-relaxed">
                  {selectedComplaint.description}
                </p>

                {/* Complaint Timeline Track */}
                <div className="border-t border-b border-border-main/50 py-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">Dispute Resolution History</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1" />
                      <div>
                        <p className="text-xs font-black text-text-main">Dispute Lodged</p>
                        <p className="text-[10px] text-text-muted">Submitted by customer on {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {selectedComplaint.adminNotes?.map((noteItem, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1" />
                        <div>
                          <p className="text-xs font-black text-text-main">Administrative Response</p>
                          <p className="text-[10px] text-text-muted">Resolved/Updated on {new Date(noteItem.timestamp).toLocaleString()}</p>
                          <p className="text-xs font-bold text-primary-400 mt-1 bg-primary-500/5 border border-primary-500/10 p-3 rounded-2xl leading-relaxed">
                            "{noteItem.note}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Administrative Controls */}
                {canUpdate && (
                  <form onSubmit={handleUpdate} className="space-y-4 pt-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">Dispute Action Panel</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Modify Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl py-3 px-4 outline-none focus:ring-2 ring-red-500 font-bold text-sm cursor-pointer"
                        >
                          <option value="">Choose Status...</option>
                          <option value="In-Review">In Review</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Resolution / Follow-up Note</label>
                      <textarea
                        rows={3}
                        placeholder="Detail resolution pathway or reasons for closing dispute..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl p-4 outline-none focus:ring-2 ring-red-500 text-xs font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updating}
                      className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" /> {updating ? 'Updating...' : 'Post Action & Save'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplaintManager;
