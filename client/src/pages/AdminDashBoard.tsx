import React from "react";
import { Link } from "react-router-dom";

const AdminDashBoard = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Admin Links</h2>
          <ul className="space-y-4">
            <li>
              <Link to="/admin/create/category" className="text-yellow-400 hover:underline">
                Create Categories
              </Link>
            </li>
            <li>
              <Link to="/admin/categories" className="text-yellow-400 hover:underline">
                Manage Categories
              </Link>
            </li>
            <li>
              <Link to="/admin/create/product" className="text-yellow-400 hover:underline">
                Create Product
              </Link>
            </li>
            <li>
              <Link to="/admin/products" className="text-yellow-400 hover:underline">
                Manage Products
              </Link>
            </li>
            <li>
              <Link to="/admin/orders" className="text-yellow-400 hover:underline">
                Manage Orders
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-2 bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Admin Information</h2>
          <p>Welcome to the admin dashboard. Here you can manage your store's products, categories, and orders.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashBoard;
