import { Routes, Route } from "react-router-dom"
import Home from '../core/Home';
import Shop from '../pages/Shop';
import Contact from '../pages/Contact';
import Customize from './Customize';
import Cart from '../core/Cart';
import Checkout from './Checkout';
import EnhancedCheckout from './EnhancedCheckout';
import OrderConfirmation from './OrderConfirmation';
import ProductDetail from './ProductDetail';
import Wishlist from './Wishlist';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Signup from '../user/Signup';
import Signin from '../user/Signin';
import UserDashBoard from '../user/UserDashBoard';
import AdminDashBoard from '../user/AdminDashBoard';
import AddCategory from '../admin/AddCategory';
import ManageCategories from '../admin/ManageCategories';
import AddProduct from '../admin/AddProduct';
import ManageProducts from '../admin/ManageProducts';
import UpdateProduct from '../admin/UpdateProduct';
import PrivateRoute from "../auth/helper/PrivateRoutes";
import AdminRoute from "../auth/helper/AdminRoutes";
import DevModeToggle from '../components/DevModeToggle';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <Header />
      <DevModeToggle />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/enhanced-checkout" element={<EnhancedCheckout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/user/dashboard" element={<PrivateRoute />}>
            <Route path="" element={<UserDashBoard />} />
          </Route>
          <Route path="/admin/dashboard" element={<AdminRoute />}>
            <Route path="" element={<AdminDashBoard />} />
          </Route>
          <Route path="/admin/create/category" element={<AdminRoute />}>
            <Route path="" element={<AddCategory />} />
          </Route>
          <Route path="/admin/categories" element={<AdminRoute />}>
            <Route path="" element={<ManageCategories />} />
          </Route>
          <Route path="/admin/create/product" element={<AdminRoute />}>
            <Route path="" element={<AddProduct />} />
          </Route>
          <Route path="/admin/products" element={<AdminRoute />}>
            <Route path="" element={<ManageProducts />} />
          </Route>
          <Route path="/admin/product/update/:productId" element={<AdminRoute />}>
            <Route path="" element={<UpdateProduct />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
