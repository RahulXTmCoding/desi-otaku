import React, { useState, useEffect } from 'react';
import { X, Truck, Link, Save, ExternalLink } from 'lucide-react';
import { Order } from './types';
import { API } from '../../../backend';
import { isAutheticated } from '../../../auth/helper';

interface TrackingLinkModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

const TrackingLinkModal: React.FC<TrackingLinkModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [trackingData, setTrackingData] = useState({
    trackingId: '',
    trackingLink: '',
    courier: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with existing data
  useEffect(() => {
    if (order.shipping) {
      setTrackingData({
        trackingId: order.shipping.trackingId || '',
        trackingLink: order.shipping.trackingLink || '',
        courier: order.shipping.courier || ''
      });
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = isAutheticated();
      if (!auth || !auth.token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API}/tracking-link/${order._id}/${auth.user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(trackingData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tracking information');
      }

      // Update the order with new shipping information
      const updatedOrder = {
        ...order,
        shipping: {
          ...order.shipping,
          ...trackingData
        }
      };

      onSuccess(updatedOrder);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update tracking information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setTrackingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Truck className="w-6 h-6 text-yellow-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Update Tracking Information</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Order Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-white font-semibold mb-2">Order Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Order ID:</span>
              <span className="text-white ml-2">{order._id}</span>
            </div>
            <div>
              <span className="text-gray-400">Customer:</span>
              <span className="text-white ml-2">
                {order.user?.name || order.guestInfo?.name || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="text-white ml-2">{order.status}</span>
            </div>
            <div>
              <span className="text-gray-400">Amount:</span>
              <span className="text-white ml-2">₹{order.amount}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tracking ID */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Tracking ID
            </label>
            <input
              type="text"
              value={trackingData.trackingId}
              onChange={(e) => handleInputChange('trackingId', e.target.value)}
              placeholder="Enter tracking number (e.g., 1234567890)"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <p className="text-gray-400 text-xs mt-1">
              The tracking number provided by the courier service
            </p>
          </div>

          {/* Courier */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Courier Service
            </label>
            <input
              type="text"
              value={trackingData.courier}
              onChange={(e) => handleInputChange('courier', e.target.value)}
              placeholder="Enter courier name (e.g., BlueDart, Delhivery)"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Tracking Link */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              <Link className="w-4 h-4 inline mr-2" />
              Tracking Link (URL)
            </label>
            <input
              type="url"
              value={trackingData.trackingLink}
              onChange={(e) => handleInputChange('trackingLink', e.target.value)}
              placeholder="https://track.bluedart.com/servlet/RoutingServlet?txtAWBNo=12345"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <p className="text-gray-400 text-xs mt-1">
              Full URL to the courier's tracking page. Users can click this to track their order.
            </p>
            
            {/* Link Preview */}
            {trackingData.trackingLink && isValidUrl(trackingData.trackingLink) && (
              <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                <p className="text-green-400 text-sm mb-2">✓ Valid URL</p>
                <a
                  href={trackingData.trackingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                >
                  Test link
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}
          </div>

          {/* Common Courier Templates */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Common Courier Templates</h4>
            <div className="space-y-2 text-sm">
              <button
                type="button"
                onClick={() => handleInputChange('trackingLink', `https://track.bluedart.com/servlet/RoutingServlet?txtAWBNo=${trackingData.trackingId}`)}
                className="block w-full text-left text-blue-400 hover:text-blue-300 py-1"
                disabled={!trackingData.trackingId}
              >
                • BlueDart: https://track.bluedart.com/servlet/RoutingServlet?txtAWBNo=YOUR_AWB
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('trackingLink', `https://www.delhivery.com/track/package/${trackingData.trackingId}`)}
                className="block w-full text-left text-blue-400 hover:text-blue-300 py-1"
                disabled={!trackingData.trackingId}
              >
                • Delhivery: https://www.delhivery.com/track/package/YOUR_AWB
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('trackingLink', `https://www.fedex.com/fedextrack/?tracknumbers=${trackingData.trackingId}`)}
                className="block w-full text-left text-blue-400 hover:text-blue-300 py-1"
                disabled={!trackingData.trackingId}
              >
                • FedEx: https://www.fedex.com/fedextrack/?tracknumbers=YOUR_AWB
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-3">
              Click on a template to auto-fill the tracking link (requires Tracking ID)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-600 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Update Tracking Info
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrackingLinkModal;
