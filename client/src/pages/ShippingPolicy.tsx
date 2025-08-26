import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Clock, MapPin, Package, Shield } from 'lucide-react';

const ShippingPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="w-[96%] md:w-[90%] mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-yellow-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">Shipping Policy</span>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Truck className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Shipping Policy
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Fast, reliable shipping to get your orders delivered on time
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Free Shipping */}
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <Package className="w-6 h-6 text-green-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Free Shipping</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-3 text-yellow-400">Domestic Orders</h3>
                <p className="text-gray-100 mb-4">
                  ✅ Free shipping on all orders above ₹999<br/>
                  ✅ Standard shipping ₹79 for orders below ₹999<br/>
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-3 text-yellow-400">Premium Benefits</h3>
                <p className="text-gray-100">
                  ✅ Priority processing<br/>
                  ✅ Tracking updates<br/>
                  ✅ Insurance coverage included
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Timeline */}
          {/* <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">Delivery Timeline</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-600">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Location</th>
                    <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Standard Delivery</th>
                    <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Express Delivery</th>
                    <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Shipping Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-700 transition-colors">
                    <td className="border border-gray-600 px-4 py-3 font-medium text-white">Metro Cities</td>
                    <td className="border border-gray-600 px-4 py-3 text-white">2-3 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-white">1-2 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-green-400">Free (₹999+)</td>
                  </tr>
                  <tr className="hover:bg-gray-700 transition-colors">
                    <td className="border border-gray-600 px-4 py-3 font-medium text-white">Tier 1 Cities</td>
                    <td className="border border-gray-600 px-4 py-3 text-white">3-4 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-white">2-3 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-green-400">Free (₹999+)</td>
                  </tr>
                  <tr className="hover:bg-gray-700 transition-colors">
                    <td className="border border-gray-600 px-4 py-3 font-medium text-white">Tier 2/3 Cities</td>
                    <td className="border border-gray-600 px-4 py-3 text-white">4-6 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-white">3-4 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-green-400">Free (₹999+)</td>
                  </tr>
                  <tr className="hover:bg-gray-700 transition-colors">
                    <td className="border border-gray-600 px-4 py-3 font-medium text-white">Remote Areas</td>
                    <td className="border border-gray-600 px-4 py-3 text-white">5-7 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-white">4-5 Business Days</td>
                    <td className="border border-gray-600 px-4 py-3 text-orange-400">₹50 (Below ₹999)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div> */}

          {/* Shipping Partners */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <Shield className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">Our Shipping Partners</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-yellow-400 mb-2">Blue Dart</h3>
                <p className="text-gray-300 text-sm">Express delivery for metro cities</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-yellow-400 mb-2">Delhivery</h3>
                <p className="text-gray-300 text-sm">Reliable nationwide coverage</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-yellow-400 mb-2">Ekart</h3>
                <p className="text-gray-300 text-sm">Cost-effective shipping solution</p>
              </div>
            </div>
          </div>

          {/* Order Processing */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Order Processing</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">1</div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Order Confirmation</h3>
                  <p className="text-gray-300">Your order is confirmed and payment is processed within 2 hours of placing the order.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">2</div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Production & Quality Check</h3>
                  <p className="text-gray-300">Custom designs are printed and quality checked within 24-48 hours.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">3</div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Packaging & Dispatch</h3>
                  <p className="text-gray-300">Orders are carefully packaged and dispatched within 2-3 business days.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">4</div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Delivery & Tracking</h3>
                  <p className="text-gray-300">Track your order in real-time and receive delivery updates via SMS/Email.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Restrictions */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <MapPin className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">Shipping Information</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-400">We Ship To</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>✅ All major cities in India</li>
                  <li>✅ Pin codes serviceable by our partners</li>
                  <li>✅ PO Box addresses (with restrictions)</li>
                  <li>✅ APO/FPO addresses</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-400">Important Notes</h3>
                <ul className="space-y-2 text-gray-300">
                  {/* <li>• Orders placed before 2 PM are processed same day</li>
                  <li>• Weekend orders processed on next business day</li> */}
                  <li>• Festival/holiday delays may apply</li>
                  <li>• Weather conditions may affect delivery</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-white">Need Help with Shipping?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-white">Contact Support</h3>
                <p className="text-white mb-4">
                  Our customer service team is available to help with any shipping questions.
                </p>
                <Link 
                  to="/contact" 
                  className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-white">Track Your Order</h3>
                <p className="text-white mb-4">
                  Use your order ID to track your shipment in real-time.
                </p>
                <Link 
                  to="/track-order" 
                  className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Track Order
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
