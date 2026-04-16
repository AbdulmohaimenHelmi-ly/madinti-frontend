"use client";
import { useTranslations } from "next-intl";
import { Typography } from "@mui/material";
import EmptyState from "@/components/common/EmptyState";

export default function VendorOrdersPage() {
  const t = useTranslations();
  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>{t("vendor.myOrders")}</Typography>
      <EmptyState message={t("order.noOrders")} />
    </>
  );
}
