import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout } from "../../api/auth";
import { getCart } from "../../api/cart";
import useAuthStore from "../../store/authStore";

export default function Navbar() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: status === "authenticated",
  });
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/products?search=${encodeURIComponent(search.trim())}` : "/products");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clear();
      queryClient.clear();
      navigate("/");
    }
  };

  return (
    <header className="bg-navy text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link to="/" className="text-xl font-bold text-cream shrink-0">
          Aaganbazaar
        </Link>

        <form onSubmit={handleSearch} className="flex min-w-40 flex-1 items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-l border-0 px-3 py-1.5 text-sm text-navy focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-r bg-orange px-3 py-1.5 text-sm font-medium text-cream hover:opacity-90"
          >
            Search
          </button>
        </form>

        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link to="/products" className="hover:text-orange">
            Products
          </Link>

          {status === "authenticated" && (
            <Link to="/cart" className="hover:text-orange">
              Cart{itemCount > 0 ? ` (${itemCount})` : ""}
            </Link>
          )}

          {status === "authenticated" && (
            <Link to="/orders" className="hover:text-orange">
              My Orders
            </Link>
          )}

          {status === "authenticated" && user?.role === "seller" && (
            <>
              <Link to="/seller/dashboard" className="hover:text-orange">
                My Products
              </Link>
              <Link to="/seller/orders" className="hover:text-orange">
                Seller Orders
              </Link>
            </>
          )}

          {status === "authenticated" && user?.role !== "seller" && (
            <Link to="/sell" className="hover:text-orange">
              Sell on Aaganbazaar
            </Link>
          )}

          {status === "authenticated" ? (
            <>
              <span className="text-cream/70">Hi, {user?.first_name || user?.email}</span>
              <button type="button" onClick={handleLogout} className="hover:text-orange">
                Logout
              </button>
            </>
          ) : (
            status !== "loading" && (
              <>
                <Link to="/login" className="hover:text-orange">
                  Login
                </Link>
                <Link to="/register" className="hover:text-orange">
                  Register
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
