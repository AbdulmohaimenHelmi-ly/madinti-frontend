"use client";

import { useTranslations, useLocale } from "next-intl";
import { Box, Chip } from "@mui/material";
import Link from "next/link";

const navItems = [
  { key: "home", path: "" },
  { key: "products", path: "/products" },
  { key: "categories", path: "/categories" },
  { key: "vendors", path: "/vendors" },
] as const;

export default function Navbar() {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <Box
      sx={{
        display: { xs: "none", md: "flex" },
        gap: 1,
        alignItems: "center",
      }}
    >
      {navItems.map((item) => (
        <Chip
          key={item.key}
          component={Link}
          href={`/${locale}${item.path}`}
          label={t(item.key)}
          clickable
          variant="outlined"
          sx={{
            border: "none",
            color: "inherit",
            fontWeight: 500,
            "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
          }}
        />
      ))}
    </Box>
  );
}
