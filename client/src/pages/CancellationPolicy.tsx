import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, Mail, AlertTriangle, CheckCircle } from 'lucide-react';

const CancellationPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="w-[96%] md:w-[90%] mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-yellow-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">Cancellation Policy</span>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Cancellation Policy
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Simple and clear cancellation process for your orders
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Cancellation Policy */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <CheckCircle className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">How to Cancel Your Order</h2>
            </div>
            <div className="space-y-6 text-gray-300">
              <p className="text-lg leading-relaxed">
                You can raise cancellation request for items or orders <strong className="text-white">before we start processing your order</strong>. 
                By sharing us an email with your <strong className="text-yellow-400">Order ID</strong> and the <strong className="text-yellow-400">reason for cancellation</strong>.
              </p>
              
              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-400 mb-2">Important Requirement</h3>
                    <p className="text-white">
                      Remember the cancellation request must be raised from the <strong>same email ID used while ordering</strong> on our site.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-semibold text-white">Send Cancellation Email</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Send us the email on: <strong className="text-yellow-400">hello@attars.club</strong>
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>Include in your email:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your Order ID</li>
                    <li>Reason for cancellation</li>
                    <li>Send from the same email used for ordering</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* After Shipping Policy */}
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-6 h-6 text-orange-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">After Order is Shipped</h2>
            </div>
            <div className="space-y-4 text-white">
              <p className="text-lg leading-relaxed">
                Once the order is <strong>shipped from the warehouse</strong>, it <strong className="text-orange-400">cannot be cancelled</strong>.
              </p>
              
              <p className="leading-relaxed">
                When the shipment is delivered and if the customer receives a <strong className="text-red-400">faulty product</strong> then 
                he or she can raise the <strong className="text-yellow-400">return request</strong>.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-white">Need Help?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <h3 className="font-semibold mb-3 text-white">Cancel Your Order</h3>
                <p className="text-white mb-4 text-sm">
                  Send us an email with your Order ID and cancellation reason.
                </p>
                <a 
                  href="mailto:hello@attars.club?subject=Order Cancellation Request&body=Order ID: %0D%0AReason for cancellation: %0D%0A%0D%0APlease send this email from the same address used for ordering."
                  className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Email Cancellation
                </a>
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-3 text-white">Return Policy</h3>
                <p className="text-white mb-4 text-sm">
                  For faulty products received after delivery.
                </p>
                <Link 
                  to="/return-policy" 
                  className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  View Return Policy
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="text-center bg-gray-800 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4">Still Have Questions?</h3>
            <p className="text-gray-400 mb-6">
              Our customer support team is here to help with your cancellation request.
            </p>
            <Link 
              to="/contact" 
              className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy;
