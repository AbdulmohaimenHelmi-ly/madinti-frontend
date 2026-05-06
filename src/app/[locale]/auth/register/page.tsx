"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Container, Typography, TextField, Button, Card, CardContent, Box, Alert, FormControlLabel, Checkbox, Grid, Divider } from "@mui/material";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import PetsIcon from "@mui/icons-material/Pets";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import AltchaWidget from "@/components/AltchaWidget";
import { GoogleLogin } from "@react-oauth/google";
import { googleClientId } from "@/components/providers/GoogleAuthProvider";

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "", phone: "" });
  const [isVendor, setIsVendor] = useState(false);
  const [error, setError] = useState("");
  const [_hp, setHp] = useState(""); // honeypot — must stay empty
  const [_altcha, setAltcha] = useState(""); // Altcha PoW solution
  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (_hp) return; // bot filled the hidden field — silently abort
    if (!_altcha) { setError(t("common.error")); return; }
    // Verify Altcha PoW server-side before calling auth
    try {
      const vRes = await fetch("/api/altcha", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payload: _altcha }),
      });
      if (!vRes.ok) { setError(t("common.error")); return; }
    } catch { setError(t("common.error")); return; }
    try {
      await register({ ...form, role: isVendor ? "vendor" : "customer" });
      router.push(`/${locale}`);
    } catch { setError(t("common.error")); }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setError("");
    try {
      await loginWithGoogle(credentialResponse.credential);
      router.push(`/${locale}`);
    } catch { setError(t("common.error")); }
  };
  return (
    <>
      {/* ── MOBILE LAYOUT ── full-screen native-app feel */}
      <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", minHeight: "100dvh" }}>
        {/* Brand header */}
        <Box
          sx={(theme) => ({
            background: `linear-gradient(160deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            pt: 7,
            pb: 6,
            px: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "white",
          })}
        >
          <PetsIcon sx={{ fontSize: 64, mb: 1.5, opacity: 0.95 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
            {t("common.appName")}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5, textAlign: "center" }}>
            {t("home.heroSubtitle")}
          </Typography>
        </Box>

        {/* Form sheet — slides up over the header */}
        <Box
          sx={{
            flex: 1,
            bgcolor: "background.paper",
            borderRadius: "24px 24px 0 0",
            mt: -3,
            px: 3,
            pt: 4,
            pb: 5,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            {t("auth.registerTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("auth.hasAccount")}{" "}
            <Box
              component={Link}
              href={`/${locale}/auth/login`}
              sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none" }}
            >
              {t("common.login")}
            </Box>
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <input type="text" name="website" value={_hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} aria-hidden="true" autoComplete="off" style={{ display: "none" }} />
            <TextField label={t("auth.name")} value={form.name} onChange={handleChange("name")} required fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
            <TextField label={t("auth.email")} type="email" value={form.email} onChange={handleChange("email")} required fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
            <TextField label={t("auth.phone")} value={form.phone} onChange={handleChange("phone")} fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
            <TextField label={t("auth.password")} type="password" value={form.password} onChange={handleChange("password")} required fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
            <TextField label={t("auth.confirmPassword")} type="password" value={form.password_confirmation} onChange={handleChange("password_confirmation")} required fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
            <AltchaWidget onSolve={setAltcha} />
            <FormControlLabel
              control={<Checkbox checked={isVendor} onChange={(e) => setIsVendor(e.target.checked)} sx={{ "&.Mui-checked": { color: "primary.main" } }} />}
              label={t("auth.registerAsVendor")}
              sx={{ "& .MuiFormControlLabel-label": { fontWeight: 500, fontSize: "0.9rem" } }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
              sx={{ py: 1.75, borderRadius: 3, fontSize: "1rem", fontWeight: 700, mt: 0.5 }}
            >
              {t("auth.registerTitle")}
            </Button>
          </Box>

          {googleClientId && (
            <>
              <Divider sx={{ my: 2.5 }}>{t("auth.orContinueWith")}</Divider>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError(t("common.error"))}
                  useOneTap={false}
                  width="100%"
                />
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* ── DESKTOP LAYOUT ── unchanged */}
      <Container maxWidth="md" sx={{ display: { xs: "none", md: "block" }, py: 8 }}>
        <Grid container spacing={0} sx={{ minHeight: 580 }}>
          {/* Decorative side panel */}
          <Grid
            size={{ md: 5 }}
            sx={(theme) => ({
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.primary.light} 100%)`,
              borderRadius: "16px 0 0 16px",
              color: "white",
              p: 4,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: "-50%",
                right: "-30%",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: "-20%",
                left: "-20%",
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
              },
            })}
          >
            <PersonAddAltIcon sx={{ fontSize: 56, mb: 2, opacity: 0.9 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: "center", display: "inline-flex", alignItems: "center", gap: 1 }}>
              <PetsIcon sx={{ fontSize: 24, transform: "rotate(-15deg)" }} />
              {t("common.appName")}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, textAlign: "center" }}>
              {t("home.heroSubtitle")}
            </Typography>
          </Grid>

          {/* Form */}
          <Grid size={{ md: 7 }}>
            <Card sx={{ height: "100%", borderRadius: "0 16px 16px 0" }}>
              <CardContent sx={{ p: 5, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
                  {t("auth.registerTitle")}
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <input type="text" name="website" value={_hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} aria-hidden="true" autoComplete="off" style={{ display: "none" }} />
                  <TextField label={t("auth.name")} value={form.name} onChange={handleChange("name")} required fullWidth />
                  <TextField label={t("auth.email")} type="email" value={form.email} onChange={handleChange("email")} required fullWidth />
                  <TextField label={t("auth.phone")} value={form.phone} onChange={handleChange("phone")} fullWidth />
                  <TextField label={t("auth.password")} type="password" value={form.password} onChange={handleChange("password")} required fullWidth />
                  <TextField label={t("auth.confirmPassword")} type="password" value={form.password_confirmation} onChange={handleChange("password_confirmation")} required fullWidth />
                  <AltchaWidget onSolve={setAltcha} />
                  <FormControlLabel
                    control={<Checkbox checked={isVendor} onChange={(e) => setIsVendor(e.target.checked)} sx={{ "&.Mui-checked": { color: "primary.main" } }} />}
                    label={t("auth.registerAsVendor")}
                    sx={{ "& .MuiFormControlLabel-label": { fontWeight: 500, fontSize: "0.9rem" } }}
                  />
                  <Button type="submit" variant="contained" size="large" fullWidth disabled={isLoading} sx={{ py: 1.5, borderRadius: 3, fontSize: "1rem" }}>
                    {t("auth.registerTitle")}
                  </Button>
                </Box>
                {googleClientId && (
                  <>
                    <Divider sx={{ my: 2 }}>{t("auth.orContinueWith")}</Divider>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError(t("common.error"))} useOneTap={false} width="100%" />
                    </Box>
                  </>
                )}
                <Typography sx={{ mt: 3, textAlign: "center", color: "text.secondary" }}>
                  {t("auth.hasAccount")}{" "}
                  <Box component={Link} href={`/${locale}/auth/login`} sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none" }}>
                    {t("common.login")}
                  </Box>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
