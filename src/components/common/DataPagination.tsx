"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface DataPaginationProps {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}

export default function DataPagination({
  page,
  lastPage,
  total,
  perPage,
  onChange,
}: DataPaginationProps) {
  const tCommon = useTranslations("common");
  if (lastPage <= 1 || total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= lastPage; i++) {
    if (i === 1 || i === lastPage || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 px-1">
      <p className="text-sm text-gray-500">
        {tCommon("showingRange", { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-1 text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                "min-w-[32px] px-2 py-1 rounded-lg border text-sm font-semibold transition",
                p === page
                  ? "border-transparent text-white"
                  : "border-gray-200 hover:bg-gray-50"
              )}
              style={p === page ? { backgroundColor: "var(--color-primary)" } : {}}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= lastPage}
          className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
