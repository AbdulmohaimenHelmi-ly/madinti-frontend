"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { IconButton } from "@mui/material";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";

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
    <IconButton
      onClick={switchLocale}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      sx={{
        color: "#1A1A1A",
        width: 40,
        height: 40,
        borderRadius: 100,
        border: "1px solid #EDE7E9",
        bgcolor: "white",
        transition: "all 0.2s ease",
        "&:hover": { bgcolor: "#F5F0F2" },
      }}
    >
      <TranslateRoundedIcon />
    </IconButton>
  );
}
