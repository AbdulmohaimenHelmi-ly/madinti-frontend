"use client";

import { Card, CardContent, Typography, Divider, Button, Box } from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import type { Cart } from "@/lib/types";

interface CartSummaryProps {
  cart: Cart;
}

export default function CartSummary({ cart }: CartSummaryProps) {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale();

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <Card
      sx={{
        position: "sticky",
        top: 90,
        overflow: "visible",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, #1B5E20, #4CAF50)",
          borderRadius: "16px 16px 0 0",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
          {t("title")}
        </Typography>
        <Divider sx={{ mb: 2.5 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
          <Typography color="text.secondary">{t("subtotal")}</Typography>
          <Typography sx={{ fontWeight: 600 }}>
            {subtotal.toFixed(2)} {tc("currency")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
          <Typography color="text.secondary">{t("shipping")}</Typography>
          <Typography sx={{ fontWeight: 500, color: "success.main" }}>
            0.00 {tc("currency")}
          </Typography>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {t("total")}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              background: "linear-gradient(135deg, #1B5E20, #4CAF50)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {subtotal.toFixed(2)} {tc("currency")}
          </Typography>
        </Box>

        <Button
          component={Link}
          href={`/${locale}/orders`}
          variant="contained"
          fullWidth
          size="large"
          startIcon={<ShoppingCartCheckoutIcon />}
          sx={{
            py: 1.5,
            borderRadius: 3,
            fontWeight: 700,
            fontSize: "1rem",
          }}
        >
          {t("checkout")}
        </Button>
      </CardContent>
    </Card>
  );
}
