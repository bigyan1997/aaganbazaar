import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import GuestRoute from "./components/auth/GuestRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SellerRoute from "./components/auth/SellerRoute";
import Layout from "./components/layout/Layout";
import useAuthBootstrap from "./hooks/useAuthBootstrap";
import HomePage from "./pages/HomePage";

// Everything but the homepage is lazy - a first-time visitor only ever
// downloads the JS for the page they actually land on, not the seller
// dashboard, checkout, auth forms, etc. all at once.
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/auth/VerifyEmailPage"));
const CartPage = lazy(() => import("./pages/cart/CartPage"));
const ProductDetailPage = lazy(() => import("./pages/catalog/ProductDetailPage"));
const ProductsPage = lazy(() => import("./pages/catalog/ProductsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const CheckoutPage = lazy(() => import("./pages/orders/CheckoutPage"));
const OrderDetailPage = lazy(() => import("./pages/orders/OrderDetailPage"));
const OrdersPage = lazy(() => import("./pages/orders/OrdersPage"));
const SellerApplyPage = lazy(() => import("./pages/seller/SellerApplyPage"));
const SellerDashboardPage = lazy(() => import("./pages/seller/SellerDashboardPage"));
const SellerOrdersPage = lazy(() => import("./pages/seller/SellerOrdersPage"));
const SellerPublicPage = lazy(() => import("./pages/seller/SellerPublicPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function PageFallback() {
  return <p className="text-navy/60">Loading…</p>;
}

function AppRoutes() {
  useAuthBootstrap();

  return (
    <Suspense fallback={<PageFallback />}>
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
    </Suspense>
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
