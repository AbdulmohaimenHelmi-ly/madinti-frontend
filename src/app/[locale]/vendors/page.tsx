"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Container, Typography, Grid } from "@mui/material";
import VendorCard from "@/components/vendors/VendorCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import type { Vendor } from "@/lib/types";
import { vendorsApi } from "@/lib/api/vendors";

export default function VendorsPage() {
  const t = useTranslations();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    vendorsApi.getAll().then((res) => setVendors(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingSpinner />;
  if (vendors.length === 0) return <EmptyState message={t("vendor.noVendors")} />;
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>{t("vendor.title")}</Typography>
      <Grid container spacing={3}>
        {vendors.map((v) => (<Grid key={v.id} size={{ xs: 12, sm: 6, md: 4 }}><VendorCard vendor={v} /></Grid>))}
      </Grid>
    </Container>
  );
}
