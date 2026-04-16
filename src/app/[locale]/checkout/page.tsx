"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { ordersApi } from "@/lib/api/orders";
import { citiesApi, type Area, type City } from "@/lib/api/cities";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const paymentMethods = ["cash_on_delivery", "bank_transfer"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cart = useCartStore((s) => s.cart);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const cartLoading = useCartStore((s) => s.isLoading);

  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [cityId, setCityId] = useState<number | "">("");
  const [areaId, setAreaId] = useState<number | "">("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isInitialized, isAuthenticated, locale, router]);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    citiesApi.list().then((res) => setCities(res.data.data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      setAreaId("");
      return;
    }
    citiesApi
      .areasOf(Number(cityId))
      .then((res) => setAreas(res.data.data))
      .catch(() => setAreas([]));
  }, [cityId]);

  useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user, phone]);

  const subtotal = useMemo(
    () =>
      cart?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0,
    [cart]
  );

  if (!isInitialized || cartLoading) return <LoadingSpinner />;

  if (!cart || cart.items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          {tCart("empty")}
        </Typography>
        <Button
          component={Link}
          href={`/${locale}/products`}
          variant="contained"
          sx={{ borderRadius: 100, px: 4 }}
        >
          {tCart("continueShopping")}
        </Button>
      </Container>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!cityId || !address || !phone) {
      setError(t("fillRequired"));
      return;
    }
    const city = cities.find((c) => c.id === cityId);
    const area = areas.find((a) => a.id === areaId);
    const shippingCity = area ? `${city?.name}, ${area.name}` : city?.name ?? "";

    setSubmitting(true);
    try {
      const res = await ordersApi.create({
        shipping_address: address,
        shipping_city: shippingCity,
        shipping_phone: phone,
        payment_method: paymentMethod,
        notes: notes || undefined,
      });
      const order = res.data.data;
      await clearCart();
      router.push(`/${locale}/orders/${order.id}`);
    } catch {
      setError(tCommon("error"));
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
          {t("title")}
        </Typography>
        <Typography color="text.secondary">{t("subtitle")}</Typography>
      </Box>

      <Grid container spacing={4} component="form" onSubmit={submit}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {t("shippingInfo")}
              </Typography>

              <Stack spacing={2.5}>
                <TextField
                  label={t("phone")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  select
                  label={t("city")}
                  value={cityId === "" ? "" : String(cityId)}
                  onChange={(e) =>
                    setCityId(e.target.value ? Number(e.target.value) : "")
                  }
                  required
                  fullWidth
                >
                  {cities.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t("area")}
                  value={areaId === "" ? "" : String(areaId)}
                  onChange={(e) =>
                    setAreaId(e.target.value ? Number(e.target.value) : "")
                  }
                  disabled={!cityId || areas.length === 0}
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  multiline
                  minRows={2}
                  fullWidth
                />
                <TextField
                  select
                  label={t("paymentMethod")}
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                  required
                  fullWidth
                >
                  {paymentMethods.map((m) => (
                    <MenuItem key={m} value={m}>
                      {t(`payment.${m}`)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={t("notes")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                />
                {error && <Alert severity="error">{error}</Alert>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ position: { md: "sticky" }, top: { md: 90 } }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {t("orderSummary")}
              </Typography>
              <Stack spacing={1.2}>
                {cart.items.map((item) => {
                  const productName =
                    item.product && locale === "en" && item.product.name_en
                      ? item.product.name_en
                      : item.product?.name ?? `#${item.product_id}`;
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography variant="body2" noWrap>
                        {productName} × {item.quantity}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                      >
                        {(item.price * item.quantity).toFixed(2)}{" "}
                        {tCommon("currency")}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography color="text.secondary">
                  {tCart("subtotal")}
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {subtotal.toFixed(2)} {tCommon("currency")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography color="text.secondary">
                  {tCart("shipping")}
                </Typography>
                <Typography sx={{ color: "success.main", fontWeight: 500 }}>
                  0.00 {tCommon("currency")}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {tCart("total")}
                </Typography>
                <Typography
                  variant="h6"
                  color="primary"
                  sx={{ fontWeight: 800 }}
                >
                  {subtotal.toFixed(2)} {tCommon("currency")}
                </Typography>
              </Box>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                startIcon={<ShoppingCartCheckoutIcon />}
                sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
              >
                {t("placeOrder")}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
