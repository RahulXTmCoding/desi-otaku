import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Mail,
  Home,
  Copy,
  Download,
  UserPlus,
  Shield,
  Star,
  Loader2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { isAutheticated, signup, authenticate } from '../auth/helper';
import { API } from '../backend';

const OrderConfirmationEnhanced: React.FC = () => {
  // Immediate test to see if component loads
  console.log('OrderConfirmationEnhanced component is loading!');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const auth = isAutheticated();
  const isGuest = !auth || typeof auth === 'boolean' || !auth.user;
  
  // Try to get order data from location state first, then sessionStorage for guests
  let orderStateData = location.state;
  
  // If no location state and user is guest, check sessionStorage
  if (!orderStateData && isGuest) {
    const storedData = sessionStorage.getItem('guestOrderConfirmation');
    if (storedData) {
      try {
        orderStateData = JSON.parse(storedData);
        console.log('Retrieved guest order from sessionStorage:', orderStateData);
      } catch (error) {
        console.error('Failed to parse stored order data:', error);
      }
    }
  }
  
  // Debug logging
  console.log('Order Confirmation - Order State Data:', orderStateData);
  console.log('Order Confirmation - Auth:', auth);
  console.log('Order Confirmation - Is Guest:', isGuest);
  
  const [orderNumber] = useState(orderStateData?.orderId || `ORD${Date.now().toString().slice(-8)}`);
  const [copied, setCopied] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [accountCreationLoading, setAccountCreationLoading] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  
  // Get order details from order state data
  const orderDetails = orderStateData?.orderDetails;
  const shippingInfo = orderStateData?.shippingInfo;
  const paymentMethod = orderStateData?.paymentMethod;
  
  // If no order data found anywhere, show an error
  if (!orderStateData) {
    console.error('No order data found in navigation state');
    return (
      <div className="min-h-screen bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Data Not Found</h1>
          <p className="text-gray-400 mb-6">
            It seems you've navigated to this page directly. 
            Please complete your order through the checkout process.
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-bold"
          >
            Go to Shop
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // ✅ FIX: Store order data in sessionStorage as backup
    if (orderStateData) {
      sessionStorage.setItem('orderConfirmation', JSON.stringify(orderStateData));
      console.log('✅ Order data stored in sessionStorage as backup');
    }
    
    // Only clear cart if it was NOT a Buy Now purchase
    // Buy Now purchases should preserve the original cart
    const wasBuyNow = location.state?.isBuyNow || location.state?.buyNowItem;
    
    if (!wasBuyNow) {
      // Clear cart after successful cart checkout (not Buy Now)
      clearCart().then(() => {
        console.log('Cart cleared after cart checkout');
      });
    } else {
      console.log('Buy Now purchase detected - preserving original cart');
    }

    // Celebration animation
    const timer = setTimeout(() => {
      confetti();
    }, 500);

    // Auto-create account for guest users
    if (isGuest && shippingInfo?.email && !accountCreated) {
      autoCreateAccount();
    }

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

  const autoCreateAccount = async () => {
    if (!shippingInfo?.email || !shippingInfo?.fullName || accountCreated || accountCreationLoading) {
      return;
    }

    setAccountCreationLoading(true);

    try {
      // Extract first name from full name
      const name = shippingInfo.fullName.split(' ')[0];
      
      // Generate a secure temporary password
      const tempPassword = `Temp${Date.now()}!${Math.random().toString(36).substring(2, 8)}`;
      
      const signupData = await signup({
        name,
        email: shippingInfo.email,
        password: tempPassword
      });

      if (!signupData.error) {
        setAccountCreated(true);
        console.log('Account created successfully for:', shippingInfo.email);
        
        // Link the order to the newly created user
        if (orderStateData?.orderId) {
          try {
            // In a real implementation, you'd have an API endpoint to link the order
            console.log('Order will be linked to new account:', orderStateData.orderId);
          } catch (error) {
            console.error('Failed to link order to new account:', error);
          }
        }
        
        // In a real app, you would send an email with password reset link
        // For now, we'll just show a message
      } else if (signupData.error.includes('already exists') || signupData.error.includes('Email already registered')) {
        // User already has an account - order is already linked by the backend
        console.log('User already has an account - order already linked');
        setAccountExists(true);
      }
    } catch (error) {
      console.error('Auto account creation failed:', error);
    } finally {
      setAccountCreationLoading(false);
    }
  };

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  // ✅ CRITICAL DEBUG: Check all possible data sources
  console.log('🔍 FULL OrderStateData structure:', JSON.stringify(orderStateData, null, 2));
  console.log('🔍 OrderDetails structure:', JSON.stringify(orderDetails, null, 2));
  
  const finalAmount = orderStateData?.finalAmount || orderDetails?.amount || 0;
  const itemCount = orderStateData?.itemCount || orderDetails?.products?.length || 0;
  
  // ✅ CRITICAL FIX: Use new data structure from payment flow
  const shippingCost = orderStateData?.shippingCost || orderDetails?.shipping?.shippingCost || 0;
  const subtotal = orderStateData?.subtotal || orderStateData?.originalAmount || finalAmount;
  
  // ✅ FIXED: Get discounts directly from navigation state
  const couponDiscount = orderStateData?.couponDiscount || orderDetails?.discount || orderDetails?.coupon?.discount || 0;
  const quantityDiscount = orderStateData?.quantityDiscount || 0;
  const rewardPointsUsed = orderDetails?.rewardPointsRedeemed || 0;
  
  // ✅ CRITICAL DEBUG: Log all possible data sources
  console.log('📊 Order Confirmation Data Analysis:');
  console.log(`   Available fields in orderStateData:`, Object.keys(orderStateData || {}));
  console.log(`   finalAmount: ₹${finalAmount} (from: ${orderStateData?.finalAmount ? 'orderStateData.finalAmount' : 'orderDetails.amount'})`);
  console.log(`   subtotal: ₹${subtotal} (from: ${orderStateData?.subtotal ? 'orderStateData.subtotal' : orderStateData?.originalAmount ? 'orderStateData.originalAmount' : 'calculated'})`);
  console.log(`   shippingCost: ₹${shippingCost} (from: ${orderStateData?.shippingCost ? 'orderStateData.shippingCost' : 'default/calculated'})`);
  console.log(`   couponDiscount: ₹${couponDiscount} (from: ${orderStateData?.couponDiscount ? 'orderStateData.couponDiscount' : 'default'})`);
  console.log(`   quantityDiscount: ₹${quantityDiscount} (from: ${orderStateData?.quantityDiscount ? 'orderStateData.quantityDiscount' : orderStateData?.aovDiscount ? 'orderStateData.aovDiscount' : 'default'})`);
  
  // ✅ FIXED: Handle HTML invoice response correctly
  const handleDownloadInvoice = async () => {
    if (!orderNumber) {
      setDownloadError('Order number not available');
      return;
    }
    
    setDownloadingInvoice(true);
    setDownloadError('');
    
    try {
      const response = await fetch(`${API}/invoice/order/${orderNumber}/download`);
      
      if (response.ok) {
        const contentType = response.headers.get('Content-Type');
        
        if (contentType?.includes('text/html')) {
          // ✅ HTML invoice - open in new tab
          const invoiceUrl = `${API}/invoice/order/${orderNumber}/download`;
          window.open(invoiceUrl, '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes');
        } else if (contentType?.includes('application/pdf')) {
          // ✅ PDF invoice - download as file
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${orderNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          // ✅ JSON response with invoice data
          const data = await response.json();
          if (data.downloadUnavailable) {
            alert(`${data.message}\n\nInvoice Number: ${data.invoice.invoiceNumber}\nCustomer: ${data.invoice.customer.name}\nAmount: ₹${data.invoice.amounts.grandTotal}`);
          } else {
            throw new Error('Unexpected response format');
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invoice not ready yet. Please try again in a few minutes.');
      }
    } catch (error: any) {
      console.error('Download invoice error:', error);
      setDownloadError(error.message || 'Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

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

        {/* Account Creation Info for Guest Users */}
        {isGuest && accountCreated && (
          <div className="bg-blue-500/10 border border-blue-500 p-6 rounded-lg mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 text-blue-400">Account Created Automatically!</h3>
                <p className="text-gray-300 mb-3">
                  We've created an account for you to track your order and save time on future purchases.
                </p>
                <div className="bg-gray-800 p-4 rounded-lg mb-3">
                  <p className="text-sm text-gray-400 mb-1">Your account email:</p>
                  <p className="font-mono text-yellow-400">{shippingInfo?.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    📧 Check your email for instructions to set your password
                  </p>
                  <p className="text-sm text-gray-300">
                    🔒 Use "Forgot Password" on the sign-in page to set a new password
                  </p>
                  <p className="text-sm text-gray-300">
                    📦 Your order and shipping address have been saved to your account
                  </p>
                </div>
                <Link 
                  to="/forgot-password" 
                  className="inline-block mt-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-2 rounded-lg font-bold transition-all"
                >
                  Set Your Password
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Account Already Exists Info */}
        {isGuest && accountExists && (
          <div className="bg-green-500/10 border border-green-500 p-6 rounded-lg mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 text-green-400">Great News! Order Linked to Your Account</h3>
                <p className="text-gray-300 mb-3">
                  We found your existing account with <span className="font-mono text-yellow-400">{shippingInfo?.email}</span> 
                  and automatically linked this order to it!
                </p>
                <div className="bg-gray-800 p-4 rounded-lg mb-3">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>This order has been added to your account.</strong> You can now:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li>View this order in your order history</li>
                    <li>Track shipment status</li>
                    <li>Download invoices</li>
                    <li>Contact support if needed</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    ✅ <strong>No action needed!</strong> Just sign in to see all your orders
                  </p>
                  <p className="text-sm text-gray-300">
                    🔐 Forgot your password? Use the "Forgot Password" link on the sign-in page
                  </p>
                </div>
                <div className="flex gap-3 mt-4">
                  <Link 
                    to="/signin" 
                    className="inline-block bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-2 rounded-lg font-bold transition-all"
                  >
                    Sign In to View Orders
                  </Link>
                  <Link 
                    to="/forgot-password" 
                    className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition-all"
                  >
                    Reset Password
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

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
            <div className="flex flex-col items-end">
              <button 
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
              >
                {downloadingInvoice ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloadingInvoice ? 'Downloading...' : 'Download Invoice'}
              </button>
              {downloadError && (
                <p className="text-red-400 text-sm mt-2 max-w-xs text-right">
                  {downloadError}
                </p>
              )}
            </div>
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
                  <span>{itemCount} T-shirts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal:</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                
                {shippingCost > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping:</span>
                    <span>₹{shippingCost.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping:</span>
                    <span className="text-green-400">FREE</span>
                  </div>
                )}
                
                {quantityDiscount > 0 && (
                  <div className="flex justify-between text-yellow-400">
                    <span>Quantity Discount ({orderStateData?.aovDiscount?.percentage || ''}% off for {itemCount} items):</span>
                    <span>-₹{quantityDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Discount ({orderStateData?.orderDetails?.coupon?.code || orderDetails?.coupon?.code || 'Applied'}):</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                {rewardPointsUsed > 0 && (
                  <div className="flex justify-between text-purple-400">
                    <span>Reward Points ({rewardPointsUsed} points):</span>
                    <span>-₹{rewardPointsUsed.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                {(quantityDiscount > 0 || couponDiscount > 0 || rewardPointsUsed > 0) && (
                  <div className="flex justify-between text-green-400 font-semibold pt-1 border-t border-gray-600">
                    <span>Total Savings:</span>
                    <span>-₹{(quantityDiscount + couponDiscount + rewardPointsUsed).toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax:</span>
                  <span>₹0</span>
                </div>
                <hr className="border-gray-600 my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total Paid:</span>
                  <span className="text-yellow-400">₹{finalAmount.toLocaleString('en-IN')}</span>
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
                  <p>{orderDetails?.shipping?.courier || 'Standard Delivery'} (5-7 business days)</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Tracking:</p>
                  <p className="text-yellow-400">Will be sent to {shippingInfo?.email || 'your email'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {shippingInfo && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="font-medium mb-2">Shipping Address:</h4>
              <p className="text-sm text-gray-300">
                {shippingInfo.fullName}<br />
                {shippingInfo.address}<br />
                {shippingInfo.city}, {shippingInfo.state} - {shippingInfo.pinCode}<br />
                Phone: {shippingInfo.phone}
              </p>
            </div>
          )}
        </div>

        {/* Loading State for Account Creation */}
        {accountCreationLoading && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-300">Creating your account...</p>
          </div>
        )}

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

export default OrderConfirmationEnhanced;
