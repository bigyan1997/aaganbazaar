import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getBanners } from "../../api/common";

const AUTO_ADVANCE_MS = 5000;

function isExternal(url) {
  return /^https?:\/\//i.test(url);
}

export default function BannerCarousel() {
  const { data: banners } = useQuery({ queryKey: ["banners"], queryFn: getBanners });
  const [index, setIndex] = useState(0);
  const hasBanners = banners?.length > 0;

  useEffect(() => {
    if (!hasBanners || banners.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [hasBanners, banners?.length]);

  if (!hasBanners) {
    // Static fallback - what shows before an admin has configured any
    // banners, so the homepage never looks broken out of the box.
    return (
      <div className="flex items-center justify-between rounded-2xl bg-cream-dark p-8">
        <div>
          <p className="mb-1.5 text-xl font-medium text-navy">किन्नुहोस् नेपाली</p>
          <p className="mb-3.5 text-sm text-navy-light">Every purchase supports a local seller</p>
          <Link
            to="/products"
            className="inline-block rounded-lg bg-orange px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-dark"
          >
            Start shopping ↗
          </Link>
        </div>
        <Store size={52} className="text-orange" strokeWidth={1.5} />
      </div>
    );
  }

  const banner = banners[index % banners.length];
  const image = <img src={banner.image} alt="" className="h-48 w-full rounded-2xl object-cover sm:h-64" />;

  return (
    <div className="relative">
      {banner.link_url ? (
        isExternal(banner.link_url) ? (
          <a href={banner.link_url} target="_blank" rel="noreferrer">
            {image}
          </a>
        ) : (
          <Link to={banner.link_url}>{image}</Link>
        )
      ) : (
        image
      )}

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            aria-label="Previous banner"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 hover:bg-white"
          >
            <ChevronLeft size={18} className="text-navy" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            aria-label="Next banner"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 hover:bg-white"
          >
            <ChevronRight size={18} className="text-navy" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-orange" : "bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
