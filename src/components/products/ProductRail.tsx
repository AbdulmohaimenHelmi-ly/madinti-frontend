"use client";

import { useLocale } from "next-intl";
import type { Product } from "@/lib/types";
import ProductRailCard from "./ProductRailCard";
import ProductGrid from "./ProductGrid";

interface ProductRailProps {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
}

const CARD_WIDTH = 160;
const RAIL_HEIGHT = 280;
const GAP = 12;

export default function ProductRail({
  products,
  loading = false,
  skeletonCount = 4,
}: ProductRailProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <>
      {/* Mobile: horizontal scroll rail */}
      <div className="block md:hidden">
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="flex flex-row overflow-x-auto overflow-y-hidden"
          style={{
            height: RAIL_HEIGHT,
            gap: GAP,
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 4,
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 rounded-[18px] bg-gray-200 animate-pulse border border-[#EDE7E9]"
                  style={{ flex: `0 0 ${CARD_WIDTH}px`, height: RAIL_HEIGHT - 8, scrollSnapAlign: "start" }}
                />
              ))
            : products.map((product) => (
                <div
                  key={product.id}
                  className="shrink-0 overflow-hidden"
                  style={{ flex: `0 0 ${CARD_WIDTH}px`, scrollSnapAlign: "start", alignSelf: "stretch" }}
                >
                  <ProductRailCard product={product} />
                </div>
              ))}
        </div>
      </div>

      {/* Desktop: standard grid */}
      <div className="hidden md:block">
        <ProductGrid products={products} />
      </div>
    </>
  );
}
