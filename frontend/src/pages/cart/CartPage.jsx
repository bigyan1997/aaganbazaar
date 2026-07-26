import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { getCart, removeCartItem, updateCartItem } from "../../api/cart";
import { extractErrorMessage } from "../../utils/errors";

export default function CartPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: cart, isLoading } = useQuery({ queryKey: ["cart"], queryFn: getCart });

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: ["cart"] });
  const updateMutation = useMutation({ mutationFn: ({ id, quantity }) => updateCartItem(id, { quantity }), onSuccess: invalidateCart });
  const removeMutation = useMutation({ mutationFn: removeCartItem, onSuccess: invalidateCart });

  if (isLoading) return <p className="text-navy/60">Loading cart…</p>;

  if (!cart?.items?.length) {
    return (
      <div className="text-center text-navy/60">
        <p>Your cart is empty.</p>
        <Link to="/products" className="mt-3 inline-block text-orange hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-navy">Your Cart</h1>

      <ul className="flex flex-col divide-y divide-navy/10 rounded border border-navy/10">
        {cart.items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-4 p-4">
            <Link to={`/products/${item.product_slug}`} className="flex-1 font-medium text-navy hover:text-orange">
              {item.product_name}
            </Link>
            {item.discount_percent ? (
              <span className="flex flex-col items-end text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="text-navy/70">Rs. {item.unit_price} each</span>
                  <span className="rounded bg-orange/10 px-1 text-xs text-orange">-{item.discount_percent}%</span>
                </span>
                <span className="text-xs text-navy-light line-through">Rs. {item.list_price}</span>
              </span>
            ) : (
              <span className="text-sm text-navy/70">Rs. {item.unit_price} each</span>
            )}
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => {
                const quantity = Math.max(1, Number(e.target.value));
                updateMutation.mutate({ id: item.id, quantity });
              }}
              className="w-16 rounded border border-navy/20 px-2 py-1 text-sm"
            />
            <span className="w-24 text-right font-semibold text-orange">Rs. {item.line_total}</span>
            <button
              type="button"
              onClick={() => removeMutation.mutate(item.id)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {updateMutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(updateMutation.error)}</p>}

      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-semibold text-navy">Total: Rs. {cart.total}</span>
          {Number(cart.total_savings) > 0 && (
            <p className="text-sm text-orange">You saved Rs. {cart.total_savings}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate("/checkout")}
          className="rounded bg-orange px-5 py-2 font-medium text-cream hover:opacity-90"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
