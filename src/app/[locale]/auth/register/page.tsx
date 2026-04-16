"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Container, Typography, TextField, Button, Card, CardContent, Box, Alert, FormControlLabel, Checkbox } from "@mui/material";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "", phone: "" });
  const [isVendor, setIsVendor] = useState(false);
  const [error, setError] = useState("");
  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register({ ...form, role: isVendor ? "vendor" : "customer" });
      router.push(`/${locale}`);
    } catch { setError(t("common.error")); }
  };
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card><CardContent sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>{t("auth.registerTitle")}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField label={t("auth.name")} value={form.name} onChange={handleChange("name")} required fullWidth />
          <TextField label={t("auth.email")} type="email" value={form.email} onChange={handleChange("email")} required fullWidth />
          <TextField label={t("auth.phone")} value={form.phone} onChange={handleChange("phone")} fullWidth />
          <TextField label={t("auth.password")} type="password" value={form.password} onChange={handleChange("password")} required fullWidth />
          <TextField label={t("auth.confirmPassword")} type="password" value={form.password_confirmation} onChange={handleChange("password_confirmation")} required fullWidth />
          <FormControlLabel control={<Checkbox checked={isVendor} onChange={(e) => setIsVendor(e.target.checked)} />} label={t("auth.registerAsVendor")} />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={isLoading}>{t("auth.registerTitle")}</Button>
        </Box>
        <Typography textAlign="center" sx={{ mt: 3 }}>
          {t("auth.hasAccount")}{" "}
          <Link href={`/${locale}/auth/login`} style={{ color: "inherit", fontWeight: 600 }}>{t("common.login")}</Link>
        </Typography>
      </CardContent></Card>
    </Container>
  );
}
