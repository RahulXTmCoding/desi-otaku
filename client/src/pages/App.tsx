import { Routes, Route } from "react-router-dom"
import Home from '../core/Home';
import ShopWithBackendFilters from '../pages/ShopWithBackendFilters';
import Contact from '../pages/Contact';
import Customize from './Customize';
import Cart from './Cart';
import CheckoutFixed from './CheckoutFixed';
import OrderConfirmation from './OrderConfirmation';
import OrderConfirmationEnhanced from './OrderConfirmationEnhanced';
import ProductDetail from './ProductDetail';
import Wishlist from './Wishlist';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Signup from '../user/Signup';
import Signin from '../user/Signin';
import UserDashBoardEnhanced from '../user/UserDashBoardEnhanced';
import OrderDetail from '../user/OrderDetail';
import AdminDashBoard from './AdminDashBoard';
import AddCategory from '../admin/AddCategory';
import ManageCategories from '../admin/ManageCategories';
import AddProduct from '../admin/AddProduct';
import ManageProducts from '../admin/ManageProducts';
import UpdateProduct from '../admin/UpdateProduct';
import AddDesign from '../admin/AddDesign';
import ManageDesigns from '../admin/ManageDesigns';
import UpdateDesign from '../admin/UpdateDesign';
import ReviewSettings from '../admin/ReviewSettings';
import AnalyticsDashboard from '../admin/AnalyticsDashboard';
import Analytics from '../admin/Analytics';
import ManageCoupons from '../admin/ManageCoupons';
import ProductVariantsPage from '../admin/ProductVariantsPage';
import OrderManagement from '../admin/OrderManagement';
import ManageProductTypes from '../admin/ManageProductTypes';
import PrivateRoute from "../auth/helper/PrivateRoutes";
import AdminRoute from "../auth/helper/AdminRoutes";
import DevModeToggle from '../components/DevModeToggle';
import UserProfile from '../user/UserProfile';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <Header />
      <DevModeToggle />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<ShopWithBackendFilters />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<CheckoutFixed />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/order-confirmation-enhanced" element={<OrderConfirmationEnhanced />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/user/dashboard" element={
            <PrivateRoute>
              <UserDashBoardEnhanced />
            </PrivateRoute>
          } />
          <Route path="/order/:orderId" element={
            <PrivateRoute>
              <OrderDetail />
            </PrivateRoute>
          } />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashBoard />
            </AdminRoute>
          } />
          <Route path="/admin/create/category" element={
            <AdminRoute>
              <AddCategory />
            </AdminRoute>
          } />
          <Route path="/admin/categories" element={
            <AdminRoute>
              <ManageCategories />
            </AdminRoute>
          } />
          <Route path="/admin/create/product" element={
            <AdminRoute>
              <AddProduct />
            </AdminRoute>
          } />
          <Route path="/admin/products" element={
            <AdminRoute>
              <ManageProducts />
            </AdminRoute>
          } />
          <Route path="/admin/product/update/:productId" element={
            <AdminRoute>
              <UpdateProduct />
            </AdminRoute>
          } />
          <Route path="/admin/product/variants/:productId" element={
            <AdminRoute>
              <ProductVariantsPage />
            </AdminRoute>
          } />
          <Route path="/admin/product-types" element={
            <AdminRoute>
              <ManageProductTypes />
            </AdminRoute>
          } />
          <Route path="/admin/create/design" element={
            <AdminRoute>
              <AddDesign />
            </AdminRoute>
          } />
          <Route path="/admin/designs" element={
            <AdminRoute>
              <ManageDesigns />
            </AdminRoute>
          } />
          <Route path="/admin/update/design/:designId" element={
            <AdminRoute>
              <UpdateDesign />
            </AdminRoute>
          } />
          <Route path="/admin/order-management" element={
            <AdminRoute>
              <OrderManagement />
            </AdminRoute>
          } />
          <Route path="/admin/orders" element={
            <AdminRoute>
              <OrderManagement />
            </AdminRoute>
          } />
          <Route path="/admin/analytics" element={
            <AdminRoute>
              <Analytics />
            </AdminRoute>
          } />
          <Route path="/admin/coupons" element={
            <AdminRoute>
              <ManageCoupons />
            </AdminRoute>
          } />
          <Route path="/admin/review-settings" element={
            <AdminRoute>
              <ReviewSettings />
            </AdminRoute>
          } />
          <Route path="/user/profile" element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
