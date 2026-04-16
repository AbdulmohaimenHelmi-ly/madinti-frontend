"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Box, Typography } from "@mui/material";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "");
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <Box
      onClick={switchLocale}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") switchLocale(); }}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      sx={{
        display: "flex",
        alignItems: "center",
        bgcolor: "rgba(255,255,255,0.12)",
        borderRadius: 100,
        p: "3px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
      }}
    >
      <Typography
        component="span"
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: 100,
          fontSize: "0.75rem",
          fontWeight: 700,
          color: locale === "ar" ? "primary.main" : "white",
          bgcolor: locale === "ar" ? "white" : "transparent",
          transition: "all 0.2s ease",
          lineHeight: 1.4,
        }}
      >
        عربي
      </Typography>
      <Typography
        component="span"
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: 100,
          fontSize: "0.75rem",
          fontWeight: 700,
          color: locale === "en" ? "primary.main" : "white",
          bgcolor: locale === "en" ? "white" : "transparent",
          transition: "all 0.2s ease",
          lineHeight: 1.4,
        }}
      >
        EN
      </Typography>
    </Box>
  );
}
