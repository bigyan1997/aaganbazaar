import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, ChevronRight, MapPin, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { addCartItem } from "../../api/cart";
import { getProduct, getProductReviews, getProducts } from "../../api/catalog";
import { getReviewableOrderItem } from "../../api/reviews";
import ProductCard from "../../components/catalog/ProductCard";
import ProductGallery from "../../components/catalog/ProductGallery";
import StarRating from "../../components/catalog/StarRating";
import StockAlertButton from "../../components/catalog/StockAlertButton";
import WishlistButton from "../../components/catalog/WishlistButton";
import ReviewForm from "../../components/orders/ReviewForm";
import useAuthStore from "../../store/authStore";
import { extractErrorMessage } from "../../utils/errors";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug),
  });
  const { data: reviews } = useQuery({
    queryKey: ["product-reviews", slug],
    queryFn: () => getProductReviews(slug),
    enabled: Boolean(product),
  });
  const { data: reviewable } = useQuery({
    queryKey: ["reviewable-item", slug],
    queryFn: () => getReviewableOrderItem(slug),
    enabled: status === "authenticated",
  });
  const { data: related } = useQuery({
    queryKey: ["related-products", product?.category_slug],
    queryFn: () => getProducts({ category: product.category_slug, page_size: 6 }),
    enabled: Boolean(product?.category_slug),
    staleTime: 1000 * 30,
  });

  const addToCart = useMutation({
    mutationFn: () => addCartItem({ product: product.id, quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (isLoading) return <p className="text-navy/60">Loading…</p>;
  if (!product) return <p className="text-navy/60">Product not found.</p>;

  const handleAddToCart = () => {
    if (status !== "authenticated") {
      navigate("/login", { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }
    addToCart.mutate();
  };

  const relatedProducts = related?.results?.filter((p) => p.id !== product.id).slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <nav className="flex items-center gap-1 text-xs text-navy/50">
        <Link to="/" className="hover:text-orange">
          Home
        </Link>
        <ChevronRight size={12} />
        <Link to={`/products?category=${product.category_slug}`} className="hover:text-orange">
          {product.category_name}
        </Link>
        <ChevronRight size={12} />
        <span className="line-clamp-1 text-navy/70">{product.name}</span>
      </nav>

      <div className="grid gap-6 sm:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-4 rounded-2xl border border-cream-dark bg-white/60 p-5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-semibold text-navy">{product.name}</h1>
            <WishlistButton productId={product.id} size={20} />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-navy/60">
            <StarRating rating={product.average_rating} count={product.review_count} size={16} />
            <span className="text-navy/30">|</span>
            <span>
              Sold by{" "}
              <Link to={`/sellers/${product.seller_slug}`} className="text-orange hover:underline">
                {product.seller_name}
              </Link>
            </span>
          </div>

          <div className="border-t border-cream-dark pt-4">
            {product.discount_percent ? (
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-orange">Rs. {product.sale_price}</p>
                <p className="text-sm text-navy-light line-through">Rs. {product.price}</p>
                <span className="rounded bg-orange px-1.5 py-0.5 text-xs font-medium text-white">
                  -{product.discount_percent}%
                </span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-orange">Rs. {product.price}</p>
            )}
            <p className={product.in_stock ? "mt-1 text-sm text-navy/70" : "mt-1 text-sm text-red-600"}>
              {product.in_stock ? `${product.stock_quantity} in stock` : "Out of stock"}
            </p>
          </div>

          {product.in_stock ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={product.stock_quantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded border border-navy/20 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
                className="flex-1 rounded-lg bg-orange px-4 py-2.5 font-medium text-cream hover:opacity-90 disabled:opacity-50"
              >
                {addToCart.isPending ? "Adding…" : "Add to Cart"}
              </button>
            </div>
          ) : (
            <StockAlertButton slug={slug} />
          )}
          {addToCart.isSuccess && <p className="text-sm text-green-700">Added to cart.</p>}
          {addToCart.isError && <p className="text-sm text-red-600">{extractErrorMessage(addToCart.error)}</p>}

          <div className="grid grid-cols-3 gap-2 rounded-lg bg-cream p-3 text-[11px] text-navy-light">
            <div className="flex items-center gap-1.5">
              <Banknote size={14} className="shrink-0 text-orange" />
              Cash on delivery
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="shrink-0 text-orange" />
              Nationwide delivery
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCcw size={14} className="shrink-0 text-orange" />
              Easy returns
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-cream-dark bg-white/60 p-5">
        <h2 className="mb-2 text-lg font-semibold text-navy">Product Details</h2>
        <p className="whitespace-pre-line text-navy/80">{product.description}</p>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-navy">Reviews</h2>
          {product.review_count > 0 && (
            <StarRating rating={product.average_rating} count={product.review_count} size={14} />
          )}
        </div>

        {reviewable?.order_item_id && (
          <div className="mb-4">
            <p className="mb-1 text-sm font-medium text-navy">You bought this - leave a review</p>
            <ReviewForm
              orderItemId={reviewable.order_item_id}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["product-reviews", slug] });
                queryClient.invalidateQueries({ queryKey: ["product", slug] });
                queryClient.invalidateQueries({ queryKey: ["reviewable-item", slug] });
              }}
            />
          </div>
        )}

        {reviews?.length ? (
          <ul className="flex flex-col gap-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-cream-dark bg-white/60 p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-navy">{review.buyer_name}</span>
                  <span className="text-orange">{"★".repeat(review.rating)}</span>
                </div>
                {review.comment && <p className="mt-1 text-sm text-navy/70">{review.comment}</p>}
                {review.images?.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {review.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.image}
                        alt=""
                        loading="lazy"
                        className="h-16 w-16 rounded border border-navy/10 object-cover"
                      />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-navy/60">No reviews yet.</p>
        )}
      </section>

      {relatedProducts?.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-navy">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
