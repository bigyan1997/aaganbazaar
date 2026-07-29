import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getOrder } from "../../api/orders";

const PAYMENT_LABELS = { cod: "Cash on delivery", esewa: "eSewa", khalti: "Khalti" };

export default function OrderInvoicePage() {
  const { orderNumber } = useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => getOrder(orderNumber),
  });

  if (isLoading) return <p className="text-navy/60">Loading invoice…</p>;
  if (!order) return <p className="text-navy/60">Order not found.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <Link to={`/orders/${orderNumber}`} className="text-sm text-orange hover:underline">
          ← Back to order
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex min-h-11 items-center gap-1.5 rounded-lg bg-orange px-4 text-sm font-medium text-cream hover:opacity-90"
        >
          <Printer size={15} />
          Print invoice
        </button>
      </div>

      <div className="rounded-2xl border border-cream-dark bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between border-b border-cream-dark pb-6">
          <div>
            <p className="text-xl font-bold tracking-tight text-navy">
              Aagan<span className="text-orange">bazaar</span>
            </p>
            <p className="text-xs text-navy/50">Made in Nepal, for Nepal</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-navy">Invoice</p>
            <p className="text-sm text-navy/60">{order.order_number}</p>
            <p className="text-xs text-navy/50">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-text-muted">Billed to</p>
            <p className="text-navy">{order.shipping_full_name}</p>
            <p className="text-navy/70">{order.shipping_phone}</p>
            <p className="text-navy/70">
              {order.shipping_address_line}, {order.shipping_city}, {order.shipping_district},{" "}
              {order.shipping_province}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="mb-1 text-xs font-medium uppercase text-text-muted">Payment</p>
            <p className="text-navy">{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</p>
            <p className="capitalize text-navy/70">Status: {order.payment_status}</p>
          </div>
        </div>

        {order.seller_orders.map((so) => (
          <div key={so.id} className="mb-4">
            <p className="mb-1 text-xs font-medium text-navy/60">Sold by {so.seller_name}</p>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cream-dark text-xs text-text-muted">
                  <th className="py-1.5 font-medium">Item</th>
                  <th className="py-1.5 text-right font-medium">Qty</th>
                  <th className="py-1.5 text-right font-medium">Unit price</th>
                  <th className="py-1.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {so.items.map((item) => (
                  <tr key={item.id} className="border-b border-cream-dark last:border-0">
                    <td className="py-1.5 text-navy">{item.product_name}</td>
                    <td className="py-1.5 text-right text-navy/70">{item.quantity}</td>
                    <td className="py-1.5 text-right text-navy/70">Rs. {item.unit_price}</td>
                    <td className="py-1.5 text-right font-medium text-navy">Rs. {item.line_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="flex justify-end border-t border-cream-dark pt-4">
          <div className="text-right">
            <p className="text-sm text-navy/60">Total</p>
            <p className="text-2xl font-semibold text-orange">Rs. {order.total_amount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
