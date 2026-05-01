"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Box, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CategoryCard from "@/components/categories/CategoryCard";
import type { Category } from "@/lib/types";

interface CategoriesCarouselProps {
  categories: Category[];
}

const COLS = 8;
const ROWS = 2;
const PAGE_SIZE = COLS * ROWS; // 16

export default function CategoriesCarousel({ categories }: CategoriesCarouselProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [page, setPage] = useState(0);

  const pages = useMemo(() => {
    const chunks: Category[][] = [];
    for (let i = 0; i < categories.length; i += PAGE_SIZE) {
      chunks.push(categories.slice(i, i + PAGE_SIZE));
    }
    return chunks.length === 0 ? [[]] : chunks;
  }, [categories]);

  const pageCount = pages.length;
  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  const handlePrev = () => canPrev && setPage((p) => p - 1);
  const handleNext = () => canNext && setPage((p) => p + 1);

  if (categories.length === 0) return null;

  return (
    <>
      {/* ── MOBILE: horizontal-scroll strip matching Flutter's CategoryChip row ── */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          overflowX: "auto",
          gap: 2,
          px: 2,
          py: 1,
          mb: 3,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {categories.map((c) => (
          <Box key={c.id} sx={{ flexShrink: 0, scrollSnapAlign: "start" }}>
            <CategoryCard category={c} />
          </Box>
        ))}
      </Box>

      {/* ── DESKTOP: paginated grid ─────────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          position: "relative",
          mb: 8,
          px: 5,
          py: 2,
        }}
      >
        {/* Force LTR on the rail so the translate math is identical regardless
            of page direction. stylis-plugin-rtl otherwise flips translateX signs
            and hides the first page. */}
        <Box sx={{ overflow: "hidden", direction: "ltr" }}>
          <Box
            sx={{
              display: "flex",
              width: `${pageCount * 100}%`,
              transform: `translateX(-${(page * 100) / pageCount}%)`,
              transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {pages.map((chunk, idx) => (
              <Box
                key={idx}
                sx={{
                  flex: `0 0 ${100 / pageCount}%`,
                  display: "grid",
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                  gridAutoRows: "auto",
                  rowGap: 4,
                  columnGap: 2,
                  px: 1,
                  // Restore locale direction so child content reads correctly in Arabic.
                  direction: isRtl ? "rtl" : "ltr",
                }}
              >
                {chunk.map((c) => (
                  <Box key={c.id} sx={{ display: "flex", justifyContent: "center" }}>
                    <CategoryCard category={c} />
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        {pageCount > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              disabled={!canPrev}
              sx={{
                position: "absolute",
                top: "50%",
                left: 0,
                transform: "translateY(-50%)",
                bgcolor: "white",
                color: "text.primary",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                opacity: canPrev ? 1 : 0,
                pointerEvents: canPrev ? "auto" : "none",
                transition: "opacity 0.2s ease",
                "&:hover": { bgcolor: "white", boxShadow: "0 6px 20px rgba(0,0,0,0.22)" },
                zIndex: 2,
              }}
            >
              <ChevronLeftIcon sx={{ transform: isRtl ? "scaleX(-1)" : "none" }} />
            </IconButton>

            <IconButton
              onClick={handleNext}
              disabled={!canNext}
              sx={{
                position: "absolute",
                top: "50%",
                right: 0,
                transform: "translateY(-50%)",
                bgcolor: "white",
                color: "text.primary",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                opacity: canNext ? 1 : 0,
                pointerEvents: canNext ? "auto" : "none",
                transition: "opacity 0.2s ease",
                "&:hover": { bgcolor: "white", boxShadow: "0 6px 20px rgba(0,0,0,0.22)" },
                zIndex: 2,
              }}
            >
              <ChevronRightIcon sx={{ transform: isRtl ? "scaleX(-1)" : "none" }} />
            </IconButton>
          </>
        )}
      </Box>
    </>
  );
}
