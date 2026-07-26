import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { getOrders } from "../../api/orders";

const PAYMENT_LABELS = { cod: "Cash on delivery", esewa: "eSewa", khalti: "Khalti" };

const STATUS_STYLES = {
  pending: "bg-cream-dark text-navy-light",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-orange/10 text-orange",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-amber-100 text-amber-700",
  mixed: "bg-cream-dark text-navy-light",
};

function overallStatus(order) {
  const statuses = [...new Set(order.seller_orders.map((so) => so.status))];
  return statuses.length === 1 ? statuses[0] : "mixed";
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: getOrders });
  const orders = data?.results ?? data ?? [];

  if (isLoading) return <p className="text-navy/60">Loading orders…</p>;
  if (!orders.length) return <p className="text-navy/60">You haven't placed any orders yet.</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-navy">Purchases</h1>

      <div className="overflow-x-auto rounded-lg border border-cream-dark bg-white/60">
        <table className="w-full min-w-160 text-left text-sm">
          <thead>
            <tr className="border-b border-cream-dark text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const status = overallStatus(order);
              return (
                <tr key={order.id} className="border-b border-cream-dark last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{order.order_number}</td>
                  <td className="px-4 py-3 text-navy-light">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-navy">Rs. {order.total_amount}</td>
                  <td className="px-4 py-3 text-navy-light">
                    {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/orders/${order.order_number}`} className="text-orange hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
