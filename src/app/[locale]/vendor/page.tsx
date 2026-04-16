"use client";
import { useTranslations } from "next-intl";
import { Typography, Card, CardContent, Grid, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";

export default function VendorDashboard() {
  const t = useTranslations("vendor");
  const stats = [
    { label: t("totalSales"), value: "0", icon: <TrendingUpIcon /> },
    { label: t("products"), value: "0", icon: <InventoryIcon /> },
    { label: t("myOrders"), value: "0", icon: <ShoppingBagIcon /> },
  ];
  return (
    <>
      <Typography variant="h4" fontWeight={700} gutterBottom>{t("dashboard")}</Typography>
      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ color: "primary.main" }}>{s.icon}</Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                    <Typography color="text.secondary">{s.label}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
