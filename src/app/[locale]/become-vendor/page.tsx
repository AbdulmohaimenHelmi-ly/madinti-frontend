"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";

import {
  vendorApplicationsApi,
  type ApplyVendorPayload,
  type VendorApplication,
} from "@/lib/api/vendorApplications";
import { citiesApi, type Area, type City } from "@/lib/api/cities";
import { useAuthStore } from "@/lib/store/authStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const emptyForm: ApplyVendorPayload = {
  store_name: "",
  store_name_en: "",
  description: "",
  phone: "",
  city_id: null,
  area_id: null,
  address: "",
};

const statusColor = (s: VendorApplication["status"]) =>
  s === "approved" ? "success" : s === "rejected" ? "error" : "warning";

export default function BecomeVendorPage() {
  const t = useTranslations("vendorApplication");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const initialize = useAuthStore((s) => s.initialize);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [form, setForm] = useState<ApplyVendorPayload>(emptyForm);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    citiesApi.list().then((res) => setCities(res.data.data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!form.city_id) {
      setAreas([]);
      return;
    }
    citiesApi
      .areasOf(form.city_id)
      .then((res) => setAreas(res.data.data))
      .catch(() => setAreas([]));
  }, [form.city_id]);

  useEffect(() => {
    if (!user && !token) initialize();
  }, [user, token, initialize]);

  useEffect(() => {
    if (!user && !token) {
      router.replace(`/${locale}/auth/login`);
    }
  }, [user, token, locale, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const res = await vendorApplicationsApi.getMine();
        if (active) setApplication(res.data.data);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.store_name.trim()) {
      setError(t("storeNameRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await vendorApplicationsApi.apply(form);
      setApplication(res.data.data);
      setSnackbar(t("submitted"));
      setForm(emptyForm);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("submitError");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) return <LoadingSpinner />;

  if (user.is_vendor) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="info">{t("alreadyVendor")}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={() => router.push(`/${locale}/vendor`)}
          >
            {t("goToDashboard")}
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #FFB744 0%, #E6A33E 100%)",
            color: "white",
          }}
        >
          <StorefrontIcon />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t("title")}
          </Typography>
          <Typography color="text.secondary">{t("subtitle")}</Typography>
        </Box>
      </Stack>

      {application && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="overline" color="text.secondary">
                  {t("yourApplication")}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {application.store_name}
                </Typography>
              </Box>
              <Chip
                color={statusColor(application.status)}
                label={t(`status.${application.status}`)}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
            {application.admin_notes && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {application.admin_notes}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {(!application || application.status === "rejected") && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {application ? t("reapply") : t("applyNow")}
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label={t("storeName")}
                  value={form.store_name}
                  onChange={(e) =>
                    setForm({ ...form, store_name: e.target.value })
                  }
                  required
                  fullWidth
                />
                <TextField
                  label={t("storeNameEn")}
                  value={form.store_name_en}
                  onChange={(e) =>
                    setForm({ ...form, store_name_en: e.target.value })
                  }
                  fullWidth
                />
                <TextField
                  label={t("phone")}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  fullWidth
                />
                <TextField
                  select
                  label={t("city")}
                  value={form.city_id ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      city_id: e.target.value ? Number(e.target.value) : null,
                      area_id: null,
                    })
                  }
                  fullWidth
                >
                  <MenuItem value="">{tCommon("none")}</MenuItem>
                  {cities.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t("area")}
                  value={form.area_id ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      area_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  disabled={!form.city_id || areas.length === 0}
                  fullWidth
                >
                  <MenuItem value="">{tCommon("none")}</MenuItem>
                  {areas.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={t("address")}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  fullWidth
                />
                <TextField
                  label={t("description")}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  multiline
                  rows={3}
                  fullWidth
                />
                <Stack direction="row" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={saving}
                    sx={{ borderRadius: 2, px: 4 }}
                  >
                    {tCommon("submit")}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />
    </Container>
  );
}
