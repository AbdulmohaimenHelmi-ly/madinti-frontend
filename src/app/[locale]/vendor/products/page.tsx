
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import SearchIcon from "@mui/icons-material/Search";

import AudienceChip, {
  useAudienceOptions,
} from "@/components/common/AudienceChip";
import DataPagination from "@/components/common/DataPagination";
import EmptyState from "@/components/common/EmptyState";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { vendorApi } from "@/lib/api/vendor";
import type { Product } from "@/lib/types";

const PER_PAGE = 15;

export default function VendorProductsPage() {
  const locale = useLocale();
  const t = useTranslations("vendor");
  const tCommon = useTranslations("common");
  const audienceOptions = useAudienceOptions(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState<{
    msg: string;
    sev: "success" | "error";
  } | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [audience, setAudience] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorApi.getProducts({ page, per_page: PER_PAGE });
      setProducts(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    load();
  }, [load]);

  const productName = (product: Product) =>
    locale === "en" && product.name_en ? product.name_en : product.name;

  const categoryName = (product: Product) => {
    if (!product.category) return t("none");
    return locale === "en" && product.category.name_en
      ? product.category.name_en
      : product.category.name;
  };

  const primaryImage = (product: Product) =>
    product.images?.find((item) => item.is_primary)?.image ??
    product.images?.[0]?.image ??
    product.image ??
    null;

  const currency = (value: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      productName(product).toLowerCase().includes(query) ||
      (product.sku ?? "").toLowerCase().includes(query);
    const matchesStatus =
      !status ||
      (status === "active" ? product.is_active : !product.is_active);
    const matchesAudience =
      !audience || (product.content_type ?? "unisex") === audience;
    return matchesSearch && matchesStatus && matchesAudience;
  });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await vendorApi.deleteProduct(confirmDelete.id);
      setConfirmDelete(null);
      setSnack({ msg: t("productDeleted"), sev: "success" });
      if (products.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await load();
      }
    } catch {
      setSnack({ msg: t("actionError"), sev: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <VendorPageHeader
        title={t("myProducts")}
        subtitle={t("myProductsSubtitle")}
        action={{
          label: t("addProduct"),
          icon: <AddIcon />,
          href: `/${locale}/vendor/products/new`,
        }}
      />

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder={t("searchProducts")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label={tCommon("status")}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            sx={{ minWidth: { xs: "100%", md: 180 } }}
          >
            <MenuItem value="">{t("allStatuses")}</MenuItem>
            <MenuItem value="active">{t("active")}</MenuItem>
            <MenuItem value="inactive">{t("inactive")}</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label={t("audience")}
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            sx={{ minWidth: { xs: "100%", md: 180 } }}
          >
            {audienceOptions.map((option) => (
              <MenuItem key={option.value || "all"} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {loading ? (
          <Box sx={{ p: 2 }}>
            <TableRowsSkeleton rows={8} />
          </Box>
        ) : filteredProducts.length === 0 ? (
          <EmptyState message={t("noProducts")} />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{tCommon("product")}</TableCell>
                    <TableCell>{t("category")}</TableCell>
                    <TableCell>{tCommon("price")}</TableCell>
                    <TableCell>{tCommon("stock")}</TableCell>
                    <TableCell>{t("audience")}</TableCell>
                    <TableCell>{tCommon("status")}</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const image =
                      product.images?.find((item) => item.is_primary) ??
                      product.images?.[0];

                    return (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "center" }}
                          >
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
                              {primaryImage(product) ? (
                                <Box
                                  component="img"
                                  src={primaryImage(product) ?? undefined}
                                  alt={productName(product)}
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
                              <Typography sx={{ fontWeight: 700 }} noWrap>
                                {productName(product)}
                              </Typography>
                              {product.sku ? (
                                <Typography variant="caption" color="text.secondary">
                                  {product.sku}
                                </Typography>
                              ) : null}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{categoryName(product)}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {currency(product.price)} {tCommon("currency")}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={product.quantity}
                            color={
                              product.quantity > 10
                                ? "success"
                                : product.quantity > 0
                                  ? "warning"
                                  : "error"
                            }
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <AudienceChip value={product.content_type} />
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            useFlexGap
                            sx={{ flexWrap: "wrap" }}
                          >
                            <Chip
                              size="small"
                              color={product.is_active ? "success" : "default"}
                              label={product.is_active ? t("active") : t("inactive")}
                              sx={{ fontWeight: 600 }}
                            />
                            {product.is_featured && (
                              <Chip
                                size="small"
                                color="warning"
                                label={t("featured")}
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}
                            useFlexGap
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              component={Link}
                              href={`/${locale}/vendor/products/${product.id}/edit`}
                              startIcon={<EditIcon />}
                            >
                              {tCommon("edit")}
                            </Button>
                            <Tooltip title={tCommon("delete")}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setConfirmDelete(product)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
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
      </Paper>

      <Dialog
        open={confirmDelete != null}
        onClose={() => !deleting && setConfirmDelete(null)}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{tCommon("delete")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("confirmDelete")}
            {confirmDelete && (
              <Box component="span" sx={{ display: "block", mt: 1, fontWeight: 700 }}>
                {productName(confirmDelete)}
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} disabled={deleting}>
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {tCommon("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack != null}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ borderRadius: 2 }}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
