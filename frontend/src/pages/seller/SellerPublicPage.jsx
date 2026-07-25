import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { getProducts } from "../../api/catalog";
import { getSellerPublicProfile } from "../../api/sellers";
import ProductCard from "../../components/catalog/ProductCard";

export default function SellerPublicPage() {
  const { slug } = useParams();
  const { data: seller, isLoading } = useQuery({
    queryKey: ["seller", slug],
    queryFn: () => getSellerPublicProfile(slug),
  });
  const { data: products } = useQuery({
    queryKey: ["products", { seller__slug: slug }],
    queryFn: () => getProducts({ seller__slug: slug }),
    enabled: Boolean(seller),
  });

  if (isLoading) return <p className="text-navy/60">Loading…</p>;
  if (!seller) return <p className="text-navy/60">Seller not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">{seller.store_name}</h1>
        <p className="mt-1 text-navy/70">{seller.description}</p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-navy">Products</h2>
        {products?.results?.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-navy/60">No products found.</p>
        )}
      </div>
    </div>
  );
}
