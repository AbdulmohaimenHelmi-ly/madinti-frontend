"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { Banner, Category } from "@/lib/types";
import { useContentFilter } from "@/lib/context/ContentFilterContext";
import { withProductContentType } from "@/lib/products/contentTypeLink";

const SLIDE_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
];

interface Slide { key: string; image: string | null; title: string; subtitle: string; link: string; }

interface MobileHeroCarouselProps {
  banners: Banner[];
  categories: Category[];
}

export default function MobileHeroCarousel({ banners, categories }: MobileHeroCarouselProps) {
  const locale = useLocale();
  const { apiParam: contentType } = useContentFilter();
  const isRtl = locale === "ar";

  const bannerTitle = (b: Banner) => (locale === "en" && b.title_en ? b.title_en : b.title) ?? "";
  const bannerSubtitle = (b: Banner) => (locale === "en" && b.subtitle_en ? b.subtitle_en : b.subtitle) ?? "";
  const categoryName = (c: Category) => locale === "en" && c.name_en ? c.name_en : c.name;

  const activeBanners = banners.filter((b) => b.is_active);
  const sliderBanners = activeBanners.filter((b) => b.position === "slider").sort((a, b) => a.sort_order - b.sort_order);

  const slides: Slide[] = sliderBanners.length > 0
    ? sliderBanners.map((b) => ({ key: `banner-${b.id}`, image: b.image, title: bannerTitle(b), subtitle: bannerSubtitle(b), link: withProductContentType(b.link || `/${locale}/products`, contentType) }))
    : categories.slice(0, 5).map((c) => ({ key: `cat-${c.id}`, image: c.image, title: categoryName(c), subtitle: "", link: withProductContentType(`/${locale}/products?category_id=${c.id}`, contentType) }));

  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = slides.length;

  const scrollToSlide = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el || count === 0) return;
    const slide = el.children.item(idx) as HTMLElement | null;
    if (!slide) return;
    const targetLeft = Math.max(0, Math.min(slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2, el.scrollWidth - el.clientWidth));
    el.scrollTo({ left: targetLeft, behavior: "smooth" });
  }, [count]);

  const startAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count < 2) return;
    timerRef.current = setInterval(() => {
      setActiveIdx((i) => { const next = (i + 1) % count; scrollToSlide(next); return next; });
    }, 5000);
  }, [count, scrollToSlide]);

  useEffect(() => { startAutoplay(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [startAutoplay]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || count === 0) return;
    const containerRect = el.getBoundingClientRect();
    const viewportCenter = containerRect.left + containerRect.width / 2;
    let nearestIdx = 0, nearestDistance = Number.POSITIVE_INFINITY;
    Array.from(el.children).forEach((child, idx) => {
      const rect = (child as HTMLElement).getBoundingClientRect();
      const d = Math.abs(rect.left + rect.width / 2 - viewportCenter);
      if (d < nearestDistance) { nearestDistance = d; nearestIdx = idx; }
    });
    setActiveIdx(nearestIdx);
    startAutoplay();
  };

  const handleDotClick = (idx: number) => { setActiveIdx(idx); scrollToSlide(idx); startAutoplay(); };

  if (slides.length === 0) return null;

  return (
    <div className="mb-4">
      <div ref={scrollRef} dir="ltr" onScroll={handleScroll}
        className="flex overflow-x-auto [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden gap-3 px-[4%]">
        {slides.map((slide, i) => (
          <Link key={slide.key} href={slide.link}
            className="shrink-0 no-underline relative block rounded-[20px] overflow-hidden [scroll-snap-align:center] transition-transform duration-300"
            style={{ flex: "0 0 92%", height: 200, background: SLIDE_GRADIENTS[i % SLIDE_GRADIENTS.length], transform: i === activeIdx ? "scale(1)" : "scale(0.97)" }}>
            {slide.image && <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.10) 60%)" }} />
            <div dir={isRtl ? "rtl" : "ltr"} className="absolute bottom-0 start-0 end-0 p-5 flex flex-col items-start">
              {slide.subtitle && (
                <span className="inline-flex px-3 py-1 mb-2 rounded-full text-white text-[0.69rem] font-semibold leading-snug" style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.35)" }}>
                  {slide.subtitle}
                </span>
              )}
              <p className="text-white text-[1.35rem] font-extrabold leading-tight text-start drop-shadow-md line-clamp-2 w-full">{slide.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {count > 1 && (
        <div className="flex justify-center items-center gap-2 mt-3">
          {slides.map((_, i) => (
            <button key={i} type="button" onClick={() => handleDotClick(i)} className="h-1.5 rounded-full cursor-pointer transition-all duration-300"
              style={{ width: i === activeIdx ? 22 : 6, background: i === activeIdx ? "var(--color-primary)" : "#D1D5DB" }} />
          ))}
        </div>
      )}
    </div>
  );
}
