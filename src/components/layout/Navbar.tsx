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
        px: 0.75,
        py: 0.5,
        borderRadius: 100,
        bgcolor: "#F5F0F2",
        border: "1px solid #EDE7E9",
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
            color: "#1A1A1A",
            fontWeight: isActive(item.path) ? 700 : 500,
            borderRadius: 100,
            px: 2,
            py: 0.75,
            minWidth: "auto",
            fontSize: "0.875rem",
            bgcolor: isActive(item.path) ? "white" : "transparent",
            boxShadow: isActive(item.path) ? "0 4px 10px rgba(10, 37, 64, 0.08)" : "none",
            "&:hover": { bgcolor: isActive(item.path) ? "white" : "rgba(255,255,255,0.55)" },
            transition: "all 0.2s ease",
          }}
        >
          {t(item.key)}
        </Button>
      ))}
    </Box>
  );
}
