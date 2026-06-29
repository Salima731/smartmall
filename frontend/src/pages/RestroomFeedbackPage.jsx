import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAddComplaintMutation } from '../features/restrooms/restroomApiSlice';
import { Sparkles, Star, AlertTriangle, CheckCircle2, MessageSquare, Send, ArrowLeft, ThumbsUp, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const COMMON_ISSUES = [
  'Wet Floor', 'No Soap', 'Trash Full', 'Unclean Toilet', 
  'Bad Odor', 'No Toilet Paper', 'Hand Dryer Broken', 'Sink Clogged'
];

const RestroomFeedbackPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [addComplaint, { isLoading }] = useAddComplaintMutation();

  const [rating, setRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(null);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [customComplaint, setCustomComplaint] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleIssue = (issue) => {
    setSelectedIssues(prev => 
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Combine selected tags with custom text
    const fullComplaint = [
      ...selectedIssues,
      customComplaint.trim()
    ].filter(Boolean).join('; ');

    if (rating < 5 && !fullComplaint) {
      toast.warn('Please select or describe the issue to help us improve.');
      return;
    }

    try {
      await addComplaint({
        id,
        complaint: fullComplaint || 'No specific complaint',
        rating,
        qrCodeId: `QR-${Math.floor(1000 + Math.random() * 9000)}` // Simulated unique QR scan ID
      }).unwrap();

      setSubmitted(true);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit feedback. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-[2.5rem] border border-border-main p-8 shadow-2xl relative overflow-hidden bg-bg-card"
            >
              {/* Decorative background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
              
              {/* Header */}
              <div className="text-center space-y-3 mb-8">
                <div className="w-16 h-16 bg-primary-500/10 rounded-3xl flex items-center justify-center mx-auto text-primary-500 shadow-xl shadow-primary-500/10 border border-primary-500/20">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-text-main tracking-tight">Smart Mall Restroom Feedback</h2>
                <p className="text-xs text-text-muted font-medium max-w-sm mx-auto">
                  Your instant feedback directly alerts our cleaning staff to maintain pristine hygiene standards.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Star Rating Section */}
                <div className="space-y-4 text-center bg-bg-sub/50 p-6 rounded-3xl border border-border-main">
                  <label className="block text-xs font-black uppercase tracking-widest text-text-muted">
                    Rate Your Experience
                  </label>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        onClick={() => setRating(star)}
                        className="p-2 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star 
                          className={`w-9 h-9 transition-colors ${
                            star <= (hoveredStar || rating) 
                              ? rating <= 2 ? 'text-red-500 fill-red-500' : rating <= 3 ? 'text-yellow-500 fill-yellow-500' : 'text-green-500 fill-green-500'
                              : 'text-border-main'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                  <p className={`text-xs font-bold ${rating <= 2 ? 'text-red-500' : rating <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {rating === 5 ? 'Excellent & Clean' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : rating === 2 ? 'Needs Attention' : 'Unsatisfactory'}
                  </p>
                </div>

                {/* Common Issues Quick Select (Only show prominently if rating < 5) */}
                <div className="space-y-3">
                  <label className="block text-xs font-black uppercase tracking-widest text-text-muted flex items-center justify-between">
                    <span>Quick Select Issues</span>
                    {rating < 5 && <span className="text-red-500 text-[10px]">* Recommended</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ISSUES.map((issue) => {
                      const isSelected = selectedIssues.includes(issue);
                      return (
                        <button
                          type="button"
                          key={issue}
                          onClick={() => toggleIssue(issue)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                            isSelected 
                              ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/10' 
                              : 'bg-bg-sub text-text-muted border-border-main hover:border-border-main/80'
                          }`}
                        >
                          {issue}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Notes */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-text-muted">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    value={customComplaint}
                    onChange={(e) => setCustomComplaint(e.target.value)}
                    rows={3}
                    className="w-full bg-bg-sub border border-border-main rounded-2xl p-4 focus:ring-2 ring-primary-500 outline-none text-sm font-medium placeholder:text-text-muted/50 text-text-main"
                    placeholder="Describe any other details or specific locations..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xl shadow-primary-500/20 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Instant Alert</span>
                    </>
                  )}
                </button>

              </form>

              {/* Footer Note */}
              <div className="mt-6 pt-6 border-t border-border-main text-center flex items-center justify-center gap-1.5 text-[10px] text-text-muted font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
                <span>Submitted securely to Smart Mall Facility Management</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-[2.5rem] border border-green-500/20 p-8 text-center space-y-6 shadow-2xl bg-bg-card relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-500/20 shadow-xl shadow-green-500/10 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-text-main">Thank You For Your Feedback!</h3>
                <p className="text-text-muted text-sm font-medium max-w-sm mx-auto">
                  Your report has been broadcasted instantly to the active cleaning staff dashboard. We are on it!
                </p>
              </div>

              <div className="bg-bg-sub p-6 rounded-2xl border border-border-main max-w-xs mx-auto space-y-2 text-left">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-text-muted">Facility ID:</span>
                  <span className="text-text-main uppercase">{id ? id.slice(-6) : 'SYS-1'}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-text-muted">Rating Submitted:</span>
                  <span className="text-green-500">{rating} ★</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-text-muted">Status:</span>
                  <span className="text-primary-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-ping" /> Staff Alerted
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-border-main flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Homepage
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RestroomFeedbackPage;
