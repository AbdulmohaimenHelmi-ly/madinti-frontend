"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid } from "lucide-react";
import CategoryCard from "@/components/categories/CategoryCard";
import { CategoryGridSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import type { Category } from "@/lib/types";
import { categoriesApi } from "@/lib/api/categories";

function SubTile({ category, isViewAll, href }: { category?: Category; isViewAll?: boolean; href: string }) {
  const locale = useLocale();
  const router = useRouter();
  const name = isViewAll ? "كل المنتجات" : locale === "en" && category?.name_en ? category.name_en : (category?.name ?? "");
  return (
    <div role="button" onClick={() => router.push(href)} className="flex flex-col items-center cursor-pointer rounded-[14px] active:opacity-70">
      <div className="w-full aspect-square rounded-[14px] overflow-hidden bg-[#F5F0F2] flex items-center justify-center">
        {isViewAll ? <LayoutGrid size={28} className="text-[#6B6B6B]" /> :
          category?.image ? <img src={category.image} alt={name} loading="lazy" className="w-full h-full object-cover block" /> :
          <LayoutGrid size={24} className="text-[#6B6B6B]" />}
      </div>
      <p className="mt-1.5 text-[0.72rem] font-semibold text-[#1A1A1A] leading-tight text-center line-clamp-2">{name}</p>
    </div>
  );
}

function MobileCategoriesLayout({ categories }: { categories: Category[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const selected = categories[selectedIdx] ?? categories[0];
  useEffect(() => { rightPaneRef.current?.scrollTo({ top: 0 }); }, [selectedIdx]);
  const children: Category[] = selected?.children ?? [];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px - 56px)" }}>
      <form className="mx-2 my-2 flex items-center bg-white rounded-[14px] border border-[#EDE7E9] px-3 shrink-0" onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) router.push(`/${locale}/products?search=${encodeURIComponent(searchQuery.trim())}`); }}>
        <Search size={18} className="text-[#6B6B6B] shrink-0" />
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("common.searchHint")} className="flex-1 py-2.5 px-2 text-sm bg-transparent focus:outline-none" />
      </form>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-26 shrink-0 bg-[#F5F0F2] overflow-y-auto scrollbar-none" style={{ width: 104 }}>
          {categories.map((cat, i) => {
            const active = i === selectedIdx;
            const name = locale === "en" && cat.name_en ? cat.name_en : cat.name;
            return (
              <div key={cat.id} role="button" onClick={() => setSelectedIdx(i)} className="flex items-center px-2.5 py-4 cursor-pointer transition-colors" style={{ background: active ? "white" : "transparent" }}>
                <div className="w-1 h-5 rounded shrink-0 mr-2 transition-colors" style={{ background: active ? "var(--color-primary)" : "transparent" }} />
                <p className={`text-[0.78rem] leading-tight line-clamp-2 transition-all ${active ? "font-extrabold text-[#1A1A1A]" : "font-medium text-[#6B6B6B]"}`}>{name}</p>
              </div>
            );
          })}
        </div>
        <div className="w-px bg-[#EDE7E9] shrink-0" />
        <div ref={rightPaneRef} className="flex-1 bg-white overflow-y-auto scrollbar-none p-4 pb-6">
          {selected?.image && (
            <div className="w-full mb-4 rounded-[14px] overflow-hidden relative" style={{ aspectRatio: "16/7" }}>
              <img src={selected.image} alt={locale === "en" && selected.name_en ? selected.name_en : selected.name} className="w-full h-full object-cover block" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(0,0,0,0.55), transparent)" }} />
              <p className="absolute bottom-2.5 start-3.5 text-white font-extrabold text-base">{locale === "en" && selected.name_en ? selected.name_en : selected.name}</p>
            </div>
          )}
          <p className="text-[0.94rem] font-extrabold text-[#1A1A1A] mb-3">{t("home.topCategories")}</p>
          <div className="grid grid-cols-3 gap-3">
            <SubTile isViewAll href={`/${locale}/products?category_id=${selected?.id}`} />
            {children.map((child) => <SubTile key={child.id} category={child} href={`/${locale}/products?category_id=${child.id}`} />)}
          </div>
          {children.filter((c) => (c.children?.length ?? 0) > 0).map((group) => (
            <div key={group.id} className="mt-6">
              <p className="text-[0.94rem] font-extrabold text-[#1A1A1A] mb-3">{locale === "en" && group.name_en ? group.name_en : group.name}</p>
              <div className="grid grid-cols-3 gap-3">
                <SubTile isViewAll href={`/${locale}/products?category_id=${group.id}`} />
                {(group.children ?? []).map((gc) => <SubTile key={gc.id} category={gc} href={`/${locale}/products?category_id=${gc.id}`} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopCategoriesLayout({ categories }: { categories: Category[] }) {
  const t = useTranslations();
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("category.allCategories")}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((cat) => <CategoryCard key={cat.id} category={cat} />)}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  useEffect(() => {
    categoriesApi.getTree().then((res) => setCategories(res.data.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <>
      <div className="md:hidden flex" style={{ height: "calc(100vh - 112px)" }}>
        <div className="bg-[#F5F0F2] shrink-0" style={{ width: 104 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-3.5 py-4"><div className="h-3 w-4/5 bg-gray-200 rounded animate-pulse" /></div>
          ))}
        </div>
        <div className="flex-1 p-4 grid grid-cols-3 gap-4 content-start">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i}>
              <div className="w-full aspect-square rounded-[14px] bg-gray-200 animate-pulse" />
              <div className="h-2.5 w-3/4 mx-auto mt-1.5 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="hidden md:block max-w-[1200px] mx-auto px-4 py-8"><CategoryGridSkeleton count={8} /></div>
    </>
  );

  if (categories.length === 0) return <EmptyState message={t("category.noCategories")} />;

  return (
    <>
      <div className="md:hidden"><MobileCategoriesLayout categories={categories} /></div>
      <div className="hidden md:block"><DesktopCategoriesLayout categories={categories} /></div>
    </>
  );
}
