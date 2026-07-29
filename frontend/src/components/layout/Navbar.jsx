import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, Package, Search, ShoppingCart, Store, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout } from "../../api/auth";
import { getCart } from "../../api/cart";
import { getCategories } from "../../api/catalog";
import { getSellerOrders } from "../../api/orders";
import logoIcon from "../../assets/logo-icon.png";
import useAuthStore from "../../store/authStore";
import AccountMenu from "./AccountMenu";

const clusterLinkClass =
  "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-cream hover:bg-white/10 hover:text-white";
const clusterLabelClass = "hidden text-[10px] leading-none sm:block";

export default function Navbar() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const categoriesRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) setCategoriesOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) mobileSearchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/products?search=${encodeURIComponent(search.trim())}` : "/products");
    setSearch("");
    setMobileSearchOpen(false);
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
    <header className="bg-navy">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5 sm:gap-3">
        {/* Mobile expanded search - takes over the row, sm+ never sees this */}
        {mobileSearchOpen && (
          <form
            onSubmit={handleSearch}
            style={{ transformOrigin: "right center", animation: "navbar-search-in 200ms ease-out" }}
            className="flex h-10 w-full min-w-0 items-center gap-1 rounded-full bg-white pl-4 pr-1 sm:hidden"
          >
            <Search size={16} className="shrink-0 text-navy/40" />
            <input
              ref={mobileSearchInputRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products"
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-navy outline-none placeholder:text-navy/40"
            />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-navy/50 hover:bg-cream"
            >
              <X size={18} />
            </button>
          </form>
        )}

        {/* Normal row - hidden on mobile while search is expanded, always shown sm+ */}
        <div className={`flex min-w-0 flex-1 items-center gap-2 sm:gap-3 ${mobileSearchOpen ? "hidden sm:flex" : "flex"}`}>
          {/* Categories flyout */}
          {categories?.length > 0 && (
            <div ref={categoriesRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setCategoriesOpen((o) => !o)}
                aria-label="Browse categories"
                aria-expanded={categoriesOpen}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-cream hover:bg-white/10 hover:text-white"
              >
                {categoriesOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              {categoriesOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border border-cream-dark bg-white py-1.5 shadow-lg">
                  <Link
                    to="/deals"
                    onClick={() => setCategoriesOpen(false)}
                    className="block px-3.5 py-2 text-sm font-medium text-orange hover:bg-cream"
                  >
                    Deals
                  </Link>
                  <div className="my-1 border-t border-cream-dark" />
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/products?category=${c.slug}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="block px-3.5 py-2 text-sm text-navy hover:bg-cream"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logo - wrapped in a light badge so the navy line-art reads
              against the navy bar instead of vanishing into it. */}
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream p-1">
              <img src={logoIcon} alt="" className="h-full w-full object-contain" />
            </div>
            <span className="hidden text-lg font-bold tracking-tight text-white sm:inline">
              Aagan<span className="text-orange">bazaar</span>
            </span>
          </Link>

          {/* Desktop/tablet search - always visible, sm and up */}
          <form
            onSubmit={handleSearch}
            className="hidden h-10 min-w-0 flex-1 items-center rounded-full bg-white pl-4 pr-1 sm:flex"
          >
            <Search size={16} className="shrink-0 text-navy/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products"
              className="ml-2 min-w-0 flex-1 border-none bg-transparent text-sm text-navy outline-none placeholder:text-navy/40"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange text-white hover:bg-orange-dark"
            >
              <Search size={16} />
            </button>
          </form>

          {/* Mobile search trigger - icon only, expands the form above on tap */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Open search"
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cream hover:bg-white/10 sm:hidden"
          >
            <Search size={20} />
          </button>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-0.5">
            {isSeller ? (
              <>
                <Link to="/seller/dashboard" className={clusterLinkClass}>
                  <Store size={18} />
                  <span className={clusterLabelClass}>Dashboard</span>
                </Link>
                <Link to="/seller/orders" className={`relative ${clusterLinkClass}`}>
                  <Package size={18} />
                  <span className={clusterLabelClass}>Orders</span>
                  {pendingCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[9px] font-semibold text-white">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <Link to="/sell" className={clusterLinkClass}>
                <Store size={18} />
                <span className={clusterLabelClass}>Sell</span>
              </Link>
            )}

            {status === "authenticated" ? (
              <AccountMenu user={user} onLogout={handleLogout} />
            ) : (
              status !== "loading" && (
                <Link to="/login" className={clusterLinkClass}>
                  <User size={18} />
                  <span className={clusterLabelClass}>Sign in</span>
                </Link>
              )
            )}

            <Link to="/cart" className={`relative ${clusterLinkClass}`}>
              <ShoppingCart size={18} />
              <span className={clusterLabelClass}>Cart</span>
              {itemCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[9px] font-medium text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
