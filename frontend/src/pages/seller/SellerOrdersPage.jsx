import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { getSellerOrders, updateSellerOrder } from "../../api/orders";
import OrderTimeline from "../../components/orders/OrderTimeline";
import { extractErrorMessage } from "../../utils/errors";

// Mirrors apps.orders.serializers.SellerOrderUpdateSerializer._ALLOWED_TRANSITIONS -
// the server is the real gate, this just keeps the dropdown from offering
// moves that would just come back as a 400.
const NEXT_STATUSES = {
  pending: ["pending", "confirmed", "cancelled"],
  confirmed: ["confirmed", "shipped", "cancelled"],
  shipped: ["shipped", "delivered"],
  delivered: ["delivered", "refunded"],
  cancelled: ["cancelled"],
  refunded: ["refunded"],
};

// Nothing further can happen to these - no edit affordance at all.
const TERMINAL_STATUSES = ["cancelled", "refunded"];

function SellerOrderRow({ sellerOrder }) {
  const [status, setStatus] = useState(sellerOrder.status);
  const [tracking, setTracking] = useState(sellerOrder.tracking_number || "");
  // A delivered order looks "done" - editing it (to record a return/refund)
  // is a deliberate, separate action, not the default view.
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => updateSellerOrder(sellerOrder.id, { status, tracking_number: tracking }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      queryClient.invalidateQueries({ queryKey: ["seller-orders-pending-count"] });
      setEditing(false);
    },
  });

  const isTerminal = TERMINAL_STATUSES.includes(sellerOrder.status);
  const isDelivered = sellerOrder.status === "delivered";
  const showControls = !isTerminal && (!isDelivered || editing);

  return (
    <li className="rounded border border-navy/10 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-navy">{sellerOrder.order_number}</span>
        <span className="text-sm text-navy/60">Subtotal: Rs. {sellerOrder.subtotal}</span>
      </div>
      <div className="mb-3">
        <OrderTimeline status={sellerOrder.status} />
      </div>
      <ul className="mb-3 flex flex-col divide-y divide-navy/10 text-sm">
        {sellerOrder.items.map((item) => (
          <li key={item.id} className="flex justify-between py-1">
            <span className="text-navy">
              {item.product_name} × {item.quantity}
            </span>
            <span className="text-orange">Rs. {item.line_total}</span>
          </li>
        ))}
      </ul>

      {isDelivered && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded border border-navy/20 px-3 py-1.5 text-sm text-navy hover:bg-cream"
        >
          Edit order
        </button>
      )}

      {showControls && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border border-navy/20 px-2 py-1 text-sm"
          >
            {(NEXT_STATUSES[sellerOrder.status] || [sellerOrder.status]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Tracking number"
            className="rounded border border-navy/20 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded bg-orange px-3 py-1.5 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? "Saving…" : "Update"}
          </button>
          {isDelivered && (
            <button
              type="button"
              onClick={() => {
                setStatus(sellerOrder.status);
                setEditing(false);
              }}
              className="text-sm text-navy/60 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      )}
      {mutation.isError && <p className="mt-1 text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}
    </li>
  );
}

export default function SellerOrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ["seller-orders"], queryFn: getSellerOrders });
  const orders = data?.results ?? data ?? [];

  if (isLoading) return <p className="text-navy/60">Loading orders…</p>;
  if (!orders.length) return <p className="text-navy/60">No orders yet.</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-navy">Seller Orders</h1>
      <ul className="flex flex-col gap-4">
        {orders.map((so) => (
          <SellerOrderRow key={so.id} sellerOrder={so} />
        ))}
      </ul>
    </div>
  );
}
