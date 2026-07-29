import { Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-semibold text-navy">Contact us</h1>
      <p className="text-navy/80">
        Have a question about an order, a seller application, or anything else? Reach out and we'll
        get back to you.
      </p>
      <div className="flex flex-col gap-3 rounded-xl border border-cream-dark bg-white/60 p-4">
        <a
          href="mailto:support@aaganbazaar.com"
          className="flex items-center gap-2.5 text-sm text-navy hover:text-orange"
        >
          <Mail size={16} className="shrink-0 text-orange" />
          support@aaganbazaar.com
        </a>
        <p className="flex items-center gap-2.5 text-sm text-navy/70">
          <MapPin size={16} className="shrink-0 text-orange" />
          Kathmandu, Nepal
        </p>
      </div>
      <p className="text-sm text-navy/60">
        For order-specific issues, it's fastest to open the order from{" "}
        <a href="/orders" className="text-orange hover:underline">
          your order history
        </a>{" "}
        and message the seller directly.
      </p>
    </div>
  );
}
