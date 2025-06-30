import React, { useState, useEffect } from 'react';
import { MessageSquare, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import Base from '../core/Base';
import { Link } from 'react-router-dom';
import { isAutheticated } from '../auth/helper';
import { API } from '../backend';

const ReviewSettings = () => {
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const auth = isAutheticated();
  const user = auth && auth.user ? auth.user : null;
  const token = auth ? auth.token : null;
  const userId = user?._id;

  useEffect(() => {
    loadReviewsStatus();
  }, []);

  const loadReviewsStatus = async () => {
    try {
      const response = await fetch(`${API}/settings/reviews-status`);
      const data = await response.json();
      
      if (response.ok) {
        setReviewsEnabled(data.reviewsEnabled);
      } else {
        setError('Failed to load reviews status');
      }
    } catch (err) {
      console.error('Failed to load reviews status:', err);
      setError('Failed to load reviews status');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReviews = async () => {
    setToggling(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API}/settings/toggle-reviews/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setReviewsEnabled(data.reviewsEnabled);
        setMessage(data.message);
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to toggle reviews');
      }
    } catch (err) {
      console.error('Error toggling reviews:', err);
      setError('Failed to toggle reviews. Please try again.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <Base title="Review Settings" description="Manage product review system">
      <div className="bg-gray-800 rounded-xl p-8 mb-4">
        <Link
          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors mb-6"
          to="/admin/dashboard"
        >
          <span>← Back to Dashboard</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">Review System Settings</h1>
          </div>

          {/* Status Card */}
          <div className="bg-gray-700 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Reviews Status</h2>
                <p className="text-gray-400">
                  Control whether customers can view and write product reviews
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full font-semibold ${
                reviewsEnabled 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {reviewsEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            <div className="border-t border-gray-600 pt-4">
              <p className="text-sm text-gray-400 mb-4">
                {reviewsEnabled 
                  ? 'Reviews are currently visible to all users. Customers can read and write reviews for products.'
                  : 'Reviews are currently hidden from all users. The review section will show a disabled message.'}
              </p>
              
              <button
                onClick={handleToggleReviews}
                disabled={toggling || loading}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
                  reviewsEnabled
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {toggling ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {reviewsEnabled ? (
                      <>
                        <ToggleRight className="w-5 h-5" />
                        Disable Reviews
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5" />
                        Enable Reviews
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {message}
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-gray-700 rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Important Information
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Disabling reviews will hide the review section on all product pages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Existing reviews will be preserved and will become visible again when re-enabled</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Users will see a message indicating that reviews are temporarily unavailable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>This setting affects all products across the entire platform</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Base>
  );
};

export default ReviewSettings;
