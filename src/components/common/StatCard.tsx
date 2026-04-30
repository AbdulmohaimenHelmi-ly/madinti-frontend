"use client";

import { Box, Card, Stack, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  hint?: string;
  /** Optional delta as a percentage. Positive = up, negative = down, 0 = flat. */
  delta?: number;
  /** Optional contextual label for the delta, e.g. "vs last week". */
  deltaLabel?: string;
}

/**
 * Unified KPI card used across the admin / vendor / delivery dashboards.
 * Modern admin-template look: tinted icon tile, big number, optional trend.
 */
export default function StatCard({
  label,
  value,
  icon,
  color = "#1976d2",
  hint,
  delta,
  deltaLabel,
}: StatCardProps) {
  const trend =
    typeof delta === "number"
      ? delta > 0
        ? "up"
        : delta < 0
          ? "down"
          : "flat"
      : null;

  const trendColor =
    trend === "up"
      ? "success.main"
      : trend === "down"
        ? "error.main"
        : "text.secondary";

  const TrendIcon =
    trend === "up"
      ? TrendingUpIcon
      : trend === "down"
        ? TrendingDownIcon
        : TrendingFlatIcon;

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.paper",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 28px -16px rgba(15, 23, 42, 0.18)",
          borderColor: "transparent",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          insetInlineEnd: -40,
          top: -40,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle at center, ${color}22 0%, transparent 70%)`,
          pointerEvents: "none",
        },
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.6,
              fontSize: 11,
              display: "block",
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              lineHeight: 1.15,
              mt: 0.75,
              color: "text.primary",
              fontSize: { xs: 26, sm: 28 },
              letterSpacing: "-0.02em",
            }}
            noWrap
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `${color}1a`,
            color,
            flexShrink: 0,
            "& svg": { fontSize: 22 },
          }}
        >
          {icon}
        </Box>
      </Stack>

      {(trend || hint) && (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            mt: 1.75,
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {trend && (
            <Stack
              direction="row"
              spacing={0.25}
              sx={{
                alignItems: "center",
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                bgcolor:
                  trend === "up"
                    ? "rgba(46, 125, 50, 0.1)"
                    : trend === "down"
                      ? "rgba(211, 47, 47, 0.1)"
                      : "action.hover",
                color: trendColor,
              }}
            >
              <TrendIcon sx={{ fontSize: 14 }} />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, fontSize: 11, lineHeight: 1 }}
              >
                {Math.abs(delta!).toFixed(1)}%
              </Typography>
            </Stack>
          )}
          {(deltaLabel || hint) && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: 12 }}
              noWrap
            >
              {deltaLabel ?? hint}
            </Typography>
          )}
        </Stack>
      )}
    </Card>
  );
}
