import { API } from "../../backend";

// Mock payment token for test mode
export const mockGetToken = (): Promise<any> => {
  return Promise.resolve({
    clientToken: "mock-client-token",
    success: true
  });
};

// Mock payment processing for test mode
export const mockProcessPayment = (paymentInfo: any): Promise<any> => {
  return Promise.resolve({
    success: true,
    transaction: {
      id: `mock-txn-${Date.now()}`,
      amount: paymentInfo.amount,
      status: "success"
    }
  });
};

export const getmeToken = (userId: string, token: string) => {
  return fetch(`${API}/payment/gettoken/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => {
      console.log(err);
      return { error: "Failed to get payment token" };
    });
};

export const processPayment = (userId: string, token: string, paymentInfo: any) => {
  return fetch(`${API}/payment/braintree/${userId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(paymentInfo),
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => {
      console.log(err);
      return { error: "Payment processing failed" };
    });
};
