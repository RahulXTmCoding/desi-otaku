import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Ruler, User, Shirt } from 'lucide-react';

const SizeGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="w-[96%] md:w-[90%] mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-yellow-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">Size Guide</span>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Ruler className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Size Guide
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Find your perfect fit with our comprehensive size guide
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* How to Measure */}
          <div className="bg-gray-800 rounded-2xl p-8 mb-8">
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold">How to Measure Yourself</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-yellow-400">Chest/Bust</h3>
                <p className="text-gray-300 mb-4">
                  Measure around the fullest part of your chest, keeping the tape horizontal and snug but not tight.
                </p>
                
                <h3 className="text-xl font-semibold mb-4 text-yellow-400">Length</h3>
                <p className="text-gray-300 mb-4">
                  Measure from the highest point of your shoulder down to where you want the garment to end.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-yellow-400">Shoulders</h3>
                <p className="text-gray-300 mb-4">
                  Measure from the edge of one shoulder to the edge of the other across your back.
                </p>
                
                <h3 className="text-xl font-semibold mb-4 text-yellow-400">Sleeve Length</h3>
                <p className="text-gray-300">
                  Measure from your shoulder point down to your wrist with your arm slightly bent.
                </p>
              </div>
            </div>
          </div>

          {/* Plain T-Shirt Size Chart */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8 mb-8">
            <div className="flex items-center mb-6">
              <Shirt className="w-6 h-6 text-green-400 mr-3" />
              <h2 className="text-xl sm:text-2xl font-bold">Plain T-Shirt Size Chart</h2>
              <span className="ml-3 text-sm bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Regular Fit</span>
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-full px-4 sm:px-0">
                <table className="w-full border-collapse border border-gray-600 min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Size</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Chest (inches)</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Length (inches)</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Shoulder (inches)</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Sleeve (inches)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-green-400">S</td>
                      <td className="border border-gray-600 px-4 py-3">36</td>
                      <td className="border border-gray-600 px-4 py-3">26</td>
                      <td className="border border-gray-600 px-4 py-3">17</td>
                      <td className="border border-gray-600 px-4 py-3">7</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-green-400">M</td>
                      <td className="border border-gray-600 px-4 py-3">38</td>
                      <td className="border border-gray-600 px-4 py-3">27</td>
                      <td className="border border-gray-600 px-4 py-3">18</td>
                      <td className="border border-gray-600 px-4 py-3">8</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-green-400">L</td>
                      <td className="border border-gray-600 px-4 py-3">40</td>
                      <td className="border border-gray-600 px-4 py-3">28</td>
                      <td className="border border-gray-600 px-4 py-3">19</td>
                      <td className="border border-gray-600 px-4 py-3">9</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-green-400">XL</td>
                      <td className="border border-gray-600 px-4 py-3">42</td>
                      <td className="border border-gray-600 px-4 py-3">29</td>
                      <td className="border border-gray-600 px-4 py-3">20</td>
                      <td className="border border-gray-600 px-4 py-3">10</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-green-400">XXL</td>
                      <td className="border border-gray-600 px-4 py-3">44</td>
                      <td className="border border-gray-600 px-4 py-3">30</td>
                      <td className="border border-gray-600 px-4 py-3">21</td>
                      <td className="border border-gray-600 px-4 py-3">11</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Oversized Tees Size Chart */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8 mb-8">
            <div className="flex items-center mb-6">
              <Shirt className="w-6 h-6 text-orange-400 mr-3" />
              <h2 className="text-xl sm:text-2xl font-bold">Oversized Tees Size Chart</h2>
              <span className="ml-3 text-sm bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full">Oversized Fit</span>
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-full px-4 sm:px-0">
                <table className="w-full border-collapse border border-gray-600 min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Size</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Chest (inches)</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Length (inches)</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Shoulder (inches)</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Sleeve (inches)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-orange-400">S</td>
                      <td className="border border-gray-600 px-4 py-3">42</td>
                      <td className="border border-gray-600 px-4 py-3">28</td>
                      <td className="border border-gray-600 px-4 py-3">20</td>
                      <td className="border border-gray-600 px-4 py-3">8</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-orange-400">M</td>
                      <td className="border border-gray-600 px-4 py-3">44</td>
                      <td className="border border-gray-600 px-4 py-3">29</td>
                      <td className="border border-gray-600 px-4 py-3">21</td>
                      <td className="border border-gray-600 px-4 py-3">9</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-orange-400">L</td>
                      <td className="border border-gray-600 px-4 py-3">46</td>
                      <td className="border border-gray-600 px-4 py-3">30</td>
                      <td className="border border-gray-600 px-4 py-3">22</td>
                      <td className="border border-gray-600 px-4 py-3">10</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-orange-400">XL</td>
                      <td className="border border-gray-600 px-4 py-3">48</td>
                      <td className="border border-gray-600 px-4 py-3">31</td>
                      <td className="border border-gray-600 px-4 py-3">23</td>
                      <td className="border border-gray-600 px-4 py-3">11</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-orange-400">XXL</td>
                      <td className="border border-gray-600 px-4 py-3">50</td>
                      <td className="border border-gray-600 px-4 py-3">32</td>
                      <td className="border border-gray-600 px-4 py-3">24</td>
                      <td className="border border-gray-600 px-4 py-3">12</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Hoodies Size Chart */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8 mb-8">
            <div className="flex items-center mb-6">
              <Shirt className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-xl sm:text-2xl font-bold">Hoodies Size Chart</h2>
              <span className="ml-3 text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">Comfortable Fit</span>
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-full px-4 sm:px-0">
                <table className="w-full border-collapse border border-gray-600 min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Size</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Chest (inches)</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Length (inches)</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Shoulder (inches)</th>
                      <th className="border border-gray-600 px-4 py-3 text-left font-semibold">Sleeve (inches)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-blue-400">S</td>
                      <td className="border border-gray-600 px-4 py-3">38</td>
                      <td className="border border-gray-600 px-4 py-3">25</td>
                      <td className="border border-gray-600 px-4 py-3">18</td>
                      <td className="border border-gray-600 px-4 py-3">24</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-blue-400">M</td>
                      <td className="border border-gray-600 px-4 py-3">40</td>
                      <td className="border border-gray-600 px-4 py-3">26</td>
                      <td className="border border-gray-600 px-4 py-3">19</td>
                      <td className="border border-gray-600 px-4 py-3">25</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-blue-400">L</td>
                      <td className="border border-gray-600 px-4 py-3">42</td>
                      <td className="border border-gray-600 px-4 py-3">27</td>
                      <td className="border border-gray-600 px-4 py-3">20</td>
                      <td className="border border-gray-600 px-4 py-3">26</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-blue-400">XL</td>
                      <td className="border border-gray-600 px-4 py-3">44</td>
                      <td className="border border-gray-600 px-4 py-3">28</td>
                      <td className="border border-gray-600 px-4 py-3">21</td>
                      <td className="border border-gray-600 px-4 py-3">27</td>
                    </tr>
                    <tr className="hover:bg-gray-700 transition-colors">
                      <td className="border border-gray-600 px-4 py-3 font-medium text-blue-400">XXL</td>
                      <td className="border border-gray-600 px-4 py-3">46</td>
                      <td className="border border-gray-600 px-4 py-3">29</td>
                      <td className="border border-gray-600 px-4 py-3">22</td>
                      <td className="border border-gray-600 px-4 py-3">28</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Fit Guide */}
          <div className="bg-gray-800 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Fit Guide</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-400">S</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-blue-400">Slim Fit</h3>
                <p className="text-gray-400 text-sm">
                  Close to body fit, ideal for a sleek silhouette
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-400">R</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-green-400">Regular Fit</h3>
                <p className="text-gray-400 text-sm">
                  Comfortable everyday fit with room to move
                </p>
              </div>
              <div className="text-center">
                <div className="bg-orange-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-400">O</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-orange-400">Oversized</h3>
                <p className="text-gray-400 text-sm">
                  Loose and relaxed fit for maximum comfort
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-white">Sizing Tips</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span className="text-white">When in doubt, size up for a more comfortable fit</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span className="text-white">Consider the fabric - cotton may shrink slightly after washing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span className="text-white">Check product descriptions for specific fit information</span>
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span className="text-white">Measure your favorite fitting shirt and compare</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span className="text-white">Our customer service team is here to help with sizing questions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span className="text-white">We offer easy exchanges if the size doesn't fit perfectly</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">Still need help with sizing?</p>
            <Link 
              to="/contact" 
              className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-yellow-300 transition-colors"
            >
              Contact Our Support Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuide;
