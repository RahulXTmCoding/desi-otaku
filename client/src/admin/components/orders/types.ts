export interface OrderProduct {
  product: string;
  name: string;
  price: number;
  count: number;
  size?: string;
  color?: string;
  colorValue?: string;
  designId?: string;
  designImage?: string;
  customDesign?: string;
  customization?: any;
  image?: string;
  isCustom?: boolean;
  productType?: string;
}

export interface ShippingInfo {
  method: string;
  trackingNumber?: string;
  courier?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  cost: number;
  shippingCost?: number;
}

export interface OrderTimeline {
  status: string;
  timestamp: string;
  description?: string;
  user?: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface GuestInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  guestInfo?: GuestInfo;
  products: OrderProduct[];
  transaction_id: string;
  amount: number;
  originalAmount?: number;
  address?: string;
  shippingAddress?: ShippingAddress;
  status?: string;
  paymentMethod?: string;
  shipping?: ShippingInfo;
  notes?: string[];
  timeline?: OrderTimeline[];
  discount?: number;
  couponCode?: string;
  aovDiscount?: {
    amount: number;
    percentage: number;
    totalQuantity: number;
  };
  coupon?: {
    code: string;
    discount?: number;
    discountValue?: number;
  };
  rewardPointsRedeemed?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
}
