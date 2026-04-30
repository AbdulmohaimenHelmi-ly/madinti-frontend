"use client";

import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import type { Cart } from "@/lib/types";

interface CartSummaryProps {
  cart: Cart;
}

/**
 * Per-vendor cart summary. Each cart turns into one order, so the checkout
 * button targets that specific vendor's cart via `?vendor=ID`.
 */
export default function CartSummary({ cart }: CartSummaryProps) {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale();

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <Box
      sx={(theme) => ({
        mt: 1,
        p: 2.5,
        borderRadius: 3,
        bgcolor: theme.palette.mode === "light" ? "grey.50" : "background.default",
        border: "1px solid",
        borderColor: "divider",
      })}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
            <Typography color="text.secondary">{t("subtotal")}</Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {subtotal.toFixed(2)} {tc("currency")}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
            <Typography color="text.secondary">{t("shipping")}</Typography>
            <Typography sx={{ fontWeight: 600, color: "text.secondary" }}>
              {t("shippingAtCheckout")}
            </Typography>
          </Stack>
          <Divider sx={{ my: 0.5 }} />
          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 800 }}>{t("total")}</Typography>
            <Typography
              sx={(theme) => ({
                fontWeight: 800,
                fontSize: "1.1rem",
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              })}
            >
              {subtotal.toFixed(2)} {tc("currency")}
            </Typography>
          </Stack>
        </Stack>

        <Button
          component={Link}
          href={`/${locale}/checkout?vendor=${cart.vendor_id}`}
          variant="contained"
          size="large"
          startIcon={<ShoppingCartCheckoutIcon />}
          sx={{
            py: 1.4,
            px: 3,
            borderRadius: 3,
            fontWeight: 800,
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
            textTransform: "none",
            minWidth: { sm: 220 },
          }}
        >
          {t("checkoutThisStore")}
        </Button>
      </Stack>
    </Box>
  );
}

