import { Scale, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import useCompareStore from "../../store/compareStore";

export default function CompareFloatingBar() {
  const slugs = useCompareStore((s) => s.slugs);
  const clear = useCompareStore((s) => s.clear);
  const location = useLocation();

  if (slugs.length === 0 || location.pathname === "/compare") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cream-dark bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-navy">
          <Scale size={16} className="text-orange" />
          {slugs.length} item{slugs.length === 1 ? "" : "s"} to compare
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-navy/60 hover:text-navy"
          >
            <X size={14} />
            Clear
          </button>
          <Link
            to="/compare"
            className="flex min-h-11 items-center rounded-lg bg-orange px-4 text-sm font-medium text-cream hover:opacity-90"
          >
            Compare
          </Link>
        </div>
      </div>
    </div>
  );
}
