import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { getProducts } from "../api/catalog";
import ProductCard from "../components/catalog/ProductCard";

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["products", { page_size: 8, ordering: "-created_at" }],
    queryFn: () => getProducts({ page_size: 8, ordering: "-created_at" }),
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded bg-navy px-6 py-12 text-center text-cream">
        <h1 className="text-3xl font-semibold sm:text-4xl">Aaganbazaar — किन्नुहोस् नेपाली</h1>
        <p className="mt-2 text-cream/70">A Nepal-focused marketplace, made for local buyers and sellers.</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded bg-orange px-5 py-2 font-medium text-cream hover:opacity-90"
        >
          Browse Products
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-navy">New Arrivals</h2>
        {isLoading ? (
          <p className="text-navy/60">Loading products…</p>
        ) : data?.results?.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {data.results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-navy/60">No products yet — check back soon.</p>
        )}
      </section>
    </div>
  );
}
