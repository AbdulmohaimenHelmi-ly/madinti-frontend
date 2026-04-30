"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Alert, Box, Grid } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InventoryIcon from "@mui/icons-material/Inventory";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StarIcon from "@mui/icons-material/Star";
import StorefrontIcon from "@mui/icons-material/Storefront";

import { StatCardsSkeleton } from "@/components/common/Skeletons";
import StatCard from "@/components/common/StatCard";
import DashboardHero from "@/components/common/DashboardHero";
import SectionTitle from "@/components/common/SectionTitle";
import ChartCard from "@/components/common/ChartCard";
import { vendorApi, type VendorDashboardPayload } from "@/lib/api/vendor";

const STATUS_COLORS: Record<string, string> = {
  pending: "#ed6c02",
  processing: "#0288d1",
  shipped: "#1976d2",
  delivered: "#2e7d32",
  cancelled: "#d32f2f",
  refunded: "#9c27b0",
};

interface Stat {
  key: string;
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export default function VendorDashboardPage() {
  const t = useTranslations("vendor");
  const tStatus = useTranslations("order.statuses");
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

  const dateLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-US", {
      month: "short",
      day: "numeric",
    });
    return (iso: string) => {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? iso : fmt.format(d);
    };
  }, [locale]);

  const chartDates = useMemo(
    () => data?.charts?.orders_daily.map((p) => dateLabel(p.date)) ?? [],
    [data, dateLabel]
  );
  const chartRevenue = useMemo(
    () => data?.charts?.orders_daily.map((p) => p.revenue) ?? [],
    [data]
  );
  const statusPieData = useMemo(
    () =>
      data?.charts?.status_breakdown.map((s, i) => ({
        id: i,
        value: s.count,
        label: tStatus(s.status),
        color: STATUS_COLORS[s.status] ?? "#90a4ae",
      })) ?? [],
    [data, tStatus]
  );
  const topProducts = data?.charts?.top_products ?? [];
  const ordersByWeekday = data?.charts?.orders_by_weekday ?? [];
  const revenueByStatus = data?.charts?.revenue_by_status ?? [];
  const chartOrders = useMemo(
    () => data?.charts?.orders_daily.map((p) => p.orders) ?? [],
    [data]
  );
  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-US", {
      weekday: "short",
    });
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2024, 0, 7 + i))
    );
  }, [locale]);

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

      {!loading && data?.charts && (
        <Box sx={{ mt: 4 }}>
          <SectionTitle
            title={t("analytics")}
            subtitle={t("analyticsSubtitle")}
          />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 8 }}>
              <ChartCard title={t("revenueTrend")} height={280}>
                <LineChart
                  margin={{ left: 60, right: 16, top: 16, bottom: 30 }}
                  xAxis={[
                    {
                      data: chartDates,
                      scaleType: "point",
                      tickLabelStyle: { fontSize: 11 },
                    },
                  ]}
                  series={[
                    {
                      data: chartRevenue,
                      label: t("revenueTrend"),
                      color: "#2e7d32",
                      area: true,
                      curve: "monotoneX",
                      showMark: false,
                    },
                  ]}
                  grid={{ horizontal: true }}
                  hideLegend
                />
              </ChartCard>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ChartCard title={t("statusBreakdown")} height={280}>
                <PieChart
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                  series={[
                    {
                      innerRadius: 50,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      data: statusPieData,
                      arcLabel: (item) =>
                        item.value > 0 ? `${item.value}` : "",
                      arcLabelMinAngle: 25,
                    },
                  ]}
                  hideLegend={false}
                  slotProps={{
                    legend: {
                      direction: "horizontal",
                      position: { vertical: "bottom", horizontal: "center" },
                      sx: { fontSize: 11 },
                    },
                  }}
                />
              </ChartCard>
            </Grid>
            {topProducts.length > 0 && (
              <Grid size={12}>
                <ChartCard title={t("topProductsChart")} height={280}>
                  <BarChart
                    margin={{ left: 50, right: 16, top: 16, bottom: 60 }}
                    xAxis={[
                      {
                        data: topProducts.map((p) => p.name),
                        scaleType: "band",
                        tickLabelStyle: { fontSize: 11 },
                      },
                    ]}
                    series={[
                      {
                        data: topProducts.map((p) => p.quantity),
                        label: t("totalProducts"),
                        color: "#9c27b0",
                      },
                    ]}
                    grid={{ horizontal: true }}
                    hideLegend
                    borderRadius={6}
                  />
                </ChartCard>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 8 }}>
              <ChartCard title={t("ordersTrend")} height={260}>
                <LineChart
                  margin={{ left: 50, right: 16, top: 16, bottom: 30 }}
                  xAxis={[
                    {
                      data: chartDates,
                      scaleType: "point",
                      tickLabelStyle: { fontSize: 11 },
                    },
                  ]}
                  series={[
                    {
                      data: chartOrders,
                      label: t("totalOrders"),
                      color: "#1976d2",
                      curve: "monotoneX",
                      showMark: false,
                    },
                  ]}
                  grid={{ horizontal: true }}
                  hideLegend
                />
              </ChartCard>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ChartCard title={t("weekdayDistribution")} height={260}>
                <BarChart
                  margin={{ left: 40, right: 16, top: 16, bottom: 30 }}
                  xAxis={[
                    {
                      data: weekdayLabels,
                      scaleType: "band",
                      tickLabelStyle: { fontSize: 10 },
                    },
                  ]}
                  series={[
                    {
                      data: ordersByWeekday.map((d) => d.count),
                      label: t("totalOrders"),
                      color: "#0288d1",
                    },
                  ]}
                  grid={{ horizontal: true }}
                  hideLegend
                  borderRadius={4}
                />
              </ChartCard>
            </Grid>
            <Grid size={12}>
              <ChartCard title={t("revenueByStatus")} height={260}>
                <BarChart
                  margin={{ left: 70, right: 16, top: 16, bottom: 40 }}
                  xAxis={[
                    {
                      data: revenueByStatus.map((s) => tStatus(s.status)),
                      scaleType: "band",
                      tickLabelStyle: { fontSize: 11 },
                    },
                  ]}
                  series={[
                    {
                      data: revenueByStatus.map((s) => s.revenue),
                      label: t("totalSales"),
                      color: "#2e7d32",
                      valueFormatter: (v) => (v == null ? "" : currency(v)),
                    },
                  ]}
                  grid={{ horizontal: true }}
                  hideLegend
                  borderRadius={6}
                />
              </ChartCard>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}
