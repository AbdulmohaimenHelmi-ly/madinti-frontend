"use client";

import { useEffect, useState } from "react";
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
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import DataPagination from "@/components/common/DataPagination";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { vendorApi } from "@/lib/api/vendor";
import type { Product } from "@/lib/types";

const PER_PAGE = 15;

export default function VendorProductsPage() {
  const t = useTranslations("vendor");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    vendorApi
      .getProducts({ per_page: PER_PAGE, page })
      .then((res) => {
        if (!active) return;
        setProducts(res.data.data);
        setLastPage(res.data.meta.last_page);
        setTotal(res.data.meta.total);
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
  }, [t, page]);

  const productName = (p: Product) =>
    locale === "en" && p.name_en ? p.name_en : p.name;

  const filtered = products.filter((p) =>
    search ? productName(p).toLowerCase().includes(search.toLowerCase()) : true
  );

  const currency = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", {
      maximumFractionDigits: 2,
    }).format(Number(n) || 0);

  return (
    <Box>
      <VendorPageHeader
        title={t("myProducts")}
        subtitle={t("myProductsSubtitle")}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <TextField
          size="small"
          placeholder={tCommon("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.disabled" }} />
              ),
            },
          }}
          sx={{ minWidth: 280 }}
        />
      </Paper>

      {loading ? (
        <TableRowsSkeleton rows={6} columns={4} />
      ) : filtered.length === 0 ? (
        <EmptyState message={t("noProducts")} />
      ) : (
        <>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("product")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("price")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("stock")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => {
                const img = p.images?.find((i) => i.is_primary) ?? p.images?.[0];
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            overflow: "hidden",
                            bgcolor: "grey.100",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "grey.400",
                            flexShrink: 0,
                          }}
                        >
                          {img ? (
                            <Box
                              component="img"
                              src={img.image}
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
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                            noWrap
                          >
                            {productName(p)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.sku || "—"}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{currency(p.price)}</TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={p.is_active ? t("active") : t("inactive")}
                        color={p.is_active ? "success" : "default"}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
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
