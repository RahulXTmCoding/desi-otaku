import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Mail,
  Home,
  Copy,
  Download
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [orderNumber] = useState(`ORD${Date.now().toString().slice(-8)}`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Clear cart after successful order
    clearCart().then(() => {
      console.log('Cart cleared');
    });

    // Celebration animation
    const timer = setTimeout(() => {
      confetti();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const confetti = () => {
    // Simple confetti effect
    const colors = ['#FCD34D', '#8B5CF6', '#10B981', '#EF4444', '#3B82F6'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      const confettiElement = document.createElement('div');
      confettiElement.style.position = 'fixed';
      confettiElement.style.width = '10px';
      confettiElement.style.height = '10px';
      confettiElement.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confettiElement.style.left = Math.random() * 100 + '%';
      confettiElement.style.top = '-10px';
      confettiElement.style.borderRadius = '50%';
      confettiElement.style.pointerEvents = 'none';
      confettiElement.style.zIndex = '9999';
      
      document.body.appendChild(confettiElement);
      
      const animation = confettiElement.animate([
        { 
          transform: 'translateY(0) rotate(0deg)',
          opacity: 1
        },
        { 
          transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`,
          opacity: 0
        }
      ], {
        duration: Math.random() * 3000 + 2000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
      
      animation.onfinish = () => confettiElement.remove();
    }
  };

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Order Confirmed!</h1>
          <p className="text-xl text-gray-300">Thank you for your purchase</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Order Details</h2>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Order Number:</span>
                <span className="font-mono text-yellow-400">{orderNumber}</span>
                <button
                  onClick={copyOrderNumber}
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                  title="Copy order number"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {copied && <span className="text-green-400 text-sm">Copied!</span>}
              </div>
            </div>
            <button className="mt-4 md:mt-0 flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Download Invoice
            </button>
          </div>

          {/* Order Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-yellow-400" />
                <h3 className="font-semibold text-lg">Order Summary</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Items:</span>
                  <span>3 T-shirts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal:</span>
                  <span>₹1,797</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping:</span>
                  <span className="text-green-400">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax:</span>
                  <span>₹0</span>
                </div>
                <hr className="border-gray-600 my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total Paid:</span>
                  <span className="text-yellow-400">₹1,797</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-6 h-6 text-yellow-400" />
                <h3 className="font-semibold text-lg">Delivery Information</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Estimated Delivery:</p>
                  <p className="font-semibold text-green-400">
                    {estimatedDelivery.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Shipping Method:</p>
                  <p>Standard Delivery (5-7 business days)</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Tracking:</p>
                  <p className="text-yellow-400">Will be sent via email</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-6">What happens next?</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Order Confirmation Email</h3>
                <p className="text-gray-400 text-sm">
                  You'll receive an email with your order details and invoice within the next few minutes.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Order Processing</h3>
                <p className="text-gray-400 text-sm">
                  We'll start preparing your custom t-shirts. This usually takes 1-2 business days.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Shipping Updates</h3>
                <p className="text-gray-400 text-sm">
                  Once shipped, you'll receive tracking information to monitor your delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={() => navigate('/shop')}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-gray-900 py-3 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>

        {/* Customer Support */}
        <div className="text-center mt-12 text-gray-400">
          <p className="mb-2">Need help with your order?</p>
          <Link to="/contact" className="text-yellow-400 hover:text-yellow-300 font-medium">
            Contact Customer Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
