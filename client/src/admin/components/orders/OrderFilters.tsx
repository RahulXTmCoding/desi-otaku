import React from 'react';
import { Search } from 'lucide-react';

interface OrderFiltersProps {
  searchQuery: string;
  statusFilter: string;
  dateFilter: string;
  paymentFilter: string;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onDateFilterChange: (value: string) => void;
  onPaymentFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchQuery,
  statusFilter,
  dateFilter,
  paymentFilter,
  sortBy,
  onSearchChange,
  onStatusFilterChange,
  onDateFilterChange,
  onPaymentFilterChange,
  onSortByChange
}) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
      <div className="grid lg:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, phone, email, transaction ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
        >
          <option value="all">All Status</option>
          <option value="received">Received</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
          <option value="status">Status</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Date Filter */}
        <div className="flex gap-2">
          {['all', 'today', 'week', 'month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => onDateFilterChange(period)}
              className={`px-4 py-2 rounded-lg capitalize transition-all ${
                dateFilter === period
                  ? 'bg-yellow-400 text-gray-900 font-semibold'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {period === 'all' ? 'All Time' : period}
            </button>
          ))}
        </div>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => onPaymentFilterChange(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 text-sm"
        >
          <option value="all">All Payments</option>
          <option value="credit card">Credit Card</option>
          <option value="debit card">Debit Card</option>
          <option value="paypal">PayPal</option>
          <option value="razorpay">Razorpay</option>
        </select>
      </div>
    </div>
  );
};

export default OrderFilters;
