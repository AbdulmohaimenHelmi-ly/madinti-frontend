"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
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

import { vendorApi } from "@/lib/api/vendor";
import type { Brand, Category, ContentType } from "@/lib/types";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { useAudienceOptions } from "@/components/common/AudienceChip";

interface CreateForm {
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
  has_variants: boolean;
}

export default function VendorCreateProductPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("vendor");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const audienceOptions = useAudienceOptions(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreateForm>({
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
    has_variants: false,
  });

  useEffect(() => {
    let active = true;
    Promise.all([vendorApi.listCategories(), vendorApi.listBrands()])
      .then(([c, b]) => {
        if (!active) return;
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
    locale === "en" && it.name_en ? it.name_en : it.name;

  const fieldDisabled = bootstrapping || saving;

  const handleSave = async () => {
    setError("");
    if (!form.category_id) {
      setError(tAdmin("nameRequired"));
      return;
    }
    if (!form.name.trim()) {
      setError(tAdmin("nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const created = await vendorApi.createProduct({
        category_id: Number(form.category_id),
        brand_id: form.brand_id === "" ? null : Number(form.brand_id),
        name: form.name.trim(),
        name_en: form.name_en.trim() || null,
        description: form.description || null,
        description_en: form.description_en || null,
        price: form.has_variants ? 0 : Number(form.price) || 0,
        compare_price:
          form.compare_price === "" ? null : Number(form.compare_price),
        cost: form.cost === "" ? null : Number(form.cost),
        sku: form.sku || null,
        quantity: form.has_variants ? 0 : Number(form.quantity) || 0,
        content_type: form.content_type,
        is_active: form.is_active,
        is_featured: form.is_featured,
        has_variants: form.has_variants,
      });
      router.push(`/${locale}/vendor/products/${created.data.data.id}/edit`);
    } catch {
      setError(t("actionError"));
      setSaving(false);
    }
  };

  return (
    <Box>
      <Button
        component={Link}
        href={`/${locale}/vendor/products`}
        startIcon={
          <ArrowBackIcon
            sx={{ transform: locale === "ar" ? "scaleX(-1)" : "none" }}
          />
        }
        sx={{ mb: 2 }}
      >
        {t("backToProducts")}
      </Button>

      <VendorPageHeader
        title={t("addProduct")}
        subtitle={t("addProductSubtitle")}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {tAdmin("basicInfo")}
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label={tAdmin("nameAr")}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                disabled={fieldDisabled}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label={tAdmin("nameEn")}
                value={form.name_en}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name_en: e.target.value }))
                }
                disabled={fieldDisabled}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={t("category")}
                value={form.category_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category_id: Number(e.target.value) || "" }))
                }
                required
                disabled={fieldDisabled}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {labelOf(category)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={tAdmin("brand")}
                value={form.brand_id}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    brand_id: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                disabled={fieldDisabled}
              >
                <MenuItem value="">{t("none")}</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand.id} value={brand.id}>
                    {labelOf(brand)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={tAdmin("audience")}
                value={form.content_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    content_type: e.target.value as ContentType,
                  }))
                }
                disabled={fieldDisabled}
              >
                {audienceOptions.map((option) => (
                  <MenuItem key={option.value || "unisex"} value={option.value || "unisex"}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label={tAdmin("descriptionAr")}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                disabled={fieldDisabled}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label={tAdmin("descriptionEn")}
                value={form.description_en}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description_en: e.target.value }))
                }
                disabled={fieldDisabled}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(_, checked) =>
                      setForm((f) => ({ ...f, is_active: checked }))
                    }
                    disabled={fieldDisabled}
                  />
                }
                label={t("active")}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_featured}
                    onChange={(_, checked) =>
                      setForm((f) => ({ ...f, is_featured: checked }))
                    }
                    disabled={fieldDisabled}
                  />
                }
                label={t("featured")}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            sx={{
              mb: 2,
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {tAdmin("pricingStock")}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={form.has_variants}
                  onChange={(_, checked) =>
                    setForm((f) => ({ ...f, has_variants: checked }))
                  }
                  disabled={fieldDisabled}
                />
              }
              label={tAdmin("hasVariants")}
            />
          </Stack>

          {form.has_variants ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {tAdmin("createVariantsAfterSave")}
            </Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={tCommon("price")}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  disabled={fieldDisabled}
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
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={tAdmin("comparePrice")}
                  value={form.compare_price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, compare_price: e.target.value }))
                  }
                  disabled={fieldDisabled}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={tCommon("quantity")}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  disabled={fieldDisabled}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={tAdmin("sku")}
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  disabled={fieldDisabled}
                />
              </Grid>
            </Grid>
          )}

          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={fieldDisabled}
              startIcon={<SaveIcon />}
            >
              {tCommon("save")}
            </Button>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
