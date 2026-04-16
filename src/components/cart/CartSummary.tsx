"use client";

import { Card, CardContent, Typography, Divider, Button, Box } from "@mui/material";
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
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t("title")}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography color="text.secondary">{t("subtotal")}</Typography>
          <Typography fontWeight={500}>
            {subtotal.toFixed(2)} {tc("currency")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography color="text.secondary">{t("shipping")}</Typography>
          <Typography fontWeight={500}>0.00 {tc("currency")}</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>
            {t("total")}
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary">
            {subtotal.toFixed(2)} {tc("currency")}
          </Typography>
        </Box>

        <Button
          component={Link}
          href={`/${locale}/orders`}
          variant="contained"
          fullWidth
          size="large"
        >
          {t("checkout")}
        </Button>
      </CardContent>
    </Card>
  );
}
