"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

import { adminApi } from "@/lib/api/admin";
import type { Product } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";
import AudienceChip, { useAudienceOptions } from "@/components/common/AudienceChip";
import DataPagination from "@/components/common/DataPagination";

const PER_PAGE = 15;

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
  const [audience, setAudience] = useState("");
  const tContent = useTranslations("content");
  const audienceOptions = useAudienceOptions(true);

  // Server-side pagination state.
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getProducts({ per_page: PER_PAGE, page });
      setProducts(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, page]);

  useEffect(() => {
    load();
  }, [load]);

  const productName = (p: Product) =>
    locale === "en" && p.name_en ? p.name_en : p.name;

  const filteredProducts = products.filter((p) => {
    if (status === "1" && !p.is_active) return false;
    if (status === "0" && p.is_active) return false;
    if (audience && (p.content_type ?? "unisex") !== audience) return false;
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

  const primaryImage = (p: Product) =>
    p.images?.find((img) => img.is_primary)?.image ??
    p.images?.[0]?.image ??
    p.image ??
    null;

  return (
    <Box>
      <AdminPageHeader
        title={t("products")}
        subtitle={t("productsSubtitle")}
        action={{
          label: t("addProduct"),
          icon: <AddIcon />,
          href: `/${locale}/admin/products/new`,
        }}
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
          {
            key: "audience",
            label: tContent("contentType"),
            value: audience,
            onChange: setAudience,
            options: audienceOptions,
          },
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={5} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState message={tProduct("noProducts")} />
      ) : (
        <>
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
                <TableCell sx={{ fontWeight: 700 }}>
                  {tContent("contentType")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          overflow: "hidden",
                          bgcolor: "grey.100",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "grey.400",
                          flexShrink: 0,
                        }}
                      >
                        {primaryImage(p) ? (
                          <Box
                            component="img"
                            src={primaryImage(p) ?? undefined}
                            alt={productName(p)}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <ImageNotSupportedIcon fontSize="small" />
                        )}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {productName(p)}
                        </Box>
                        {p.sku ? (
                          <Box sx={{ color: "text.secondary", fontSize: 12 }}>
                            {p.sku}
                          </Box>
                        ) : null}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{vendorName(p)}</TableCell>
                  <TableCell>{categoryName(p)}</TableCell>
                  <TableCell>
                    {p.price} {tCommon("currency")}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={p.quantity}
                      color={
                        p.quantity > 10
                          ? "success"
                          : p.quantity > 0
                            ? "warning"
                            : "error"
                      }
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <AudienceChip value={p.content_type} />
                  </TableCell>
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
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      component={Link}
                      href={`/${locale}/admin/products/${p.id}/edit`}
                      startIcon={<EditIcon />}
                    >
                      {tCommon("edit")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
          <DataPagination
            page={page}
            lastPage={lastPage}
            total={total}
            perPage={PER_PAGE}
            onChange={setPage}
          />
        </>
      )}
    </Box>
  );
}
