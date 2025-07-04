export interface RevenueData {
  date: string;
  amount: number;
  orderCount: number;
}

export interface ProductPerformance {
  productId: string;
  name: string;
  sold: number;
  revenue: number;
  views: number;
  conversionRate: number;
}

export interface CategoryPerformance {
  categoryId: string;
  name: string;
  products: number;
  revenue: number;
  percentage: number;
}

export interface CustomerData {
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  avgOrderValue: number;
}

export interface SalesOverview {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: number;
  orderGrowth: number;
  avgOrderValue: number;
  conversionRate: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}
