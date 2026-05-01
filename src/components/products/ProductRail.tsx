"use client";

/**
 * ProductRail — matches Flutter's _ProductRail exactly.
 *
 * Mobile (xs/sm): horizontal scroll carousel
 *   height 280, cards 160px wide, square image (1:1), white card w/ rounded corners
 *   12px gap, 16px side padding, scroll-snap
 * Desktop (md+): standard ProductGrid
 */

import { Box, Skeleton } from "@mui/material";
import type { Product } from "@/lib/types";
import ProductRailCard from "./ProductRailCard";
import ProductGrid from "./ProductGrid";

interface ProductRailProps {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
}

const CARD_WIDTH = 160;
// Square image = 160px + text padding top+bottom 22px + name ~34px + rating ~18px + price ~22px ≈ 256px
// Flutter rail height is 290, use 280 to match
const RAIL_HEIGHT = 280;
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
            py: 0.5,
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            direction: "ltr",
            alignItems: "stretch",
          }}
        >
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: `0 0 ${CARD_WIDTH}px`,
                    height: RAIL_HEIGHT - 8,
                    scrollSnapAlign: "start",
                    borderRadius: "18px",
                    overflow: "hidden",
                    bgcolor: "white",
                    border: "1px solid #EDE7E9",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width={CARD_WIDTH}
                    height={CARD_WIDTH}
                    sx={{ flexShrink: 0 }}
                  />
                  <Box sx={{ p: "10px", display: "flex", flexDirection: "column", gap: 1 }}>
                    <Skeleton width="85%" height={14} />
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="50%" height={18} />
                  </Box>
                </Box>
              ))
            : products.map((product) => (
                <Box
                  key={product.id}
                  sx={{
                    flex: `0 0 ${CARD_WIDTH}px`,
                    scrollSnapAlign: "start",
                    /* Let the card fill the rail height */
                    alignSelf: "stretch",
                    overflow: "hidden",
                  }}
                >
                  <ProductRailCard product={product} />
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

