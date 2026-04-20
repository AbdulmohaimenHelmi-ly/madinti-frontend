"use client";

import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Paper,
  Chip,
  Button,
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
              src={primaryImage?.image || "/placeholder-product.svg"}
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
            {item.variant && (item.variant.label || item.variant.options?.length) && (
              <Chip
                size="small"
                variant="outlined"
                sx={{ mb: 0.5, height: 22, "& .MuiChip-label": { px: 1, fontSize: "0.72rem" } }}
                label={
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                    {item.variant.options?.find((o) => o.hex_color)?.hex_color && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: item.variant.options.find((o) => o.hex_color)!.hex_color!,
                          border: "1px solid",
                          borderColor: "grey.300",
                        }}
                      />
                    )}
                    <span>
                      {item.variant.label ||
                        item.variant.options
                          .map((o) => {
                            const opt = locale === "en" && o.option_en ? o.option_en : o.option;
                            const val = locale === "en" && o.value_en ? o.value_en : o.value;
                            return `${opt}: ${val}`;
                          })
                          .join(" / ")}
                    </span>
                  </Box>
                }
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
              {Number(item.price).toFixed(2)} {t("currency")}
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
              onClick={() => {
                if (item.quantity <= 1) {
                  removeItem(item.id);
                } else {
                  updateItem(item.id, item.quantity - 1);
                }
              }}
              sx={{ borderRadius: 0 }}
              aria-label={item.quantity <= 1 ? t("remove") : t("decrease")}
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
              aria-label={t("increase")}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Paper>

          <Typography variant="body1" sx={{ minWidth: 80, textAlign: "end", fontWeight: 800, flexShrink: 0 }}>
            {(Number(item.price) * item.quantity).toFixed(2)} {t("currency")}
          </Typography>

          <Button
            onClick={() => removeItem(item.id)}
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteOutlineIcon />}
            sx={{
              flexShrink: 0,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              borderWidth: 1.5,
              "&:hover": { bgcolor: "error.main", color: "white", borderColor: "error.main" },
            }}
          >
            {t("remove")}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
