"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Container, Typography, TextField, Button, Card, CardContent, Box, Alert } from "@mui/material";
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push(`/${locale}`);
    } catch { setError(t("common.error")); }
  };
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card><CardContent sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>{t("auth.loginTitle")}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField label={t("auth.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
          <TextField label={t("auth.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={isLoading}>{t("auth.loginTitle")}</Button>
        </Box>
        <Typography textAlign="center" sx={{ mt: 3 }}>
          {t("auth.noAccount")}{" "}
          <Link href={`/${locale}/auth/register`} style={{ color: "inherit", fontWeight: 600 }}>{t("common.register")}</Link>
        </Typography>
      </CardContent></Card>
    </Container>
  );
}
