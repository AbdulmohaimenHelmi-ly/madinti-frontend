"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InventoryIcon from "@mui/icons-material/Inventory";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StarIcon from "@mui/icons-material/Star";
import StorefrontIcon from "@mui/icons-material/Storefront";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { vendorApi, type VendorDashboardPayload } from "@/lib/api/vendor";

interface Stat {
  key: string;
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export default function VendorDashboardPage() {
  const t = useTranslations("vendor");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<VendorDashboardPayload | null>(null);

  useEffect(() => {
    let active = true;
    vendorApi
      .getDashboard()
      .then((res) => {
        if (active) setData(res.data.data);
      })
      .catch(() => {
        if (active) setError(t("loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  const currency = (n: number | string) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", {
      maximumFractionDigits: 2,
    }).format(Number(n) || 0);

  const stats: Stat[] = data
    ? [
        {
          key: "sales",
          label: t("totalSales"),
          value: currency(data.total_sales),
          icon: <TrendingUpIcon />,
          color: "#2e7d32",
        },
        {
          key: "orders",
          label: t("totalOrders"),
          value: data.total_orders,
          icon: <ReceiptLongIcon />,
          color: "#1976d2",
        },
        {
          key: "products",
          label: t("totalProducts"),
          value: data.total_products,
          icon: <InventoryIcon />,
          color: "#9c27b0",
        },
        {
          key: "rating",
          label: t("rating"),
          value: Number(data.rating || 0).toFixed(1),
          icon: <StarIcon />,
          color: "#ed6c02",
        },
      ]
    : [];

  return (
    <Box>
      <VendorPageHeader
        title={t("dashboard")}
        subtitle={t("dashboardSubtitle")}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {data?.vendor && (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={(theme) => ({
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: "white",
                  })}
                >
                  <StorefrontIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t("storeInfo")}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, lineHeight: 1.2 }}
                    noWrap
                  >
                    {data.vendor.store_name}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          <Grid container spacing={3}>
            {stats.map((s) => (
              <Grid key={s.key} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    borderRadius: 3,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: `${s.color}18`,
                          color: s.color,
                        }}
                      >
                        {s.icon}
                      </Box>
                      <Box>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 800, lineHeight: 1 }}
                        >
                          {s.value}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                          {s.label}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
