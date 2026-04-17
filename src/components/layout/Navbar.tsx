"use client";

import { useTranslations, useLocale } from "next-intl";
import { Box, Button } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CategoriesMegaMenu from "./CategoriesMegaMenu";

const navItems = [
  { key: "products", path: "/products" },
  { key: "vendors", path: "/vendors" },
] as const;

export default function Navbar() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`;
    if (path === "") return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(fullPath);
  };

  return (
    <Box
      sx={{
        display: { xs: "none", md: "flex" },
        gap: 0.5,
        alignItems: "center",
        ml: 2,
      }}
    >
      <CategoriesMegaMenu />

      {navItems.map((item) => (
        <Button
          key={item.key}
          component={Link}
          href={`/${locale}${item.path}`}
          size="small"
          sx={{
            color: "white",
            fontWeight: isActive(item.path) ? 700 : 500,
            borderRadius: 100,
            px: 2,
            py: 0.75,
            minWidth: "auto",
            fontSize: "0.875rem",
            bgcolor: isActive(item.path) ? "rgba(255,255,255,0.18)" : "transparent",
            "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
            transition: "all 0.2s ease",
          }}
        >
          {t(item.key)}
        </Button>
      ))}
    </Box>
  );
}
