"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Box, Card, CardContent, Grid, Typography } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CategoryIcon from "@mui/icons-material/Category";
import InventoryIcon from "@mui/icons-material/Inventory";

import { adminApi } from "@/lib/api/admin";
import { productsApi } from "@/lib/api/products";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Stat {
  key: string;
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [usersRes, vendorsRes, categoriesRes, productsRes] =
          await Promise.all([
            adminApi.getUsers({ per_page: 1 }),
            adminApi.getVendors({ per_page: 1 }),
            adminApi.getCategories(),
            productsApi.getAll({ per_page: 1 }),
          ]);

        if (!active) return;

        const next: Stat[] = [
          {
            key: "users",
            label: t("users"),
            value: usersRes.data.meta?.total ?? 0,
            icon: <PeopleIcon />,
            color: "#1976d2",
          },
          {
            key: "vendors",
            label: t("vendors"),
            value: vendorsRes.data.meta?.total ?? 0,
            icon: <StorefrontIcon />,
            color: "#2e7d32",
          },
          {
            key: "categories",
            label: t("categories"),
            value: categoriesRes.data.data?.length ?? 0,
            icon: <CategoryIcon />,
            color: "#ed6c02",
          },
          {
            key: "products",
            label: t("products"),
            value: productsRes.data.meta?.total ?? 0,
            icon: <InventoryIcon />,
            color: "#9c27b0",
          },
        ];

        setStats(next);
      } catch {
        if (active) setError(t("loadError"));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [t]);

  return (
    <Box>
      <AdminPageHeader
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
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
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
      )}
    </Box>
  );
}
