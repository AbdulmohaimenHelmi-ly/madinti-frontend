"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Container, Typography, Grid, Box, Skeleton, InputBase, IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import CategoryCard from "@/components/categories/CategoryCard";
import { CategoryGridSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import type { Category } from "@/lib/types";
import { categoriesApi } from "@/lib/api/categories";

/* ── Sub-tile (right pane): square image + 14px radius, 3-col ── */
function SubTile({
  category,
  isViewAll,
  href,
}: {
  category?: Category;
  isViewAll?: boolean;
  href: string;
}) {
  const locale = useLocale();
  const name =
    isViewAll
      ? "كل المنتجات"
      : locale === "en" && category?.name_en
        ? category.name_en
        : (category?.name ?? "");
  const router = useRouter();

  return (
    <Box
      role="button"
      onClick={() => router.push(href)}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        borderRadius: "14px",
        "&:active": { opacity: 0.7 },
      }}
    >
      {/* Square image */}
      <Box
        sx={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "14px",
          overflow: "hidden",
          bgcolor: "#F5F0F2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isViewAll ? (
          <GridViewRoundedIcon sx={{ color: "#6B6B6B", fontSize: 30 }} />
        ) : category?.image ? (
          <Box
            component="img"
            src={category.image}
            alt={name}
            loading="lazy"
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <GridViewRoundedIcon sx={{ color: "#6B6B6B", fontSize: 26 }} />
        )}
      </Box>
      {/* Label */}
      <Typography
        sx={{
          mt: "6px",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "#1A1A1A",
          lineHeight: 1.15,
          textAlign: "center",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {name}
      </Typography>
    </Box>
  );
}

/* ── Mobile two-pane layout (Flutter CategoriesScreen) ── */
function MobileCategoriesLayout({ categories }: { categories: Category[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const selected = categories[selectedIdx] ?? categories[0];

  // Reset right pane scroll when parent changes
  useEffect(() => {
    rightPaneRef.current?.scrollTo({ top: 0 });
  }, [selectedIdx]);

  const children: Category[] = selected?.children ?? [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px - 56px)" }}>
      {/* Search bar */}
      <Box
        sx={{
          mx: 2,
          my: 1,
          display: "flex",
          alignItems: "center",
          bgcolor: "white",
          borderRadius: "14px",
          border: "1px solid #EDE7E9",
          px: 1.5,
          flexShrink: 0,
        }}
        component="form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          if (searchQuery.trim()) router.push(`/${locale}/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }}
      >
        <SearchRoundedIcon sx={{ color: "#6B6B6B", fontSize: 20, flexShrink: 0 }} />
        <InputBase
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("common.searchHint")}
          fullWidth
          sx={{ py: "10px", px: 1, fontSize: "0.85rem" }}
        />
      </Box>

      {/* Two-pane */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left rail */}
        <Box
          sx={{
            width: 104,
            flexShrink: 0,
            bgcolor: "#F5F0F2",
            overflowY: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {categories.map((cat, i) => {
            const active = i === selectedIdx;
            const name = locale === "en" && cat.name_en ? cat.name_en : cat.name;
            return (
              <Box
                key={cat.id}
                role="button"
                onClick={() => setSelectedIdx(i)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: "10px",
                  py: "16px",
                  cursor: "pointer",
                  bgcolor: active ? "white" : "transparent",
                  transition: "background-color 0.18s ease",
                }}
              >
                {/* Active indicator bar */}
                <Box
                  sx={{
                    width: 3,
                    height: 22,
                    borderRadius: "3px",
                    flexShrink: 0,
                    bgcolor: active ? theme.palette.primary.main : "transparent",
                    transition: "background-color 0.18s ease",
                    mr: 1,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: active ? 800 : 500,
                    color: active ? "#1A1A1A" : "#6B6B6B",
                    lineHeight: 1.25,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    transition: "all 0.18s ease",
                  }}
                >
                  {name}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Divider */}
        <Box sx={{ width: "1px", bgcolor: "#EDE7E9", flexShrink: 0 }} />

        {/* Right pane */}
        <Box
          ref={rightPaneRef}
          sx={{
            flex: 1,
            bgcolor: "white",
            overflowY: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            p: "16px 16px 24px",
          }}
        >
          {/* Parent banner */}
          {selected?.image && (
            <Box
              sx={{
                width: "100%",
                aspectRatio: "16 / 7",
                borderRadius: "14px",
                overflow: "hidden",
                mb: 2,
                position: "relative",
              }}
            >
              <Box
                component="img"
                src={selected.image}
                alt={locale === "en" && selected.name_en ? selected.name_en : selected.name}
                sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top right, rgba(0,0,0,0.55), transparent)",
                }}
              />
              <Typography
                sx={{
                  position: "absolute",
                  bottom: 10,
                  insetInlineStart: 14,
                  color: "white",
                  fontWeight: 800,
                  fontSize: "1rem",
                }}
              >
                {locale === "en" && selected.name_en ? selected.name_en : selected.name}
              </Typography>
            </Box>
          )}

          {/* Section header */}
          <Typography sx={{ fontSize: "0.94rem", fontWeight: 800, color: "#1A1A1A", mb: "12px" }}>
            {t("home.topCategories")}
          </Typography>

          {/* 3-col sub-grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "14px 12px",
            }}
          >
            {/* "View All" tile */}
            <SubTile
              isViewAll
              href={`/${locale}/products?category_id=${selected?.id}`}
            />
            {children.map((child) => (
              <SubTile
                key={child.id}
                category={child}
                href={`/${locale}/products?category_id=${child.id}`}
              />
            ))}
          </Box>

          {/* Sub-groups (grandchildren) */}
          {children
            .filter((c) => (c.children?.length ?? 0) > 0)
            .map((group) => (
              <Box key={group.id} sx={{ mt: "24px" }}>
                <Typography sx={{ fontSize: "0.94rem", fontWeight: 800, color: "#1A1A1A", mb: "12px" }}>
                  {locale === "en" && group.name_en ? group.name_en : group.name}
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "14px 12px",
                  }}
                >
                  <SubTile
                    isViewAll
                    href={`/${locale}/products?category_id=${group.id}`}
                  />
                  {(group.children ?? []).map((gc) => (
                    <SubTile
                      key={gc.id}
                      category={gc}
                      href={`/${locale}/products?category_id=${gc.id}`}
                    />
                  ))}
                </Box>
              </Box>
            ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ── Desktop: original grid layout ── */
function DesktopCategoriesLayout({ categories }: { categories: Category[] }) {
  const t = useTranslations();
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
        {t("category.allCategories")}
      </Typography>
      <Grid container spacing={3}>
        {categories.map((cat) => (
          <Grid key={cat.id} size={{ xs: 6, sm: 4, md: 3 }}>
            <CategoryCard category={cat} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

/* ── Page entry point ── */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  useEffect(() => {
    // Use getTree so children are available for the two-pane layout
    categoriesApi
      .getTree()
      .then((res) => setCategories(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <>
        {/* Mobile skeleton */}
        <Box sx={{ display: { xs: "flex", md: "none" }, height: "calc(100vh - 112px)" }}>
          <Box sx={{ width: 104, bgcolor: "#F5F0F2", flexShrink: 0 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Box key={i} sx={{ px: "14px", py: "16px" }}>
                <Skeleton width="80%" height={14} />
              </Box>
            ))}
          </Box>
          <Box sx={{ flex: 1, p: 2, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, alignContent: "start" }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <Box key={i}>
                <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "1", borderRadius: "14px" }} />
                <Skeleton width="70%" sx={{ mt: 0.5, mx: "auto" }} />
              </Box>
            ))}
          </Box>
        </Box>
        {/* Desktop skeleton */}
        <Container maxWidth="lg" sx={{ py: 4, display: { xs: "none", md: "block" } }}>
          <CategoryGridSkeleton count={8} />
        </Container>
      </>
    );

  if (categories.length === 0)
    return <EmptyState message={t("category.noCategories")} />;

  return (
    <>
      {/* Mobile two-pane (xs/sm) */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MobileCategoriesLayout categories={categories} />
      </Box>
      {/* Desktop grid (md+) */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DesktopCategoriesLayout categories={categories} />
      </Box>
    </>
  );
}
