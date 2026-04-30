"use client";

import { CacheProvider } from "@emotion/react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import createEmotionCache from "@/theme/createEmotionCache";
import { createAppTheme } from "@/theme/theme";
import { useContentFilter } from "@/lib/context/ContentFilterContext";

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";
  const { filter } = useContentFilter();
  const emotionCache = useMemo(
    () => createEmotionCache(direction),
    [direction]
  );
  const theme = useMemo(
    () => createAppTheme(direction, filter),
    [direction, filter]
  );

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={locale === "ar" ? arLocale : enUS}
        >
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
