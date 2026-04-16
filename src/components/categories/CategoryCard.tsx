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
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
        },
      }}
    >
      <CardMedia
        sx={{
          height: 160,
          bgcolor: "primary.light",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        image={category.image || undefined}
      >
        {!category.image && (
          <Typography variant="h3" sx={{ opacity: 0.3, color: "white" }}>
            {name[0]}
          </Typography>
        )}
      </CardMedia>
      <CardContent>
        <Typography
          variant="h6"
          fontWeight={600}
          textAlign="center"
          color="text.primary"
        >
          {name}
        </Typography>
      </CardContent>
    </Card>
  );
}
