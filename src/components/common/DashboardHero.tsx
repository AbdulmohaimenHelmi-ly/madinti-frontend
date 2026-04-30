"use client";

import { Box, Stack, Typography } from "@mui/material";

export interface DashboardHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Optional right-aligned content, e.g. action buttons or metadata. */
  action?: React.ReactNode;
}

/**
 * Gradient hero card used at the top of admin / vendor / delivery dashboards.
 * Gives the overview pages a clear "pro admin template" feel.
 */
export default function DashboardHero({
  eyebrow,
  title,
  subtitle,
  icon,
  action,
}: DashboardHeroProps) {
  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        mb: 3,
        p: { xs: 2.5, sm: 3.5 },
        color: "primary.contrastText",
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        boxShadow: "0 18px 36px -22px rgba(15, 23, 42, 0.45)",
      })}
    >
      {/* Decorative blobs */}
      <Box
        sx={{
          position: "absolute",
          insetInlineEnd: -80,
          top: -80,
          width: 240,
          height: 240,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.12)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          insetInlineEnd: 60,
          bottom: -60,
          width: 140,
          height: 140,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.08)",
          pointerEvents: "none",
        }}
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", minWidth: 0, flex: 1 }}
        >
          {icon && (
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.18)",
                color: "white",
                backdropFilter: "blur(6px)",
                flexShrink: 0,
                "& svg": { fontSize: 28 },
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            {eyebrow && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontWeight: 600,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  opacity: 0.85,
                }}
              >
                {eyebrow}
              </Typography>
            )}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
              noWrap
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{ mt: 0.5, opacity: 0.9 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {action && (
          <Box sx={{ flexShrink: 0, width: { xs: "100%", md: "auto" } }}>
            {action}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
