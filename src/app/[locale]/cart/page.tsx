"use client";
import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Container,
  Typography,
  Button,
  Box,
  Stack,
  Card,
  CardContent,
  Avatar,
  Divider,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Link from "next/link";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import { CartSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";

/**
 * Cart page renders one card per vendor — each card is its own mini cart
 * with its own checkout button, since each cart turns into a single order.
 */
export default function CartPage() {
  const t = useTranslations();
  const locale = useLocale();
  const carts = useCartStore((s) => s.carts);
  const isLoading = useCartStore((s) => s.isLoading);
  const fetchCarts = useCartStore((s) => s.fetchCarts);
  const clearAllCarts = useCartStore((s) => s.clearAllCarts);
  const clearVendorCart = useCartStore((s) => s.clearVendorCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) fetchCarts();
  }, [isAuthenticated, fetchCarts]);

  const handleClearAll = () => {
    if (typeof window !== "undefined" && !window.confirm(t("cart.confirmClear"))) return;
    clearAllCarts();
  };

  const handleClearVendor = (vendorId: number) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(t("cart.confirmClearVendor"))
    ) {
      return;
    }
    clearVendorCart(vendorId);
  };

  if (isLoading && carts.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 1,
              fontSize: { xs: "1.6rem", sm: "2rem", md: "3rem" },
            }}
          >
            {t("cart.title")}
          </Typography>
        </Box>
        <CartSkeleton />
      </Container>
    );
  }

  if (carts.length === 0) {
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
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Box
        sx={{
          mb: { xs: 3, md: 4 },
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 1,
              fontSize: { xs: "1.6rem", sm: "2rem", md: "3rem" },
            }}
          >
            {t("cart.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("cart.vendorSubtitle", { count: carts.length })}
          </Typography>
          <Box
            sx={(theme) => ({
              mt: 1.5,
              width: 48,
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            })}
          />
        </Box>
        <Button
          onClick={handleClearAll}
          variant="outlined"
          color="error"
          startIcon={<DeleteSweepIcon />}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
        >
          {t("cart.clearAll")}
        </Button>
      </Box>

      <Stack spacing={3}>
        {carts.map((cart) => {
          const vendorName =
            (locale === "en" && cart.vendor?.store_name_en) ||
            cart.vendor?.store_name ||
            "";
          return (
            <Card key={cart.id} sx={{ overflow: "hidden" }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Avatar
                      src={cart.vendor?.logo ?? undefined}
                      sx={{ width: 44, height: 44, bgcolor: "primary.main" }}
                    >
                      <StorefrontIcon />
                    </Avatar>
                    <Box>
                      <Typography
                        component={cart.vendor?.slug ? Link : "div"}
                        href={
                          cart.vendor?.slug
                            ? `/${locale}/vendors/${cart.vendor.slug}`
                            : undefined
                        }
                        sx={{
                          fontWeight: 800,
                          fontSize: "1.05rem",
                          color: "text.primary",
                          textDecoration: "none",
                          "&:hover": cart.vendor?.slug
                            ? { color: "primary.main" }
                            : {},
                        }}
                      >
                        {vendorName || t("cart.unknownVendor")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("cart.itemsCount", { count: cart.items_count })}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    onClick={() => handleClearVendor(cart.vendor_id)}
                    variant="text"
                    color="error"
                    size="small"
                    startIcon={<DeleteSweepIcon />}
                    sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", alignSelf: { xs: "flex-end", sm: "center" } }}
                  >
                    {t("cart.clearVendor")}
                  </Button>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 2 }}>
                  {cart.items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </Box>

                <CartSummary cart={cart} />
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Container>
  );
}

