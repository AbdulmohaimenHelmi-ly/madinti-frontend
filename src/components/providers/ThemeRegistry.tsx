"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import rtlPlugin from "stylis-plugin-rtl";
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
  const cacheOptions = useMemo(
    () =>
      direction === "rtl"
        ? { key: "muirtl", stylisPlugins: [rtlPlugin] }
        : { key: "mui" },
    [direction]
  );
  const theme = useMemo(
    () => createAppTheme(direction, filter),
    [direction, filter]
  );

  return (
    <AppRouterCacheProvider options={cacheOptions}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={locale === "ar" ? arLocale : enUS}
        >
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
