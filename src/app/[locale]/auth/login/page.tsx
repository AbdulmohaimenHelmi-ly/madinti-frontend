"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Container, Typography, TextField, Button, Card, CardContent, Box, Alert, Grid } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PetsIcon from "@mui/icons-material/Pets";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [_hp, setHp] = useState(""); // honeypot — must stay empty
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (_hp) return; // bot filled the hidden field — silently abort
    try {
      await login(email, password);
      const u = useAuthStore.getState().user;
      if (u?.is_admin) router.push(`/${locale}/admin`);
      else if (u?.is_delivery) router.push(`/${locale}/delivery`);
      else if (u?.is_vendor) router.push(`/${locale}/vendor`);
      else router.push(`/${locale}`);
    } catch { setError(t("common.error")); }
  };
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Grid container spacing={0} sx={{ minHeight: { md: 500 } }}>
        {/* Decorative side panel */}
        <Grid
          size={{ xs: 12, md: 5 }}
          sx={(theme) => ({
            display: { xs: "none", md: "flex" },
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
          <LockOutlinedIcon sx={{ fontSize: 56, mb: 2, opacity: 0.9 }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 1,
              textAlign: "center",
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PetsIcon sx={{ fontSize: 24, transform: "rotate(-15deg)" }} />
            {t("common.appName")}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, textAlign: "center" }}>
            {t("home.heroSubtitle")}
          </Typography>
        </Grid>
        {/* Form */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: "100%", borderRadius: { xs: 4, md: "0 16px 16px 0" } }}>
            <CardContent sx={{ p: { xs: 3, md: 5 }, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
                {t("auth.loginTitle")}
              </Typography>
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Honeypot — invisible to humans, bots fill it and get silently blocked */}
                <input
                  type="text"
                  name="website"
                  value={_hp}
                  onChange={(e) => setHp(e.target.value)}
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="off"
                  style={{ display: "none" }}
                />
                <TextField label={t("auth.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
                <TextField label={t("auth.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                  sx={{ py: 1.5, borderRadius: 3, fontSize: "1rem" }}
                >
                  {t("auth.loginTitle")}
                </Button>
              </Box>
              <Typography sx={{ mt: 3, textAlign: "center", color: "text.secondary" }}>
                {t("auth.noAccount")}{" "}
                <Box component={Link} href={`/${locale}/auth/register`} sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none" }}>
                  {t("common.register")}
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
