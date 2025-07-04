import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingBag } from 'lucide-react';
import { SalesOverview } from './types';

interface SalesOverviewCardsProps {
  data: SalesOverview;
  loading?: boolean;
}

const SalesOverviewCards: React.FC<SalesOverviewCardsProps> = ({ data, loading }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      growth: data.revenueGrowth,
      icon: DollarSign,
      color: 'yellow',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/20',
      iconColor: 'text-yellow-400'
    },
    {
      title: 'Total Orders',
      value: data.totalOrders.toLocaleString(),
      growth: data.orderGrowth,
      icon: ShoppingBag,
      color: 'blue',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(data.avgOrderValue),
      growth: null,
      icon: Package,
      color: 'green',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/20',
      iconColor: 'text-green-400'
    },
    {
      title: 'Total Customers',
      value: data.totalCustomers.toLocaleString(),
      growth: null,
      icon: Users,
      color: 'purple',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/20',
      iconColor: 'text-purple-400'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="animate-pulse">
              <div className="h-12 w-12 bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-8 w-24 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-gray-800 rounded-2xl p-6 border ${card.borderColor} hover:border-${card.color}-400 transition-colors`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${card.bgColor} rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              {card.growth !== null && formatPercentage(card.growth)}
            </div>
            <h3 className="text-2xl font-bold">{card.value}</h3>
            <p className="text-gray-400 text-sm">{card.title}</p>
          </div>
        );
      })}
    </div>
  );
};

export default SalesOverviewCards;
