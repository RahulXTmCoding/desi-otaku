import { API } from "../../backend";

// Get Braintree client token
export const getBraintreeClientToken = (userId: string, token: string) => {
  return fetch(`${API}/payment/gettoken/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      return { error: "Failed to get payment token" };
    });
};

// Process Braintree payment
export const processPayment = (userId: string, token: string, paymentData: { paymentMethodNonce: string; amount: string }) => {
  return fetch(`${API}/payment/braintree/${userId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(paymentData)
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      return { error: "Payment processing failed" };
    });
};

// Mock payment for test mode
export const mockProcessPayment = (amount: number): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transaction: {
          id: `MOCK-TXN-${Date.now()}`,
          amount: amount,
          status: "submitted_for_settlement"
        }
      });
    }, 1500); // Simulate payment processing delay
  });
};
