"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Box, Typography } from "@mui/material";
import type { Banner, Category } from "@/lib/types";

const SLIDE_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
];

interface Slide {
  key: string;
  image: string | null;
  title: string;
  subtitle: string;
  link: string;
}

interface MobileHeroCarouselProps {
  banners: Banner[];
  categories: Category[];
}

/**
 * Phone-resolution hero carousel that exactly mirrors the Flutter
 * HeroCarousel widget:
 *  - viewportFraction 0.92 (peek at next slide via horizontal padding)
 *  - borderRadius 20 on each card
 *  - bottom-aligned text: frosted subtitle pill + bold title
 *  - Animated dot indicators (active: primary colour 22×6, inactive: grey 6×6)
 *  - Auto-advances every 5 s; CSS scroll-snap + overflow-x gives native touch swipe
 *  - No arrow buttons
 */
export default function MobileHeroCarousel({
  banners,
  categories,
}: MobileHeroCarouselProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const bannerTitle = (b: Banner) =>
    (locale === "en" && b.title_en ? b.title_en : b.title) ?? "";
  const bannerSubtitle = (b: Banner) =>
    (locale === "en" && b.subtitle_en ? b.subtitle_en : b.subtitle) ?? "";
  const categoryName = (c: Category) =>
    locale === "en" && c.name_en ? c.name_en : c.name;

  const activeBanners = banners.filter((b) => b.is_active);
  const sliderBanners = activeBanners
    .filter((b) => b.position === "slider")
    .sort((a, b) => a.sort_order - b.sort_order);

  const slides: Slide[] =
    sliderBanners.length > 0
      ? sliderBanners.map((b) => ({
          key: `banner-${b.id}`,
          image: b.image,
          title: bannerTitle(b),
          subtitle: bannerSubtitle(b),
          link: b.link || `/${locale}/products`,
        }))
      : categories.slice(0, 5).map((c) => ({
          key: `cat-${c.id}`,
          image: c.image,
          title: categoryName(c),
          subtitle: "",
          link: `/${locale}/products?category_id=${c.id}`,
        }));

  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = slides.length;

  const scrollToSlide = useCallback(
    (idx: number) => {
      const el = scrollRef.current;
      if (!el || count === 0) return;

      const slide = el.children.item(idx) as HTMLElement | null;
      if (!slide) return;

      // Let the browser resolve RTL/LTR positioning; this matches Flutter's
      // PageView movement direction in Arabic without relying on scrollLeft math.
      slide.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    },
    [count]
  );

  const startAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count < 2) return;
    timerRef.current = setInterval(() => {
      setActiveIdx((i) => {
        const next = (i + 1) % count;
        scrollToSlide(next);
        return next;
      });
    }, 5000);
  }, [count, scrollToSlide]);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoplay]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || count === 0) return;

    const containerRect = el.getBoundingClientRect();
    const viewportCenter = containerRect.left + containerRect.width / 2;
    let nearestIdx = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(el.children).forEach((child, idx) => {
      const slide = child as HTMLElement;
      const rect = slide.getBoundingClientRect();
      const slideCenter = rect.left + rect.width / 2;
      const distance = Math.abs(slideCenter - viewportCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIdx = idx;
      }
    });

    setActiveIdx(nearestIdx);
    // restart autoplay after user interaction
    startAutoplay();
  };

  const handleDotClick = (idx: number) => {
    setActiveIdx(idx);
    scrollToSlide(idx);
    startAutoplay();
  };

  if (slides.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      {/*
       * Scroll container — force LTR so scroll-left math doesn't flip in RTL
       * locales. CSS scroll-snap gives native swipe on touch screens for free.
       */}
      <Box
        ref={scrollRef}
        dir={isRtl ? "rtl" : "ltr"}
        onScroll={handleScroll}
        sx={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          // horizontal padding creates the Flutter viewportFraction:0.92 peek
          px: "4%",
          gap: 1.5,
        }}
      >
        {slides.map((slide, i) => (
          <Box
            key={slide.key}
            component={Link}
            href={slide.link}
            sx={{
              flex: "0 0 92%",
              scrollSnapAlign: "center",
              height: 200,
              borderRadius: "20px",
              overflow: "hidden",
              position: "relative",
              display: "block",
              textDecoration: "none",
              background: SLIDE_GRADIENTS[i % SLIDE_GRADIENTS.length],
              flexShrink: 0,
              // subtle scale on active for depth
              transition: "transform 0.3s ease",
              transform: i === activeIdx ? "scale(1)" : "scale(0.97)",
            }}
          >
            {/* Image */}
            {slide.image && (
              <Box
                component="img"
                src={slide.image}
                alt={slide.title}
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}

            {/* Overlay — bottom-left → top-right as in Flutter HeroCarousel */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.10) 60%)",
              }}
            />

            {/* Text block — pinned to bottom-start */}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                p: 2.5,
                // respect locale text direction inside the card
                direction: locale === "ar" ? "rtl" : "ltr",
              }}
            >
              {slide.subtitle && (
                <Box
                  sx={{
                    display: "inline-flex",
                    px: 1.25,
                    py: 0.5,
                    mb: 1,
                    bgcolor: "rgba(255,255,255,0.22)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    borderRadius: 100,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      color: "white",
                      fontSize: "0.69rem",
                      fontWeight: 600,
                      lineHeight: 1.3,
                    }}
                  >
                    {slide.subtitle}
                  </Typography>
                </Box>
              )}
              <Typography
                sx={{
                  color: "white",
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  lineHeight: 1.2,
                  textShadow: "0 2px 8px rgba(0,0,0,0.35)",
                  display: "-webkit-box",
                  overflow: "hidden",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                }}
              >
                {slide.title}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Dot indicators — match Flutter's animated containers */}
      {count > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 0.75,
            mt: 1.5,
          }}
        >
          {slides.map((_, i) => (
            <Box
              key={i}
              onClick={() => handleDotClick(i)}
              sx={{
                height: 6,
                width: i === activeIdx ? 22 : 6,
                borderRadius: 3,
                bgcolor: i === activeIdx ? "primary.main" : "grey.300",
                cursor: "pointer",
                transition: "width 0.25s ease, background-color 0.25s ease",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
