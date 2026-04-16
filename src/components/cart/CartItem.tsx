"use client";

import {
  Box,
  Typography,
  IconButton,
  TextField,
  Card,
  CardContent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useLocale, useTranslations } from "next-intl";
import type { CartItem as CartItemType } from "@/lib/types";
import { useCartStore } from "@/lib/store/cartStore";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const productName =
    item.product && locale === "en" && item.product.name_en
      ? item.product.name_en
      : item.product?.name || "";

  const primaryImage =
    item.product?.images?.find((img) => img.is_primary) ||
    item.product?.images?.[0];

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box
            component="img"
            src={primaryImage?.image || "/placeholder-product.png"}
            alt={productName}
            sx={{
              width: 80,
              height: 80,
              objectFit: "contain",
              borderRadius: 2,
              bgcolor: "grey.100",
            }}
          />

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {productName}
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              {item.price} {t("currency")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ minWidth: 32, textAlign: "center" }}>
              {item.quantity}
            </Typography>
            <IconButton
              size="small"
              onClick={() => updateItem(item.id, item.quantity + 1)}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="body1" sx={{ minWidth: 80, textAlign: "end", fontWeight: 700 }}>
            {(item.price * item.quantity).toFixed(2)} {t("currency")}
          </Typography>

          <IconButton color="error" onClick={() => removeItem(item.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
