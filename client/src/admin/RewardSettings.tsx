import React, { useState, useEffect } from 'react';
import { Gift, ToggleLeft, ToggleRight, AlertCircle, Coins, TrendingUp, Award } from 'lucide-react';
import Base from '../core/Base';
import { Link } from 'react-router-dom';
import { isAutheticated } from '../auth/helper';
import { API } from '../backend';

const RewardSettings = () => {
  const [rewardsEnabled, setRewardsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const auth = isAutheticated();
  const user = auth && auth.user ? auth.user : null;
  const token = auth ? auth.token : null;
  const userId = user?._id;

  useEffect(() => {
    loadRewardsStatus();
  }, []);

  const loadRewardsStatus = async () => {
    try {
      const response = await fetch(`${API}/settings/rewards-status`);
      const data = await response.json();
      
      if (response.ok) {
        setRewardsEnabled(data.rewardsEnabled);
      } else {
        setError('Failed to load rewards status');
      }
    } catch (err) {
      console.error('Failed to load rewards status:', err);
      setError('Failed to load rewards status');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRewards = async () => {
    setToggling(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API}/settings/toggle-rewards/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setRewardsEnabled(data.rewardsEnabled);
        setMessage(data.message);
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to toggle reward points');
      }
    } catch (err) {
      console.error('Error toggling rewards:', err);
      setError('Failed to toggle reward points. Please try again.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <Base title="Reward Points Settings" description="Manage reward points system">
      <div className="bg-gray-800 rounded-xl p-8 mb-4">
        <Link
          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors mb-6"
          to="/admin/dashboard"
        >
          <span>← Back to Dashboard</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Gift className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">Reward Points Settings</h1>
          </div>

          {/* Status Card */}
          <div className="bg-gray-700 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Reward Points Status</h2>
                <p className="text-gray-400">
                  Control whether customers can earn and redeem reward points
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full font-semibold ${
                rewardsEnabled 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {rewardsEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            <div className="border-t border-gray-600 pt-4">
              <p className="text-sm text-gray-400 mb-4">
                {rewardsEnabled 
                  ? 'Reward points system is active. Customers earn points on purchases and can redeem them for discounts.'
                  : 'Reward points system is disabled. Customers cannot earn or redeem points.'}
              </p>
              
              <button
                onClick={handleToggleRewards}
                disabled={toggling || loading}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
                  rewardsEnabled
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
                    {rewardsEnabled ? (
                      <>
                        <ToggleRight className="w-5 h-5" />
                        Disable Reward Points
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5" />
                        Enable Reward Points
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

          {/* Current Configuration */}
          <div className="bg-gray-700 rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              Current Configuration
            </h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Earning Rate</span>
                </div>
                <span className="text-sm font-semibold">1% of order value</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Point Value</span>
                </div>
                <span className="text-sm font-semibold">1 point = ₹0.5</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">Max Redemption</span>
                </div>
                <span className="text-sm font-semibold">50 points per order</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gray-700 rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Important Information
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Disabling rewards will prevent customers from earning new points</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Existing points will be preserved and can be redeemed when re-enabled</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Points earned through past orders remain valid</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>This setting affects the entire platform immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Reward points visibility in user dashboard is controlled by this setting</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Base>
  );
};

export default RewardSettings;
