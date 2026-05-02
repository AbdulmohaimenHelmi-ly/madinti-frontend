"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Container,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LogoutIcon from "@mui/icons-material/Logout";
import PetsIcon from "@mui/icons-material/Pets";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import Navbar from "./Navbar";
import LanguageSwitcher from "./LanguageSwitcher";
import ProfileMenu from "./ProfileMenu";
import MobileAudienceIconBar from "@/components/home/MobileAudienceIconBar";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";

const mobileNavItems = [
  { key: "categories", path: "/categories", icon: CategoryIcon },
  { key: "products", path: "/products", icon: InventoryIcon },
  { key: "vendors", path: "/vendors", icon: StorefrontIcon },
  { key: "orders", path: "/orders", icon: ReceiptLongIcon },
] as const;

export default function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.itemCount);

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "");
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  // The admin/vendor/delivery areas have their own full-screen dashboard chrome.
  if (
    pathname?.startsWith(`/${locale}/admin`) ||
    pathname?.startsWith(`/${locale}/vendor`) ||
    pathname?.startsWith(`/${locale}/delivery`)
  ) {
    return null;
  }

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "#FAF7F8",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid #EDE7E9",
        }}
      >
        {/* ── MOBILE APPBAR (Flutter-style: audience pill + translate + favorites) ── */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <Toolbar sx={{ px: 1.5, gap: 0.5, minHeight: 56 }}>
            <MobileAudienceIconBar />
            <Box sx={{ flexGrow: 1 }} />
            <IconButton
              onClick={switchLocale}
              aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
              sx={{
                color: "#1A1A1A",
                "&:hover": { bgcolor: "rgba(0,0,0,0.05)" },
              }}
            >
              <TranslateRoundedIcon />
            </IconButton>
            <IconButton
              component={Link}
              href={`/${locale}/favorites`}
              aria-label={t("favorites")}
              sx={{
                color: "#1A1A1A",
                "&:hover": { bgcolor: "rgba(0,0,0,0.05)" },
              }}
            >
              <FavoriteBorderRoundedIcon />
            </IconButton>
          </Toolbar>
        </Box>

        {/* ── DESKTOP APPBAR (mobile-inspired light header, full nav) ── */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1.25, minHeight: { xs: 64, md: 64 } }}>

            <Typography
              variant="h5"
              component={Link}
              href={`/${locale}`}
              sx={{
                fontWeight: 800,
                color: "#1A1A1A",
                textDecoration: "none",
                flexShrink: 0,
                letterSpacing: "0.02em",
                fontSize: { xs: "1.3rem", md: "1.5rem" },
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PetsIcon
                sx={{
                  color: theme.palette.primary.main,
                  fontSize: { xs: 22, md: 26 },
                  transform: "rotate(-15deg)",
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))",
                }}
              />
              {t("appName")}
            </Typography>

            <Navbar />

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ display: { xs: "none", md: "flex" }, mr: 1.5 }}>
              <MobileAudienceIconBar />
            </Box>

            <LanguageSwitcher />

            <IconButton
              component={Link}
              href={`/${locale}/cart`}
              sx={{
                color: "#1A1A1A",
                position: "relative",
                // Cart lives in the mobile bottom nav on phones — hide here
                // to avoid a duplicate entry point.
                display: { xs: "none", md: "inline-flex" },
                width: 40,
                height: 40,
                borderRadius: 100,
                border: "1px solid #EDE7E9",
                bgcolor: "white",
                "&:hover": { bgcolor: "#F5F0F2" },
              }}
            >
              <Badge
                badgeContent={itemCount}
                color="secondary"
                sx={{
                  "& .MuiBadge-badge": {
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    minWidth: 18,
                    height: 18,
                  },
                }}
              >
                <ShoppingCartIcon />
              </Badge>
            </IconButton>

            {isAuthenticated && !user?.is_admin && !user?.is_vendor && !user?.is_delivery && (
              <Button
                component={Link}
                href={`/${locale}/become-vendor`}
                startIcon={<AddBusinessIcon />}
                sx={{
                  display: { xs: "none", md: "inline-flex" },
                  color: "#1A1A1A",
                  borderRadius: 100,
                  px: 2,
                  border: "1px solid #EDE7E9",
                  bgcolor: "white",
                  "&:hover": { bgcolor: "#F5F0F2" },
                  fontWeight: 600,
                }}
              >
                {t("becomeVendor")}
              </Button>
            )}

            {!isInitialized ? (
              <Box
                sx={{
                  width: 110,
                  height: 40,
                  borderRadius: 100,
                  bgcolor: "white",
                  border: "1px solid #EDE7E9",
                  display: { xs: "none", sm: "block" },
                }}
              />
            ) : isAuthenticated ? (
              <ProfileMenu />
            ) : (
              <Button
                component={Link}
                href={`/${locale}/auth/login`}
                color="inherit"
                startIcon={<PersonIcon />}
                sx={{
                  display: { xs: "none", sm: "flex" },
                  borderRadius: 100,
                  px: 2.5,
                  color: "#1A1A1A",
                  border: "1px solid #EDE7E9",
                  bgcolor: "white",
                  "&:hover": { bgcolor: "#F5F0F2" },
                }}
              >
                {t("login")}
              </Button>
            )}
          </Toolbar>
        </Container>
        </Box>
      </AppBar>

      <Drawer
        anchor={locale === "ar" ? "right" : "left"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 300,
              bgcolor: "background.paper",
            },
          },
        }}
      >
        <Box>
          <Box
            style={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2.5,
              color: "white",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 1 }}
            >
              <PetsIcon sx={{ fontSize: 22, transform: "rotate(-15deg)" }} />
              {t("appName")}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List sx={{ px: 1, pt: 1 }}>
            {mobileNavItems.map((item) => (
              <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  href={`/${locale}${item.path}`}
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    borderRadius: 2,
                    "&:hover": { bgcolor: "primary.main", color: "white",
                      "& .MuiListItemIcon-root": { color: "white" },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t(item.key)}
                    slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ mx: 2 }} />
          <List sx={{ px: 1, pt: 1 }}>
            {isAuthenticated ? (
              <>
                {user?.is_admin && (
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={`/${locale}/admin`}
                      onClick={() => setDrawerOpen(false)}
                      sx={{ borderRadius: 2, "&:hover": { bgcolor: "primary.main", color: "white", "& .MuiListItemIcon-root": { color: "white" } } }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                        <AdminPanelSettingsIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t("adminPanel")} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                    </ListItemButton>
                  </ListItem>
                )}
                {user?.is_vendor && (
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={`/${locale}/vendor`}
                      onClick={() => setDrawerOpen(false)}
                      sx={{ borderRadius: 2, "&:hover": { bgcolor: "primary.main", color: "white", "& .MuiListItemIcon-root": { color: "white" } } }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                        <StorefrontIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t("vendorDashboard")} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                    </ListItemButton>
                  </ListItem>
                )}
                {user?.is_delivery && (
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={`/${locale}/delivery`}
                      onClick={() => setDrawerOpen(false)}
                      sx={{ borderRadius: 2, "&:hover": { bgcolor: "primary.main", color: "white", "& .MuiListItemIcon-root": { color: "white" } } }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                        <LocalShippingIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t("deliveryDashboard")} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                    </ListItemButton>
                  </ListItem>
                )}
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    href={`/${locale}/profile`}
                    onClick={() => setDrawerOpen(false)}
                    sx={{ borderRadius: 2, "&:hover": { bgcolor: "primary.main", color: "white", "& .MuiListItemIcon-root": { color: "white" } } }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t("myProfile")} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                  </ListItemButton>
                </ListItem>
                {!user?.is_vendor && !user?.is_admin && !user?.is_delivery && (
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={`/${locale}/become-vendor`}
                      onClick={() => setDrawerOpen(false)}
                      sx={{ borderRadius: 2, "&:hover": { bgcolor: "primary.main", color: "white", "& .MuiListItemIcon-root": { color: "white" } } }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                        <AddBusinessIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t("becomeVendor")} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                    </ListItemButton>
                  </ListItem>
                )}
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={async () => {
                      setDrawerOpen(false);
                      await logout();
                    }}
                    sx={{ borderRadius: 2, "&:hover": { bgcolor: "error.main", color: "white", "& .MuiListItemIcon-root": { color: "white" } } }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t("logout")} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              <>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    href={`/${locale}/auth/login`}
                    onClick={() => setDrawerOpen(false)}
                    sx={{ borderRadius: 2, "&:hover": { bgcolor: "primary.main", color: "white",
                      "& .MuiListItemIcon-root": { color: "white" },
                    } }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                      <LoginIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t("login")} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    href={`/${locale}/auth/register`}
                    onClick={() => setDrawerOpen(false)}
                    sx={{ borderRadius: 2, "&:hover": { bgcolor: "primary.main", color: "white",
                      "& .MuiListItemIcon-root": { color: "white" },
                    } }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                      <PersonAddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t("register")} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
