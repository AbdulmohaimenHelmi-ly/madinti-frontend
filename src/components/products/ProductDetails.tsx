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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
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

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box
          sx={{
            bgcolor: "grey.100",
            borderRadius: 3,
            overflow: "hidden",
            mb: 2,
          }}
        >
          <Box
            component="img"
            src={product.images?.[selectedImage]?.image || "/placeholder-product.png"}
            alt={name}
            sx={{
              width: "100%",
              height: 400,
              objectFit: "contain",
            }}
          />
        </Box>
        {product.images && product.images.length > 1 && (
          <Box sx={{ display: "flex", gap: 1, overflow: "auto" }}>
            {product.images.map((img, idx) => (
              <Box
                key={img.id}
                onClick={() => setSelectedImage(idx)}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: idx === selectedImage ? "2px solid" : "2px solid transparent",
                  borderColor: idx === selectedImage ? "primary.main" : "transparent",
                  flexShrink: 0,
                }}
              >
                <Box
                  component="img"
                  src={img.image}
                  alt=""
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {name}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Rating value={product.rating} readOnly precision={0.5} />
          <Typography variant="body2" color="text.secondary">
            ({product.total_reviews} {t("product.reviews")})
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 3 }}>
          <Typography variant="h4" color="primary" fontWeight={700}>
            {product.price} {t("common.currency")}
          </Typography>
          {product.compare_price && product.compare_price > product.price && (
            <Typography
              variant="h6"
              color="text.disabled"
              sx={{ textDecoration: "line-through" }}
            >
              {product.compare_price} {t("common.currency")}
            </Typography>
          )}
        </Box>

        <Chip
          label={product.quantity > 0 ? t("product.inStock") : t("product.outOfStock")}
          color={product.quantity > 0 ? "success" : "error"}
          size="small"
          sx={{ mb: 3 }}
        />

        <Divider sx={{ mb: 3 }} />

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
          {description}
        </Typography>

        {product.vendor && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t("product.vendor")}:{" "}
            {locale === "en" && product.vendor.store_name_en
              ? product.vendor.store_name_en
              : product.vendor.store_name}
          </Typography>
        )}

        {product.sku && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("product.sku")}: {product.sku}
          </Typography>
        )}

        <Divider sx={{ mb: 3 }} />

        {product.quantity > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Typography variant="body1" fontWeight={500}>
              {t("common.quantity")}:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <RemoveIcon />
              </IconButton>
              <TextField
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val > 0 && val <= product.quantity) setQuantity(val);
                }}
                size="small"
                sx={{ width: 60 }}
                slotProps={{ htmlInput: { style: { textAlign: "center" } } }}
              />
              <IconButton
                size="small"
                onClick={() =>
                  setQuantity((q) => Math.min(product.quantity, q + 1))
                }
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ShoppingCartIcon />}
            onClick={handleAddToCart}
            disabled={product.quantity === 0}
            fullWidth
          >
            {t("common.addToCart")}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
}
