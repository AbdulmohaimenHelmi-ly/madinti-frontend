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
  Divider,
  Container,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import Navbar from "./Navbar";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";

const mobileNavItems = [
  { key: "home", path: "" },
  { key: "products", path: "/products" },
  { key: "categories", path: "/categories" },
  { key: "vendors", path: "/vendors" },
  { key: "orders", path: "/orders" },
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
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: "primary.main" }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h5"
              component={Link}
              href={`/${locale}`}
              sx={{
                fontWeight: 700,
                color: "white",
                textDecoration: "none",
                flexShrink: 0,
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
              color="inherit"
            >
              <Badge badgeContent={itemCount} color="secondary">
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
                startIcon={<PersonIcon />}
                sx={{ display: { xs: "none", sm: "flex" } }}
              >
                {user?.name?.split(" ")[0]}
              </Button>
            ) : (
              <Button
                component={Link}
                href={`/${locale}/auth/login`}
                color="inherit"
                startIcon={<PersonIcon />}
                sx={{ display: { xs: "none", sm: "flex" } }}
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
      >
        <Box sx={{ width: 280 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
            }}
          >
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {t("appName")}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            {mobileNavItems.map((item) => (
              <ListItem key={item.key} disablePadding>
                <ListItemButton
                  component={Link}
                  href={`/${locale}${item.path}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary={t(item.key)} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {isAuthenticated ? (
              <>
                {user?.role === "vendor" && (
                  <ListItem disablePadding>
                    <ListItemButton
                      component={Link}
                      href={`/${locale}/vendor`}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <ListItemText primary={t("vendors")} />
                    </ListItemButton>
                  </ListItem>
                )}
              </>
            ) : (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href={`/${locale}/auth/login`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ListItemText primary={t("login")} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href={`/${locale}/auth/register`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ListItemText primary={t("register")} />
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
