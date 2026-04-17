"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Rating,
  Divider,
  IconButton,
  TextField,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/lib/store/cartStore";

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);

  const name = locale === "en" && product.name_en ? product.name_en : product.name;
  const description =
    locale === "en" && product.description_en
      ? product.description_en
      : product.description;

  const handleAddToCart = () => {
    addItem(product.id, quantity);
  };

  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: "grey.50",
            borderRadius: 4,
            overflow: "hidden",
            mb: 2,
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <Box
            component="img"
            src={product.images?.[selectedImage]?.image || "/placeholder-product.png"}
            alt={name}
            sx={{
              width: "100%",
              height: 450,
              objectFit: "contain",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "scale(1.03)" },
            }}
          />
        </Paper>
        {product.images && product.images.length > 1 && (
          <Box sx={{ display: "flex", gap: 1.5, overflow: "auto", pb: 1 }}>
            {product.images.map((img, idx) => (
              <Paper
                key={img.id}
                elevation={0}
                onClick={() => setSelectedImage(idx)}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2.5,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: "2px solid",
                  borderColor: idx === selectedImage ? "primary.main" : "grey.200",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                  opacity: idx === selectedImage ? 1 : 0.7,
                  "&:hover": { opacity: 1, borderColor: "primary.light" },
                }}
              >
                <Box
                  component="img"
                  src={img.image}
                  alt=""
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Paper>
            ))}
          </Box>
        )}
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          {name}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Rating value={product.rating} readOnly precision={0.5} size="large" />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            ({product.total_reviews} {t("product.reviews")})
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 2 }}>
          <Typography
            variant="h3"
            sx={(theme) => ({
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            })}
          >
            {product.price} {t("common.currency")}
          </Typography>
          {hasDiscount && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="h6"
                color="text.disabled"
                sx={{ textDecoration: "line-through" }}
              >
                {product.compare_price} {t("common.currency")}
              </Typography>
              <Chip
                label={`-${discountPercent}%`}
                size="small"
                sx={{ bgcolor: "secondary.main", color: "white", fontWeight: 700 }}
              />
            </Box>
          )}
        </Box>

        <Chip
          label={product.quantity > 0 ? t("product.inStock") : t("product.outOfStock")}
          color={product.quantity > 0 ? "success" : "error"}
          size="small"
          variant="outlined"
          sx={{ mb: 3, fontWeight: 600 }}
        />

        <Divider sx={{ mb: 3 }} />

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.9 }}>
          {description}
        </Typography>

        {product.vendor && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <StorefrontIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {t("product.vendor")}:{" "}
              <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                {locale === "en" && product.vendor.store_name_en
                  ? product.vendor.store_name_en
                  : product.vendor.store_name}
              </Box>
            </Typography>
          </Box>
        )}

        {product.sku && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("product.sku")}: <Box component="span" sx={{ fontWeight: 500 }}>{product.sku}</Box>
          </Typography>
        )}

        <Divider sx={{ mb: 3 }} />

        {product.quantity > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {t("common.quantity")}:
            </Typography>
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                border: "1px solid",
                borderColor: "grey.300",
                borderRadius: 2.5,
                overflow: "hidden",
              }}
            >
              <IconButton
                size="small"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                sx={{ borderRadius: 0, px: 1.5 }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <TextField
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val > 0 && val <= product.quantity) setQuantity(val);
                }}
                size="small"
                sx={{
                  width: 56,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    "& fieldset": { border: "none" },
                  },
                }}
                slotProps={{ htmlInput: { style: { textAlign: "center", fontWeight: 700 } } }}
              />
              <IconButton
                size="small"
                onClick={() =>
                  setQuantity((q) => Math.min(product.quantity, q + 1))
                }
                sx={{ borderRadius: 0, px: 1.5 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Box>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={<ShoppingCartIcon />}
          onClick={handleAddToCart}
          disabled={product.quantity === 0}
          fullWidth
          sx={{
            py: 1.8,
            borderRadius: 3,
            fontSize: "1.05rem",
            fontWeight: 700,
          }}
        >
          {t("common.addToCart")}
        </Button>
      </Grid>
    </Grid>
  );
}
