"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, Layers } from "lucide-react";
import type { Banner, BannerPosition, Brand, Category, ContentType } from "@/lib/types";
import { useContentFilter } from "@/lib/context/ContentFilterContext";
import { withProductContentType } from "@/lib/products/contentTypeLink";

interface HeroMosaicProps {
  categories: Category[];
  brands: Brand[];
  banners: Banner[];
}

const SLIDE_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
];

const SIDE_TILE_LABELS_EN = ["Hot Sellers", "New Arrivals", "Better Picks"];
const SIDE_TILE_LABELS_AR = ["الأكثر مبيعاً", "وصل حديثاً", "أفضل الاختيارات"];

interface Slide {
  key: string;
  image: string | null;
  title: string;
  subtitle: string;
  link: string;
}

interface Tile {
  key: string;
  image: string | null;
  label: string;
  title: string;
  href: string;
  contentType?: ContentType;
}

export default function HeroMosaic({ categories, brands, banners }: HeroMosaicProps) {
  const locale = useLocale();
  const t = useTranslations();
  const { apiParam: contentType } = useContentFilter();
  const isRtl = locale === "ar";
  const sideLabels = isRtl ? SIDE_TILE_LABELS_AR : SIDE_TILE_LABELS_EN;

  const categoryName = (c: Category) => locale === "en" && c.name_en ? c.name_en : c.name;
  const brandName = (b: Brand) => locale === "en" && b.name_en ? b.name_en : b.name;
  const bannerTitle = (b: Banner) => (locale === "en" && b.title_en ? b.title_en : b.title) ?? "";
  const bannerSubtitle = (b: Banner) => (locale === "en" && b.subtitle_en ? b.subtitle_en : b.subtitle) ?? "";

  const activeBanners = banners.filter((b) => b.is_active);
  const sliderBanners = activeBanners.filter((b) => b.position === "slider").sort((a, b) => a.sort_order - b.sort_order);

  const slotBanner = (position: BannerPosition): Banner | null => {
    const list = activeBanners.filter((b) => b.position === position).sort((a, b) => a.sort_order - b.sort_order);
    return list[0] ?? null;
  };

  const slides: Slide[] = sliderBanners.length > 0
    ? sliderBanners.map((b) => ({ key: `banner-${b.id}`, image: b.image, title: bannerTitle(b), subtitle: bannerSubtitle(b) || t("home.heroSubtitle"), link: withProductContentType(b.link || `/${locale}/products`, contentType) }))
    : categories.slice(0, 5).map((c) => ({ key: `cat-${c.id}`, image: c.image, title: categoryName(c), subtitle: t("home.heroSubtitle"), link: withProductContentType(`/${locale}/products?category_id=${c.id}`, contentType) }));

  const mkPromoTile = (pos: BannerPosition, i: number, fallbackCategories: Category[], label: string): Tile => {
    const b = slotBanner(pos);
    if (b) return { key: `promo-${b.id}`, image: b.image, label: bannerSubtitle(b) || label, title: bannerTitle(b) || label, href: withProductContentType(b.link || `/${locale}/products`, contentType) };
    const c = fallbackCategories[i];
    if (c) return { key: `cat-${c.id}`, image: c.image, label, title: categoryName(c), href: withProductContentType(`/${locale}/products?category_id=${c.id}`, contentType) };
    return { key: `ph-left-${i}`, image: null, label, title: label, href: withProductContentType(`/${locale}/products`, contentType) };
  };

  const mkBrandTile = (pos: BannerPosition, i: number): Tile => {
    const b = slotBanner(pos);
    if (b) return { key: `brand-b-${b.id}`, image: b.image, label: bannerSubtitle(b) || t("home.featuredBrand"), title: bannerTitle(b) || "", href: withProductContentType(b.link || `/${locale}/products`, contentType) };
    const brand = brands[i];
    if (brand) return { key: `brand-${brand.id}`, image: brand.logo, label: t("home.featuredBrand"), title: brandName(brand), href: withProductContentType(`/${locale}/products?brand=${brand.id}`, contentType) };
    const c = categories[i + 3];
    if (c) return { key: `cat-r-${c.id}`, image: c.image, label: sideLabels[i] ?? "", title: categoryName(c), href: withProductContentType(`/${locale}/products?category_id=${c.id}`, contentType) };
    return { key: `ph-right-${i}`, image: null, label: sideLabels[i] ?? "", title: sideLabels[i] ?? "", href: withProductContentType(`/${locale}/products`, contentType) };
  };

  const leftTiles = (["left_1", "left_2", "left_3"] as BannerPosition[]).map((pos, i) => mkPromoTile(pos, i, categories, sideLabels[i] ?? ""));
  const rightTiles = (["right_1", "right_2", "right_3"] as BannerPosition[]).map((pos, i) => mkBrandTile(pos, i));

  const [active, setActive] = useState(0);
  const count = Math.max(slides.length, 1);

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % count), 5000);
    return () => clearInterval(id);
  }, [count]);

  const handlePrev = () => setActive((i) => (i - 1 + count) % count);
  const handleNext = () => setActive((i) => (i + 1) % count);

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const TileImage = ({ image, title, gradient }: { image: string | null; title: string; gradient: string }) => (
    <>
      {image
        ? <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/tile:scale-[1.06]" />
        : <div className="absolute inset-0" style={{ background: gradient }} />}
    </>
  );

  const PromoTile = ({ tile, gradient }: { tile: Tile; gradient: string }) => (
    <Link href={tile.href} className="group/tile relative block rounded-lg overflow-hidden bg-gray-100 text-white h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl no-underline" style={{ minHeight: "clamp(64px, 16vw, 90px)" }}>
      <TileImage image={tile.image} title={tile.title} gradient={gradient} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.62) 42%, rgba(0,0,0,0.18) 74%, rgba(0,0,0,0) 100%)" }} />
      <div className="relative z-10 flex items-center h-full px-4 md:px-5 max-w-[74%] md:max-w-[66%]">
        <span className="font-extrabold leading-none text-[0.95rem] md:text-[0.96rem] drop-shadow-md">{tile.title}</span>
      </div>
    </Link>
  );

  const BrandTile = ({ tile, gradient }: { tile: Tile; gradient: string }) => (
    <Link href={tile.href} className="group/tile relative flex items-center justify-center text-center rounded-lg overflow-hidden bg-gray-100 text-white h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl no-underline px-3 md:px-4" style={{ minHeight: "clamp(64px, 16vw, 90px)" }}>
      <TileImage image={tile.image} title={tile.title} gradient={gradient} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.24) 100%)" }} />
      <span className="relative z-10 font-extrabold leading-none text-[1rem] md:text-[1.18rem] drop-shadow-md" style={{ letterSpacing: locale === "en" ? "0.14em" : 0, textTransform: locale === "en" ? "uppercase" : "none" }}>{tile.title}</span>
    </Link>
  );

  return (
    <div className="mb-4 md:mb-5">
      <div className="mx-0 md:mx-[clamp(24px,2.8vw,48px)] grid gap-3 md:gap-[clamp(10px,1.15vw,16px)]"
        style={{ gridTemplateColumns: "1fr", alignItems: "stretch" }}>
        <div className="md:hidden flex overflow-hidden">
          {/* Mobile: slider only */}
          <div className="relative w-full rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: "16/10", minHeight: "clamp(240px, 58vw, 340px)" }}>
            {slides.map((slide, i) => {
              const isActive = i === active;
              return (
                <div key={slide.key} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: isActive ? 1 : 0, background: SLIDE_GRADIENTS[i % SLIDE_GRADIENTS.length] }}>
                  {slide.image && <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0.14) 34%, rgba(0,0,0,0) 72%)" }} />
                  <div className={`relative z-10 flex flex-col justify-center h-full p-6 max-w-[80%] text-white ${isRtl ? "text-right" : "text-left"}`}>
                    <p className="text-[0.7rem] font-bold tracking-[0.15em] uppercase opacity-90 mb-2">{t("home.featuredCollection")}</p>
                    <h2 className="text-[1.8rem] font-black leading-[1.05] drop-shadow-lg mb-3 line-clamp-2">{slide.title}</h2>
                    <Link href={slide.link} className="inline-flex items-center gap-1.5 bg-white text-gray-900 font-bold rounded-full px-6 py-2.5 text-[0.95rem] no-underline hover:shadow-xl transition">
                      {t("home.shopNow")} <ArrowIcon size={15} />
                    </Link>
                  </div>
                </div>
              );
            })}

            {count > 1 && (
              <>
                <button type="button" onClick={isRtl ? handleNext : handlePrev} className="absolute top-1/2 start-2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-gray-900 shadow-lg hover:bg-white transition">
                  {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
                <button type="button" onClick={isRtl ? handlePrev : handleNext} className="absolute top-1/2 end-2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-gray-900 shadow-lg hover:bg-white transition">
                  {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {slides.map((_, i) => (
                    <button key={i} type="button" onClick={() => setActive(i)} className="h-2 rounded-full cursor-pointer transition-all duration-300"
                      style={{ width: i === active ? 24 : 8, background: i === active ? "white" : "rgba(255,255,255,0.55)" }} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Desktop: 3-col mosaic */}
        <div className="hidden md:grid gap-[clamp(10px,1.15vw,16px)]" style={{ gridTemplateColumns: "21.9% minmax(0,1fr) 21.9%", aspectRatio: "923/188" }}>
          {/* Left column */}
          <div className="grid gap-[clamp(10px,1.15vw,16px)]" style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr))" }}>
            {leftTiles.map((tile, i) => <PromoTile key={tile.key} tile={tile} gradient={SLIDE_GRADIENTS[i % SLIDE_GRADIENTS.length]} />)}
          </div>

          {/* Center slider */}
          <div className="relative rounded-lg overflow-hidden bg-gray-100 h-full">
            {slides.map((slide, i) => {
              const isActive = i === active;
              return (
                <div key={slide.key} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: isActive ? 1 : 0, background: SLIDE_GRADIENTS[i % SLIDE_GRADIENTS.length] }}>
                  {slide.image && <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0.14) 34%, rgba(0,0,0,0) 72%)" }} />
                  <div className={`relative z-10 flex flex-col justify-center h-full px-5 py-4 max-w-[46%] text-white ${isRtl ? "text-right" : "text-left"}`}>
                    <p className="text-[0.58rem] font-bold tracking-[0.15em] uppercase opacity-90 mb-0.5">{t("home.featuredCollection")}</p>
                    <h2 className="text-[1.9rem] font-black leading-[1.05] drop-shadow-lg mb-1.5 line-clamp-2">{slide.title}</h2>
                    <Link href={slide.link} className="inline-flex items-center gap-1 bg-white text-gray-900 font-bold rounded-full px-4 py-1.5 text-[0.8rem] no-underline hover:shadow-xl transition w-fit">
                      {t("home.shopNow")} <ArrowIcon size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
            {count > 1 && (
              <>
                <button type="button" onClick={isRtl ? handleNext : handlePrev} className="absolute top-1/2 start-2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-md hover:bg-white transition">
                  {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
                <button type="button" onClick={isRtl ? handlePrev : handleNext} className="absolute top-1/2 end-2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-md hover:bg-white transition">
                  {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {slides.map((_, i) => (
                    <button key={i} type="button" onClick={() => setActive(i)} className="h-2 rounded-full transition-all duration-300"
                      style={{ width: i === active ? 24 : 8, background: i === active ? "white" : "rgba(255,255,255,0.55)" }} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right column */}
          <div className="grid gap-[clamp(10px,1.15vw,16px)]" style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr))" }}>
            {rightTiles.map((tile, i) => <BrandTile key={tile.key} tile={tile} gradient={SLIDE_GRADIENTS[(i + 2) % SLIDE_GRADIENTS.length]} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
