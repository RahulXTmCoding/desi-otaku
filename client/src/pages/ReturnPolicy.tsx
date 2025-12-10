import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import ReturnExchangeForm from '../components/ReturnExchangeForm';

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
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Returns & Exchanges for Defects Only</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg shadow-md">
                  5
                </div>
                <h3 className="font-semibold text-yellow-400 mb-2">Days to Report</h3>
                <p className="text-gray-100 text-sm">Report issues within 5 days</p>
              </div>
              <div className="text-center bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="bg-blue-400 text-gray-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg shadow-md">
                  ₹0
                </div>
                <h3 className="font-semibold text-blue-400 mb-2">Free for Defects</h3>
                <p className="text-gray-100 text-sm">No charges for our mistakes</p>
              </div>
              <div className="text-center bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="bg-green-400 text-gray-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg shadow-md">
                  ✓
                </div>
                <h3 className="font-semibold text-green-400 mb-2">Quality Assured</h3>
                <p className="text-gray-100 text-sm">We stand behind our products</p>
              </div>
            </div>
          </div>

          {/* Return Eligibility */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <CheckCircle className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">Return Eligibility</h2>
            </div>
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3 text-yellow-400">Returns Only for Defects</h3>
              <p className="text-gray-300">
                Returns are accepted <strong>only</strong> when we send a faulty product, wrong size, faulty print, or damaged product. We do not accept returns for change of mind, color preference, ordering the wrong size.
              </p>
              <p className="text-gray-300 mt-3 text-sm">
                Please carefully check the size chart and product details before placing your order, as we cannot accept returns for sizing mistakes or design interpretation differences.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-400">Returnable Items</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span>Faulty/defective products</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span>Wrong size delivered</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span>Faulty prints or damaged prints</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span>Damaged product during shipping</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span>Wrong product delivered</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-400">Non-Returnable Items</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-400 mr-2" />
                    <span>Change of mind or color preference</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-400 mr-2" />
                    <span>Wrong size ordered by customer</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-400 mr-2" />
                    <span>Misunderstanding product type (embroidered vs printed)</span>
                  </li>
                  <li className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-400 mr-2" />
                    <span>Don't like the design after receiving</span>
                  </li>
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
                    <span>Returns after 5 days</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>


          {/* Exchange Policy */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <RotateCcw className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">Exchange Policy</h2>
            </div>
            <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Exchange Conditions</h3>
              <p className="text-gray-300">
                Exchanges are available for faulty products, wrong size, faulty prints, or damaged products. Additionally, size exchanges are allowed for extra delivery charges if you ordered the wrong size.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-400">Free Exchange</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Faulty or defective products</li>
                  <li>• Wrong size delivered by us</li>
                  <li>• Faulty prints or damaged prints</li>
                  <li>• Damaged during shipping</li>
                  <li>• Within 5 days of delivery</li>
                  <li>• Subject to stock availability</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-400">Size Exchange (Paid)</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Size change due to customer ordering wrong size</li>
                  <li>• Extra delivery charges apply (₹80-120)</li>
                  <li>• Within 5 days of delivery</li>
                  <li>• Product must be unused with tags</li>
                  <li>• One-time exchange per order</li>
                  <li>• Subject to stock availability</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-sm text-orange-400">
                <strong>Note:</strong> For size exchanges where you ordered the wrong size, delivery charges (₹80-120 depending on location) must be paid before we ship the replacement. No exchange will be processed for change of mind, color preference, or misunderstanding of product details (like print type vs embroidery).
              </p>
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
                  <span className="text-white">Refunds will be processed to the original payment method within 3–4 business days.</span>
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

          {/* Return/Exchange Request Form - HIGHLIGHTED SECTION */}
          <div id="return-form" className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-2 border-yellow-400 rounded-2xl p-6 md:p-8 scroll-mt-20">
            <ReturnExchangeForm />
          </div>

          {/* Return Process */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <RotateCcw className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">How to Return/Exchange (Alternative)</h2>
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
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
