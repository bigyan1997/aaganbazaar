const STEPS = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderTimeline({ status }) {
  if (status === "cancelled") {
    return <div className="rounded bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">Order cancelled</div>;
  }

  // A refund only ever happens after delivery, so the full path (placed
  // through delivered) still shows complete - the refund is an addendum,
  // not a replacement for what actually happened.
  const isRefunded = status === "refunded";
  const currentIndex = isRefunded ? STEPS.length - 1 : STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i <= currentIndex;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                    done ? "bg-orange text-white" : "bg-cream-dark text-navy-light"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span className={`mt-1 whitespace-nowrap text-[10px] ${done ? "text-navy" : "text-navy-light"}`}>
                  {step.label}
                </span>
              </div>
              {!isLast && <div className={`mx-1 h-0.5 flex-1 ${i < currentIndex ? "bg-orange" : "bg-cream-dark"}`} />}
            </div>
          );
        })}
      </div>
      {isRefunded && (
        <div className="w-fit rounded bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Refunded</div>
      )}
    </div>
  );
}
