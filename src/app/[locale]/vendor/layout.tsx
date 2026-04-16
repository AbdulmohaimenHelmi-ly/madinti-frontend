"use client";
import { useTranslations, useLocale } from "next-intl";
import { Box, Container, List, ListItem, ListItemButton, ListItemText, Paper, Grid } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import Link from "next/link";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("vendor");
  const locale = useLocale();
  const links = [
    { label: t("dashboard"), href: `/${locale}/vendor`, icon: <DashboardIcon /> },
    { label: t("myProducts"), href: `/${locale}/vendor/products`, icon: <InventoryIcon /> },
    { label: t("myOrders"), href: `/${locale}/vendor/orders`, icon: <ShoppingBagIcon /> },
  ];
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ borderRadius: 3 }}>
            <List>
              {links.map((link) => (
                <ListItem key={link.href} disablePadding>
                  <ListItemButton component={Link} href={link.href}>
                    {link.icon}
                    <ListItemText primary={link.label} sx={{ ml: 1 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>{children}</Grid>
      </Grid>
    </Container>
  );
}
