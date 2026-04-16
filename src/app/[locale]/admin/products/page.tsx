"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { productsApi } from "@/lib/api/products";
import type { Product } from "@/lib/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";

export default function AdminProductsPage() {
  const t = useTranslations("admin");
  const tProduct = useTranslations("product");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await productsApi.getAll({ per_page: 50 });
      setProducts(res.data.data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const productName = (p: Product) =>
    locale === "en" && p.name_en ? p.name_en : p.name;

  const filteredProducts = products.filter((p) => {
    if (status === "1" && !p.is_active) return false;
    if (status === "0" && p.is_active) return false;
    if (search) {
      const q = search.toLowerCase();
      const n = (productName(p) || "").toLowerCase();
      const v = (p.vendor?.store_name || "").toLowerCase();
      if (!n.includes(q) && !v.includes(q)) return false;
    }
    return true;
  });

  const vendorName = (p: Product) =>
    p.vendor
      ? locale === "en" && p.vendor.store_name_en
        ? p.vendor.store_name_en
        : p.vendor.store_name
      : "—";

  const categoryName = (p: Product) =>
    p.category
      ? locale === "en" && p.category.name_en
        ? p.category.name_en
        : p.category.name
      : "—";

  return (
    <Box>
      <AdminPageHeader
        title={t("products")}
        subtitle={t("productsSubtitle")}
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchProducts")}
        selects={[
          {
            key: "status",
            label: t("status"),
            value: status,
            onChange: setStatus,
            options: [
              { value: "", label: t("allStatuses") },
              { value: "1", label: t("active") },
              { value: "0", label: t("inactive") },
            ],
          },
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : filteredProducts.length === 0 ? (
        <EmptyState message={tProduct("noProducts")} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("name")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tProduct("vendor")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tProduct("category")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tCommon("price")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tCommon("quantity")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {productName(p)}
                  </TableCell>
                  <TableCell>{vendorName(p)}</TableCell>
                  <TableCell>{categoryName(p)}</TableCell>
                  <TableCell>
                    {p.price} {tCommon("currency")}
                  </TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Chip
                        size="small"
                        color={p.is_active ? "success" : "default"}
                        label={p.is_active ? t("active") : t("inactive")}
                        sx={{ fontWeight: 600 }}
                      />
                      {p.is_featured && (
                        <Chip
                          size="small"
                          color="warning"
                          label={tProduct("featured")}
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
