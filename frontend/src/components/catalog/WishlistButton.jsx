import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { addToWishlist, getWishlist, removeFromWishlist } from "../../api/wishlist";
import useAuthStore from "../../store/authStore";

const VARIANT_CLASSES = {
  // Floating badge over a product thumbnail (ProductCard, gallery).
  badge: "relative rounded-full bg-white/80 p-1.5 shadow-sm hover:bg-white",
  // Plain icon button sitting inline alongside other icons (product detail
  // action row) - no floating background/shadow of its own.
  inline: "relative rounded-full p-2 text-navy/50 hover:bg-cream",
};

export default function WishlistButton({ productId, size = 18, variant = "badge", className = "" }) {
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
    enabled: status === "authenticated",
  });

  const item = wishlist?.find((i) => i.product_detail.id === productId);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["wishlist"] });
  const add = useMutation({ mutationFn: () => addToWishlist(productId), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: () => removeFromWishlist(item.id), onSuccess: invalidate });

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      navigate("/login", { state: { from: { pathname: window.location.pathname } } });
      return;
    }
    if (item) remove.mutate();
    else add.mutate();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={add.isPending || remove.isPending}
      aria-label={item ? "Remove from wishlist" : "Save to wishlist"}
      className={`after:absolute after:-inset-2.5 after:content-[''] ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <Heart size={size} className={item ? "fill-orange text-orange" : "text-navy/50"} />
    </button>
  );
}
