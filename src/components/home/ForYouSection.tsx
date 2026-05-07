"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import ProductRail from "@/components/products/ProductRail";
import { productsApi } from "@/lib/api/products";
import { withProductContentType } from "@/lib/products/contentTypeLink";
import type { Product } from "@/lib/types";

interface ForYouSectionProps {
  contentType?: "male" | "female";
}

export default function ForYouSection({ contentType }: ForYouSectionProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [products, setProducts] = useState<Product[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const productsHref = withProductContentType(`/${locale}/products`, contentType);
  const requestKey = contentType ?? "__all__";
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    const params: Record<string, string | number> = { per_page: 12 };
    if (contentType) params.content_type = contentType;

    productsApi.getForYou(params)
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data.data ?? []);
        setLoadedKey(requestKey);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setLoadedKey(requestKey);
      });

    return () => { cancelled = true; };
  }, [contentType, requestKey]);

  if (!loading && products.length === 0) return null;

  return (
    <div className="mb-10 md:mb-20 px-4 md:px-10">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles size={20} style={{ color: "var(--color-primary)" }} />
            <span className="font-extrabold text-lg text-gray-900 leading-tight">{t("home.forYou")}</span>
          </div>
          <div className="w-9 h-[3px] rounded-sm mt-1.5 mb-1.5" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))" }} />
          <p className="text-xs text-gray-500 leading-snug">{t("home.forYouSubtitle")}</p>
        </div>
        <Link
          href={productsHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold no-underline transition-all duration-200 hover:text-white"
          style={{ color: "var(--color-primary)", ["--hover-bg" as string]: "var(--color-primary)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
        >
          {t("common.viewAll")}
          <ArrowIcon size={15} />
        </Link>
      </div>

      {loading ? (
        <ProductRail products={[]} loading skeletonCount={6} />
      ) : (
        <ProductRail products={products} />
      )}
    </div>
  );
}
