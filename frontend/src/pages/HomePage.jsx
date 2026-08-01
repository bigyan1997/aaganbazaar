import { useQuery } from "@tanstack/react-query";
import {
  Baby,
  BookOpen,
  Gift,
  Heart,
  Percent,
  RotateCcw,
  Shirt,
  ShoppingBag,
  ShieldCheck,
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
import DealCountdown from "../components/home/DealCountdown";
import ProductTabs from "../components/home/ProductTabs";
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

const TRUST_BADGES = [
  { icon: Percent, title: "Best prices & offers", subtitle: "Deals updated daily" },
  { icon: Truck, title: "Nationwide delivery", subtitle: "Even outside the valley" },
  { icon: Wallet, title: "eSewa & Khalti", subtitle: "Plus cash on delivery" },
  { icon: RotateCcw, title: "Easy returns", subtitle: "Hassle-free process" },
  { icon: ShieldCheck, title: "Safe delivery", subtitle: "Tracked, every order" },
  { icon: Heart, title: "Local sellers", subtitle: "Every shop is Nepal based" },
];

function iconForCategory(name) {
  return CATEGORY_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Store;
}

export default function HomePage() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const isSeller = status === "authenticated" && user?.role === "seller";

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
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

  const topDeal = flashDeals?.results?.[0];
  const restOfDeals = flashDeals?.results?.slice(1) ?? [];

  return (
    <div className="flex flex-col gap-8">
      {/* Hero / admin-managed banner */}
      <BannerCarousel />

      {/* Trust badges - Nest-style icon boxes */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {TRUST_BADGES.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="rounded-lg bg-white/60 p-3 text-center sm:text-left">
            <Icon size={20} className="mx-auto text-orange sm:mx-0" strokeWidth={1.75} />
            <p className="mt-2 text-xs font-medium text-navy">{title}</p>
            <p className="text-[10px] text-text-muted">{subtitle}</p>
          </div>
        ))}
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
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-cream">
                    <Icon size={18} className="text-orange" strokeWidth={1.75} />
                  </div>
                  <p className="mt-1.5 text-[10px] text-navy-light">{c.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Deal of the Day - featured deal + countdown, rest of the deals alongside */}
      {topDeal && !loadingDeals && (
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[15px] font-medium text-navy">Deal of the Day</p>
            <DealCountdown />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {/* The featured tile only spans 2 rows when there's enough
                inventory to fill both of them (cols 2-5 x 2 rows = 4+
                items) - otherwise row 2 is empty and row-span-2 reserves
                its height anyway, leaving a dead gap before the next
                section. */}
            <div className={restOfDeals.length >= 4 ? "col-span-2 sm:col-span-1 sm:row-span-2" : "col-span-2 sm:col-span-1"}>
              <ProductCard product={topDeal} />
            </div>
            {restOfDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Tabbed product carousel - New Arrivals / Top Rated / Best Deals / Budget Picks */}
      <ProductTabs />

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

      {/* Lifestyle promo banner */}
      <div className="flex flex-col items-start gap-3 rounded-2xl bg-cream-dark p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-lg font-medium text-navy">Support a neighbourhood shop today</p>
          <p className="text-xs text-text-muted">
            Every order on Aaganbazaar goes straight to a Nepali seller — not an outsourced warehouse
          </p>
        </div>
        <Link
          to="/stores"
          className="inline-block whitespace-nowrap rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-light"
        >
          Browse local shops ↗
        </Link>
      </div>

      {/* Quick links strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link to="/products" className="rounded-xl bg-white/60 p-4 transition hover:shadow-md">
          <ShoppingBag size={22} className="text-orange" strokeWidth={1.75} />
          <p className="mb-0.5 mt-2.5 text-sm font-medium text-navy">Everyday essentials</p>
          <p className="text-xs text-text-muted">Browse the full catalog</p>
        </Link>
        <Link to="/deals" className="rounded-xl bg-white/60 p-4 transition hover:shadow-md">
          <Percent size={22} className="text-orange" strokeWidth={1.75} />
          <p className="mb-0.5 mt-2.5 text-sm font-medium text-navy">This week's best prices</p>
          <p className="text-xs text-text-muted">See every active deal</p>
        </Link>
        <Link to="/stores" className="rounded-xl bg-white/60 p-4 transition hover:shadow-md">
          <Store size={22} className="text-orange" strokeWidth={1.75} />
          <p className="mb-0.5 mt-2.5 text-sm font-medium text-navy">Support a local shop</p>
          <p className="text-xs text-text-muted">Browse sellers near you</p>
        </Link>
      </div>

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
    </div>
  );
}
