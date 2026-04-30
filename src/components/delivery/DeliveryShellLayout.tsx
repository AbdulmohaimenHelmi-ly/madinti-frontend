"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
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
  AppBar,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import BusinessIcon from "@mui/icons-material/Business";
import ListAltIcon from "@mui/icons-material/ListAlt";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { useAuthStore } from "@/lib/store/authStore";

const DRAWER_WIDTH = 264;
const APPBAR_HEIGHT = 64;
const SIDEBAR_BG = "#0F172A";
const SIDEBAR_HOVER = "rgba(255,255,255,0.06)";
const SIDEBAR_FG = "rgba(255,255,255,0.72)";

export default function DeliveryShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("delivery");
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
    if (!isInitialized || isLoading) return;
    if (!token) {
      router.replace(`/${locale}/auth/login`);
      return;
    }
    if (user && !user.is_delivery && !user.is_admin) {
      router.replace(`/${locale}`);
    }
  }, [isInitialized, isLoading, user, token, locale, router]);

  const links = useMemo(
    () => [
      { label: t("dashboard"), href: `/${locale}/delivery`, icon: <DashboardIcon />, exact: true },
      { label: t("company"), href: `/${locale}/delivery/company`, icon: <BusinessIcon /> },
      { label: t("orders"), href: `/${locale}/delivery/orders`, icon: <ListAltIcon /> },
      { label: t("prices"), href: `/${locale}/delivery/prices`, icon: <PriceChangeIcon /> },
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

  if (!user || (!user.is_delivery && !user.is_admin)) {
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
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: SIDEBAR_BG, color: SIDEBAR_FG }}>
      <Box
        sx={{
          height: APPBAR_HEIGHT,
          display: "flex",
          alignItems: "center",
          px: 2.5,
          gap: 1.5,
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
          <LocalShippingIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "white", fontWeight: 800, lineHeight: 1.1 }} noWrap>
            {tCommon("appName")}
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>
            {t("panel")}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, py: 2, flex: 1, overflowY: "auto" }}>
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
                  <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>{link.icon}</ListItemIcon>
                  <ListItemText
                    primary={link.label}
                    slotProps={{ primary: { sx: { fontWeight: active ? 700 : 500, fontSize: "0.9rem" } } }}
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
          sx={{ borderRadius: 2, color: SIDEBAR_FG, "&:hover": { bgcolor: SIDEBAR_HOVER, color: "white" } }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("visitSite")} slotProps={{ primary: { sx: { fontSize: "0.85rem" } } }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F4F6FA" }}>
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
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{ paper: { sx: { width: DRAWER_WIDTH } } }}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        {sidebarContent}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "white",
            color: "text.primary",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar sx={{ minHeight: APPBAR_HEIGHT, gap: 1 }}>
            <IconButton sx={{ display: { xs: "inline-flex", md: "none" } }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", flex: 1 }} noWrap>
              {currentPage?.label ?? t("dashboard")}
            </Typography>
            <Tooltip title={user.email}>
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.9rem" }}>
                  {user.name?.[0] ?? "D"}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{tCommon("logout")}</ListItemText>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 3 }, flex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}
