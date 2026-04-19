"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import LocationCityIcon from "@mui/icons-material/LocationCity";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

import { deliveryApi, type DeliveryDashboardPayload } from "@/lib/api/delivery";

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
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        {t("dashboard")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("dashboardSubtitle")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {data?.company && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
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
              <LocalShippingIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                {t("companyName")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
                {data.company.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("basePrice")}: {Number(data.company.base_price).toFixed(2)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      <Grid container spacing={3}>
        {(loading ? [1, 2, 3] : stats).map((s, i) => (
          <Grid key={typeof s === "object" ? s.key : i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                {typeof s === "object" ? (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: `${s.color}1a`,
                        color: s.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {s.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {s.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {s.value}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Box sx={{ height: 64 }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
