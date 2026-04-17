"use client";

import { Box, Typography } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import Link from "next/link";

interface BrandMarkProps {
  name: string;
  href?: string;
  /** 'light' for dark backgrounds, 'color' for light backgrounds */
  variant?: "light" | "color";
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { text: "1.05rem", icon: 18, gap: 0.75 },
  md: { text: "1.3rem", icon: 22, gap: 1 },
  lg: { text: "1.5rem", icon: 26, gap: 1.1 },
};

export default function BrandMark({
  name,
  href,
  variant = "light",
  size = "md",
}: BrandMarkProps) {
  const s = SIZES[size];

  const inner = (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        textDecoration: "none",
      }}
    >
      <PetsIcon
        sx={{
          fontSize: s.icon,
          color: variant === "light" ? "white" : "primary.main",
          transform: "rotate(-15deg)",
          filter:
            variant === "light"
              ? "drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
              : "none",
        }}
      />
      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          fontSize: s.text,
          letterSpacing: "0.02em",
          lineHeight: 1,
          ...(variant === "light"
            ? {
                background:
                  "linear-gradient(135deg, #FFFFFF 0%, #E8F5E9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }
            : { color: "primary.main" }),
        }}
      >
        {name}
      </Typography>
    </Box>
  );

  if (!href) return inner;

  return (
    <Box
      component={Link}
      href={href}
      sx={{ display: "inline-flex", textDecoration: "none", flexShrink: 0 }}
    >
      {inner}
    </Box>
  );
}
