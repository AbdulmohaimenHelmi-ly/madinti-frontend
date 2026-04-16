"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "");
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <Button
      onClick={switchLocale}
      startIcon={<LanguageIcon />}
      color="inherit"
      size="small"
      sx={{ minWidth: "auto" }}
      aria-label={locale === "ar" ? "English" : "العربية"}
    >
      {locale === "ar" ? "EN" : "عربي"}
    </Button>
  );
}
