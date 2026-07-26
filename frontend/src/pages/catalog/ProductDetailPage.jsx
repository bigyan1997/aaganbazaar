import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { addCartItem } from "../../api/cart";
import { getProduct, getProductReviews } from "../../api/catalog";
import { getReviewableOrderItem } from "../../api/reviews";
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

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-semibold text-navy">{product.name}</h1>
            <WishlistButton productId={product.id} size={20} />
          </div>
          <p className="text-sm text-navy/60">
            Sold by{" "}
            <Link to={`/sellers/${product.seller_slug}`} className="text-orange hover:underline">
              {product.seller_name}
            </Link>{" "}
            · {product.category_name}
          </p>
          <StarRating rating={product.average_rating} count={product.review_count} size={16} />
          {product.discount_percent ? (
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-orange">Rs. {product.sale_price}</p>
              <p className="text-sm text-navy-light line-through">Rs. {product.price}</p>
              <span className="rounded bg-orange px-1.5 py-0.5 text-xs font-medium text-white">
                -{product.discount_percent}%
              </span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-orange">Rs. {product.price}</p>
          )}
          <p className={product.in_stock ? "text-sm text-navy/70" : "text-sm text-red-600"}>
            {product.in_stock ? `${product.stock_quantity} in stock` : "Out of stock"}
          </p>
          <p className="whitespace-pre-line text-navy/80">{product.description}</p>

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
                className="rounded bg-orange px-4 py-2 font-medium text-cream hover:opacity-90 disabled:opacity-50"
              >
                {addToCart.isPending ? "Adding…" : "Add to Cart"}
              </button>
            </div>
          ) : (
            <StockAlertButton slug={slug} />
          )}
          {addToCart.isSuccess && <p className="text-sm text-green-700">Added to cart.</p>}
          {addToCart.isError && <p className="text-sm text-red-600">{extractErrorMessage(addToCart.error)}</p>}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-navy">Reviews</h2>

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
              <li key={review.id} className="rounded border border-navy/10 p-3">
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
    </div>
  );
}
