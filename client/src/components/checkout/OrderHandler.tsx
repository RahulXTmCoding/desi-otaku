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
  isBuyNow = false
}: OrderHandlerProps) => {
  const navigate = useNavigate();
  const [showProcessingModal, setShowProcessingModal] = useState(false);
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
    } else if (paymentMethod === 'razorpay') {
      // Razorpay implementation for both authenticated and guest users
      let orderResponse;
      
      if (isGuest) {
        // Guest checkout - use dedicated endpoint with secure format
        const cartItems = cart.map(item => ({
          product: item.product || item._id?.split('-')[0] || '',
          name: item.name,
          quantity: item.quantity,
          size: item.size,
          customization: item.customization,
          isCustom: item.isCustom,
          color: item.color
        }));

        const response = await fetch(`${API}/razorpay/order/guest/create`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cartItems: cartItems,
            couponCode: appliedDiscount.coupon?.code || null,
            rewardPoints: null, // No reward points for guests
            currency: 'INR',
            receipt: `guest_${Date.now()}`,
            customerInfo: {
              name: shippingInfo.fullName,
              email: shippingInfo.email,
              phone: shippingInfo.phone
            },
            notes: {
              items: cart.length,
              shipping_method: selectedShipping?.courier_name || 'Standard'
            },
            // ✅ CRITICAL FIX: Send frontend calculated amount to ensure exact match
            frontendAmount: totalAmount,
            shippingCost: selectedShipping?.rate || 0
          })
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create guest order');
        }
        orderResponse = data;
      } else {
        // Authenticated user checkout - use secure format
        const cartItems = cart.map(item => ({
          product: item.product || item._id?.split('-')[0] || '',
          name: item.name,
          quantity: item.quantity,
          size: item.size,
          customization: item.customization,
          isCustom: item.isCustom,
          color: item.color
        }));

        const response = await fetch(`${API}/razorpay/order/create`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(auth as any).token}`
          },
          body: JSON.stringify({
            cartItems: cartItems,
            couponCode: appliedDiscount.coupon?.code || null,
            rewardPoints: appliedDiscount.rewardPoints?.points || null,
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: {
              customer_name: shippingInfo.fullName,
              customer_email: shippingInfo.email,
              items: cart.length,
              shipping_method: selectedShipping?.courier_name || 'Standard'
            },
            // ✅ CRITICAL FIX: Send frontend calculated amount to ensure exact match
            frontendAmount: totalAmount,
            shippingCost: selectedShipping?.rate || 0
          })
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create authenticated order');
        }
        orderResponse = data;
      }
      
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
          name: 'T-Shirt Store',
          description: 'Order Payment',
          prefill: {
            name: shippingInfo.fullName,
            email: shippingInfo.email,
            phone: shippingInfo.phone
          }
        },
        async (paymentData: any) => {
          console.log('🎯 PAYMENT SUCCESS CALLBACK TRIGGERED:', paymentData);
          
          // ✅ CRITICAL FIX: Navigate immediately with correct data structure
          console.log('🚀 IMMEDIATE NAVIGATION WITH PAYMENT DATA');
          
          try {
            // ✅ CRITICAL FIX: Get AOV discount from backend calculation, not frontend calculation
            console.log('🔍 GETTING DISCOUNT DATA FROM BACKEND CALCULATION...');
            
            // Get server-calculated values - the backend has already calculated these
            let serverSubtotal = getTotalAmount();
            let serverCouponDiscount = appliedDiscount.coupon?.discount || 0;
            let serverQuantityDiscount = 0;
            
            // ✅ FETCH ACTUAL SERVER CALCULATION TO GET AOV DISCOUNT
            try {
              const calculationResponse = await fetch(`${API}/razorpay/calculate-amount`, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  cartItems: cart.map(item => ({
                    product: item.product || item._id?.split('-')[0] || '',
                    name: item.name,
                    quantity: item.quantity,
                    size: item.size
                  })),
                  couponCode: appliedDiscount.coupon?.code || null,
                  shippingCost: selectedShipping?.rate || 0
                })
              });
              
              if (calculationResponse.ok) {
                const calculationData = await calculationResponse.json();
                console.log('🎯 BACKEND CALCULATION RESPONSE:', calculationData);
                
                // Use backend-calculated values
                serverSubtotal = calculationData.subtotal || serverSubtotal;
                serverCouponDiscount = calculationData.couponDiscount || serverCouponDiscount;
                
                // ✅ CRITICAL: Get AOV discount from backend calculation
                if (calculationData.aovDiscount !== undefined) {
                  serverQuantityDiscount = calculationData.aovDiscount;
                } else {
                  // Fallback: calculate from total discounts
                  const totalDiscountFromBackend = serverSubtotal - calculationData.total - (calculationData.shippingCost || 0);
                  serverQuantityDiscount = Math.max(0, totalDiscountFromBackend - serverCouponDiscount);
                }
                
                console.log('✅ BACKEND DISCOUNT DATA RETRIEVED:');
                console.log(`   Backend Subtotal: ₹${serverSubtotal}`);
                console.log(`   Backend Coupon Discount: ₹${serverCouponDiscount}`);
                console.log(`   Backend AOV Discount: ₹${serverQuantityDiscount}`);
                console.log(`   Backend Final Total: ₹${calculationData.total}`);
              } else {
                console.warn('⚠️ Could not fetch backend calculation, using fallback');
                // Fallback calculation
                serverQuantityDiscount = serverSubtotal - totalAmount - serverCouponDiscount - (selectedShipping?.rate || 0);
              }
            } catch (error) {
              console.error('❌ Error fetching backend calculation:', error);
              // Fallback calculation
              serverQuantityDiscount = serverSubtotal - totalAmount - serverCouponDiscount - (selectedShipping?.rate || 0);
            }
            
            console.log('💰 FINAL DISCOUNT VALUES:');
            console.log(`   Subtotal: ₹${serverSubtotal}`);
            console.log(`   Final Amount: ₹${totalAmount}`);
            console.log(`   Coupon Discount: ₹${serverCouponDiscount}`);
            console.log(`   AOV Discount (from backend): ₹${serverQuantityDiscount}`);
            console.log(`   Shipping: ₹${selectedShipping?.rate || 0}`);
            
            // Create order data for confirmation
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
              originalAmount: serverSubtotal,
              discount: serverCouponDiscount + serverQuantityDiscount,
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
            
            // ✅ CRITICAL FIX: Include discount data in navigation state
            const navigationState = {
              orderId: paymentData.razorpay_payment_id,
              orderDetails: orderData,
              shippingInfo,
              paymentMethod,
              paymentDetails: paymentData,
              finalAmount: totalAmount,
              originalAmount: serverSubtotal,
              subtotal: serverSubtotal,
              couponDiscount: serverCouponDiscount,
              quantityDiscount: serverQuantityDiscount,
              shippingCost: selectedShipping?.rate || 0,
              isGuest,
              isBuyNow,
              createdAt: new Date().toISOString(),
              paymentSuccess: true
            };
            
            console.log('🎯 NAVIGATION STATE WITH DISCOUNTS:', {
              orderId: navigationState.orderId,
              finalAmount: navigationState.finalAmount,
              subtotal: navigationState.subtotal,
              couponDiscount: navigationState.couponDiscount,
              quantityDiscount: navigationState.quantityDiscount
            });
            
            // ✅ IMMEDIATE NAVIGATION: Skip modal for faster UX
            console.log('⚡ NAVIGATING IMMEDIATELY TO ORDER CONFIRMATION');
            navigate('/order-confirmation-enhanced', { 
              state: navigationState,
              replace: true 
            });
            
            // ✅ BACKGROUND PROCESSING: Handle order creation after navigation
            console.log('🔄 Starting background order processing...');
            
            (async () => {
              try {
                if (isGuest) {
                  // Guest payment verification and order creation
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
                    console.error('Payment verification failed:', verifyData.error);
                    return;
                  }
                  
                  // Create guest order
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
                    console.error('Failed to create guest order:', orderCreateData.error);
                    return;
                  }
                  
                  console.log('✅ Guest order created successfully in background:', orderCreateData.order._id);
                  
                } else {
                  // Authenticated user verification and order creation
                  const verifyResponse = await verifyRazorpayPayment(
                    (auth as any).user._id,
                    (auth as any).token,
                    paymentData
                  );
                  
                  if (!verifyResponse.verified && !verifyResponse.success) {
                    console.error('Payment verification failed');
                    return;
                  }
                  
                  // Create authenticated order
                  const orderResult = await createOrder((auth as any).user._id, (auth as any).token, orderData);
                  if (orderResult.error) {
                    console.error('Failed to create authenticated order:', orderResult.error);
                    return;
                  }
                  
                  console.log('✅ Authenticated order created successfully in background:', orderResult._id);
                }
              } catch (error) {
                console.error('❌ Background order processing failed:', error);
              }
            })();
            
            // Clear cart in background if needed
            if (!isBuyNow) {
              clearCart()
                .then(() => console.log('✅ Cart cleared in background'))
                .catch((error) => console.error('Cart clear error (non-blocking):', error));
            }
            
          } catch (error) {
            console.error('❌ Error in payment success callback:', error);
            
            // ✅ FALLBACK NAVIGATION with error state
            navigate('/order-confirmation-enhanced', { 
              state: {
                orderId: paymentData.razorpay_payment_id || 'unknown',
                paymentDetails: paymentData,
                finalAmount: totalAmount,
                isGuest,
                isBuyNow,
                hasError: true,
                errorMessage: error.message,
                createdAt: new Date().toISOString()
              },
              replace: true 
            });
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
    if (pendingNavigation) {
      console.log('✅ Navigating to order confirmation with pending navigation');
      console.log('🎯 NAVIGATION PATH:', pendingNavigation.path);
      console.log('🎯 NAVIGATION STATE KEYS:', Object.keys(pendingNavigation.state || {}));
      navigate(pendingNavigation.path, { state: pendingNavigation.state });
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
      />
    )
  };
};
