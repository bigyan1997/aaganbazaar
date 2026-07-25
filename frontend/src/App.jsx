import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import GuestRoute from "./components/auth/GuestRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SellerRoute from "./components/auth/SellerRoute";
import Layout from "./components/layout/Layout";
import useAuthBootstrap from "./hooks/useAuthBootstrap";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import CartPage from "./pages/cart/CartPage";
import ProductDetailPage from "./pages/catalog/ProductDetailPage";
import ProductsPage from "./pages/catalog/ProductsPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import AccountPage from "./pages/AccountPage";
import CheckoutPage from "./pages/orders/CheckoutPage";
import OrderDetailPage from "./pages/orders/OrderDetailPage";
import OrdersPage from "./pages/orders/OrdersPage";
import SellerApplyPage from "./pages/seller/SellerApplyPage";
import SellerDashboardPage from "./pages/seller/SellerDashboardPage";
import SellerOrdersPage from "./pages/seller/SellerOrdersPage";
import SellerPublicPage from "./pages/seller/SellerPublicPage";
import WishlistPage from "./pages/WishlistPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AppRoutes() {
  useAuthBootstrap();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/sellers/:slug" element={<SellerPublicPage />} />

        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:orderNumber" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/sell" element={<SellerApplyPage />} />
        <Route path="/seller/dashboard" element={<SellerRoute><SellerDashboardPage /></SellerRoute>} />
        <Route path="/seller/orders" element={<SellerRoute><SellerOrdersPage /></SellerRoute>} />

        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
