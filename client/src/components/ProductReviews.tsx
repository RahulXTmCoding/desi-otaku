import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { API } from '../backend';
import { isAutheticated } from '../auth/helper';

interface ProductReviewsProps {
  productId: string;
  productImage: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productImage }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  
  const auth = isAutheticated();
  const userId = auth && auth.user ? auth.user._id : null;
  const token = auth ? auth.token : null;

  useEffect(() => {
    checkReviewsStatus();
    loadReviews();
    if (userId) {
      checkUserReview();
    }
  }, [productId]);

  const checkReviewsStatus = async () => {
    try {
      const response = await fetch(`${API}/settings/reviews-status`);
      const data = await response.json();
      
      if (response.ok) {
        setReviewsEnabled(data.reviewsEnabled);
      }
    } catch (err) {
      console.error('Failed to check reviews status:', err);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(`${API}/reviews/product/${productId}`);
      const data = await response.json();
      
      if (response.ok) {
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkUserReview = async () => {
    if (!userId || !token) return;
    
    try {
      const response = await fetch(`${API}/reviews/product/${productId}/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const review = await response.json();
        setUserReview(review);
        setFormData({
          rating: review.rating,
          title: review.title,
          comment: review.comment
        });
      }
    } catch (err) {
      console.error('Error checking user review:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !token) {
      alert('Please login to write a review');
      return;
    }

    try {
      const url = userReview 
        ? `${API}/reviews/${userReview._id}/${userId}`
        : `${API}/reviews/product/${productId}/${userId}`;
      
      const method = userReview ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadReviews();
        await checkUserReview();
        setShowReviewForm(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview || !userId || !token) return;
    
    if (!confirm('Are you sure you want to delete your review?')) return;

    try {
      const response = await fetch(`${API}/reviews/${userReview._id}/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUserReview(null);
        await loadReviews();
        setFormData({ rating: 5, title: '', comment: '' });
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!userId || !token) {
      alert('Please login to mark reviews as helpful');
      return;
    }

    try {
      const response = await fetch(`${API}/reviews/${reviewId}/helpful/${userId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadReviews();
      }
    } catch (err) {
      console.error('Error marking review as helpful:', err);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingForm = () => {
    return (
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData({ ...formData, rating: star })}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 cursor-pointer transition-colors ${
                star <= formData.rating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-600 hover:text-gray-500'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  if (!reviewsEnabled) {
    return (
      <div className="mt-12 bg-gray-800 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Reviews Temporarily Unavailable</h2>
        <p className="text-gray-400">
          Product reviews are currently disabled. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

      {/* Review Stats */}
      {stats && (
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div className="text-center md:text-left">
              <div className="text-5xl font-bold text-yellow-400 mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center md:justify-start mb-2">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-gray-400">
                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.distribution[rating] || 0;
                const percentage = stats.totalReviews > 0 
                  ? (count / stats.totalReviews) * 100 
                  : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm w-12">{rating} star</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-yellow-400 h-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button/Form */}
      {userId && !userReview && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="mb-8 px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
        >
          Write a Review
        </button>
      )}

      {/* Review Form */}
      {(showReviewForm || (userReview && showReviewForm)) && (
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <img src={productImage} alt="product" className="w-24 h-24 rounded-lg object-cover"/>
            <div>
              <h3 className="text-xl font-semibold">
                {userReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              <p className="text-gray-400">Your feedback helps other shoppers.</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmitReview}>
            {renderRatingForm()}
            
            <input
              type="text"
              placeholder="Review Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg mb-4 focus:outline-none focus:border-yellow-400"
              required
            />
            
            <textarea
              placeholder="Write your review here..."
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg mb-4 focus:outline-none focus:border-yellow-400 min-h-[120px]"
              required
            />
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                {userReview ? 'Update Review' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User's Review */}
      {userReview && !showReviewForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border-2 border-yellow-400/30">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold text-lg">Your Review</h4>
              <div className="flex items-center gap-2 mt-1">
                {renderStars(userReview.rating)}
                {userReview.verified && (
                  <span className="flex items-center gap-1 text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Verified Purchase
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReviewForm(true)}
                className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                title="Edit Review"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteReview}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete Review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <h5 className="font-semibold mb-2">{userReview.title}</h5>
          <p className="text-gray-300">{userReview.comment}</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.filter(r => r._id !== userReview?._id).map((review) => (
          <div key={review._id} className="bg-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold">{review.user.name}</h4>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-green-500 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {renderStars(review.rating)}
                  <span className="text-sm text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <h5 className="font-semibold mb-2">{review.title}</h5>
            <p className="text-gray-300 mb-4">{review.comment}</p>
            
            <button
              onClick={() => handleMarkHelpful(review._id)}
              className={`flex items-center gap-2 text-sm ${
                review.isHelpful ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              } transition-colors`}
            >
              <ThumbsUp className="w-4 h-4" />
              Helpful ({review.helpfulCount || 0})
            </button>
          </div>
        ))}
      </div>

      {reviews.length === 0 && !userReview && (
        <p className="text-center text-gray-400 py-8">
          No reviews yet. Be the first to review this product!
        </p>
      )}
    </div>
  );
};

export default ProductReviews;
