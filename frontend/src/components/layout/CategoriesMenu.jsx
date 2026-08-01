import { useQuery } from "@tanstack/react-query";
import { Grid3x3, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getCategories } from "../../api/catalog";

// Rendered twice in Navbar: an icon-only trigger for the mobile row, and a
// labeled button for the desktop category strip. Each instance owns its own
// open/close state rather than sharing one, since they live in different
// parts of the DOM and a shared dropdown can't be positioned under both.
export default function CategoriesMenu({ variant = "icon" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!categories?.length) return null;

  return (
    <div ref={ref} className="relative">
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Browse categories"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-cream hover:bg-white/10 hover:text-white"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-h-11 items-center gap-2 rounded-lg bg-orange px-4 text-sm font-medium text-white hover:bg-orange-dark"
        >
          <Grid3x3 size={16} />
          Browse All Categories
        </button>
      )}
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border border-cream-dark bg-white py-1.5 shadow-lg">
          <Link
            to="/deals"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-sm font-medium text-orange hover:bg-cream"
          >
            Deals
          </Link>
          <Link
            to="/stores"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-sm font-medium text-navy hover:bg-cream"
          >
            Stores
          </Link>
          <div className="my-1 border-t border-cream-dark" />
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/products?category=${c.slug}`}
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2.5 text-sm text-navy hover:bg-cream"
            >
              {c.name}
            </Link>
          ))}
          <div className="my-1 border-t border-cream-dark" />
          <Link
            to="/categories"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-sm font-medium text-navy/70 hover:bg-cream"
          >
            View all categories →
          </Link>
        </div>
      )}
    </div>
  );
}
