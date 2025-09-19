import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../backend';
import { createOrder, mockCreateOrder } from '../../core/helper/orderHelper';
import { mockProcessPayment } from '../../core/helper/paymentHelper';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  mockRazorpayPayment,
  initializeRazorpayCheckout
} from '../../core/helper/razorpayHelper';
import { redeemPoints, trackCouponUsage } from '../../core/helper/checkoutHelper';
import { useTheme } from '../../context/ThemeContext';
import PaymentProcessingModal from '../PaymentProcessingModal';

interface OrderHandlerProps {
  cart: any[];
  auth: any;
  isTestMode: boolean;
  paymentMethod: string;
  shippingInfo: any;
  selectedShipping: any;
  appliedDiscount: {
    coupon: { code: string; discount: number; description: string } | null;
    rewardPoints: { points: number; discount: number } | null;
  };
  getTotalAmount: () => number;
  getFinalAmount: () => number;
  razorpayReady: boolean;
  clearCart: () => Promise<void>;
  isBuyNow?: boolean;
  codVerification?: {
    otpSent: boolean;
    otpVerified: boolean;
    otp: string;
    loading: boolean;
    verificationToken?: string;
    verifiedPhone?: string;
  };
}

export const useOrderHandler = ({
  cart,
  auth,
  isTestMode,
  paymentMethod,
  shippingInfo,
  selectedShipping,
  appliedDiscount,
  getTotalAmount,
  getFinalAmount,
  razorpayReady,
  clearCart,
  isBuyNow = false,
  codVerification
}: OrderHandlerProps) => {
  const navigate = useNavigate();
  const { theme } = useTheme(); // ✅ NEW: Get current user theme
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false); // ✅ NEW: Track when order processing is done
  const [pendingNavigation, setPendingNavigation] = useState<any>(null);
  
  const handlePlaceOrder = async () => {
    // Allow guest checkout - they can sign in later or create account after order
    const isGuest = !auth || typeof auth === 'boolean' || !auth.user || !auth.token;
    const totalAmount = getFinalAmount();
    
    if (isTestMode) {
      // Test mode implementation
      const paymentResult = paymentMethod === 'razorpay' 
        ? await mockRazorpayPayment(totalAmount)
        : await mockProcessPayment(totalAmount);
        
      const orderData = {
        products: cart.map(item => ({
          product: item.product || item._id?.split('-')[0] || '',
          name: item.name,
          price: item.price,
          count: item.quantity,
          size: item.size,
        })),
        transaction_id: paymentMethod === 'razorpay' 
          ? paymentResult.razorpay_payment_id 
          : paymentResult.transaction.id,
        amount: totalAmount,
        originalAmount: getTotalAmount() + (selectedShipping?.rate || 0),
        discount: (appliedDiscount.coupon?.discount || 0) + (appliedDiscount.rewardPoints?.discount || 0),
        coupon: appliedDiscount.coupon ? {
          code: appliedDiscount.coupon.code,
          discountType: 'fixed',
          discountValue: appliedDiscount.coupon.discount
        } : null,
        rewardPointsRedeemed: appliedDiscount.rewardPoints?.points || 0,
        address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pinCode}, ${shippingInfo.country}`,
        status: "Received",
        shipping: {
          name: shippingInfo.fullName,
          phone: shippingInfo.phone,
          pincode: shippingInfo.pinCode,
          city: shippingInfo.city,
          state: shippingInfo.state,
          country: shippingInfo.country,
          weight: 0.3 * cart.length,
          shippingCost: selectedShipping?.rate || 0,
          courier: selectedShipping?.courier_name || ''
        }
      };
      
      const orderResult = await mockCreateOrder(orderData);
      
      if (orderResult.error) {
        throw new Error(orderResult.error);
      }
      
      // Only clear cart if it's not a Buy Now purchase
      if (!isBuyNow) {
        await clearCart();
      }
      navigate('/order-confirmation-enhanced', { 
        state: { 
          orderId: orderResult._id,
          orderDetails: orderData,
          shippingInfo,
          paymentMethod,
          isBuyNow // ✅ FIXED: Pass isBuyNow flag for test mode too
        }
      });
    } else if (paymentMethod === 'cod') {
      // ✅ NEW: Show processing modal for COD orders too
      setShowProcessingModal(true);
      
      // COD implementation for both authenticated and guest users
      console.log('🎯 CREATING COD ORDER:', {
        userType: isGuest ? 'guest' : 'authenticated',
        cartItems: cart.length,
        codVerified: codVerification?.otpVerified,
        totalAmount
      });

      if (!isTestMode && !codVerification?.otpVerified) {
        // ✅ Hide modal on error
        setShowProcessingModal(false);
        throw new Error('Phone verification required for COD orders');
      }

      const orderData = {
        products: cart.map(item => ({
          product: item.product || item._id?.split('-')[0] || '',
          name: item.name,
          price: item.price,
          count: item.quantity,
          size: item.size,
          isCustom: item.isCustom,
          color: item.color,
          customization: item.customization
        })),
        amount: totalAmount,
        coupon: appliedDiscount.coupon,
        rewardPointsRedeemed: isGuest ? 0 : (appliedDiscount.rewardPoints?.points || 0),
        address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pinCode}, ${shippingInfo.country}`,
        shipping: {
          name: shippingInfo.fullName,
          phone: shippingInfo.phone,
          pincode: shippingInfo.pinCode,
          city: shippingInfo.city,
          state: shippingInfo.state,
          country: shippingInfo.country,
          weight: 0.3 * cart.length,
          shippingCost: selectedShipping?.rate || 0,
          courier: selectedShipping?.courier_name || ''
        },
        // ✅ SECURE VERIFICATION: Send token and phone instead of simple boolean
        verificationToken: codVerification?.verificationToken,
        phone: codVerification?.verifiedPhone || shippingInfo.phone
      };

      let orderResult;
      let autoAccountCreated = false; // ✅ CRITICAL FIX: Declare variable in proper scope
      let existingAccountLinked = false; // ✅ CRITICAL FIX: Declare variable in proper scope
      
      try {
        if (isGuest) {
          console.log('👤 Creating guest COD order...');
          
          const response = await fetch(`${API}/cod/order/guest/create`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...orderData,
              guestInfo: {
                name: shippingInfo.fullName,
                email: shippingInfo.email,
                phone: shippingInfo.phone
              }
            })
          });
          
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to create COD order');
          }
          
          orderResult = data.order;
          // ✅ CRITICAL FIX: Capture both flags from backend response
          autoAccountCreated = data.autoAccountCreated || false;
          existingAccountLinked = data.existingAccountLinked || false;
          console.log('✅ Guest COD order created successfully:', orderResult._id, 'autoAccountCreated:', autoAccountCreated, 'existingAccountLinked:', existingAccountLinked);
          
        } else {
          console.log('🔐 Creating authenticated user COD order...');
          
          const response = await fetch(`${API}/cod/order/create`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${(auth as any).token}`
            },
            body: JSON.stringify(orderData)
          });
          
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to create COD order');
          }
          
          orderResult = data.order;
          // For authenticated users, auto account creation doesn't apply
          autoAccountCreated = false;
          console.log('✅ Authenticated COD order created successfully:', orderResult._id);
        }

        // ✅ SUCCESS: COD Order created successfully, store navigation data for modal completion
        console.log('🎉 COD ORDER CREATION SUCCESSFUL - PREPARING NAVIGATION');
        
        const navigationState = {
          orderId: orderResult._id,
          orderDetails: orderResult,
          shippingInfo,
          paymentMethod: 'cod',
          finalAmount: totalAmount,
          originalAmount: getTotalAmount() + (selectedShipping?.rate || 0),
          subtotal: getTotalAmount(),
          couponDiscount: appliedDiscount.coupon ? appliedDiscount.coupon.discount : 0,
          quantityDiscount: 0, // COD orders don't have quantity discounts in this flow
          rewardPointsUsed: isGuest ? 0 : (appliedDiscount.rewardPoints?.points || 0),
          rewardDiscount: isGuest ? 0 : (appliedDiscount.rewardPoints?.discount || 0),
          // ✅ NEW: Include online payment discount (0 for COD but needed for consistency)
          onlinePaymentDiscount: 0,
          shippingCost: selectedShipping?.rate || 0,
          appliedCoupon: appliedDiscount.coupon,
          appliedRewardPoints: isGuest ? null : appliedDiscount.rewardPoints,
          // ✅ CRITICAL FIX: Include both flags from backend response
          autoAccountCreated: autoAccountCreated,
          existingAccountLinked: isGuest ? (existingAccountLinked || false) : false,
          isGuest,
          isBuyNow,
          createdAt: new Date().toISOString(),
          paymentSuccess: true,
          orderCreated: true,
          codOrder: true
        };
        
        // ✅ NEW: Store navigation data for when modal completes, don't navigate immediately
        setPendingNavigation({
          path: '/order-confirmation-enhanced',
          state: navigationState
        });
        
        // ✅ NEW: Mark processing as complete to trigger modal completion
        setIsProcessingComplete(true);
        
        // Clear cart after successful order processing (but before navigation)
        if (!isBuyNow) {
          clearCart()
            .then(() => console.log('✅ Cart cleared after successful COD order'))
            .catch((error) => console.error('Cart clear error (non-blocking):', error));
        }
        
      } catch (error: any) {
        console.error('❌ COD ORDER CREATION FAILED:', error);
        
        // ✅ Hide processing modal on error
        setShowProcessingModal(false);
        setIsProcessingComplete(false); // ✅ Reset processing state
        
        // Re-throw error to be handled by the calling function
        throw error;
      }
      
    } else if (paymentMethod === 'razorpay') {
      // Razorpay implementation for both authenticated and guest users
      let orderResponse;
      
      // ✅ UNIFIED API CALL - Single endpoint for both guest and authenticated users
      const cartItems = cart.map(item => ({
        product: item.product || item._id?.split('-')[0] || '',
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        customization: item.customization,
        isCustom: item.isCustom,
        color: item.color
      }));

      console.log('🎯 CREATING UNIFIED RAZORPAY ORDER:', {
        userType: isGuest ? 'guest' : 'authenticated',
        cartItems: cartItems.length,
        couponCode: appliedDiscount.coupon?.code,
        rewardPoints: isGuest ? null : appliedDiscount.rewardPoints?.points,
        frontendAmount: totalAmount,
        shippingCost: selectedShipping?.rate
      });

      // ✅ SINGLE API CALL - Auto-detects user type based on auth header
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      };

      // Add auth header if user is authenticated
      if (!isGuest && (auth as any).token) {
        headers.Authorization = `Bearer ${(auth as any).token}`;
      }

      const response = await fetch(`${API}/razorpay/order/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cartItems: cartItems,
          couponCode: appliedDiscount.coupon?.code || null,
          rewardPoints: isGuest ? null : (appliedDiscount.rewardPoints?.points || null),
          paymentMethod: paymentMethod, // ✅ CRITICAL FIX: Send actual selected payment method for online discount
          currency: 'INR',
          receipt: isGuest ? `guest_${Date.now()}` : `order_${Date.now()}`,
          customerInfo: {
            name: shippingInfo.fullName,
            email: shippingInfo.email,
            phone: shippingInfo.phone
          },
          notes: {
            items: cart.length,
            shipping_method: selectedShipping?.courier_name || 'Standard',
            ...(isGuest ? {} : {
              customer_name: shippingInfo.fullName,
              customer_email: shippingInfo.email,
              reward_points_applied: appliedDiscount.rewardPoints?.points || 0,
              reward_discount_applied: appliedDiscount.rewardPoints?.discount || 0
            })
          },
          // ✅ Send frontend amount for verification (backend will use its own calculation)
          frontendAmount: totalAmount,
          shippingCost: selectedShipping?.rate || 0
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }
      orderResponse = data;
      
      if (orderResponse.error) {
        throw new Error(orderResponse.error);
      }
      
      console.log('🎯 About to initialize Razorpay checkout with:', {
        order_id: orderResponse.order.id,
        amount: orderResponse.order.amount,
        key_id: orderResponse.key_id
      });
      
      initializeRazorpayCheckout(
        {
          order_id: orderResponse.order.id,
          amount: orderResponse.order.amount,
          currency: orderResponse.order.currency,
          key_id: orderResponse.key_id,
          name: 'Attars',
          description: 'Order Payment',
          prefill: {
            name: shippingInfo.fullName,
            email: shippingInfo.email,
            phone: shippingInfo.phone
          },
          theme: {
            color: theme.colors.primary // ✅ NEW: Use user's selected theme color!
          }
        },
        async (paymentData: any) => {
          console.log('🎯 PAYMENT SUCCESS CALLBACK TRIGGERED:', paymentData);
          
          // ✅ NEW: Show processing modal immediately after successful payment
          setShowProcessingModal(true);
          
          // ✅ CRITICAL FIX: Wait for order creation to complete BEFORE navigating
          console.log('🔄 PROCESSING ORDER CREATION...');
          
          try {
            // ✅ FIXED: Let backend calculate all discounts - don't duplicate logic
            // Create order data for backend (backend will calculate all discounts including online payment discount)
            const orderData = {
              products: cart.map(item => ({
                product: item.product || item._id?.split('-')[0] || '',
                name: item.name,
                price: item.price,
                count: item.quantity,
                size: item.size,
                isCustom: item.isCustom,
                color: item.color,
                customization: item.customization
              })),
              transaction_id: paymentData.razorpay_payment_id,
              amount: totalAmount,
              paymentMethod: paymentMethod, // ✅ Backend will use this to calculate online payment discount
              coupon: appliedDiscount.coupon,
              rewardPointsRedeemed: appliedDiscount.rewardPoints?.points || 0,
              address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pinCode}, ${shippingInfo.country}`,
              status: "Received",
              shipping: {
                name: shippingInfo.fullName,
                phone: shippingInfo.phone,
                pincode: shippingInfo.pinCode,
                city: shippingInfo.city,
                state: shippingInfo.state,
                country: shippingInfo.country,
                weight: 0.3 * cart.length,
                shippingCost: selectedShipping?.rate || 0,
                courier: selectedShipping?.courier_name || ''
              }
            };
            
            let orderResult;
            let guestAutoAccountCreated = false; // ✅ CRITICAL FIX: Declare variable in proper scope
            let guestExistingAccountLinked = false; // ✅ CRITICAL FIX: Declare variable in proper scope
            
            if (isGuest) {
              console.log('👤 Creating guest order...');
              
              // Step 1: Verify payment
              const verifyResponse = await fetch(`${API}/razorpay/payment/guest/verify`, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
              });
              
              const verifyData = await verifyResponse.json();
              if (!verifyResponse.ok || !verifyData.verified) {
                throw new Error(`Payment verification failed: ${verifyData.error || 'Unknown error'}`);
              }
              
              console.log('✅ Guest payment verified');
              
              // Step 2: Create order
              const orderResponse = await fetch(`${API}/guest/order/create`, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  ...orderData,
                  guestInfo: {
                    name: shippingInfo.fullName,
                    email: shippingInfo.email,
                    phone: shippingInfo.phone
                  }
                })
              });
              
              const orderCreateData = await orderResponse.json();
              if (!orderResponse.ok) {
                throw new Error(`Guest order creation failed: ${orderCreateData.error || orderCreateData.err || 'Unknown error'}`);
              }
              
              orderResult = orderCreateData.order || orderCreateData;
              // ✅ CRITICAL FIX: Capture both flags for Razorpay guest orders too
              guestAutoAccountCreated = orderCreateData.autoAccountCreated || false;
              guestExistingAccountLinked = orderCreateData.existingAccountLinked || false;
              console.log('✅ Guest order created successfully:', orderResult._id, 'autoAccountCreated:', guestAutoAccountCreated, 'existingAccountLinked:', guestExistingAccountLinked);
              
            } else {
              console.log('🔐 Creating authenticated user order...');
              
              // Step 1: Verify payment
              const verifyResponse = await fetch(`${API}/razorpay/payment/verify/${(auth as any).user._id}`, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${(auth as any).token}`
                },
                body: JSON.stringify(paymentData)
              });
              
              const verifyData = await verifyResponse.json();
              if (!verifyResponse.ok || (!verifyData.verified && !verifyData.success)) {
                throw new Error(`Payment verification failed: ${verifyData.error || 'Unknown error'}`);
              }
              
              console.log('✅ Authenticated payment verified');
              
              // Step 2: Create order
              const createOrderResult = await createOrder((auth as any).user._id, (auth as any).token, orderData);
              if (createOrderResult.error || createOrderResult.err) {
                throw new Error(`Order creation failed: ${createOrderResult.error || createOrderResult.err || 'Unknown error'}`);
              }
              
              orderResult = createOrderResult;
              console.log('✅ Authenticated order created successfully:', orderResult._id);
            }
            
            // ✅ SUCCESS: Order created successfully, store navigation data for modal completion
            console.log('🎉 ORDER CREATION SUCCESSFUL - PREPARING NAVIGATION');
            
            // ✅ FIXED: Get final discount data from the created order or calculate it
            const serverSubtotal = orderResult.originalAmount || getTotalAmount();
            const serverCouponDiscount = appliedDiscount.coupon ? appliedDiscount.coupon.discount : 0; // ✅ Only set if coupon exists
            const serverQuantityDiscount = orderResult.quantityDiscount?.amount || 0;
            
            // ✅ CRITICAL FIX: Get online payment discount from order result
            const serverOnlinePaymentDiscount = orderResult.onlinePaymentDiscount?.amount || 0;
            
            const navigationState = {
              orderId: orderResult._id || paymentData.razorpay_payment_id,
              orderDetails: orderResult,
              shippingInfo,
              paymentMethod,
              paymentDetails: paymentData,
              finalAmount: totalAmount,
              originalAmount: serverSubtotal,
              subtotal: serverSubtotal,
              // ✅ FIXED: Only pass coupon discount if coupon was actually applied
              couponDiscount: appliedDiscount.coupon ? serverCouponDiscount : 0,
              quantityDiscount: serverQuantityDiscount,
              rewardPointsUsed: appliedDiscount.rewardPoints?.points || 0,
              rewardDiscount: appliedDiscount.rewardPoints?.discount || 0,
              // ✅ NEW: Pass online payment discount
              onlinePaymentDiscount: serverOnlinePaymentDiscount,
              shippingCost: selectedShipping?.rate || 0,
              // ✅ FIXED: Pass applied discount info for proper display
              appliedCoupon: appliedDiscount.coupon,
              appliedRewardPoints: appliedDiscount.rewardPoints,
              // ✅ CRITICAL FIX: Include both flags for Razorpay guest orders too
              autoAccountCreated: isGuest ? guestAutoAccountCreated : false,
              existingAccountLinked: isGuest ? (guestExistingAccountLinked || false) : false,
              isGuest,
              isBuyNow,
              createdAt: new Date().toISOString(),
              paymentSuccess: true,
              orderCreated: true
            };
            
            // ✅ NEW: Store navigation data for when modal completes, don't navigate immediately
            setPendingNavigation({
              path: '/order-confirmation-enhanced',
              state: navigationState
            });
            
            // ✅ NEW: Mark processing as complete to trigger modal completion
            setIsProcessingComplete(true);
            
            // Clear cart after successful order processing (but before navigation)
            if (!isBuyNow) {
              clearCart()
                .then(() => console.log('✅ Cart cleared after successful order'))
                .catch((error) => console.error('Cart clear error (non-blocking):', error));
            }
            
          } catch (error: any) {
            console.error('❌ ORDER CREATION FAILED:', error);
            
            // ✅ Hide processing modal on error
            setShowProcessingModal(false);
            setIsProcessingComplete(false); // ✅ Reset processing state
            
            // ✅ SHOW ERROR INSTEAD OF NAVIGATING TO SUCCESS PAGE
            alert(`Order creation failed: ${error.message}\n\nYour payment was successful, but we couldn't create your order. Please contact customer support with your payment ID: ${paymentData.razorpay_payment_id}`);
            
            // Don't navigate to success page if order creation failed
            // User stays on checkout page to retry or contact support
          }
        },
        (error: any) => {
          console.error('Razorpay payment error:', error);
          if (error.error !== 'Payment cancelled by user') {
            alert(`Payment failed: ${error.error || 'Unknown error'}`);
          }
        }
      );
    }
  };

  const handleModalComplete = () => {
    console.log('🎯 MODAL COMPLETE TRIGGERED');
    console.log('🎯 PENDING NAVIGATION AT MODAL COMPLETE:', pendingNavigation);
    setShowProcessingModal(false);
    setIsProcessingComplete(false); // ✅ Reset for next use
    if (pendingNavigation) {
      console.log('✅ Navigating to order confirmation with pending navigation');
      console.log('🎯 NAVIGATION PATH:', pendingNavigation.path);
      console.log('🎯 NAVIGATION STATE KEYS:', Object.keys(pendingNavigation.state || {}));
      navigate(pendingNavigation.path, { state: pendingNavigation.state, replace: true  });
      setPendingNavigation(null);
    } else {
      // ✅ CRITICAL FIX: Always try to navigate to order confirmation on success
      // Only navigate to cart if we know it's an actual failure
      console.error('⚠️ No pending navigation found - attempting default success navigation');
      
      // Create minimal success state for navigation
      const fallbackState = {
        orderId: 'unknown',
        orderDetails: {
          products: cart.map(item => ({
            product: item.product || item._id?.split('-')[0] || '',
            name: item.name,
            price: item.price,
            count: item.quantity,
            size: item.size
          })),
          amount: getFinalAmount(),
          status: "Received"
        },
        shippingInfo,
        paymentMethod,
        finalAmount: getFinalAmount(),
        isGuest: !auth || typeof auth === 'boolean' || !auth.user || !auth.token,
        isBuyNow,
        createdAt: new Date().toISOString(),
        hasWarning: true,
        warningMessage: 'Order processing completed but confirmation details may be incomplete.'
      };
      
      navigate('/order-confirmation-enhanced', { 
        state: fallbackState,
        replace: true 
      });
    }
  };
  
  return { 
    handlePlaceOrder,
    ProcessingModal: () => (
      <PaymentProcessingModal 
        isOpen={showProcessingModal} 
        onComplete={handleModalComplete}
        isProcessingComplete={isProcessingComplete} // ✅ NEW: Pass processing completion state
      />
    )
  };
};
