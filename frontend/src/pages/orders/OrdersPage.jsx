import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { getOrders } from "../../api/orders";

export default function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: getOrders });
  const orders = data?.results ?? data ?? [];

  if (isLoading) return <p className="text-navy/60">Loading orders…</p>;
  if (!orders.length) return <p className="text-navy/60">You haven't placed any orders yet.</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-navy">My Orders</h1>
      <ul className="flex flex-col divide-y divide-navy/10 rounded border border-navy/10">
        {orders.map((order) => (
          <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <Link to={`/orders/${order.order_number}`} className="font-medium text-navy hover:text-orange">
                {order.order_number}
              </Link>
              <p className="text-sm text-navy/60">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <span className="font-semibold text-orange">Rs. {order.total_amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
