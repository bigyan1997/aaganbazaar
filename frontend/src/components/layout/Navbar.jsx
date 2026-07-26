import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout } from "../../api/auth";
import { getCart } from "../../api/cart";
import { getCategories } from "../../api/catalog";
import { getSellerOrders } from "../../api/orders";
import logoIcon from "../../assets/logo-icon.png";
import useAuthStore from "../../store/authStore";
import AccountMenu from "./AccountMenu";

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
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const isSeller = status === "authenticated" && user?.role === "seller";
  const { data: pendingOrders } = useQuery({
    queryKey: ["seller-orders-pending-count"],
    queryFn: () => getSellerOrders({ status: "pending" }),
    enabled: isSeller,
    refetchInterval: 60000,
  });
  const pendingCount = pendingOrders?.count ?? 0;

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
    <header className="border-b border-cream-dark bg-cream">
      <div className="mx-auto max-w-5xl px-4">
        {/* Utility bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-dark py-1.5 text-[11px] text-text-muted">
          <span>नेपाल | English</span>
          <span className="flex flex-wrap gap-3.5">
            {status === "authenticated" && (
              <Link to="/orders" className="hover:text-orange">
                Track order
              </Link>
            )}
            {isSeller ? (
              <>
                <Link to="/seller/dashboard" className="hover:text-orange">
                  My Products
                </Link>
                <Link to="/seller/orders" className="hover:text-orange">
                  Seller Orders
                  {pendingCount > 0 && (
                    <span className="ml-1 rounded-full bg-orange px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <Link to="/sell" className="hover:text-orange">
                Sell on AaganBazaar
              </Link>
            )}
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img src={logoIcon} alt="" className="h-11 w-auto" />
            <span className="text-xl font-bold tracking-tight text-navy">Aaganbazaar</span>
          </Link>

          <form onSubmit={handleSearch} className="flex h-10 flex-1 items-center rounded-lg border border-cream-dark bg-white/70 px-3">
            <Search size={16} className="text-text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products"
              className="ml-2 flex-1 border-none bg-transparent text-sm outline-none"
            />
          </form>

          <Link to="/cart" className="relative shrink-0 text-navy-light hover:text-orange">
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-medium text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {status === "authenticated" ? (
            <AccountMenu user={user} onLogout={handleLogout} />
          ) : (
            status !== "loading" && (
              <div className="flex shrink-0 items-center gap-3 text-sm">
                <Link to="/login" className="text-navy-light hover:text-orange">
                  Login
                </Link>
                <Link to="/register" className="text-navy-light hover:text-orange">
                  Register
                </Link>
              </div>
            )
          )}
        </div>

        {/* Category strip */}
        {categories?.length > 0 && (
          <div className="flex gap-4.5 overflow-x-auto whitespace-nowrap border-t border-cream-dark py-2 text-xs text-navy-light">
            <Link to="/deals" className="shrink-0 font-medium text-orange hover:text-orange-dark">
              Deals
            </Link>
            {categories.map((c) => (
              <Link key={c.id} to={`/products?category=${c.slug}`} className="shrink-0 hover:text-orange">
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
