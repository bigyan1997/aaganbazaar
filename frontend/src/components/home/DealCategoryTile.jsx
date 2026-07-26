import { Tag } from "lucide-react";
import { Link } from "react-router-dom";

export default function DealCategoryTile({ category }) {
  return (
    <Link
      to={`/deals/${category.slug}`}
      className="overflow-hidden rounded-xl border border-cream-dark bg-white/60 transition hover:shadow-md"
    >
      <div className="flex h-24 items-center justify-center bg-cream">
        {category.image ? (
          <img src={category.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Tag size={22} className="text-orange" strokeWidth={1.75} />
        )}
      </div>
      <div className="p-2.5">
        <p className="mb-1 line-clamp-1 text-xs font-medium text-navy">{category.name}</p>
        <p className="text-[11px] text-orange">Up to {category.max_discount_percent}% off</p>
        <p className="text-[10px] text-text-muted">
          {category.deal_count} {category.deal_count === 1 ? "item" : "items"}
        </p>
      </div>
    </Link>
  );
}
