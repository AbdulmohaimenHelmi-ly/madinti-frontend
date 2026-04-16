"use client";

import {
  Card,
  CardContent,
  Typography,
  Box,
  Rating,
  Chip,
  Avatar,
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
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
          "& .vendor-banner": {
            transform: "scale(1.05)",
          },
        },
      }}
    >
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        <Box
          className="vendor-banner"
          sx={{
            height: 120,
            background: vendor.banner
              ? `url(${vendor.banner}) center/cover`
              : "linear-gradient(135deg, #E65100 0%, #FF833A 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {!vendor.banner && (
            <StorefrontIcon sx={{ fontSize: 40, color: "white", opacity: 0.4 }} />
          )}
        </Box>
        <Avatar
          src={vendor.logo || undefined}
          alt={name}
          sx={{
            width: 56,
            height: 56,
            position: "absolute",
            bottom: -28,
            left: "50%",
            transform: "translateX(-50%)",
            border: "3px solid white",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            bgcolor: "primary.main",
            fontSize: "1.2rem",
            fontWeight: 700,
          }}
        >
          {name[0]}
        </Avatar>
      </Box>
      <CardContent sx={{ pt: 5, textAlign: "center" }}>
        <Typography
          variant="subtitle1"
          color="text.primary"
          sx={{ fontWeight: 700, mb: 0.5 }}
        >
          {name}
        </Typography>

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 1.5,
              lineHeight: 1.6,
              fontSize: "0.8rem",
            }}
          >
            {description}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <Rating value={vendor.rating} readOnly size="small" precision={0.5} />
          <Chip
            label={`${t("products")}: ${vendor.total_sales}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 24 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
