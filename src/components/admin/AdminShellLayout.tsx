"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AppBar,
  Avatar,
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CategoryIcon from "@mui/icons-material/Category";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TuneIcon from "@mui/icons-material/Tune";
import ViewCarouselIcon from "@mui/icons-material/ViewCarousel";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PetsIcon from "@mui/icons-material/Pets";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { useAuthStore } from "@/lib/store/authStore";

const DRAWER_WIDTH = 264;
const APPBAR_HEIGHT = 64;

const SIDEBAR_BG = "#0F172A";
const SIDEBAR_HOVER = "rgba(255,255,255,0.06)";
const SIDEBAR_FG = "rgba(255,255,255,0.72)";

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  useEffect(() => {
    // Don't redirect until we know the final auth state.
    if (!isInitialized || isLoading) return;
    if (!token) {
      router.replace(`/${locale}/auth/login`);
      return;
    }
    if (user && !user.is_admin) {
      router.replace(`/${locale}`);
    }
  }, [isInitialized, isLoading, user, token, locale, router]);

  const links = useMemo(
    () => [
      { label: t("dashboard"), href: `/${locale}/admin`, icon: <DashboardIcon />, exact: true },
      { label: t("users"), href: `/${locale}/admin/users`, icon: <PeopleIcon /> },
      { label: t("vendors"), href: `/${locale}/admin/vendors`, icon: <StorefrontIcon /> },
      { label: t("vendorApplications"), href: `/${locale}/admin/vendor-applications`, icon: <HowToRegIcon /> },
      { label: t("categories"), href: `/${locale}/admin/categories`, icon: <CategoryIcon /> },
      { label: t("brands"), href: `/${locale}/admin/brands`, icon: <LocalOfferIcon /> },
      { label: t("products"), href: `/${locale}/admin/products`, icon: <InventoryIcon /> },
      { label: t("options") || "Options", href: `/${locale}/admin/options`, icon: <TuneIcon /> },
      { label: t("orders"), href: `/${locale}/admin/orders`, icon: <ReceiptLongIcon /> },
      { label: t("cities"), href: `/${locale}/admin/cities`, icon: <LocationCityIcon /> },
      { label: t("banners"), href: `/${locale}/admin/banners`, icon: <ViewCarouselIcon /> },
    ],
    [t, locale]
  );

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const currentPage = links.find((l) => isActive(l.href, l.exact));

  const handleLogout = async () => {
    setMenuAnchor(null);
    try {
      await logout();
    } finally {
      router.replace(`/${locale}/auth/login`);
    }
  };

  if (!user || !user.is_admin) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F4F6FA",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const sidebarContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: SIDEBAR_BG,
        color: SIDEBAR_FG,
      }}
    >
      <Box
        sx={{
          height: APPBAR_HEIGHT,
          display: "flex",
          alignItems: "center",
          px: 2.5,
          gap: 2.25,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Box
          sx={(theme) => ({
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: "white",
          })}
        >
          <AdminPanelSettingsIcon fontSize="small" />
        </Box>
        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            alignItems: "baseline",
            gap: 0.9,
            flexWrap: "nowrap",
          }}
        >
          <Typography
            component="span"
            sx={{
              color: "white",
              fontWeight: 800,
              lineHeight: 1.1,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              whiteSpace: "nowrap",
            }}
            noWrap
          >
            <PetsIcon sx={{ fontSize: 16, transform: "rotate(-15deg)" }} />
            {tCommon("appName")}
          </Typography>
          <Typography
            variant="caption"
            component="span"
            sx={{
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            {t("adminPanel")}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, py: 2, flex: 1, overflowY: "auto" }}>
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.4)",
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            px: 1.5,
          }}
        >
          {t("mainMenu")}
        </Typography>
        <List sx={{ mt: 0.5 }} disablePadding>
          {links.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <ListItem key={link.href} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  sx={(theme) => ({
                    borderRadius: 2,
                    py: 1.1,
                    color: active ? theme.palette.primary.light : SIDEBAR_FG,
                    bgcolor: active ? `${theme.palette.primary.main}24` : "transparent",
                    "&:hover": {
                      bgcolor: active ? `${theme.palette.primary.main}24` : SIDEBAR_HOVER,
                      color: active ? theme.palette.primary.light : "white",
                    },
                  })}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                    {link.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={link.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: active ? 700 : 500,
                          fontSize: "0.9rem",
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
      <Box sx={{ p: 2 }}>
        <ListItemButton
          component={Link}
          href={`/${locale}`}
          sx={{
            borderRadius: 2,
            color: SIDEBAR_FG,
            "&:hover": { bgcolor: SIDEBAR_HOVER, color: "white" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t("visitSite")}
            slotProps={{ primary: { sx: { fontSize: "0.85rem" } } }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  const isRtl = locale === "ar";

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#F4F6FA",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {sidebarContent}
      </Box>

      <Drawer
        variant="temporary"
        anchor={isRtl ? "right" : "left"}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            border: "none",
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{
            bgcolor: "white",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar sx={{ height: APPBAR_HEIGHT, gap: 1 }}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              edge="start"
              sx={{ display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              {currentPage?.label ?? t("dashboard")}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Tooltip title={user.name}>
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "primary.main",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  {user.name?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={menuAnchor}
              open={!!menuAnchor}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{ paper: { sx: { minWidth: 220, mt: 1, borderRadius: 2 } } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem component={Link} href={`/${locale}`}>
                <ListItemIcon>
                  <OpenInNewIcon fontSize="small" />
                </ListItemIcon>
                {t("visitSite")}
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                {tCommon("logout")}
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 }, maxWidth: "100%" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
