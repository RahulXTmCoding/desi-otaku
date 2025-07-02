import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./core/Home";
import Signup from "./user/Signup";
import Signin from "./user/Signin";
import AdminRoute from "./auth/helper/AdminRoutes";
import PrivateRoute from "./auth/helper/PrivateRoutes";
import UserDashBoard from "./user/UserDashBoard";
import AdminDashBoard from "./pages/AdminDashBoard";
import UserProfile from "./user/UserProfile";
import AddCategory from "./admin/AddCategory";
import ManageCategories from "./admin/ManageCategories";
import AddProduct from "./admin/AddProduct";
import ManageProducts from "./admin/ManageProducts";
import UpdateProduct from "./admin/UpdateProduct";
import AddDesign from "./admin/AddDesign";
import ManageDesigns from "./admin/ManageDesigns";
import UpdateDesign from "./admin/UpdateDesign";
import ReviewSettings from "./admin/ReviewSettings";
import AnalyticsDashboard from "./admin/AnalyticsDashboard";
import ManageCoupons from "./admin/ManageCoupons";
import ProductVariantsPage from "./admin/ProductVariantsPage";
import Cart from "./core/Cart";
import Customize from "./pages/Customize";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Wishlist from "./pages/Wishlist";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/customize" element={<Customize />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route
          path="/user/dashboard"
          element={
            <PrivateRoute>
              <UserDashBoard />
            </PrivateRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashBoard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/create/category"
          element={
            <AdminRoute>
              <AddCategory />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <ManageCategories />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/create/product"
          element={
            <AdminRoute>
              <AddProduct />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <ManageProducts />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/product/update/:productId"
          element={
            <AdminRoute>
              <UpdateProduct />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/review-settings"
          element={
            <AdminRoute>
              <ReviewSettings />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AnalyticsDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <AdminRoute>
              <ManageCoupons />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/product/variants/:productId"
          element={
            <AdminRoute>
              <ProductVariantsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/create/design"
          element={
            <AdminRoute>
              <AddDesign />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/designs"
          element={
            <AdminRoute>
              <ManageDesigns />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/update/design/:designId"
          element={
            <AdminRoute>
              <UpdateDesign />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
