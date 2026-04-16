"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
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
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import Navbar from "./Navbar";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";

const mobileNavItems = [
  { key: "home", path: "", icon: HomeIcon },
  { key: "products", path: "/products", icon: InventoryIcon },
  { key: "categories", path: "/categories", icon: CategoryIcon },
  { key: "vendors", path: "/vendors", icon: StorefrontIcon },
  { key: "orders", path: "/orders", icon: ReceiptLongIcon },
] as const;

export default function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #1B5E20 100%)",
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
                background: "linear-gradient(135deg, #FFFFFF 0%, #E8F5E9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
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

            {isAuthenticated ? (
              <Button
                component={Link}
                href={
                  user?.role === "vendor"
                    ? `/${locale}/vendor`
                    : `/${locale}/orders`
                }
                color="inherit"
                sx={{
                  display: { xs: "none", sm: "flex" },
                  gap: 1,
                  borderRadius: 100,
                  pl: 0.5,
                  pr: 2,
                  py: 0.5,
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
              >
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: "rgba(255,255,255,0.25)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </Avatar>
                {user?.name?.split(" ")[0]}
              </Button>
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
        PaperProps={{
          sx: {
            width: 300,
            bgcolor: "background.paper",
          },
        }}
      >
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2.5,
              background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
              color: "white",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
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
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ mx: 2 }} />
          <List sx={{ px: 1, pt: 1 }}>
            {isAuthenticated ? (
              <>
                {user?.role === "vendor" && (
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={`/${locale}/vendor`}
                      onClick={() => setDrawerOpen(false)}
                      sx={{ borderRadius: 2, "&:hover": { bgcolor: "primary.main", color: "white" } }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                        <StorefrontIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t("vendors")} primaryTypographyProps={{ fontWeight: 500 }} />
                    </ListItemButton>
                  </ListItem>
                )}
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
                    <ListItemText primary={t("login")} primaryTypographyProps={{ fontWeight: 500 }} />
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
                    <ListItemText primary={t("register")} primaryTypographyProps={{ fontWeight: 500 }} />
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
