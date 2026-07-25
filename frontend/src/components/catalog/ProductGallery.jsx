import { ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function ProductGallery({ images, productName }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images?.[activeIndex];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex aspect-square items-center justify-center rounded bg-cream">
        {active ? (
          <img
            src={active.image}
            alt={active.alt_text || productName}
            className="h-full w-full rounded object-cover"
          />
        ) : (
          <ShoppingBag size={40} className="text-navy/30" />
        )}
      </div>

      {images?.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 ${
                i === activeIndex ? "border-orange" : "border-transparent"
              }`}
            >
              <img src={image.image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
