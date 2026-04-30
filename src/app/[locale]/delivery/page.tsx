"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Box, Grid } from "@mui/material";
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
import { StatCardsSkeleton } from "@/components/common/Skeletons";

export default function DeliveryDashboardPage() {
  const t = useTranslations("delivery");
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
    </Box>
  );
}
