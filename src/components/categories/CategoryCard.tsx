"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import type { Category } from "@/lib/types";
import { useContentFilter } from "@/lib/context/ContentFilterContext";
import { withProductContentType } from "@/lib/products/contentTypeLink";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const locale = useLocale();
  const { apiParam: contentType } = useContentFilter();
  const name = locale === "en" && category.name_en ? category.name_en : category.name;
  const href = withProductContentType(
    `/${locale}/products?category_id=${category.id}`,
    contentType
  );

  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-3 no-underline"
    >
      <div
        className="category-circle relative overflow-hidden rounded-full border-[3px] flex items-center justify-center bg-gray-50 transition-all duration-300 group-hover:-translate-y-1.5"
        style={{
          width: "clamp(80px, 10vw, 104px)",
          height: "clamp(80px, 10vw, 104px)",
          borderColor: "rgba(var(--color-primary-rgb, 0,121,107), 0.3)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {category.image ? (
          <img
            src={category.image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-110"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-400 group-hover:scale-110"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
            }}
          >
            <span className="text-white font-black text-4xl" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              {name[0]}
            </span>
          </div>
        )}
      </div>
      <p className="text-center text-[0.82rem] font-bold text-gray-800 max-w-[120px] leading-snug">
        {name}
      </p>
    </Link>
  );
}
