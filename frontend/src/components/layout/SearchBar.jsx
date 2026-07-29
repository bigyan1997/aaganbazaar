import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getProducts } from "../../api/catalog";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

export default function SearchBar({ className = "", autoFocus = false, onSubmitted, trailingAction }) {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    setHighlighted(-1);
  }, [debounced]);

  const { data } = useQuery({
    queryKey: ["search-suggestions", debounced],
    queryFn: () => getProducts({ search: debounced, page_size: 5 }),
    enabled: debounced.trim().length >= MIN_CHARS,
    staleTime: 1000 * 30,
  });
  const suggestions = debounced.trim().length >= MIN_CHARS ? (data?.results ?? []) : [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const reset = () => {
    setOpen(false);
    setValue("");
    setDebounced("");
    onSubmitted?.();
  };

  const goToProduct = (product) => {
    reset();
    navigate(`/products/${product.slug}`);
  };

  const goToSearch = (term) => {
    reset();
    navigate(term.trim() ? `/products?search=${encodeURIComponent(term.trim())}` : "/products");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (highlighted >= 0 && suggestions[highlighted]) goToProduct(suggestions[highlighted]);
    else goToSearch(value);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex h-10 min-w-0 items-center rounded-full bg-white pl-4 pr-1"
      >
        <Search size={16} className="shrink-0 text-navy/40" />
        <input
          type="search"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => value.trim().length >= MIN_CHARS && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for products"
          className="ml-2 min-w-0 flex-1 border-none bg-transparent text-sm text-navy outline-none placeholder:text-navy/40"
        />
        {trailingAction}
        <button
          type="submit"
          aria-label="Search"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange text-white hover:bg-orange-dark"
        >
          <Search size={16} />
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-cream-dark bg-white shadow-lg">
          {suggestions.map((product, i) => (
            <button
              key={product.id}
              type="button"
              onClick={() => goToProduct(product)}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left ${
                i === highlighted ? "bg-cream" : "hover:bg-cream"
              }`}
            >
              {product.primary_image ? (
                <img
                  src={product.primary_image}
                  alt=""
                  loading="lazy"
                  className="h-9 w-9 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-cream text-navy/30">
                  <Search size={14} />
                </div>
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-navy">{product.name}</span>
              <span className="shrink-0 text-sm font-medium text-orange">
                Rs. {product.discount_percent ? product.sale_price : product.price}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => goToSearch(value)}
            className="block min-h-11 w-full border-t border-cream-dark px-3 py-2.5 text-left text-sm font-medium text-orange hover:bg-cream"
          >
            See all results for &quot;{value}&quot;
          </button>
        </div>
      )}
    </div>
  );
}
