import { lazy, Suspense } from 'react';
import { Routes, Route } from "react-router-dom";
import Header from '../components/Header';
import Footer from '../components/Footer';
import PrivateRoute from "../auth/helper/PrivateRoutes";
import AdminRoute from "../auth/helper/AdminRoutes";
import DevModeToggle from '../components/DevModeToggle';

// Lazy load all pages
const Home = lazy(() => import('../core/Home'));
const ShopWithBackendFilters = lazy(() => import('../pages/ShopWithBackendFilters'));
const Contact = lazy(() => import('../pages/Contact'));
const Customize = lazy(() => import('./Customize'));
const Cart = lazy(() => import('./Cart'));
const CheckoutFixed = lazy(() => import('./CheckoutFixed'));
const OrderConfirmation = lazy(() => import('./OrderConfirmation'));
const OrderConfirmationEnhanced = lazy(() => import('./OrderConfirmationEnhanced'));
const ProductDetail = lazy(() => import('./ProductDetail'));
const Wishlist = lazy(() => import('./Wishlist'));
const Signup = lazy(() => import('../user/Signup'));
const Signin = lazy(() => import('../user/Signin'));
const UserDashBoardEnhanced = lazy(() => import('../user/UserDashBoardEnhanced'));
const OrderDetail = lazy(() => import('../user/OrderDetail'));
const UserProfile = lazy(() => import('../user/UserProfile'));

// Lazy load admin pages - these are heavy and rarely accessed by regular users
const AdminDashBoard = lazy(() => import('./AdminDashBoard'));
const AddCategory = lazy(() => import('../admin/AddCategory'));
const ManageCategories = lazy(() => import('../admin/ManageCategories'));
const AddProduct = lazy(() => import('../admin/AddProduct'));
const ManageProducts = lazy(() => import('../admin/ManageProducts'));
const UpdateProduct = lazy(() => import('../admin/UpdateProduct'));
const AddDesign = lazy(() => import('../admin/AddDesign'));
const ManageDesigns = lazy(() => import('../admin/ManageDesigns'));
const UpdateDesign = lazy(() => import('../admin/UpdateDesign'));
const ReviewSettings = lazy(() => import('../admin/ReviewSettings'));
const Analytics = lazy(() => import('../admin/Analytics'));
const ManageCoupons = lazy(() => import('../admin/ManageCoupons'));
const ProductVariantsPage = lazy(() => import('../admin/ProductVariantsPage'));
const OrderManagement = lazy(() => import('../admin/OrderManagement'));
const ManageProductTypes = lazy(() => import('../admin/ManageProductTypes'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      <p className="mt-4 text-gray-400">Loading...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <Header />
      <DevModeToggle />
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
