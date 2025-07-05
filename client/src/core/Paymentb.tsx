import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getmeToken, processPayment } from "./helper/paymentbhelper";
import { createOrder } from "./helper/orderHelper";
import { isAutheticated } from "../auth/helper";
import { useCart } from "../context/CartContext";

// import DropIn from "braintree-web-drop-in-react";
const DropIn = ({ options, onInstance }: any) => <div>Payment functionality temporarily disabled</div>;

const Paymentb = ({ products, setReload = (f: any) => f, reload = undefined }: any) => {
  const { clearCart } = useCart();
  const [info, setInfo] = useState<{
    loading: boolean;
    success: boolean;
    clientToken: any;
    error: string;
    instance: any;
  }>({
    loading: false,
    success: false,
    clientToken: null,
    error: "",
    instance: {},
  });

  const auth = isAutheticated();
  const userId = auth && typeof auth !== 'boolean' && auth.user ? auth.user._id : null;
  const token = auth && typeof auth !== 'boolean' ? auth.token : null;

  const getToken = (userId, token) => {
    getmeToken(userId, token).then((info) => {
      // console.log("INFORMATION", info);
      if (info.error) {
        setInfo({ ...info, error: info.error });
      } else {
        const clientToken = info.clientToken;
        setInfo(prev => ({ ...prev, clientToken }));
      }
    });
  };

  const showbtdropIn = () => {
    return (
      <div>
        {info.clientToken !== null && products.length > 0 ? (
          <div>
            <DropIn
              options={{ authorization: info.clientToken }}
              onInstance={(instance) => (info.instance = instance)}
            />
            <button
              className="btn btn-block btn-success bg3"
              onClick={onPurchase}
            >
              Buy
            </button>
          </div>
        ) : (
          <h3>Please login or add something to cart</h3>
        )}
      </div>
    );
  };

  useEffect(() => {
    getToken(userId, token);
  }, []);

  const onPurchase = () => {
    setInfo(prev => ({ ...prev, loading: true }));
    let nonce;
    let getNonce = info.instance.requestPaymentMethod().then((data) => {
      nonce = data.nonce;
      const paymentData = {
        paymentMethodNonce: nonce,
        amount: getAmount(),
      };
      processPayment(userId, token, paymentData)
        .then((response) => {
          setInfo({ ...info, success: response.success, loading: false });
          console.log("PAYMENT SUCCESS");
          const orderData = {
            products: products,
            transaction_id: response.transaction.id,
            amount: response.transaction.amount,
          };
          createOrder(userId, token, orderData);
          clearCart().then(() => {
            console.log("Cart cleared after payment");
            setReload(!reload);
          });
        })
        .catch((error) => {
          setInfo(prev => ({ ...prev, loading: false, success: false }));
          console.log("PAYMENT FAILED");
        });
    });
  };

  const getAmount = () => {
    let amount = 0;
    products.map((p: any) => {
      amount = amount + p.price;
    });
    return amount;
  };

  return (
    <div>
      <h3>Your bill is {getAmount()} $</h3>
      {showbtdropIn()}
    </div>
  );
};

export default Paymentb;
