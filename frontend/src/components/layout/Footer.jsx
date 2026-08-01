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
            <Link to="/compare" className="mb-1 block hover:text-orange">
              Compare products
            </Link>
            <Link to="/faq" className="mb-1 block hover:text-orange">
              Help & FAQ
            </Link>
            <Link to="/contact" className="block hover:text-orange">
              Contact us
            </Link>
          </div>
          <div>
            <p className="mb-2 font-medium text-navy">Company</p>
            <Link to="/about" className="mb-1 block hover:text-orange">
              About us
            </Link>
            <Link to="/categories" className="mb-1 block hover:text-orange">
              Categories
            </Link>
            <Link to="/stores" className="mb-1 block hover:text-orange">
              Stores
            </Link>
            <Link to="/sell" className="block hover:text-orange">
              Start selling
            </Link>
          </div>
          <div>
            <p className="mb-2 font-medium text-navy">Payments</p>
            <p className="mb-1">eSewa, Khalti</p>
            <p>Cash on delivery</p>
          </div>
          <div>
            <p className="mb-2 font-medium text-navy">Legal</p>
            <Link to="/terms" className="mb-1 block hover:text-orange">
              Terms of Service
            </Link>
            <Link to="/privacy" className="block hover:text-orange">
              Privacy Policy
            </Link>
          </div>
        </div>
        <div className="border-t border-cream-dark py-3 text-center text-[11px] text-text-muted">
          © {new Date().getFullYear()} Aaganbazaar — किन्नुहोस् नेपाली
        </div>
      </div>
    </footer>
  );
}
