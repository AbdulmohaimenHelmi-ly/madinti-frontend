"use client";

import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Paper,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
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
    <Card sx={{ mb: 2, overflow: "visible" }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
          <Paper
            elevation={0}
            sx={{
              width: 90,
              height: 90,
              borderRadius: 2.5,
              overflow: "hidden",
              flexShrink: 0,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Box
              component="img"
              src={primaryImage?.image || "/placeholder-product.png"}
              alt={productName}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                bgcolor: "grey.50",
              }}
            />
          </Paper>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }} noWrap>
              {productName}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
              {item.price} {t("currency")}
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid",
              borderColor: "grey.300",
              borderRadius: 2,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <IconButton
              size="small"
              onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
              sx={{ borderRadius: 0 }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ minWidth: 36, textAlign: "center", fontWeight: 700, fontSize: "0.9rem" }}>
              {item.quantity}
            </Typography>
            <IconButton
              size="small"
              onClick={() => updateItem(item.id, item.quantity + 1)}
              sx={{ borderRadius: 0 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Paper>

          <Typography variant="body1" sx={{ minWidth: 80, textAlign: "end", fontWeight: 800, flexShrink: 0 }}>
            {(item.price * item.quantity).toFixed(2)} {t("currency")}
          </Typography>

          <IconButton
            onClick={() => removeItem(item.id)}
            sx={{
              color: "error.main",
              bgcolor: "error.main",
              opacity: 0.1,
              "&:hover": { bgcolor: "error.light", opacity: 1, color: "white" },
              transition: "all 0.2s ease",
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
