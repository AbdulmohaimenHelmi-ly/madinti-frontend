"use client";

import { Box, Grid, Paper, Skeleton, Stack } from "@mui/material";

const HERO_DESKTOP_GAP = "clamp(10px, 1.15vw, 16px)";
const HERO_DESKTOP_SIDE = "21.9%";
const HERO_DESKTOP_RATIO = "923 / 188";

interface GridSkeletonProps {
  count?: number;
}

/**
 * Full-page skeleton for the home page. Mirrors the main sections:
 * hero mosaic, circular categories carousel, featured product grid,
 * and top vendors row, so the layout stays stable while data loads.
 */
export function HomePageSkeleton() {
  const sideTile = (
    <Skeleton
      variant="rectangular"
      sx={{
        width: "100%",
        height: "100%",
        minHeight: { xs: "clamp(64px, 16vw, 90px)", md: 0 },
        borderRadius: "8px",
      }}
    />
  );
  return (
    <Box
      sx={{
        maxWidth: 1680,
        mx: "auto",
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 3 },
      }}
    >
      {/* Content filter switch placeholder */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 2, md: 3 } }}>
        <Skeleton variant="rounded" width={260} height={40} />
      </Box>

      {/* Hero mosaic: 3 left tiles | big slider | 3 right tiles */}
      <Box
        sx={{
          mx: { xs: 0, md: "clamp(24px, 2.8vw, 48px)" },
          display: "grid",
          gap: { xs: 1.5, md: HERO_DESKTOP_GAP },
          gridTemplateColumns: {
            xs: "1fr",
            md: `${HERO_DESKTOP_SIDE} minmax(0, 1fr) ${HERO_DESKTOP_SIDE}`,
          },
          alignItems: "stretch",
          aspectRatio: { md: HERO_DESKTOP_RATIO },
          mb: { xs: 2, md: 2.5 },
        }}
      >
        {/* LEFT: 3 tiles */}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, md: HERO_DESKTOP_GAP },
            gridTemplateRows: { xs: "unset", md: "repeat(3, minmax(0, 1fr))" },
            order: { xs: 2, md: 1 },
            height: { md: "100%" },
          }}
        >
          {sideTile}
          {sideTile}
          {sideTile}
        </Box>

        {/* CENTER: slider */}
        <Box
          sx={{
            order: { xs: 1, md: 2 },
            minHeight: { xs: "clamp(240px, 58vw, 340px)", md: 0 },
            aspectRatio: { xs: "16 / 10", md: "auto" },
            height: { md: "100%" },
          }}
        >
          <Skeleton
            variant="rectangular"
            sx={{
              width: "100%",
              height: "100%",
              minHeight: { xs: "clamp(240px, 58vw, 340px)", md: 0 },
              borderRadius: "8px",
            }}
          />
        </Box>

        {/* RIGHT: 3 tiles */}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, md: HERO_DESKTOP_GAP },
            gridTemplateRows: { xs: "unset", md: "repeat(3, minmax(0, 1fr))" },
            order: { xs: 3, md: 3 },
            height: { md: "100%" },
          }}
        >
          {sideTile}
          {sideTile}
          {sideTile}
        </Box>
      </Box>

      {/* Circular categories carousel */}
      <Box sx={{ mb: 5 }}>
        <Skeleton width={220} height={32} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={3} sx={{ overflow: "hidden" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i} sx={{ textAlign: "center", flexShrink: 0 }}>
              <Skeleton variant="circular" width={88} height={88} />
              <Skeleton width={80} sx={{ mt: 1, mx: "auto" }} />
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Featured products grid */}
      <Box sx={{ mb: 5 }}>
        <Skeleton width={220} height={32} sx={{ mb: 2 }} />
        <ProductGridSkeleton count={8} />
      </Box>

      {/* Top vendors */}
      <Box sx={{ mb: 5 }}>
        <Skeleton width={180} height={32} sx={{ mb: 2 }} />
        <VendorGridSkeleton count={4} />
      </Box>
    </Box>
  );
}


/**
 * Placeholder that matches the responsive ProductGrid layout. Used wherever
 * a ProductGrid will be rendered once data arrives so the transition from
 * loading → loaded is visually seamless.
 */
export function ProductGridSkeleton({ count = 8 }: GridSkeletonProps) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 6, sm: 6, md: 4, lg: 3 }}>
          <Skeleton
            variant="rectangular"
            sx={{ width: "100%", aspectRatio: "3 / 4", borderRadius: 2 }}
          />
          <Skeleton width="80%" sx={{ mt: 1 }} />
          <Skeleton width="50%" />
          <Skeleton width="40%" sx={{ mt: 0.5 }} />
        </Grid>
      ))}
    </Grid>
  );
}

/** Matches the responsive category cards grid (xs:2, sm:3, md:4 cols). */
export function CategoryGridSkeleton({ count = 8 }: GridSkeletonProps) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
          <Skeleton
            variant="rectangular"
            sx={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 2 }}
          />
          <Skeleton width="70%" sx={{ mt: 1, mx: "auto" }} />
        </Grid>
      ))}
    </Grid>
  );
}

/** Matches the responsive vendor cards grid (xs:12, sm:6, md:4 cols). */
export function VendorGridSkeleton({ count = 6 }: GridSkeletonProps) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={56} height={56} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="70%" />
                <Skeleton width="50%" />
              </Box>
            </Stack>
            <Skeleton width="100%" sx={{ mt: 2 }} />
            <Skeleton width="90%" />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

/** Cart page placeholder: list of item rows + summary panel. */
export function CartSkeleton() {
  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 8 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Paper
            key={i}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton
                variant="rectangular"
                width={96}
                height={96}
                sx={{ borderRadius: 1.5, flexShrink: 0 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="70%" />
                <Skeleton width="40%" sx={{ mt: 1 }} />
                <Skeleton width="30%" sx={{ mt: 1 }} />
              </Box>
              <Skeleton variant="rectangular" width={110} height={36} sx={{ borderRadius: 1 }} />
            </Stack>
          </Paper>
        ))}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Skeleton width="50%" height={32} />
          <Box sx={{ mt: 2 }}>
            <Skeleton width="100%" />
            <Skeleton width="100%" />
            <Skeleton width="100%" />
          </Box>
          <Skeleton
            variant="rectangular"
            height={44}
            sx={{ mt: 3, borderRadius: 100 }}
          />
        </Paper>
      </Grid>
    </Grid>
  );
}

/** Dashboard stat cards grid (xs:12, sm:6, md:3). */
export function StatCardsSkeleton({ count = 4 }: GridSkeletonProps) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="rounded" width={52} height={52} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={32} />
                <Skeleton width="80%" sx={{ mt: 0.5 }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

/** Admin / vendor table placeholder. */
export function TableRowsSkeleton({ rows = 6, columns = 4 }: TableSkeletonProps) {
  return (
    <Paper
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" spacing={2}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width={`${100 / columns}%`} />
          ))}
        </Stack>
      </Box>
      {Array.from({ length: rows }).map((_, r) => (
        <Box
          key={r}
          sx={{
            p: 2,
            borderBottom: r < rows - 1 ? "1px solid" : "none",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="rounded" width={44} height={44} />
            {Array.from({ length: columns - 1 }).map((_, c) => (
              <Skeleton key={c} width={`${80 / columns}%`} />
            ))}
          </Stack>
        </Box>
      ))}
    </Paper>
  );
}
