"use client";
import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container, Typography, Grid, Button, Box } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import Link from "next/link";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import { CartSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";

export default function CartPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { cart, isLoading, fetchCart, clearCart } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => { if (isAuthenticated) fetchCart(); }, [isAuthenticated, fetchCart]);
  const handleClear = () => {
    if (typeof window !== "undefined" && !window.confirm(t("cart.confirmClear"))) return;
    clearCart();
  };
  if (isLoading)
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>{t("cart.title")}</Typography>
        </Box>
        <CartSkeleton />
      </Container>
    );
  if (!cart || cart.items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <EmptyState message={t("cart.empty")} />
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button
            component={Link}
            href={`/${locale}/products`}
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            sx={{ borderRadius: 100, px: 4, py: 1.2 }}
          >
            {t("cart.continueShopping")}
          </Button>
        </Box>
      </Container>
    );
  }
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            {t("cart.title")}
          </Typography>
          <Box
            sx={(theme) => ({
              width: 48,
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            })}
          />
        </Box>
        <Button
          onClick={handleClear}
          variant="outlined"
          color="error"
          startIcon={<DeleteSweepIcon />}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
        >
          {t("cart.clearAll")}
        </Button>
      </Box>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          {cart.items.map((item) => (<CartItem key={item.id} item={item} />))}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <CartSummary cart={cart} />
        </Grid>
      </Grid>
    </Container>
  );
}
