import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-cream-dark bg-cream">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 gap-4 py-5 text-xs text-navy-light md:grid-cols-4">
          <div>
            <p className="mb-2 font-medium text-navy">Aaganbazaar</p>
            <p>Made in Nepal, for Nepal</p>
          </div>
          <div>
            <p className="mb-2 font-medium text-navy">Customer care</p>
            <Link to="/orders" className="mb-1 block hover:text-orange">
              Track order
            </Link>
          </div>
          <div>
            <p className="mb-2 font-medium text-navy">For sellers</p>
            <Link to="/sell" className="block hover:text-orange">
              Start selling
            </Link>
          </div>
          <div>
            <p className="mb-2 font-medium text-navy">Payments</p>
            <p className="mb-1">eSewa, Khalti</p>
            <p>Cash on delivery</p>
          </div>
        </div>
        <div className="border-t border-cream-dark py-3 text-center text-[11px] text-text-muted">
          © {new Date().getFullYear()} Aaganbazaar — किन्नुहोस् नेपाली
        </div>
      </div>
    </footer>
  );
}
