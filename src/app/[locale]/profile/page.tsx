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
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useAuthStore } from "@/lib/store/authStore";
import { profileApi } from "@/lib/api/profile";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState("");

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isInitialized, isAuthenticated, locale, router]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  if (!isInitialized || !user) return <LoadingSpinner />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password && password !== passwordConfirmation) {
      setError(t("passwordMismatch"));
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string> = { name, phone };
      if (password) {
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
      }
      const res = await profileApi.update(payload);
      setUser(res.data.data);
      setPassword("");
      setPasswordConfirmation("");
      setSnack(t("saved"));
    } catch {
      setError(tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
          {t("title")}
        </Typography>
        <Typography color="text.secondary">{t("subtitle")}</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {user.is_admin && <Chip color="primary" label={tCommon("adminPanel")} />}
            {user.is_vendor && <Chip color="secondary" label={tCommon("vendorDashboard")} />}
            {!user.is_admin && !user.is_vendor && (
              <Chip label={t("customer")} />
            )}
          </Stack>
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            {user.email}
          </Typography>
        </CardContent>
      </Card>

      <Card component="form" onSubmit={submit}>
        <CardContent>
          <Stack spacing={2.5}>
            <TextField
              label={t("name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={t("phone")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
            />
            <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
              {t("changePassword")}
            </Typography>
            <TextField
              type="password"
              label={t("newPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
            />
            <TextField
              type="password"
              label={t("confirmPassword")}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              fullWidth
              autoComplete="new-password"
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              disabled={saving}
              sx={{ alignSelf: "flex-start", borderRadius: 100, px: 4 }}
            >
              {tCommon("save")}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnack("")}>
          {snack}
        </Alert>
      </Snackbar>
    </Container>
  );
}
