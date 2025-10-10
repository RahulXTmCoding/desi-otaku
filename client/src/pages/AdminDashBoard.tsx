import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Package, 
  Tag, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings,
  TrendingUp,
  DollarSign,
  Eye,
  Palette,
  Megaphone
} from 'lucide-react';
import { isAutheticated } from "../auth/helper";

const AdminDashBoard = () => {
  const navigate = useNavigate();
  const auth = isAutheticated();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0
  });

  const adminName = auth && auth.user ? auth.user.name : 'Admin';

  const quickLinks = [
    {
      title: "Designs",
      description: "Manage printable designs",
      icon: Palette,
      links: [
        { name: "Add New Design", path: "/admin/create/design", color: "text-pink-400" },
        { name: "Manage Designs", path: "/admin/designs", color: "text-purple-400" },
        { name: "Popular Designs", path: "/admin/designs?sort=popular", color: "text-indigo-400" }
      ]
    },
    {
      title: "Products",
      description: "Manage your product catalog",
      icon: Package,
      links: [
        { name: "Add New Product", path: "/admin/create/product", color: "text-green-400" },
        { name: "Manage Products", path: "/admin/products", color: "text-blue-400" },
        { name: "Product Types", path: "/admin/product-types", color: "text-purple-400" },
        { name: "Product Variants", path: "/admin/products", color: "text-cyan-400" }
      ]
    },
    {
      title: "Categories",
      description: "Organize your products",
      icon: Tag,
      links: [
        { name: "Create Category", path: "/admin/create/category", color: "text-yellow-400" },
        { name: "Manage Categories", path: "/admin/categories", color: "text-orange-400" }
      ]
    },
    {
      title: "Orders & Sales",
      description: "Track and manage orders",
      icon: ShoppingBag,
      links: [
        { name: "Manage Orders", path: "/admin/order-management", color: "text-pink-400" },
        { name: "View Orders", path: "/admin/orders", color: "text-purple-400" },
        { name: "Analytics", path: "/admin/analytics", color: "text-indigo-400" }
      ]
    },
    {
      title: "Marketing",
      description: "Promotions and customer engagement",
      icon: Megaphone,
      links: [
        { name: "Email Marketing", path: "/admin/email-marketing", color: "text-blue-400" },
        { name: "Manage Coupons", path: "/admin/coupons", color: "text-red-400" },
        { name: "Review Settings", path: "/admin/review-settings", color: "text-teal-400" },
        { name: "Reward Points Settings", path: "/admin/reward-settings", color: "text-yellow-400" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {adminName}! 👋</h1>
          <p className="text-gray-400">Here's what's happening with your store today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-yellow-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-400/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold">₹0</h3>
            <p className="text-gray-400 text-sm">Total Revenue</p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-blue-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-400/10 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">Today</span>
            </div>
            <h3 className="text-2xl font-bold">0</h3>
            <p className="text-gray-400 text-sm">Total Orders</p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-green-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-400/10 rounded-lg">
                <Package className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <h3 className="text-2xl font-bold">0</h3>
            <p className="text-gray-400 text-sm">Total Products</p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-purple-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-400/10 rounded-lg">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <h3 className="text-2xl font-bold">0</h3>
            <p className="text-gray-400 text-sm">Total Users</p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickLinks.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <Icon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                    <p className="text-sm text-gray-400">{section.description}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      to={link.path}
                      className="flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
                    >
                      <span className={`font-medium ${link.color}`}>
                        {link.name}
                      </span>
                      <span className="text-gray-400 group-hover:text-white transition-colors">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
            Recent Activity
          </h3>
          <div className="text-center py-8 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity yet</p>
            <p className="text-sm mt-2">Start by adding some products to your store!</p>
            <Link
              to="/admin/create/product"
              className="inline-block mt-4 bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Add First Product
            </Link>
          </div>
        </div>

        {/* Pro Tip */}
        <div className="mt-6 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-2xl p-6 border border-yellow-400/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Pro Tip
          </h4>
          <p className="text-gray-300">
            Start by creating categories for your products, then add products with multiple color variants using the 
            <Palette className="inline w-4 h-4 mx-1 text-yellow-400" />
            icon in the products list!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashBoard;
