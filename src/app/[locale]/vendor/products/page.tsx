"use client";
import { useTranslations } from "next-intl";
import { Typography, Button, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EmptyState from "@/components/common/EmptyState";

export default function VendorProductsPage() {
  const t = useTranslations();
  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t("vendor.myProducts")}</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>{t("common.addToCart")}</Button>
      </Box>
      <EmptyState message={t("product.noProducts")} />
    </>
  );
}
