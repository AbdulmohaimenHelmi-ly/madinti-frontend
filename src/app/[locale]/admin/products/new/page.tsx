"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";

import { adminApi } from "@/lib/api/admin";
import type { Brand, Category, ContentType, Vendor } from "@/lib/types";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAudienceOptions } from "@/components/common/AudienceChip";

interface CreateForm {
  vendor_id: number | "";
  category_id: number | "";
  brand_id: number | "";
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  price: string;
  compare_price: string;
  cost: string;
  sku: string;
  quantity: string;
  content_type: ContentType;
  is_active: boolean;
  is_featured: boolean;
}

export default function AdminCreateProductPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tContent = useTranslations("content");
  const uiLocale = useLocale();
  const audienceOptions = useAudienceOptions(false);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreateForm>({
    vendor_id: "",
    category_id: "",
    brand_id: "",
    name: "",
    name_en: "",
    description: "",
    description_en: "",
    price: "",
    compare_price: "",
    cost: "",
    sku: "",
    quantity: "0",
    content_type: "unisex",
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.getVendors({ per_page: 200 }),
      adminApi.getCategories(),
      adminApi.getBrands(),
    ])
      .then(([v, c, b]) => {
        if (!active) return;
        setVendors(v.data.data);
        setCategories(c.data.data);
        setBrands(b.data.data);
      })
      .catch(() => active && setError(t("loadError")))
      .finally(() => active && setBootstrapping(false));
    return () => {
      active = false;
    };
  }, [t]);

  const labelOf = (it: { name: string; name_en: string | null }) =>
    uiLocale === "en" && it.name_en ? it.name_en : it.name;

  const vendorLabel = (v: Vendor) =>
    uiLocale === "en" && v.store_name_en ? v.store_name_en : v.store_name;

  const handleSave = async () => {
    setError("");
    if (!form.vendor_id) {
      setError(t("vendorRequired"));
      return;
    }
    if (!form.category_id) {
      setError(t("nameRequired"));
      return;
    }
    if (!form.name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const created = await adminApi.createProduct({
        vendor_id: Number(form.vendor_id),
        category_id: Number(form.category_id),
        brand_id: form.brand_id === "" ? null : Number(form.brand_id),
        name: form.name.trim(),
        name_en: form.name_en.trim() || null,
        description: form.description || null,
        description_en: form.description_en || null,
        price: Number(form.price) || 0,
        compare_price: form.compare_price === "" ? null : Number(form.compare_price),
        cost: form.cost === "" ? null : Number(form.cost),
        sku: form.sku || null,
        quantity: Number(form.quantity) || 0,
        content_type: form.content_type,
        is_active: form.is_active,
        is_featured: form.is_featured,
      });
      router.push(`/${locale}/admin/products/${created.data.data.id}/edit`);
    } catch {
      setError(t("actionError"));
      setSaving(false);
    }
  };

  return (
    <Box>
      <Button
        component={Link}
        href={`/${locale}/admin/products`}
        startIcon={
          <ArrowBackIcon
            sx={{ transform: uiLocale === "ar" ? "scaleX(-1)" : "none" }}
          />
        }
        sx={{ mb: 2 }}
      >
        {t("backToProducts")}
      </Button>

      <AdminPageHeader
        title={t("addProduct")}
        subtitle={t("addProductSubtitle")}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {t("basicInfo")}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              label={t("selectVendor")}
              value={form.vendor_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, vendor_id: Number(e.target.value) }))
              }
              fullWidth
              size="small"
              required
              disabled={bootstrapping}
            >
              {vendors.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {vendorLabel(v)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              label={t("category")}
              value={form.category_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, category_id: Number(e.target.value) }))
              }
              fullWidth
              size="small"
              required
              disabled={bootstrapping}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {labelOf(c)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t("name")}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              size="small"
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={`${t("name")} (EN)`}
              value={form.name_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, name_en: e.target.value }))
              }
              fullWidth
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              label={tContent("contentType")}
              value={form.content_type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  content_type: e.target.value as ContentType,
                }))
              }
              fullWidth
              size="small"
            >
              {audienceOptions.map((o) => (
                <MenuItem key={o.value || "unisex"} value={o.value || "unisex"}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              label="Brand"
              value={form.brand_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  brand_id: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              fullWidth
              size="small"
            >
              <MenuItem value="">{tCommon("none")}</MenuItem>
              {brands.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {labelOf(b)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Description (AR)"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Description (EN)"
              value={form.description_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, description_en: e.target.value }))
              }
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {t("pricingInventory")}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label={tCommon("price")}
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              fullWidth
              size="small"
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {tCommon("currency")}
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Compare price"
              type="number"
              value={form.compare_price}
              onChange={(e) =>
                setForm((f) => ({ ...f, compare_price: e.target.value }))
              }
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label={tCommon("quantity")}
              type="number"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="SKU"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
              />
            }
            label={form.is_active ? t("active") : t("inactive")}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.is_featured}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_featured: e.target.checked }))
                }
              />
            }
            label={t("featured")}
          />
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 3 }}
          justifyContent="flex-end"
        >
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || bootstrapping}
            startIcon={<SaveIcon />}
          >
            {t("saveProduct")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
