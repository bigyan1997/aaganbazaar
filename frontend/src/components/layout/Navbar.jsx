import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Package, Phone, Scale, Search, ShoppingCart, Store, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout } from "../../api/auth";
import { getCart } from "../../api/cart";
import { getSellerOrders } from "../../api/orders";
import { getWishlist } from "../../api/wishlist";
import logoIcon from "../../assets/logo-icon.png";
import useAuthStore from "../../store/authStore";
import useCompareStore from "../../store/compareStore";
import AccountMenu from "./AccountMenu";
import CategoriesMenu from "./CategoriesMenu";
import SearchBar from "./SearchBar";

const clusterLinkClass =
  "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-cream hover:bg-white/10 hover:text-white";
const clusterLabelClass = "hidden text-[10px] leading-none sm:block";
const stripLinkClass = "shrink-0 text-navy-light hover:text-orange";

export default function Navbar() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: status === "authenticated",
  });
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
    enabled: status === "authenticated",
  });
  const wishlistCount = wishlist?.length ?? 0;

  const compareCount = useCompareStore((s) => s.slugs.length);

  const isSeller = status === "authenticated" && user?.role === "seller";
  const { data: pendingOrders } = useQuery({
    queryKey: ["seller-orders-pending-count"],
    queryFn: () => getSellerOrders({ status: "pending" }),
    enabled: isSeller,
    refetchInterval: 60000,
  });
  const pendingCount = pendingOrders?.count ?? 0;

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
      {/* Utility bar - desktop only, real links/copy, no fake language/currency toggles */}
      <div className="hidden border-b border-white/10 bg-navy-light/40 sm:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-1.5 text-[11px] text-cream/80">
          <span className="flex gap-3.5">
            <Link to="/about" className="hover:text-white">
              About Us
            </Link>
            <Link to="/wishlist" className="hover:text-white">
              Wishlist
            </Link>
            <Link to="/orders" className="hover:text-white">
              Track order
            </Link>
          </span>
          <span className="truncate text-cream/60">किन्नुहोस् नेपाली — every purchase supports a local seller</span>
          <span className="flex shrink-0 gap-3.5">
            <Link to="/contact" className="hover:text-white">
              Contact us
            </Link>
            <Link to="/sell" className="hover:text-white">
              Sell on Aaganbazaar
            </Link>
          </span>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5 sm:gap-3">
        {/* Mobile expanded search - takes over the row, sm+ never sees this */}
        {mobileSearchOpen && (
          <div
            style={{ transformOrigin: "right center", animation: "navbar-search-in 200ms ease-out" }}
            className="w-full sm:hidden"
          >
            <SearchBar
              autoFocus
              onSubmitted={() => setMobileSearchOpen(false)}
              trailingAction={
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  aria-label="Close search"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-navy/50 hover:bg-cream"
                >
                  <X size={18} />
                </button>
              }
            />
          </div>
        )}

        {/* Normal row - hidden on mobile while search is expanded, always shown sm+ */}
        <div className={`flex min-w-0 flex-1 items-center gap-2 sm:gap-3 ${mobileSearchOpen ? "hidden sm:flex" : "flex"}`}>
          {/* Categories flyout - mobile only here, desktop gets the labeled button in the strip below */}
          <div className="shrink-0 sm:hidden">
            <CategoriesMenu variant="icon" />
          </div>

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
          <SearchBar className="hidden flex-1 sm:block" />

          {/* Mobile search trigger - icon only, expands the form above on tap */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Open search"
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-cream hover:bg-white/10 sm:hidden"
          >
            <Search size={20} />
          </button>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/compare" className={`relative ${clusterLinkClass}`}>
              <Scale size={18} />
              <span className={clusterLabelClass}>Compare</span>
              {compareCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[9px] font-medium text-white">
                  {compareCount}
                </span>
              )}
            </Link>

            {status === "authenticated" && (
              <Link to="/wishlist" className={`relative ${clusterLinkClass}`}>
                <Heart size={18} />
                <span className={clusterLabelClass}>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[9px] font-medium text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

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
              <Link to="/sell" className={`hidden ${clusterLinkClass} sm:flex`}>
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

      {/* Category strip - desktop only, mobile uses the icon flyout above instead */}
      <div className="hidden border-t border-white/10 bg-white sm:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-4.5 text-xs">
            <CategoriesMenu variant="labeled" />
            <Link to="/deals" className="shrink-0 font-medium text-orange hover:text-orange-dark">
              Deals
            </Link>
            <Link to="/stores" className={stripLinkClass}>
              Stores
            </Link>
            <Link to="/compare" className={stripLinkClass}>
              Compare
            </Link>
            <Link to="/about" className={stripLinkClass}>
              About
            </Link>
            <Link to="/contact" className={stripLinkClass}>
              Contact
            </Link>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-navy-light">
            <Phone size={14} className="text-orange" />
            support@aaganbazaar.com
          </span>
        </div>
      </div>
    </header>
  );
}
