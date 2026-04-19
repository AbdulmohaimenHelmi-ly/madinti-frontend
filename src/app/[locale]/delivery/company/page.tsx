"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

import { deliveryApi, type DeliveryCompany } from "@/lib/api/delivery";

export default function DeliveryCompanyPage() {
  const t = useTranslations("delivery");
  const [company, setCompany] = useState<DeliveryCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    deliveryApi
      .myCompany()
      .then((res) => setCompany(res.data.data))
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const update = <K extends keyof DeliveryCompany>(k: K, v: DeliveryCompany[K]) => {
    setCompany((c) => (c ? { ...c, [k]: v } : c));
  };

  const onSave = async () => {
    if (!company) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await deliveryApi.updateCompany({
        name: company.name,
        name_en: company.name_en ?? null,
        description: company.description ?? null,
        description_en: company.description_en ?? null,
        phone: company.phone ?? null,
        email: company.email ?? null,
        base_price: Number(company.base_price) || 0,
        is_active: company.is_active,
      });
      setCompany(res.data.data);
      setSuccess(t("saved"));
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!company) {
    return <Alert severity="error">{error || t("loadError")}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        {t("company")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("companySubtitle")}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={t("nameAr")}
                value={company.name}
                onChange={(e) => update("name", e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={t("nameEn")}
                value={company.name_en ?? ""}
                onChange={(e) => update("name_en", e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={t("phone")}
                value={company.phone ?? ""}
                onChange={(e) => update("phone", e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={t("email")}
                value={company.email ?? ""}
                onChange={(e) => update("email", e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={t("basePrice")}
                helperText={t("basePriceHelp")}
                type="number"
                value={company.base_price}
                onChange={(e) => update("base_price", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!company.is_active}
                    onChange={(e) => update("is_active", e.target.checked)}
                  />
                }
                label={t("isActive")}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={t("descriptionAr")}
                multiline
                minRows={3}
                value={company.description ?? ""}
                onChange={(e) => update("description", e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={t("descriptionEn")}
                multiline
                minRows={3}
                value={company.description_en ?? ""}
                onChange={(e) => update("description_en", e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={saving}
            >
              {saving ? t("saving") : t("save")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
