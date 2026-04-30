"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Box, Grid } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CategoryIcon from "@mui/icons-material/Category";
import InventoryIcon from "@mui/icons-material/Inventory";
import DashboardIcon from "@mui/icons-material/Dashboard";

import { adminApi } from "@/lib/api/admin";
import { productsApi } from "@/lib/api/products";
import { StatCardsSkeleton } from "@/components/common/Skeletons";
import StatCard from "@/components/common/StatCard";
import DashboardHero from "@/components/common/DashboardHero";
import SectionTitle from "@/components/common/SectionTitle";

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
