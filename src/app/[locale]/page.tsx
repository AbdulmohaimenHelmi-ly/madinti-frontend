"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import ProductRail from "@/components/products/ProductRail";
import VendorCard from "@/components/vendors/VendorCard";
import { HomePageSkeleton } from "@/components/common/Skeletons";
import HeroMosaic from "@/components/home/HeroMosaic";
import MobileHeroCarousel from "@/components/home/MobileHeroCarousel";
import CategoriesCarousel from "@/components/home/CategoriesCarousel";
import ForYouSection from "@/components/home/ForYouSection";
import type { Product, Category, Vendor, Brand, Banner } from "@/lib/types";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { vendorsApi } from "@/lib/api/vendors";
import { brandsApi } from "@/lib/api/brands";
import { bannersApi } from "@/lib/api/banners";
import { useContentFilter } from "@/lib/context/ContentFilterContext";
import { withProductContentType } from "@/lib/products/contentTypeLink";

function SectionHeader({ title, linkText, linkHref, isRtl }: { title: string; linkText: string; linkHref: string; isRtl: boolean }) {
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  return (
    <div className="flex justify-between items-start mb-6 md:mb-8">
      <div>
        <h2 className="text-lg md:text-2xl font-extrabold text-gray-900">{title}</h2>
        <div className="w-9 h-[3px] rounded-sm mt-1.5" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))" }} />
      </div>
      <Link href={linkHref}
        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold no-underline transition-all"
        style={{ color: "var(--color-primary)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
      >
        {linkText} <ArrowIcon size={14} />
      </Link>
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const { apiParam: contentType } = useContentFilter();
  const productsHref = withProductContentType(`/${locale}/products`, contentType);
  const requestKey = contentType ?? "__all__";
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    const baseParams: Record<string, string | number> = {};
    if (contentType) baseParams.content_type = contentType;

    Promise.all([
      productsApi.getFeatured(baseParams).catch(() => ({ data: { data: [] } })),
      categoriesApi.getAll(baseParams).catch(() => ({ data: { data: [] } })),
      vendorsApi.getAll({ per_page: 4 }).catch(() => ({ data: { data: [] } })),
      brandsApi.getAll({ is_featured: 1, per_page: 6, ...baseParams }).catch(() => ({ data: { data: [] } })),
      bannersApi.getAll({ is_active: 1, ...baseParams }).catch(() => ({ data: { data: [] } })),
    ]).then(([featuredRes, categoriesRes, vendorsRes, brandsRes, bannersRes]) => {
      if (cancelled) return;
      setFeatured(featuredRes.data.data);
      setCategories(categoriesRes.data.data);
      setVendors(vendorsRes.data.data);
      setBrands(brandsRes.data.data);
      setBanners(bannersRes.data.data);
      setLoadedKey(requestKey);
    });

    return () => { cancelled = true; };
  }, [contentType, requestKey]);

  if (loading) return <HomePageSkeleton />;

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-3 md:pt-4">
      {/* Mobile search bar */}
      <form action={`/${locale}/products`} method="get" className="md:hidden mt-2 mb-3">
        {contentType && <input type="hidden" name="content_type" value={contentType} />}
        <div className="flex items-center bg-white rounded-2xl border border-[#EDE7E9] px-3.5">
          <Search size={22} className="text-[#6B6B6B] shrink-0" />
          <input name="search" placeholder={t("common.searchHint")} aria-label={t("common.search")}
            className="flex-1 py-3.5 px-2.5 text-[0.844rem] text-gray-900 bg-transparent focus:outline-none placeholder:text-[#6B6B6B]" />
          <Link href={productsHref} aria-label={t("common.filter")} className="p-2 text-[#6B6B6B] -me-2">
            <SlidersHorizontal size={20} />
          </Link>
        </div>
      </form>

      {(categories.length > 0 || banners.length > 0) && (
        <>
          <div className="md:hidden"><MobileHeroCarousel banners={banners} categories={categories} /></div>
          <div className="hidden md:block"><HeroMosaic categories={categories} brands={brands} banners={banners} /></div>
        </>
      )}

      {categories.length > 0 && (
        <div>
          <div className="mb-1">
            <h2 className="text-lg md:text-2xl font-extrabold text-gray-900">{t("home.topCategories")}</h2>
            <div className="w-9 h-[3px] rounded-sm mt-1.5" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))" }} />
          </div>
          <CategoriesCarousel categories={categories} />
        </div>
      )}

      {featured.length > 0 && (
        <div className="mb-10 md:mb-20">
          <SectionHeader title={t("home.featuredProducts")} linkText={t("common.viewAll")} linkHref={productsHref} isRtl={isRtl} />
          <ProductRail products={featured.slice(0, 8)} />
        </div>
      )}

      <ForYouSection contentType={contentType ?? undefined} />

      {vendors.length > 0 && (
        <div className="mb-10 md:mb-20">
          <SectionHeader title={t("home.topVendors")} linkText={t("common.viewAll")} linkHref={`/${locale}/vendors`} isRtl={isRtl} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {vendors.slice(0, 4).map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
          </div>
        </div>
      )}
    </div>
  );
}
