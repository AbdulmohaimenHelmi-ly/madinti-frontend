"use client";

import { Box, Stack, Typography } from "@mui/material";

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  dense?: boolean;
}

export default function SectionTitle({
  title,
  subtitle,
  action,
  dense,
}: SectionTitleProps) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: "flex-end",
        justifyContent: "space-between",
        mb: dense ? 1.5 : 2,
        mt: dense ? 1 : 1.5,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.01em" }}
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
  );
}
