"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Box, Typography, IconButton, Button } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import type { Banner, BannerPosition, Brand, Category, ContentType } from "@/lib/types";

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
  contentType?: ContentType;
}

interface Tile {
  key: string;
  image: string | null;
  label: string;
  title: string;
  href: string;
  contentType?: ContentType;
}

export default function HeroMosaic({
  categories,
  brands,
  banners,
}: HeroMosaicProps) {
  const locale = useLocale();
  const t = useTranslations();
  const isRtl = locale === "ar";
  const sideLabels = isRtl ? SIDE_TILE_LABELS_AR : SIDE_TILE_LABELS_EN;

  const categoryName = (c: Category) =>
    locale === "en" && c.name_en ? c.name_en : c.name;
  const brandName = (b: Brand) =>
    locale === "en" && b.name_en ? b.name_en : b.name;
  const bannerTitle = (b: Banner) =>
    (locale === "en" && b.title_en ? b.title_en : b.title) ?? "";
  const bannerSubtitle = (b: Banner) =>
    (locale === "en" && b.subtitle_en ? b.subtitle_en : b.subtitle) ?? "";

  const activeBanners = banners.filter((b) => b.is_active);
  const sliderBanners = activeBanners
    .filter((b) => b.position === "slider")
    .sort((a, b) => a.sort_order - b.sort_order);

  const slotBanner = (position: BannerPosition): Banner | null => {
    const list = activeBanners
      .filter((b) => b.position === position)
      .sort((a, b) => a.sort_order - b.sort_order);
    return list[0] ?? null;
  };

  // Slides: CMS slider banners if any, else fallback to first 5 categories.
  const allSlides: Slide[] =
    sliderBanners.length > 0
      ? sliderBanners.map((b) => ({
          key: `banner-${b.id}`,
          image: b.image,
          title: bannerTitle(b),
          subtitle: bannerSubtitle(b) || t("home.heroSubtitle"),
          link: b.link || `/${locale}/products`,
          contentType: b.content_type,
        }))
      : categories.slice(0, 5).map((c) => ({
          key: `cat-${c.id}`,
          image: c.image,
          title: categoryName(c),
          subtitle: t("home.heroSubtitle"),
          link: `/${locale}/categories/${c.id}`,
          contentType: c.content_type,
        }));

  const leftPositions: BannerPosition[] = ["left_1", "left_2", "left_3"];
  const rightPositions: BannerPosition[] = ["right_1", "right_2", "right_3"];

  const leftTilesAll: Tile[] = leftPositions.map((pos, i) => {
    const b = slotBanner(pos);
    if (b) {
      return {
        key: `l-b-${b.id}`,
        image: b.image,
        label: bannerSubtitle(b) || sideLabels[i] || "",
        title: bannerTitle(b) || sideLabels[i] || "",
        href: b.link || `/${locale}/products`,
        contentType: b.content_type,
      };
    }
    const c = categories[i];
    if (!c) {
      return {
        key: `l-ph-${i}`,
        image: null,
        label: sideLabels[i] ?? "",
        title: sideLabels[i] ?? "",
        href: `/${locale}/products`,
      };
    }
    return {
      key: `l-c-${c.id}`,
      image: c.image,
      label: sideLabels[i] ?? "",
      title: categoryName(c),
      href: `/${locale}/categories/${c.id}`,
      contentType: c.content_type,
    };
  });

  const rightTilesAll: Tile[] = rightPositions.map((pos, i) => {
    const b = slotBanner(pos);
    if (b) {
      return {
        key: `r-b-${b.id}`,
        image: b.image,
        label: bannerSubtitle(b) || t("home.featuredBrand"),
        title: bannerTitle(b) || "",
        href: b.link || `/${locale}/products`,
        contentType: b.content_type,
      };
    }
    const brand = brands[i];
    if (brand) {
      return {
        key: `r-brand-${brand.id}`,
        image: brand.logo,
        label: t("home.featuredBrand"),
        title: brandName(brand),
        href: `/${locale}/products?brand=${brand.id}`,
        contentType: brand.content_type,
      };
    }
    const c = categories[i + 3];
    if (c) {
      return {
        key: `r-c-${c.id}`,
        image: c.image,
        label: sideLabels[i] ?? "",
        title: categoryName(c),
        href: `/${locale}/categories/${c.id}`,
        contentType: c.content_type,
      };
    }
    return {
      key: `r-ph-${i}`,
      image: null,
      label: sideLabels[i] ?? "",
      title: sideLabels[i] ?? "",
      href: `/${locale}/products`,
    };
  });

  const slides = allSlides;
  const leftTiles = leftTilesAll;
  const rightTiles = rightTilesAll;

  const [active, setActive] = useState(0);
  const slidesCount = Math.max(slides.length, 1);

  useEffect(() => {
    if (slidesCount < 2) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % slidesCount);
    }, 5000);
    return () => clearInterval(id);
  }, [slidesCount]);

  const handlePrev = () =>
    setActive((i) => (i - 1 + slidesCount) % slidesCount);
  const handleNext = () => setActive((i) => (i + 1) % slidesCount);

  const TileBase = ({ tile, gradient }: { tile: Tile; gradient: string }) => (
    <Box
      component={Link}
      href={tile.href}
      sx={{
        position: "relative",
        display: "block",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "grey.100",
        textDecoration: "none",
        color: "white",
        height: "100%",
        minHeight: 0,
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
          "& .tile-img": { transform: "scale(1.06)" },
        },
      }}
    >
      {tile.image ? (
        <Box
          className="tile-img"
          component="img"
          src={tile.image}
          alt={tile.title}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.5s ease",
          }}
        />
      ) : (
        <Box sx={{ position: "absolute", inset: 0, background: gradient }} />
      )}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          p: { xs: 1.25, md: 2 },
          zIndex: 1,
        }}
      >
        {tile.label && (
          <Typography
            variant="caption"
            sx={{
              display: "inline-block",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              bgcolor: "rgba(255,255,255,0.92)",
              color: "text.primary",
              px: 1,
              py: 0.25,
              borderRadius: 1,
              mb: 0.75,
              fontSize: "0.65rem",
            }}
          >
            {tile.label}
          </Typography>
        )}
        <Typography
          sx={{
            fontWeight: 800,
            lineHeight: 1.15,
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {tile.title}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ mb: { xs: 4, md: 6 } }}>
      <Box
        sx={{
          display: "grid",
          gap: { xs: 1.5, md: 2 },
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 2.2fr 1fr",
          },
          gridTemplateRows: {
            xs: "auto",
            md: "minmax(360px, 62vh)",
          },
        }}
      >
        {/* LEFT COLUMN */}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, md: 2 },
            gridTemplateRows: "1fr 1fr 1fr",
            order: { xs: 2, md: 1 },
            minHeight: { xs: 360, md: "auto" },
          }}
        >
          {leftTiles.map((tile, i) => (
            <TileBase
              key={tile.key}
              tile={tile}
              gradient={SLIDE_GRADIENTS[i % SLIDE_GRADIENTS.length]}
            />
          ))}
        </Box>

        {/* CENTER SLIDER */}
        <Box
          sx={{
            position: "relative",
            order: { xs: 1, md: 2 },
            borderRadius: 3,
            overflow: "hidden",
            minHeight: { xs: 280, md: "auto" },
            bgcolor: "grey.100",
          }}
        >
          {slides.map((slide, i) => {
            const isActive = i === active;
            return (
              <Box
                key={slide.key}
                sx={{
                  position: "absolute",
                  inset: 0,
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 0.7s ease",
                  background: SLIDE_GRADIENTS[i % SLIDE_GRADIENTS.length],
                }}
              >
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
                <Box
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    height: "100%",
                    p: { xs: 3, md: 6 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    color: "white",
                    maxWidth: { md: "60%" },
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      opacity: 0.9,
                      mb: 1,
                    }}
                  >
                    {t("home.featuredCollection")}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: "1.8rem", md: "3rem" },
                      lineHeight: 1.05,
                      textShadow: "0 2px 16px rgba(0,0,0,0.3)",
                      mb: 1.5,
                    }}
                  >
                    {slide.title}
                  </Typography>
                  {slide.subtitle && (
                    <Typography
                      sx={{
                        fontSize: { xs: "0.95rem", md: "1.1rem" },
                        opacity: 0.95,
                        mb: 3,
                        maxWidth: 420,
                      }}
                    >
                      {slide.subtitle}
                    </Typography>
                  )}
                  <Box>
                    <Button
                      component={Link}
                      href={slide.link}
                      variant="contained"
                      endIcon={
                        <ArrowForwardIcon
                          sx={{
                            transform: isRtl ? "scaleX(-1)" : "none",
                          }}
                        />
                      }
                      sx={{
                        bgcolor: "white",
                        color: "text.primary",
                        fontWeight: 700,
                        px: 3,
                        py: 1.25,
                        borderRadius: 100,
                        "&:hover": {
                          bgcolor: "white",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                        },
                      }}
                    >
                      {t("home.shopNow")}
                    </Button>
                  </Box>
                </Box>
              </Box>
            );
          })}

          {slidesCount > 1 && (
            <>
              <IconButton
                onClick={isRtl ? handleNext : handlePrev}
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: 12,
                  transform: "translateY(-50%)",
                  bgcolor: "rgba(255,255,255,0.85)",
                  color: "text.primary",
                  "&:hover": { bgcolor: "white" },
                  zIndex: 2,
                }}
              >
                {isRtl ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
              <IconButton
                onClick={isRtl ? handlePrev : handleNext}
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: 12,
                  transform: "translateY(-50%)",
                  bgcolor: "rgba(255,255,255,0.85)",
                  color: "text.primary",
                  "&:hover": { bgcolor: "white" },
                  zIndex: 2,
                }}
              >
                {isRtl ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
              <Box
                sx={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 1,
                  zIndex: 2,
                }}
              >
                {slides.map((_, i) => (
                  <Box
                    key={i}
                    onClick={() => setActive(i)}
                    sx={{
                      width: i === active ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      bgcolor:
                        i === active ? "white" : "rgba(255,255,255,0.55)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </Box>
            </>
          )}
        </Box>

        {/* RIGHT COLUMN */}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, md: 2 },
            gridTemplateRows: "1fr 1fr 1fr",
            order: { xs: 3, md: 3 },
            minHeight: { xs: 360, md: "auto" },
          }}
        >
          {rightTiles.map((tile, i) => (
            <TileBase
              key={tile.key}
              tile={tile}
              gradient={SLIDE_GRADIENTS[(i + 2) % SLIDE_GRADIENTS.length]}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
