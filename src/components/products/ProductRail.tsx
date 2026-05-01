"use client";

/**
 * ProductRail — matches Flutter's _ProductRail exactly.
 *
 * Mobile (xs/sm): horizontal scroll carousel
 *   height 290, cards 160px wide, 12px gap, 16px side padding, scroll-snap
 * Desktop (md+): standard ProductGrid
 */

import { Box, Skeleton } from "@mui/material";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import ProductGrid from "./ProductGrid";

interface ProductRailProps {
  products: Product[];
  loading?: boolean;
  /** How many skeleton cards to show while loading (mobile rail) */
  skeletonCount?: number;
}

const CARD_WIDTH = 160;
const RAIL_HEIGHT = 290;
const GAP = 12;

export default function ProductRail({
  products,
  loading = false,
  skeletonCount = 4,
}: ProductRailProps) {
  return (
    <>
      {/* ── MOBILE: horizontal scroll rail (xs/sm) ── */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            overflowX: "auto",
            overflowY: "hidden",
            height: RAIL_HEIGHT,
            gap: `${GAP}px`,
            px: 2,
            pb: 0.5,
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            /* hide scrollbar */
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            direction: "ltr",
          }}
        >
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: `0 0 ${CARD_WIDTH}px`,
                    height: RAIL_HEIGHT,
                    scrollSnapAlign: "start",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width={CARD_WIDTH}
                    height={RAIL_HEIGHT * 0.68}
                    sx={{ borderRadius: 2 }}
                  />
                  <Skeleton width="80%" sx={{ mt: 1 }} />
                  <Skeleton width="50%" />
                </Box>
              ))
            : products.map((product) => (
                <Box
                  key={product.id}
                  sx={{
                    flex: `0 0 ${CARD_WIDTH}px`,
                    height: RAIL_HEIGHT,
                    scrollSnapAlign: "start",
                  }}
                >
                  <ProductCard product={product} />
                </Box>
              ))}
        </Box>
      </Box>

      {/* ── DESKTOP: standard grid (md+) ── */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <ProductGrid products={products} />
      </Box>
    </>
  );
}
