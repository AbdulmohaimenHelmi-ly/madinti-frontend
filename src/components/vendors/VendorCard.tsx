"use client";

import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Rating,
  Chip,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Vendor } from "@/lib/types";

interface VendorCardProps {
  vendor: Vendor;
}

export default function VendorCard({ vendor }: VendorCardProps) {
  const locale = useLocale();
  const t = useTranslations("vendor");
  const name =
    locale === "en" && vendor.store_name_en
      ? vendor.store_name_en
      : vendor.store_name;
  const description =
    locale === "en" && vendor.description_en
      ? vendor.description_en
      : vendor.description;

  return (
    <Card
      component={Link}
      href={`/${locale}/vendors/${vendor.id}`}
      sx={{
        textDecoration: "none",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
        },
      }}
    >
      <CardMedia
        sx={{
          height: 140,
          bgcolor: "secondary.light",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        image={vendor.banner || undefined}
      >
        {!vendor.banner && (
          <StorefrontIcon sx={{ fontSize: 48, color: "white", opacity: 0.5 }} />
        )}
      </CardMedia>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          {vendor.logo && (
            <Box
              component="img"
              src={vendor.logo}
              alt={name}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          )}
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
        </Box>

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 1,
            }}
          >
            {description}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Rating value={vendor.rating} readOnly size="small" precision={0.5} />
          <Chip label={`${t("products")}: ${vendor.total_sales}`} size="small" variant="outlined" />
        </Box>
      </CardContent>
    </Card>
  );
}
