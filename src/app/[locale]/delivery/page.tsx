"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Alert, Box, Grid } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ListAltIcon from "@mui/icons-material/ListAlt";

import { deliveryApi, type DeliveryDashboardPayload } from "@/lib/api/delivery";
import StatCard from "@/components/common/StatCard";
import DashboardHero from "@/components/common/DashboardHero";
import SectionTitle from "@/components/common/SectionTitle";
import ChartCard from "@/components/common/ChartCard";
import { StatCardsSkeleton } from "@/components/common/Skeletons";

const STATUS_COLORS: Record<string, string> = {
  pending: "#ed6c02",
  processing: "#0288d1",
  shipped: "#1976d2",
  delivered: "#2e7d32",
  cancelled: "#d32f2f",
  refunded: "#9c27b0",
};

export default function DeliveryDashboardPage() {
  const t = useTranslations("delivery");
  const tStatus = useTranslations("orders.statuses");
  const locale = useLocale();
  const [data, setData] = useState<DeliveryDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    deliveryApi
      .dashboard()
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

  const stats = data
    ? [
        {
          key: "ordersTotal",
          label: t("ordersTotal"),
          value: data.stats.orders_total,
          icon: <ListAltIcon />,
          color: "#0F172A",
        },
        {
          key: "ordersPending",
          label: t("ordersPending"),
          value: data.stats.orders_pending,
          icon: <HourglassEmptyIcon />,
          color: "#ed6c02",
        },
        {
          key: "ordersInTransit",
          label: t("ordersInTransit"),
          value: data.stats.orders_in_transit,
          icon: <LocalShippingOutlinedIcon />,
          color: "#1976d2",
        },
        {
          key: "ordersDelivered",
          label: t("ordersDelivered"),
          value: data.stats.orders_delivered,
          icon: <CheckCircleIcon />,
          color: "#2e7d32",
        },
        {
          key: "prices",
          label: t("pricesCount"),
          value: data.stats.prices_count,
          icon: <PriceChangeIcon />,
          color: "#1976d2",
        },
        {
          key: "cities",
          label: t("citiesCovered"),
          value: data.stats.cities_covered,
          icon: <LocationCityIcon />,
          color: "#2e7d32",
        },
        {
          key: "vendors",
          label: t("vendorsCount"),
          value: data.stats.vendors_count,
          icon: <StorefrontIcon />,
          color: "#9c27b0",
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
  const chartOrders = useMemo(
    () => data?.charts?.orders_daily.map((p) => p.orders) ?? [],
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
  const topVendorsData = data?.charts?.top_vendors ?? [];

  return (
    <Box>
      <DashboardHero
        eyebrow={data?.company?.name ?? t("dashboard")}
        title={t("dashboard")}
        subtitle={t("dashboardSubtitle")}
        icon={<LocalShippingIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <SectionTitle title={t("keyMetrics")} subtitle={t("atAGlance")} />

      <Grid container spacing={2.5}>
        {loading
          ? null
          : stats.map((s) => (
              <Grid key={s.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <StatCard
                  label={s.label}
                  value={s.value}
                  icon={s.icon}
                  color={s.color}
                />
              </Grid>
            ))}
        {loading && (
          <Grid size={12}>
            <StatCardsSkeleton count={6} />
          </Grid>
        )}
      </Grid>

      {!loading && data?.charts && (
        <Box sx={{ mt: 4 }}>
          <SectionTitle
            title={t("analytics")}
            subtitle={t("analyticsSubtitle")}
          />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 8 }}>
              <ChartCard title={t("ordersTrend")} height={280}>
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
                      label: t("ordersTrend"),
                      color: "#1976d2",
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
            {topVendorsData.length > 0 && (
              <Grid size={12}>
                <ChartCard title={t("topVendorsChart")} height={280}>
                  <BarChart
                    margin={{ left: 50, right: 16, top: 16, bottom: 50 }}
                    xAxis={[
                      {
                        data: topVendorsData.map((v) => v.name),
                        scaleType: "band",
                        tickLabelStyle: { fontSize: 11 },
                      },
                    ]}
                    series={[
                      {
                        data: topVendorsData.map((v) => v.count),
                        label: t("ordersTotal"),
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
          </Grid>
        </Box>
      )}
    </Box>
  );
}
