import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Upload, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const ReturnPortal: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const returnReasons = [
    'Wrong size delivered',
    'Product defective/damaged',
    'Different product delivered',
    'Quality not as expected',
    'Changed mind',
    'Product not fitting properly',
    'Color different from image',
    'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle return request submission
    alert('Return request submitted successfully! You will receive a confirmation email shortly.');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="w-[96%] md:w-[90%] mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-yellow-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">Return Portal</span>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Return & Replace Portal
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Start your return or exchange process easily online
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Quick Info */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="bg-green-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-green-400 mb-2">7 Days</h3>
              <p className="text-gray-300 text-sm">Return window from delivery</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-blue-400 mb-2">Free Pickup</h3>
              <p className="text-gray-300 text-sm">No return shipping charges</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="bg-yellow-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="font-semibold text-yellow-400 mb-2">Easy Process</h3>
              <p className="text-gray-300 text-sm">Simple online form</p>
            </div>
          </div>

          {/* Return Form */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Initiate Return Request</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Order Number *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Enter your order number"
                      className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email used for order"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>

              {/* Return Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for Return *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  required
                >
                  <option value="">Select a reason</option>
                  {returnReasons.map((reason, index) => (
                    <option key={index} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              {/* Additional Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Comments
                </label>
                <textarea
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder="Provide additional details about your return request..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 resize-none"
                />
              </div>

              {/* Upload Images */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Images (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 mb-2">Drag & drop images here or click to browse</p>
                  <p className="text-sm text-gray-500">Supports JPG, PNG, GIF up to 5MB each</p>
                  <input type="file" multiple accept="image/*" className="hidden" />
                </div>
              </div>

              {/* Preferred Resolution */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Resolution
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                    <input
                      type="radio"
                      name="resolution"
                      value="refund"
                      className="mr-3 text-yellow-400 focus:ring-yellow-400"
                      defaultChecked
                    />
                    <div>
                      <div className="font-medium">Refund</div>
                      <div className="text-sm text-gray-400">Get your money back</div>
                    </div>
                  </label>
                  <label className="flex items-center p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                    <input
                      type="radio"
                      name="resolution"
                      value="exchange"
                      className="mr-3 text-yellow-400 focus:ring-yellow-400"
                    />
                    <div>
                      <div className="font-medium">Exchange</div>
                      <div className="text-sm text-gray-400">Replace with same/different item</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="bg-gray-700 rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    className="mt-1 mr-3 text-yellow-400 focus:ring-yellow-400"
                    required
                  />
                  <span className="text-sm text-gray-300">
                    I agree to the <Link to="/return-policy" className="text-yellow-400 hover:underline">Return Policy</Link> and 
                    understand that the item must be in original condition with tags attached.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors transform hover:scale-105"
                >
                  Submit Return Request
                </button>
              </div>
            </form>
          </div>

          {/* Return Status Check */}
          <div className="bg-gray-800 rounded-2xl p-8 mt-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Check Return Status</h2>
            <div className="max-w-md mx-auto">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter Return Request ID"
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                />
                <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                  Check Status
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-8 mt-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400 text-center">Need Help?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Before You Return</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Check if item is within 7-day return window</li>
                  <li>• Ensure original tags are attached</li>
                  <li>• Item should be unwashed and unused</li>
                  <li>• Keep original packaging if possible</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Contact Support</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Still have questions? Our support team is here to help.
                </p>
                <div className="flex gap-3">
                  <Link 
                    to="/contact" 
                    className="bg-yellow-400 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-300 transition-colors text-sm"
                  >
                    Contact Us
                  </Link>
                  <button className="bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600 transition-colors text-sm">
                    Live Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Return Process Timeline */}
          <div className="bg-gray-800 rounded-2xl p-8 mt-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Return Process</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3 font-bold">
                  1
                </div>
                <h3 className="font-semibold text-yellow-400 mb-2">Submit Request</h3>
                <p className="text-gray-300 text-sm">Fill out the return form</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-400 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3 font-bold">
                  2
                </div>
                <h3 className="font-semibold text-blue-400 mb-2">Approval</h3>
                <p className="text-gray-300 text-sm">Request reviewed within 24 hours</p>
              </div>
              <div className="text-center">
                <div className="bg-green-400 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3 font-bold">
                  3
                </div>
                <h3 className="font-semibold text-green-400 mb-2">Pickup</h3>
                <p className="text-gray-300 text-sm">Free pickup scheduled</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-400 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3 font-bold">
                  4
                </div>
                <h3 className="font-semibold text-purple-400 mb-2">Refund</h3>
                <p className="text-gray-300 text-sm">Processed within 5-7 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPortal;
