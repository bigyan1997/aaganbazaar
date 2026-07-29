import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getOrder } from "../../api/orders";
import OrderTimeline from "../../components/orders/OrderTimeline";
import ReviewForm from "../../components/orders/ReviewForm";

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => getOrder(orderNumber),
  });

  if (isLoading) return <p className="text-navy/60">Loading order…</p>;
  if (!order) return <p className="text-navy/60">Order not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-navy">Order {order.order_number}</h1>
          <p className="text-sm text-navy/60">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <Link
          to={`/orders/${orderNumber}/invoice`}
          className="flex min-h-11 shrink-0 items-center rounded-lg border border-navy/20 px-3 text-sm text-navy hover:bg-cream"
        >
          View invoice
        </Link>
      </div>

      <div className="grid gap-4 rounded border border-navy/10 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-medium text-navy">Shipping to</p>
          <p className="text-navy/70">{order.shipping_full_name}</p>
          <p className="text-navy/70">{order.shipping_phone}</p>
          <p className="text-navy/70">
            {order.shipping_address_line}, {order.shipping_city}, {order.shipping_district},{" "}
            {order.shipping_province}
          </p>
        </div>
        <div>
          <p className="font-medium text-navy">Payment</p>
          <p className="text-navy/70">Method: {order.payment_method}</p>
          <p className="text-navy/70">Status: {order.payment_status}</p>
          <p className="mt-2 font-semibold text-orange">Total: Rs. {order.total_amount}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {order.seller_orders.map((so) => (
          <div key={so.id} className="rounded border border-navy/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium text-navy">{so.seller_name}</span>
              {so.tracking_number && <span className="text-sm text-navy/60">Tracking: {so.tracking_number}</span>}
            </div>
            <div className="mb-3">
              <OrderTimeline status={so.status} />
            </div>
            <ul className="flex flex-col divide-y divide-navy/10">
              {so.items.map((item) => (
                <li key={item.id} className="py-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-navy">
                      {item.product_name} × {item.quantity}
                    </span>
                    <span className="font-medium text-orange">Rs. {item.line_total}</span>
                  </div>
                  {so.status === "delivered" && <ReviewForm orderItemId={item.id} />}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
