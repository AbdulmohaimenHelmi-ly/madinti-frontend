"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CategoryCard from "@/components/categories/CategoryCard";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoriesCarouselProps {
  categories: Category[];
}

const COLS = 8;
const ROWS = 2;
const PAGE_SIZE = COLS * ROWS;

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

  if (categories.length === 0) return null;

  return (
    <>
      {/* Mobile: horizontal scroll */}
      <div className="md:hidden flex overflow-x-auto gap-4 px-4 py-2 mb-6 scroll-smooth [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <div key={c.id} className="shrink-0 [scroll-snap-align:start]">
            <CategoryCard category={c} />
          </div>
        ))}
      </div>

      {/* Desktop: paginated grid */}
      <div className="hidden md:block relative mb-16 px-10 py-4">
        <div className="overflow-hidden" dir="ltr">
          <div
            className="flex transition-transform duration-[450ms] cubic-bezier-[0.4,0,0.2,1]"
            style={{
              width: `${pageCount * 100}%`,
              transform: `translateX(-${(page * 100) / pageCount}%)`,
            }}
          >
            {pages.map((chunk, idx) => (
              <div
                key={idx}
                className="px-1"
                style={{
                  flex: `0 0 ${100 / pageCount}%`,
                  display: "grid",
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                  rowGap: "1rem",
                  columnGap: "0.5rem",
                  direction: isRtl ? "rtl" : "ltr",
                }}
              >
                {chunk.map((c) => (
                  <div key={c.id} className="flex justify-center">
                    <CategoryCard category={c} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {pageCount > 1 && (
          <>
            <button
              type="button"
              onClick={() => canPrev && setPage((p) => p - 1)}
              disabled={!canPrev}
              className={cn(
                "absolute top-1/2 start-0 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-200",
                canPrev ? "opacity-100 hover:shadow-xl" : "opacity-0 pointer-events-none"
              )}
            >
              <ChevronLeft size={20} className={isRtl ? "scale-x-[-1]" : ""} />
            </button>
            <button
              type="button"
              onClick={() => canNext && setPage((p) => p + 1)}
              disabled={!canNext}
              className={cn(
                "absolute top-1/2 end-0 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-200",
                canNext ? "opacity-100 hover:shadow-xl" : "opacity-0 pointer-events-none"
              )}
            >
              <ChevronRight size={20} className={isRtl ? "scale-x-[-1]" : ""} />
            </button>
          </>
        )}
      </div>
    </>
  );
}
