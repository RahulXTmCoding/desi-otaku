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
import { useAnalytics } from '../context/AnalyticsContext';
import { isAutheticated, signup, authenticate } from '../auth/helper';
import { API } from '../backend';
import OrderDiscountBreakdown from '../components/OrderDiscountBreakdown';
import PDFGenerator from '../utils/pdfGenerator';

const OrderConfirmationEnhanced: React.FC = () => {
  
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const { trackPurchase } = useAnalytics();
  const auth = isAutheticated();
  
  // ✅ CRITICAL FIX: Use isGuest flag from order creation state, not recalculated value
  // The order creation process knows the true user state at the time the order was placed
  const orderStateDataPreview = location.state;
  const wasGuestAtOrderTime = orderStateDataPreview?.isGuest;
  const isGuest = wasGuestAtOrderTime !== undefined ? wasGuestAtOrderTime : (!auth || typeof auth === 'boolean' || !auth.user);
  
  // Try to get order data from location state first, then sessionStorage for guests
  let orderStateData = location.state;
  
  // If no location state and user is guest, check sessionStorage
  if (!orderStateData && isGuest) {
    const storedData = sessionStorage.getItem('guestOrderConfirmation');
    if (storedData) {
      try {
        orderStateData = JSON.parse(storedData);
      } catch (error) {
        console.error('Failed to parse stored order data:', error);
      }
    }
  }
  
  const [orderNumber] = useState(orderStateData?.orderId || `ORD${Date.now().toString().slice(-8)}`);
  const [copied, setCopied] = useState(false);
  // ✅ Use backend flags for account notifications
  const [accountCreated, setAccountCreated] = useState(orderStateData?.autoAccountCreated || false);
  const [accountExists, setAccountExists] = useState(orderStateData?.existingAccountLinked || false);
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
    }
    
    // ✅ CRITICAL: Track purchase completion
    if (orderStateData && orderDetails) {
      const orderToTrack = {
        _id: orderStateData.orderId || orderNumber,
        id: orderStateData.orderId || orderNumber,
        amount: orderStateData.finalAmount || orderDetails.amount || 0,
        finalAmount: orderStateData.finalAmount || orderDetails.amount || 0,
        products: orderDetails.products || [],
        coupon: orderDetails.coupon,
        paymentMethod: orderStateData.paymentMethod || paymentMethod,
        user: !isGuest,
        tax: 0,
        shipping: {
          shippingCost: orderStateData.shippingCost || orderDetails.shipping?.shippingCost || 0
        },
        discount: orderStateData.quantityDiscount || orderDetails.quantityDiscount?.amount || 0,
        rewardPointsRedeemed: orderStateData.rewardPointsUsed || orderDetails.rewardPointsRedeemed || 0
      };
      
      trackPurchase(orderToTrack);
    }
    
    // Only clear cart if it was NOT a Buy Now purchase
    // Buy Now purchases should preserve the original cart
    const wasBuyNow = location.state?.isBuyNow || location.state?.buyNowItem;
    
    if (!wasBuyNow) {
      // Clear cart after successful cart checkout (not Buy Now)
      clearCart().then(() => {
      });
    } else {
    }

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

  const autoCreateAccount = async () => {
    if (!shippingInfo?.email || !shippingInfo?.fullName || accountCreated || accountExists || accountCreationLoading) {
      return;
    }

    setAccountCreationLoading(true);

    try {
      // ✅ FIXED: First check if user already exists before trying to create account
      // This prevents showing "creating account" for existing users
      
      // Check if user already exists by attempting to sign up
      const name = shippingInfo.fullName.split(' ')[0];
      const tempPassword = `Temp${Date.now()}!${Math.random().toString(36).substring(2, 8)}`;
      
      const signupData = await signup({
        name,
        email: shippingInfo.email,
        password: tempPassword
      });

      if (!signupData.error) {
        // Account was successfully created (first time user)
        setAccountCreated(true);
        
        // Link the order to the newly created user
        if (orderStateData?.orderId) {
          try {
          } catch (error) {
            console.error('Failed to link order to new account:', error);
          }
        }
      } else if (signupData.error.includes('already exists') || signupData.error.includes('Email already registered')) {
        // User already has an account - this is a returning guest customer
        setAccountExists(true);
      } else {
        // Some other error occurred
        console.error('Account creation error:', signupData.error);
        // Don't show any account messages if there's an unexpected error
      }
    } catch (error) {
      console.error('Auto account creation failed:', error);
      // Don't show any account messages if there's an error
    } finally {
      setAccountCreationLoading(false);
    }
  };

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  
    const finalAmount = orderStateData?.finalAmount || orderDetails?.amount || 0;
    const itemCount = orderStateData?.itemCount || orderDetails?.products?.length || 0;
    
    // ✅ FIXED: Get all discount information from database
    const shippingCost = orderStateData?.shippingCost || orderDetails?.shipping?.shippingCost || 0;
    
    // ✅ Get all discounts from database/order details
    const couponDiscount = orderStateData?.couponDiscount || orderDetails?.coupon?.discountValue || 0;
    const quantityDiscount = orderStateData?.quantityDiscount || orderDetails?.quantityDiscount?.amount || 0;
    const rewardPointsUsed = orderStateData?.rewardPointsUsed || orderDetails?.rewardPointsRedeemed || 0;
    const rewardDiscount = orderStateData?.rewardDiscount || orderDetails?.rewardPointsDiscount || (rewardPointsUsed * 0.5) || 0;
    
    // ✅ NEW: Get online payment discount from database
    const onlinePaymentDiscount = orderStateData?.onlinePaymentDiscount || orderDetails?.onlinePaymentDiscount?.amount || 0;
    
    // ✅ FIXED: Calculate correct subtotal from originalAmount (before all discounts)
    let subtotal = 0;
    if (orderDetails?.originalAmount) {
      // Use originalAmount (subtotal + shipping before discounts)
      subtotal = orderDetails.originalAmount - shippingCost;
    } else if (orderDetails?.products && Array.isArray(orderDetails.products)) {
      // Calculate from products if originalAmount not available
      subtotal = orderDetails.products.reduce((sum, product) => {
        const price = product.price || 0;
        const count = product.count || product.quantity || 1;
        return sum + (price * count);
      }, 0);
    } else {
      // Last fallback - calculate from final amount + all discounts
      subtotal = finalAmount + quantityDiscount + couponDiscount + rewardDiscount + onlinePaymentDiscount - shippingCost;
    }
    
    subtotal = Math.max(0, subtotal);
  
  // ✅ CRITICAL DEBUG: Log all possible data sources
  
  // ✅ UPDATED: Use new HTML-to-PDF conversion system
  const handleDownloadInvoice = async () => {
    if (!orderNumber) {
      setDownloadError('Order number not available');
      return;
    }
    
    setDownloadingInvoice(true);
    setDownloadError('');
    
    try {
      // Try with order number first, then payment ID if available
      let invoiceUrl = `${API}/invoice/order/${orderNumber}/download`;
      
      try {
        await PDFGenerator.downloadInvoiceFromServer(invoiceUrl, `invoice-${orderNumber}.pdf`);
      } catch (firstError) {
        // If that fails and we have a payment ID, try with payment ID
        if (orderStateData?.paymentDetails?.razorpay_payment_id) {
          invoiceUrl = `${API}/invoice/order/${orderStateData.paymentDetails.razorpay_payment_id}/download`;
          await PDFGenerator.downloadInvoiceFromServer(invoiceUrl, `invoice-${orderNumber}.pdf`);
        } else {
          throw firstError;
        }
      }
    } catch (error: any) {
      console.error('Download invoice error:', error);
      setDownloadError(error.message || 'Failed to download invoice. Please try again.');
      
      // ✅ Fallback: Show order details if invoice fails
      setTimeout(() => {
        if (confirm('Invoice download failed. Would you like to see order details instead?')) {
          alert(`Order Details:\n\nOrder ID: ${orderNumber}\nTotal Amount: ₹${finalAmount}\nItems: ${itemCount}\nEmail: ${shippingInfo?.email}\n\nPlease save this information for your records.`);
        }
      }, 1000);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 md:py-12">
      <div className="w-[96%] md:w-[90%] max-w-4xl mx-auto md:px-4">
        {/* Success Animation */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-green-500 rounded-full mb-4 md:mb-6 animate-bounce">
            <CheckCircle className="w-14 h-14 md:w-16 md:h-16 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3">Order Confirmed!</h1>
          <p className="text-lg md:text-xl text-gray-300">Thank you for your purchase</p>
        </div>

        {/* Account Creation Info for NEW Guest Users Only */}
        {isGuest && accountCreated && !accountExists && (
          <div className="bg-blue-500/10 border border-blue-500 p-4 md:p-6 rounded-lg mb-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-bold mb-2 text-blue-400">Account Created Automatically!</h3>
                <p className="text-sm md:text-base text-gray-300 mb-3">
                  We've created an account for you to track your order and save time on future purchases.
                </p>
                <div className="bg-gray-800 p-3 md:p-4 rounded-lg mb-3">
                  <p className="text-xs md:text-sm text-gray-400 mb-1">Your account email:</p>
                  <p className="font-mono text-sm md:text-base text-yellow-400 break-all">{shippingInfo?.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs md:text-sm text-gray-300">
                    📧 Check your email for instructions to set your password
                  </p>
                  <p className="text-xs md:text-sm text-gray-300">
                    🔒 Use "Forgot Password" on the sign-in page to set a new password
                  </p>
                  <p className="text-xs md:text-sm text-gray-300">
                    📦 Your order and shipping address have been saved to your account
                  </p>
                </div>
                <Link 
                  to="/forgot-password" 
                  className="inline-block mt-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-4 md:px-6 py-2 rounded-lg font-bold transition-all text-sm md:text-base"
                >
                  Set Your Password
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Account Already Exists Info for RETURNING Guest Users */}
        {isGuest && accountExists && !accountCreated && (
          <div className="bg-green-500/10 border border-green-500 p-4 md:p-6 rounded-lg mb-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-bold mb-2 text-green-400">Great News! Order Linked to Your Account</h3>
                <p className="text-sm md:text-base text-gray-300 mb-3">
                  We found your existing account with <span className="font-mono text-yellow-400 break-all">{shippingInfo?.email} </span> 
                  and automatically linked this order to it!
                </p>
                <div className="bg-gray-800 p-3 md:p-4 rounded-lg mb-3">
                  <p className="text-xs md:text-sm text-gray-300 mb-2">
                    <strong>This order has been added to your account.</strong> You can now:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-gray-300">
                    <li>View this order in your order history</li>
                    <li>Track shipment status</li>
                    <li>Download invoices</li>
                    <li>Contact support if needed</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-xs md:text-sm text-gray-300">
                    ✅ <strong>No action needed!</strong> Just sign in to see all your orders
                  </p>
                  <p className="text-xs md:text-sm text-gray-300">
                    🔐 Forgot your password? Use the "Forgot Password" link on the sign-in page
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Link 
                    to="/signin" 
                    className="flex-1 text-center bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-4 md:px-6 py-2 rounded-lg font-bold transition-all text-sm md:text-base"
                  >
                    Sign In to View Orders
                  </Link>
                  <Link 
                    to="/forgot-password" 
                    className="flex-1 text-center bg-gray-700 hover:bg-gray-600 text-white px-4 md:px-6 py-2 rounded-lg font-bold transition-all text-sm md:text-base"
                  >
                    Reset Password
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Card */}
        <div className="bg-gray-800 rounded-2xl p-4 md:p-8 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Order Details</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-400 text-sm md:text-base">Order Number:</span>
                <span className="font-mono text-yellow-400 text-sm md:text-base break-all">{orderNumber}</span>
                <button
                  onClick={copyOrderNumber}
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                  title="Copy order number"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {copied && <span className="text-green-400 text-xs md:text-sm">Copied!</span>}
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
              {/* ✅ UNIVERSAL DISCOUNT COMPONENT - Handles all discount sources */}
              <OrderDiscountBreakdown 
                order={orderDetails}
                orderStateData={orderStateData}
                className=""
                showTitle={false}
                variant="detailed"
              />
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

        {/* Loading State for Account Creation (only for new users) */}
        {accountCreationLoading && !accountExists && !accountCreated && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-300">Creating your account...</p>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-gray-800 rounded-2xl p-4 md:p-8 border border-gray-700">
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
