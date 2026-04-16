"use client";
import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container, Typography, Grid, Button, Box } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Link from "next/link";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";

export default function CartPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { cart, isLoading, fetchCart } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => { if (isAuthenticated) fetchCart(); }, [isAuthenticated, fetchCart]);
  if (isLoading) return <LoadingSpinner />;
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
          {t("cart.title")}
        </Typography>
        <Box
          sx={{
            width: 48,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #FFB744, #FFCC80)",
          }}
        />
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
