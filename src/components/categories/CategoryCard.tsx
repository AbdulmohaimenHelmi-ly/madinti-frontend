"use client";

import { Card, CardContent, CardMedia, Typography, Box } from "@mui/material";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { Category } from "@/lib/types";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const locale = useLocale();
  const name = locale === "en" && category.name_en ? category.name_en : category.name;

  return (
    <Card
      component={Link}
      href={`/${locale}/categories/${category.id}`}
      sx={{
        textDecoration: "none",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
          "& .category-overlay": {
            background: "linear-gradient(180deg, transparent 20%, rgba(27,94,32,0.85) 100%)",
          },
          "& .category-image": {
            transform: "scale(1.08)",
          },
        },
      }}
    >
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        <CardMedia
          className="category-image"
          sx={{
            height: 180,
            bgcolor: "grey.100",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          image={category.image || undefined}
        >
          {!category.image && (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #1B5E20 0%, #4CAF50 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  color: "white",
                  opacity: 0.35,
                  fontWeight: 900,
                  fontSize: "4rem",
                }}
              >
                {name[0]}
              </Typography>
            </Box>
          )}
        </CardMedia>
        {category.image && (
          <Box
            className="category-overlay"
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "50%",
              background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 100%)",
              transition: "background 0.3s ease",
            }}
          />
        )}
      </Box>
      <CardContent sx={{ p: 2 }}>
        <Typography
          variant="subtitle1"
          color="text.primary"
          sx={{ fontWeight: 700, textAlign: "center" }}
        >
          {name}
        </Typography>
      </CardContent>
    </Card>
  );
}
