"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import MenuIcon from "@mui/icons-material/Menu";
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
import LogoutIcon from "@mui/icons-material/Logout";
import PetsIcon from "@mui/icons-material/Pets";
import Navbar from "./Navbar";
import LanguageSwitcher from "./LanguageSwitcher";
import ProfileMenu from "./ProfileMenu";
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
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.itemCount);

  // The admin/vendor areas have their own full-screen dashboard chrome.
  if (
    pathname?.startsWith(`/${locale}/admin`) ||
    pathname?.startsWith(`/${locale}/vendor`)
  ) {
    return null;
  }

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        style={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.primary.main} 100%)`,
        }}
        sx={{
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1, minHeight: { xs: 64, md: 70 } }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{
                display: { md: "none" },
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h5"
              component={Link}
              href={`/${locale}`}
              sx={{
                fontWeight: 800,
                color: "white",
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
                  color: "white",
                  fontSize: { xs: 22, md: 26 },
                  transform: "rotate(-15deg)",
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
                }}
              />
              {t("appName")}
            </Typography>

            <Navbar />

            <Box sx={{ flexGrow: 1 }} />

            <LanguageSwitcher />

            <IconButton
              component={Link}
              href={`/${locale}/cart`}
              sx={{
                color: "white",
                position: "relative",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
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

            {isAuthenticated && !user?.is_admin && !user?.is_vendor && (
              <Button
                component={Link}
                href={`/${locale}/become-vendor`}
                startIcon={<AddBusinessIcon />}
                sx={{
                  display: { xs: "none", md: "inline-flex" },
                  color: "white",
                  borderRadius: 100,
                  px: 2,
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
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
                  bgcolor: "rgba(255,255,255,0.12)",
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
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
              >
                {t("login")}
              </Button>
            )}
          </Toolbar>
        </Container>
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
                {!user?.is_vendor && !user?.is_admin && (
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
