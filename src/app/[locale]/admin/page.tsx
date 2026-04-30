"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Alert, Box, Grid } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import PeopleIcon from "@mui/icons-material/People";
import StorefrontIcon from "@mui/icons-material/Storefront";
import InventoryIcon from "@mui/icons-material/Inventory";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import DashboardIcon from "@mui/icons-material/Dashboard";

import { adminApi, type AdminDashboardPayload } from "@/lib/api/admin";
import { StatCardsSkeleton } from "@/components/common/Skeletons";
import StatCard from "@/components/common/StatCard";
import DashboardHero from "@/components/common/DashboardHero";
import SectionTitle from "@/components/common/SectionTitle";
import ChartCard from "@/components/common/ChartCard";

const STATUS_COLORS: Record<string, string> = {
  pending: "#ed6c02",
  processing: "#0288d1",
  shipped: "#1976d2",
  delivered: "#2e7d32",
  cancelled: "#d32f2f",
  refunded: "#9c27b0",
};

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const tStatus = useTranslations("orders.statuses");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AdminDashboardPayload | null>(null);

  useEffect(() => {
    let active = true;
    adminApi
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

  const currency = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", {
      maximumFractionDigits: 2,
    }).format(n || 0);

  const stats = data
    ? [
        {
          key: "users",
          label: t("users"),
          value: data.totals.users,
          icon: <PeopleIcon />,
          color: "#1976d2",
        },
        {
          key: "vendors",
          label: t("vendors"),
          value: data.totals.vendors,
          icon: <StorefrontIcon />,
          color: "#2e7d32",
        },
        {
          key: "products",
          label: t("products"),
          value: data.totals.products,
          icon: <InventoryIcon />,
          color: "#9c27b0",
        },
        {
          key: "orders",
          label: t("orders"),
          value: data.totals.orders,
          icon: <ReceiptLongIcon />,
          color: "#0F172A",
        },
        {
          key: "revenue",
          label: t("revenue"),
          value: currency(data.totals.revenue),
          icon: <PaymentsIcon />,
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
    () => data?.charts.orders_daily.map((p) => dateLabel(p.date)) ?? [],
    [data, dateLabel]
  );
  const chartOrders = useMemo(
    () => data?.charts.orders_daily.map((p) => p.orders) ?? [],
    [data]
  );
  const chartRevenue = useMemo(
    () => data?.charts.orders_daily.map((p) => p.revenue) ?? [],
    [data]
  );
  const chartUsers = useMemo(
    () => data?.charts.users_daily.map((p) => p.users) ?? [],
    [data]
  );
  const statusPieData = useMemo(
    () =>
      data?.charts.status_breakdown.map((s, i) => ({
        id: i,
        value: s.count,
        label: tStatus(s.status),
        color: STATUS_COLORS[s.status] ?? "#90a4ae",
      })) ?? [],
    [data, tStatus]
  );
  const topVendors = data?.charts.top_vendors ?? [];

  return (
    <Box>
      <DashboardHero
        eyebrow={t("adminPanel")}
        title={t("dashboard")}
        subtitle={t("dashboardSubtitle")}
        icon={<DashboardIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <SectionTitle title={t("keyMetrics")} subtitle={t("atAGlance")} />

      {loading ? (
        <StatCardsSkeleton count={5} />
      ) : (
        <Grid container spacing={2.5}>
          {stats.map((s) => (
            <Grid key={s.key} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
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

      {!loading && data && (
        <Box sx={{ mt: 4 }}>
          <SectionTitle
            title={t("analytics")}
            subtitle={t("analyticsSubtitle")}
          />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 8 }}>
              <ChartCard title={t("ordersTrend")} height={280}>
                <LineChart
                  margin={{ left: 50, right: 60, top: 16, bottom: 30 }}
                  xAxis={[
                    {
                      data: chartDates,
                      scaleType: "point",
                      tickLabelStyle: { fontSize: 11 },
                    },
                  ]}
                  yAxis={[
                    { id: "orders", scaleType: "linear" },
                    { id: "revenue", scaleType: "linear", position: "right" },
                  ]}
                  series={[
                    {
                      yAxisId: "orders",
                      data: chartOrders,
                      label: t("ordersTrend"),
                      color: "#1976d2",
                      area: true,
                      curve: "monotoneX",
                      showMark: false,
                    },
                    {
                      yAxisId: "revenue",
                      data: chartRevenue,
                      label: t("revenueTrend"),
                      color: "#2e7d32",
                      curve: "monotoneX",
                      showMark: false,
                    },
                  ]}
                  grid={{ horizontal: true }}
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
            <Grid size={{ xs: 12, md: 6 }}>
              <ChartCard title={t("newUsersTrend")} height={260}>
                <BarChart
                  margin={{ left: 50, right: 16, top: 16, bottom: 30 }}
                  xAxis={[
                    {
                      data: chartDates,
                      scaleType: "band",
                      tickLabelStyle: { fontSize: 10 },
                    },
                  ]}
                  series={[
                    {
                      data: chartUsers,
                      label: t("users"),
                      color: "#0288d1",
                    },
                  ]}
                  grid={{ horizontal: true }}
                  hideLegend
                  borderRadius={4}
                />
              </ChartCard>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ChartCard title={t("topVendorsChart")} height={260}>
                {topVendors.length === 0 ? (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.secondary",
                      fontSize: 13,
                    }}
                  >
                    —
                  </Box>
                ) : (
                  <BarChart
                    layout="horizontal"
                    margin={{ left: 120, right: 16, top: 16, bottom: 30 }}
                    yAxis={[
                      {
                        data: topVendors.map((v) => v.name),
                        scaleType: "band",
                        tickLabelStyle: { fontSize: 11 },
                      },
                    ]}
                    series={[
                      {
                        data: topVendors.map((v) => v.revenue),
                        label: t("revenue"),
                        color: "#9c27b0",
                      },
                    ]}
                    grid={{ vertical: true }}
                    hideLegend
                    borderRadius={6}
                  />
                )}
              </ChartCard>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}
