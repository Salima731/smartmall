import { useState } from 'react';
import { useGetReviewsQuery, useCreateReviewMutation } from '../features/reviews/reviewApiSlice';
import { useSelector } from 'react-redux';
import { Star, MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex space-x-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => !readonly && onChange && onChange(star)}
        className={`transition-transform ${readonly ? 'cursor-default' : 'hover:scale-125'}`}
      >
        <Star
          className={`w-5 h-5 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-border-main'}`}
        />
      </button>
    ))}
  </div>
);

const ReviewWidget = ({ targetType, targetId, mallId }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: reviews, isLoading } = useGetReviewsQuery(
    { targetType, targetId },
    { skip: !targetId }
  );
  const [createReview, { isLoading: submitting }] = useCreateReviewMutation();

  const avgRating =
    reviews?.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a star rating');
    try {
      await createReview({ targetType, targetId, mallId, rating, comment }).unwrap();
      toast.success('Review submitted!');
      setRating(0);
      setComment('');
      setShowForm(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <div className="bg-bg-card border border-border-main rounded-3xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-400" /> Reviews & Ratings
        </h3>
        <div className="flex items-center space-x-2">
          {avgRating && (
            <span className="text-2xl font-extrabold text-yellow-400">{avgRating}</span>
          )}
          <span className="text-text-muted text-sm">({reviews?.length || 0})</span>
        </div>
      </div>

      {/* Average stars */}
      {avgRating && <StarRating value={Math.round(Number(avgRating))} readonly />}

      {/* Write review */}
      {userInfo && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              <MessageSquare className="w-4 h-4 mr-1" /> Write a review
            </button>
          ) : (
            <AnimatePresence>
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="space-y-3 pt-2"
              >
                <div className="space-y-1">
                  <p className="text-xs text-text-muted font-medium">Your Rating</p>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <textarea
                  rows={2}
                  placeholder="Share your experience..."
                  className="w-full bg-bg-sub border border-border-main text-text-main rounded-xl p-3 text-sm focus:ring-2 ring-primary-500 outline-none resize-none placeholder:text-text-muted"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-1" /> Submit
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm text-text-muted hover:text-text-main rounded-xl bg-bg-sub"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-12 bg-bg-sub rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {reviews?.length > 0 ? (
            reviews.map((r) => (
              <div key={r._id} className="bg-bg-sub border border-border-main rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-main">{r.user?.name}</span>
                  <StarRating value={r.rating} readonly />
                </div>
                {r.comment && (
                  <p className="text-xs text-text-muted">{r.comment}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-text-muted italic text-center py-4">No reviews yet. Be the first!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewWidget;
