import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ReturnPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="w-[96%] md:w-[90%] mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-yellow-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">Return and Replace Policy</span>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <RotateCcw className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Return & Replace Policy
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Easy returns and replacements to ensure your complete satisfaction
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Easy Returns Highlight */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Easy Returns</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  7
                </div>
                <h3 className="font-semibold text-yellow-400 mb-2">Days Return</h3>
                <p className="text-white text-sm">Return within 7 days of delivery</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-400 text-gray-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  ₹0
                </div>
                <h3 className="font-semibold text-blue-400 mb-2">Free Returns</h3>
                <p className="text-white text-sm">No return shipping charges</p>
              </div>
              <div className="text-center">
                <div className="bg-green-400 text-gray-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  ✓
                </div>
                <h3 className="font-semibold text-green-400 mb-2">Easy Process</h3>
                <p className="text-white text-sm">Simple online return process</p>
              </div>
            </div>
          </div>

          {/* Return Eligibility */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <CheckCircle className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">Return Eligibility</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-400">Returnable Items</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span>Unused products with original tags</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span>Products in original packaging</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span>Defective or damaged items</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span>Wrong size delivered</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span>Different product delivered</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-400">Non-Returnable Items</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-400 mr-2" />
                    <span>Used or washed products</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-400 mr-2" />
                    <span>Products without original tags</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-400 mr-2" />
                    <span>Custom/personalized products (unless defective)</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-400 mr-2" />
                    <span>Products with stains or odors</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-400 mr-2" />
                    <span>Returns after 7 days</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Return Process */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <RotateCcw className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">How to Return</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">1</div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Email Us</h3>
                  <p className="text-gray-300">Send us an email at <strong className="text-yellow-400">hello@attars.club</strong> with your order details, reason for return, and photos of the product to initiate your return request.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">2</div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Wait for Confirmation</h3>
                  <p className="text-gray-300">Our team will review your request and send you return instructions within 24 hours.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">3</div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Package Your Item</h3>
                  <p className="text-gray-300">Pack the item securely in its original packaging with all tags and accessories.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">4</div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Schedule Pickup</h3>
                  <p className="text-gray-300">We'll arrange a free pickup from your address within 2-3 business days after confirmation.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">5</div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Quality Check & Refund</h3>
                  <p className="text-gray-300">Once we receive and verify the item, your refund will be processed within 5-7 business days.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Policy */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <RotateCcw className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">Exchange Policy</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-400">Size Exchange</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Free size exchange within 7 days</li>
                  <li>• Subject to stock availability</li>
                  <li>• Same product, different size only</li>
                  <li>• Original condition required</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-400">Product Exchange</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Exchange for same or higher value product</li>
                  <li>• Pay difference if applicable</li>
                  <li>• Within 7 days of delivery</li>
                  <li>• One-time exchange per order</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Refund Timeline */}
          {/* <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">Refund Timeline</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-600">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Payment Method</th>
                    <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Refund Timeline</th>
                    <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Processing</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-700 transition-colors">
                    <td className="border border-gray-600 px-4 py-3 font-medium">Credit/Debit Card</td>
                    <td className="border border-gray-600 px-4 py-3">5-7 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-green-400">Automatic</td>
                  </tr>
                  <tr className="hover:bg-gray-700 transition-colors">
                    <td className="border border-gray-600 px-4 py-3 font-medium">Net Banking</td>
                    <td className="border border-gray-600 px-4 py-3">5-7 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-green-400">Automatic</td>
                  </tr>
                  <tr className="hover:bg-gray-700 transition-colors">
                    <td className="border border-gray-600 px-4 py-3 font-medium">UPI/Wallet</td>
                    <td className="border border-gray-600 px-4 py-3">3-5 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-green-400">Automatic</td>
                  </tr>
                  <tr className="hover:bg-gray-700 transition-colors">
                    <td className="border border-gray-600 px-4 py-3 font-medium">Cash on Delivery</td>
                    <td className="border border-gray-600 px-4 py-3">7-10 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-yellow-400">Bank Transfer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div> */}

          {/* Important Notes */}
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-6 h-6 text-orange-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Important Information</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-white">Return period starts from delivery date</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-white">Original invoice must be included</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-white">Refunds processed to original payment method</span>
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-white">Quality check required for all returns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-white">Partial refunds for damaged returns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-white">Bank charges may apply for COD refunds</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-white">Need to Return an Item?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <h3 className="font-semibold mb-3 text-white">Email for Return</h3>
                <p className="text-white mb-4 text-sm">
                  Send us an email with your order details to start the return process.
                </p>
                <a 
                  href="mailto:hello@attars.club?subject=Return Request&body=Please include your order number, reason for return, and product photos."
                  className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Email Us
                </a>
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-3 text-white">Contact Support</h3>
                <p className="text-white mb-4 text-sm">
                  Get help with your return or exchange questions.
                </p>
                <Link 
                  to="/contact" 
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
