"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Alert, Box, Grid } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InventoryIcon from "@mui/icons-material/Inventory";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StarIcon from "@mui/icons-material/Star";
import StorefrontIcon from "@mui/icons-material/Storefront";

import { StatCardsSkeleton } from "@/components/common/Skeletons";
import StatCard from "@/components/common/StatCard";
import DashboardHero from "@/components/common/DashboardHero";
import SectionTitle from "@/components/common/SectionTitle";
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
      <DashboardHero
        eyebrow={data?.vendor?.store_name ?? t("dashboard")}
        title={t("dashboard")}
        subtitle={t("dashboardSubtitle")}
        icon={<StorefrontIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <SectionTitle title={t("keyMetrics")} subtitle={t("atAGlance")} />

      {loading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <Grid container spacing={2.5}>
          {stats.map((s) => (
            <Grid key={s.key} size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label={s.label}
                value={s.value}
                icon={s.icon}
                color={s.color}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
