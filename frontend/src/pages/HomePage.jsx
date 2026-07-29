import { useQuery } from "@tanstack/react-query";
import {
  Baby,
  Banknote,
  BookOpen,
  Coins,
  Gift,
  Heart,
  MapPin,
  RotateCcw,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sofa,
  Sparkles,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getCategories, getCategoryDeals, getProducts } from "../api/catalog";
import ProductCard from "../components/catalog/ProductCard";
import BannerCarousel from "../components/home/BannerCarousel";
import DealCategoryTile from "../components/home/DealCategoryTile";
import useAuthStore from "../store/authStore";

const CATEGORY_ICONS = [
  [/grocer/i, ShoppingBag],
  [/fashion|cloth|wear/i, Shirt],
  [/electronic|phone|mobile|gadget/i, Smartphone],
  [/home|kitchen|furnitur/i, Sofa],
  [/handicraft|gift/i, Gift],
  [/beauty|cosmetic/i, Sparkles],
  [/baby|kid/i, Baby],
  [/book/i, BookOpen],
];

function iconForCategory(name) {
  return CATEGORY_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Store;
}

export default function HomePage() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const isSeller = status === "authenticated" && user?.role === "seller";

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ["products", { page_size: 5, ordering: "-created_at" }],
    queryFn: () => getProducts({ page_size: 5, ordering: "-created_at" }),
    // Shorter than the global default - a seller deactivating/updating a
    // product should show up here within half a minute of a buyer
    // revisiting, not sit stale for the full 5-minute default.
    staleTime: 1000 * 30,
  });
  const { data: flashDeals, isLoading: loadingDeals } = useQuery({
    queryKey: ["products", { page_size: 5, on_sale: "true", ordering: "-discount_percent" }],
    queryFn: () => getProducts({ page_size: 5, on_sale: "true", ordering: "-discount_percent" }),
    staleTime: 1000 * 30,
  });
  const { data: dealCategories } = useQuery({
    queryKey: ["category-deals"],
    queryFn: getCategoryDeals,
    staleTime: 0,
  });

  return (
    <div className="flex flex-col gap-7">
      {/* Hero / admin-managed banner */}
      <BannerCarousel />

      {/* Trust row */}
      <div className="grid grid-cols-2 gap-2.5 text-xs text-navy-light md:grid-cols-4">
        <div className="flex items-center gap-1.5">
          <Wallet size={15} className="text-orange" />
          eSewa and Khalti
        </div>
        <div className="flex items-center gap-1.5">
          <Banknote size={15} className="text-orange" />
          Cash on delivery
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={15} className="text-orange" />
          Nationwide delivery
        </div>
        <div className="flex items-center gap-1.5">
          <RotateCcw size={15} className="text-orange" />
          Easy returns
        </div>
      </div>

      {/* Shop by category */}
      {categories?.length > 0 && (
        <div>
          <p className="mb-2.5 text-[15px] font-medium text-navy">Shop by category</p>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
            {categories.map((c) => {
              const Icon = iconForCategory(c.name);
              return (
                <Link
                  key={c.id}
                  to={`/products?category=${c.slug}`}
                  className="rounded-lg bg-white/60 px-1 py-2.5 text-center hover:bg-white"
                >
                  <Icon size={18} className="mx-auto text-orange" strokeWidth={1.75} />
                  <p className="mt-1.5 text-[10px] text-navy-light">{c.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* New arrivals */}
      <div>
        <p className="mb-2.5 text-[15px] font-medium text-navy">New Arrivals</p>
        {loadingNew ? (
          <p className="text-sm text-navy/60">Loading…</p>
        ) : newArrivals?.results?.length ? (
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
            {newArrivals.results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-navy/60">No products yet — check back soon.</p>
        )}
      </div>

      {/* Flash deals */}
      {flashDeals?.results?.length > 0 && !loadingDeals && (
        <div>
          <p className="mb-2.5 text-[15px] font-medium text-navy">Flash Deals</p>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
            {flashDeals.results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Shop deals by category */}
      {dealCategories?.length > 0 && (
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[15px] font-medium text-navy">Shop deals by category</p>
            <Link to="/deals" className="text-xs text-orange hover:underline">
              See all deals ↗
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
            {dealCategories.slice(0, 5).map((c) => (
              <DealCategoryTile key={c.id} category={c} />
            ))}
          </div>
        </div>
      )}

      {/* Seller banner */}
      {!isSeller && (
        <div className="flex items-center justify-between rounded-2xl bg-navy p-5.5">
          <div>
            <p className="mb-1 text-[15px] font-medium text-white">Sell on Aaganbazaar</p>
            <p className="text-xs text-cream-dark">Lower fees than the big platforms, and your buyers are Nepali</p>
          </div>
          <Link
            to="/sell"
            className="flex min-h-11 items-center rounded-lg bg-white px-4.5 py-2 text-xs font-medium text-navy"
          >
            Become a seller ↗
          </Link>
        </div>
      )}

      {/* Why Aaganbazaar */}
      <div>
        <p className="mb-2.5 text-[15px] font-medium text-navy">Why Aaganbazaar</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-white/60 p-3.5">
            <Heart size={20} className="text-orange" />
            <p className="mb-0.5 mt-2 text-xs font-medium text-navy">Local sellers</p>
            <p className="text-[11px] text-text-muted">Every shop is Nepal based</p>
          </div>
          <div className="rounded-lg bg-white/60 p-3.5">
            <Coins size={20} className="text-orange" />
            <p className="mb-0.5 mt-2 text-xs font-medium text-navy">Fair pricing</p>
            <p className="text-[11px] text-text-muted">Lower fees keep costs down</p>
          </div>
          <div className="rounded-lg bg-white/60 p-3.5">
            <Truck size={20} className="text-orange" />
            <p className="mb-0.5 mt-2 text-xs font-medium text-navy">Fast delivery</p>
            <p className="text-[11px] text-text-muted">Even outside the valley</p>
          </div>
        </div>
      </div>
    </div>
  );
}
