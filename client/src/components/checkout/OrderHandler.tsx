import React from 'react';
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
  clearCart
}: OrderHandlerProps) => {
  const navigate = useNavigate();
  
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
      
      await clearCart();
      navigate('/order-confirmation-enhanced', { 
        state: { 
          orderId: orderResult._id,
          orderDetails: orderData,
          shippingInfo,
          paymentMethod
        }
      });
    } else if (paymentMethod === 'razorpay') {
      // Razorpay implementation for both authenticated and guest users
      let orderResponse;
      
      if (isGuest) {
        // Guest checkout - use dedicated endpoint
        const response = await fetch(`${API}/razorpay/order/guest/create`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: totalAmount,
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
            }
          })
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create guest order');
        }
        orderResponse = data;
      } else {
        // Authenticated user checkout
        const userId = (auth as any).user._id;
        const token = (auth as any).token;
        
        orderResponse = await createRazorpayOrder(
          userId, 
          token,
          {
            amount: totalAmount,
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: {
              customer_name: shippingInfo.fullName,
              customer_email: shippingInfo.email
            }
          }
        );
      }
      
      if (orderResponse.error) {
        throw new Error(orderResponse.error);
      }
      
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
          try {
            let verifyResponse;
            
            if (isGuest) {
              // Guest payment verification
              const response = await fetch(`${API}/razorpay/payment/guest/verify`, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
              });
              
              const data = await response.json();
              if (!response.ok) {
                throw new Error(data.error || 'Payment verification failed');
              }
              verifyResponse = data;
            } else {
              // Authenticated user verification
              verifyResponse = await verifyRazorpayPayment(
                (auth as any).user._id,
                (auth as any).token,
                paymentData
              );
            }
            
            if (!verifyResponse.verified && !verifyResponse.success) {
              throw new Error('Payment verification failed');
            }
            
            const orderData = {
              products: cart.map(item => {
                const baseProduct = {
                  product: item.product || item._id?.split('-')[0] || '',
                  name: item.name,
                  price: item.price,
                  count: item.quantity,
                  size: item.size,
                  isCustom: item.isCustom,
                  color: item.color
                };
                
                // Map customization to match backend expectation
                if (item.customization) {
                  const mappedCustomization: any = {};
                  
                  if (item.customization.frontDesign) {
                    mappedCustomization.frontDesign = {
                      designId: item.customization.frontDesign.designId || 'custom-design',
                      designImage: item.customization.frontDesign.designImage,
                      position: item.customization.frontDesign.position || 'center',
                      price: item.customization.frontDesign.price || 150
                    };
                  }
                  
                  if (item.customization.backDesign) {
                    mappedCustomization.backDesign = {
                      designId: item.customization.backDesign.designId || 'custom-design',
                      designImage: item.customization.backDesign.designImage,
                      position: item.customization.backDesign.position || 'center',
                      price: item.customization.backDesign.price || 150
                    };
                  }
                  
                  return { ...baseProduct, customization: mappedCustomization };
                }
                
                return baseProduct;
              }),
              transaction_id: paymentData.razorpay_payment_id,
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
            
            let orderResult;
            
            if (isGuest) {
              // Guest order creation
              const response = await fetch(`${API}/guest/order/create`, {
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
                throw new Error(data.error || 'Failed to create guest order');
              }
              orderResult = data.order;
            } else {
              // Authenticated user order
              orderResult = await createOrder((auth as any).user._id, (auth as any).token, orderData);
              if (orderResult.error) {
                throw new Error(orderResult.error);
              }
            }
            
            // Coupon usage tracking can be done on backend if needed
            // Reward points have already been redeemed on the backend during order creation
            
            await clearCart();
            
            // Navigate to enhanced confirmation page
            navigate('/order-confirmation-enhanced', { 
              state: { 
                orderId: orderResult._id,
                orderDetails: orderData,
                shippingInfo,
                paymentMethod,
                paymentDetails: verifyResponse.payment,
                isGuest,
                createdAt: new Date().toISOString()
              }
            });
            
          } catch (error: any) {
            console.error('Order creation error:', error);
            alert(`Failed to create order: ${error.message}`);
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
  
  return { handlePlaceOrder };
};
