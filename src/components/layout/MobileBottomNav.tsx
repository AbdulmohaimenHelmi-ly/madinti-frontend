"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, Box, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";

/**
 * Mobile bottom navigation bar that mirrors the Flutter mobile app's
 * `home_shell.dart` (Home / Categories / Cart / Stores / Profile).
 *
 * Visible only on phone-sized viewports; on tablet/desktop the regular
 * top header + footer chrome is used instead. This is what makes the
 * website "feel like a mobile app" on phones.
 */
export default function MobileBottomNav() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const theme = useTheme();
  const itemCount = useCartStore((s) => s.itemCount);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Hide on the same areas the Header/Footer hide on — those sections have
  // their own dashboard chrome.
  if (
    pathname?.startsWith(`/${locale}/admin`) ||
    pathname?.startsWith(`/${locale}/vendor`) ||
    pathname?.startsWith(`/${locale}/delivery`)
  ) {
    return null;
  }

  // The profile tab routes to the user's profile if signed in, otherwise
  // to the login screen — same behaviour as the Flutter `_ProfileTab`.
  const profileHref = isAuthenticated
    ? `/${locale}/profile`
    : `/${locale}/auth/login`;

  type NavItem = {
    key: string;
    href: string;
    label: string;
    Icon: typeof HomeOutlinedIcon;
    ActiveIcon: typeof HomeRoundedIcon;
    isActive: (p: string) => boolean;
    badge?: number;
  };

  const items: NavItem[] = [
    {
      key: "home",
      href: `/${locale}`,
      label: t("home"),
      Icon: HomeOutlinedIcon,
      ActiveIcon: HomeRoundedIcon,
      isActive: (p: string) => p === `/${locale}` || p === `/${locale}/`,
    },
    {
      key: "categories",
      href: `/${locale}/categories`,
      label: t("categories"),
      Icon: GridViewOutlinedIcon,
      ActiveIcon: GridViewRoundedIcon,
      isActive: (p: string) => p.startsWith(`/${locale}/categories`),
    },
    {
      key: "cart",
      href: `/${locale}/cart`,
      label: t("cart"),
      Icon: ShoppingBagOutlinedIcon,
      ActiveIcon: ShoppingBagRoundedIcon,
      isActive: (p: string) =>
        p.startsWith(`/${locale}/cart`) ||
        p.startsWith(`/${locale}/checkout`),
      badge: itemCount,
    },
    {
      key: "vendors",
      href: `/${locale}/vendors`,
      label: t("vendors"),
      Icon: StorefrontOutlinedIcon,
      ActiveIcon: StorefrontRoundedIcon,
      isActive: (p: string) => p.startsWith(`/${locale}/vendors`),
    },
    {
      key: "profile",
      href: profileHref,
      label: t("myProfile"),
      Icon: PersonOutlineRoundedIcon,
      ActiveIcon: PersonRoundedIcon,
      isActive: (p: string) =>
        p.startsWith(`/${locale}/profile`) ||
        p.startsWith(`/${locale}/orders`) ||
        p.startsWith(`/${locale}/favorites`) ||
        p.startsWith(`/${locale}/auth`),
    },
  ];

  const currentPath = pathname ?? "";

  return (
    <Paper
      elevation={0}
      component="nav"
      aria-label="Mobile navigation"
      sx={{
        display: { xs: "block", md: "none" },
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        // Respect iOS home-indicator safe area.
        pb: "env(safe-area-inset-bottom)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${items.length}, 1fr)`,
          height: 64,
        }}
      >
        {items.map(({ key, href, label, Icon, ActiveIcon, isActive, badge }) => {
          const active = isActive(currentPath);
          const IconComp = active ? ActiveIcon : Icon;
          return (
            <Box
              key={key}
              component={Link}
              href={href}
              prefetch={false}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.25,
                textDecoration: "none",
                color: active ? theme.palette.primary.main : "text.secondary",
                position: "relative",
                transition: "color 0.2s ease",
                WebkitTapHighlightColor: "transparent",
                "&:active": { transform: "scale(0.97)" },
              }}
            >
              {active && (
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: 0,
                    width: 28,
                    height: 3,
                    borderRadius: "0 0 4px 4px",
                    bgcolor: "primary.main",
                  }}
                />
              )}
              {badge && badge > 0 ? (
                <Badge
                  badgeContent={badge > 99 ? "99+" : badge}
                  color="secondary"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                    },
                  }}
                >
                  <IconComp fontSize="small" />
                </Badge>
              ) : (
                <IconComp fontSize="small" />
              )}
              <Box
                component="span"
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: active ? 700 : 500,
                  lineHeight: 1.1,
                  letterSpacing: "0.01em",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  px: 0.5,
                }}
              >
                {label}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
