import { ChevronDown, Heart, LogOut, Package, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = (user?.first_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 hover:bg-cream-dark"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-dark text-xs font-medium text-navy">
          {initial}
        </span>
        <ChevronDown size={14} className="text-navy-light" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-52 rounded-lg border border-cream-dark bg-white py-1 shadow-lg">
          <div className="border-b border-cream-dark px-3 py-2">
            <p className="truncate text-sm font-medium text-navy">{user?.first_name || "Welcome"}</p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
          </div>
          <Link
            to="/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-navy hover:bg-cream"
          >
            <Package size={15} className="text-navy-light" />
            Purchases
          </Link>
          <Link
            to="/wishlist"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-navy hover:bg-cream"
          >
            <Heart size={15} className="text-navy-light" />
            Wishlist
          </Link>
          <Link
            to="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-navy hover:bg-cream"
          >
            <UserIcon size={15} className="text-navy-light" />
            Manage account
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-navy hover:bg-cream"
          >
            <LogOut size={15} className="text-navy-light" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
