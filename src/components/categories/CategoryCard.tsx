"use client";

import { Box, Typography } from "@mui/material";
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
    <Box
      component={Link}
      href={`/${locale}/categories/${category.id}`}
      sx={(theme) => ({
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-6px)",
          "& .category-circle": {
            boxShadow: `0 12px 32px ${theme.palette.primary.main}59`,
            borderColor: theme.palette.primary.main,
          },
          "& .category-image": {
            transform: "scale(1.1)",
          },
        },
      })}
    >
      <Box
        className="category-circle"
        sx={(theme) => ({
          width: { xs: 80, sm: 92, md: 104 },
          height: { xs: 80, sm: 92, md: 104 },
          borderRadius: "50%",
          overflow: "hidden",
          border: "3px solid",
          borderColor: `${theme.palette.primary.main}4D`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.50",
        })}
      >
        {category.image ? (
          <Box
            className="category-image"
            component="img"
            src={category.image}
            alt={name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        ) : (
          <Box
            className="category-image"
            sx={(theme) => ({
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            })}
          >
            <Typography
              variant="h3"
              sx={{
                color: "white",
                fontWeight: 900,
                fontSize: { xs: "2rem", sm: "2.5rem" },
                textShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {name[0]}
            </Typography>
          </Box>
        )}
      </Box>
      <Typography
        variant="subtitle2"
        color="text.primary"
        sx={{
          fontWeight: 700,
          textAlign: "center",
          maxWidth: 120,
          lineHeight: 1.3,
          fontSize: { xs: "0.8rem", sm: "0.875rem" },
        }}
      >
        {name}
      </Typography>
    </Box>
  );
}
