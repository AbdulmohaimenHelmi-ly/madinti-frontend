"use client";

import { Box, Card, Stack, Typography } from "@mui/material";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  height?: number | string;
  children: React.ReactNode;
  /** When true, removes inner padding around the chart so it fills the card */
  flush?: boolean;
}

/**
 * Standard wrapper for analytics charts on dashboards.
 * Gives every chart a consistent header, padding and surface treatment.
 */
export default function ChartCard({
  title,
  subtitle,
  action,
  height = 280,
  children,
  flush,
}: ChartCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.01em" }}
            noWrap
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Stack>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          height,
          mx: flush ? -2 : 0,
          mb: flush ? -2 : 0,
        }}
      >
        {children}
      </Box>
    </Card>
  );
}
