import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  useGetReviewsQuery, 
  useGetMyReviewsQuery,
  useGetAllReviewsQuery, 
  useCreateReviewMutation, 
  useModerateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation
} from '../features/reviews/reviewApiSlice';
import { Star, MessageSquare, ShieldAlert, Check, X, Award, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const ReviewManager = ({ targetType = 'Mall', targetId }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const isAdmin = userInfo?.role === 'Super Admin' || userInfo?.role === 'Mall Admin';
  const isShopOwner = userInfo?.role === 'Shop Owner';
  const isNormalUser = userInfo?.role === 'User';
  
  const hasTarget = !!targetId;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // States for Editing
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  // 1. Fetch all reviews for admins or shop owners on dashboard
  const { data: allAdminReviews = [], refetch: refetchAdmin } = useGetAllReviewsQuery(undefined, {
    skip: !(isAdmin || (isShopOwner && !hasTarget)),
  });

  // 2. Fetch specific target reviews if targetId is passed
  const { data: targetReviews = [], refetch: refetchTarget } = useGetReviewsQuery(
    { targetType, targetId },
    { skip: (isAdmin || (isShopOwner && !hasTarget)) || !hasTarget }
  );

  // 3. Fetch general user's own reviews (when on dashboard tab)
  const { data: myUserReviews = [], refetch: refetchMyReviews } = useGetMyReviewsQuery(undefined, {
    skip: isAdmin || hasTarget || !isNormalUser
  });

  const [createReview, { isLoading: submitting }] = useCreateReviewMutation();
  const [moderateReview] = useModerateReviewMutation();
  const [updateReview, { isLoading: updating }] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error('Please add a comment');
    try {
      await createReview({
        targetType,
        targetId,
        mallId: userInfo.mall,
        rating,
        comment,
      }).unwrap();
      toast.success('Review submitted successfully! It is now pending moderation.');
      setComment('');
      setShowAddForm(false);
      
      if (hasTarget) refetchTarget();
      if (isShopOwner && !hasTarget) refetchAdmin();
      if (isNormalUser) refetchMyReviews();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit review');
    }
  };

  const handleEditStart = (rev) => {
    setEditingReviewId(rev._id);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
  };

  const handleEditCancel = () => {
    setEditingReviewId(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editComment.trim()) return toast.error('Please add a comment');
    try {
      await updateReview({
        id: editingReviewId,
        rating: editRating,
        comment: editComment
      }).unwrap();
      toast.success('Review updated successfully!');
      setEditingReviewId(null);

      if (hasTarget) refetchTarget();
      if (isShopOwner && !hasTarget) refetchAdmin();
      if (isNormalUser) refetchMyReviews();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update review');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(id).unwrap();
      toast.success('Review deleted successfully');
      
      refetchAdmin();
      if (hasTarget) refetchTarget();
      if (isNormalUser) refetchMyReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  const handleModerate = async (id, status) => {
    try {
      await moderateReview({ id, status }).unwrap();
      toast.success(`Review ${status.toLowerCase()} successfully`);
      refetchAdmin();
      if (hasTarget) refetchTarget();
      if (isNormalUser) refetchMyReviews();
    } catch (err) {
      toast.error('Failed to moderate review');
    }
  };

  const reviewsToRender = 
    isAdmin || (isShopOwner && !hasTarget) ? allAdminReviews : 
    hasTarget ? targetReviews : 
    myUserReviews;

  // Calculate review average and counts
  const totalReviewsCount = reviewsToRender.length;
  const averageRating = totalReviewsCount > 0 
    ? (reviewsToRender.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-8 w-full">
      {/* Header Panel */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-bg-card shadow-2xl relative overflow-hidden">
        <div className="flex items-center space-x-4 z-10">
          <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
            <Star className="w-8 h-8 fill-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-main">
              {isAdmin ? 'Review Moderation Board' : 'Feedback & Ratings'}
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              {isAdmin 
                ? 'Approve or reject customer reviews to maintain community standards.'
                : 'Browse ratings or share your own thoughts on services, operations, and shopping experience.'
              }
            </p>
          </div>
        </div>

        {/* Stats and Action Container */}
        <div className="flex flex-wrap items-center gap-6 z-10 w-full md:w-auto justify-between md:justify-end">
          <div className="flex gap-4">
            <div className="flex flex-col items-center justify-center bg-bg-sub/80 border border-border-main px-4 py-3 rounded-2xl min-w-[90px] shadow-md">
              <span className="text-xl font-black text-amber-500 flex items-center gap-1">
                {averageRating} <Star className="w-4 h-4 fill-amber-500 text-amber-500 inline" />
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-text-muted mt-1">Avg Rating</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-bg-sub/80 border border-border-main px-4 py-3 rounded-2xl min-w-[90px] shadow-md">
              <span className="text-xl font-black text-text-main">{totalReviewsCount}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-text-muted mt-1">Reviews</span>
            </div>
          </div>

          {!isAdmin && userInfo && hasTarget && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Leave Review
            </button>
          )}
        </div>
      </div>

      {/* Review Submission Form */}
      {showAddForm && (
        <motion.form
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAddReview}
          className="p-8 bg-bg-card border border-border-main rounded-[2.5rem] space-y-6 shadow-2xl"
        >
          <h3 className="text-lg font-black text-text-main">Share Your Experience</h3>
          
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Select Rating</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-115 transition-transform cursor-pointer"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-text-muted opacity-30'}`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Review Comment</label>
            <textarea
              rows={4}
              placeholder="Tell others what you think... cleanliness, queues, product variety, service speeds?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-bg-sub border border-border-main text-text-main rounded-2xl p-4 outline-none focus:ring-2 ring-amber-500 text-sm font-medium"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Post Review'}
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

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reviewsToRender.length > 0 ? (
          reviewsToRender.map((rev) => (
            <div 
              key={rev._id}
              className="glass-card p-6 rounded-[2.5rem] border border-border-main bg-bg-card shadow-xl flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all relative overflow-hidden group text-left"
            >
              {editingReviewId === rev._id ? (
                <form onSubmit={handleEditSubmit} className="space-y-4 w-full">
                  <h4 className="font-bold text-sm text-text-main">Edit Your Review</h4>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Rating</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setEditRating(star)}
                          className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star 
                            className={`w-6 h-6 ${star <= editRating ? 'text-amber-400 fill-amber-400' : 'text-text-muted opacity-30'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Comment</label>
                    <textarea
                      rows={3}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full bg-bg-sub border border-border-main text-text-main rounded-xl p-3 outline-none focus:ring-2 ring-amber-500 text-xs font-medium"
                    />
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                    >
                      {updating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      className="px-4 py-2 bg-bg-sub hover:bg-bg-sub/80 text-text-main rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border border-border-main cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center font-black text-amber-500 text-sm border border-amber-500/20">
                        {rev.user?.name ? rev.user.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text-main">{rev.user?.name || 'Anonymous User'}</h4>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-3.5 h-3.5 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-text-muted opacity-20'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  {rev.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider">
                      <Award className="w-3 h-3" /> Verified Feedback
                    </span>
                  )}

                  <p className="text-xs font-medium text-text-muted leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
              )}

              {/* Status and Actions */}
              <div className="pt-4 border-t border-border-main/50 flex justify-between items-center text-[10px] font-black uppercase tracking-wider mt-auto">
                <div>
                  {isAdmin ? (
                    <span className={`px-3 py-1 rounded-xl border ${
                      rev.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      rev.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                    }`}>
                      {rev.status}
                    </span>
                  ) : (
                    <span className="text-text-muted">Target: {rev.targetType}</span>
                  )}
                </div>

                <div className="flex space-x-2 items-center">
                  {/* User Edit/Delete Actions for own reviews */}
                  {!editingReviewId && userInfo && rev.user?._id === userInfo?._id && (
                    <>
                      <button
                        onClick={() => handleEditStart(rev)}
                        className="px-2.5 py-1.5 bg-primary-500/10 hover:bg-primary-500 hover:text-white text-primary-500 rounded-xl transition-all border border-primary-500/20 cursor-pointer text-[9px] font-bold flex items-center gap-1"
                      >
                        <Edit className="w-2.5 h-2.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReview(rev._id)}
                        className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all border border-red-500/20 cursor-pointer text-[9px] font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> Delete
                      </button>
                    </>
                  )}

                  {isAdmin && rev.status === 'Pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleModerate(rev._id, 'Approved')}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleModerate(rev._id, 'Rejected')}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}

                  {/* Admin Delete Action */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteReview(rev._id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-colors border border-red-500/20 cursor-pointer"
                      title="Admin Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 py-20 text-center flex flex-col items-center gap-3">
            <MessageSquare className="w-12 h-12 text-text-muted opacity-20" />
            <p className="text-sm font-bold text-text-muted">No reviews available under current parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewManager;
