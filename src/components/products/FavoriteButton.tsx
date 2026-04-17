"use client";

import { useMemo } from "react";
import { IconButton, Tooltip } from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";

interface FavoriteButtonProps {
  productId: number;
  size?: "small" | "medium";
  /** Render a contrast background halo (for use on top of product images). */
  floating?: boolean;
}

/**
 * Heart toggle used on product cards and product detail page.
 * - Unauthenticated clicks redirect to /login.
 * - Authenticated clicks optimistically toggle the wishlist store.
 */
export default function FavoriteButton({
  productId,
  size = "small",
  floating = true,
}: FavoriteButtonProps) {
  const locale = useLocale();
  const t = useTranslations("product");
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isFavorite = useWishlistStore((s) => s.ids.has(productId));
  const toggle = useWishlistStore((s) => s.toggle);

  const label = useMemo(
    () => (isFavorite ? t("removeFromFavorites") : t("addToFavorites")),
    [isFavorite, t],
  );

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    await toggle(productId);
  };

  return (
    <Tooltip title={label} placement="top" arrow>
      <IconButton
        onClick={handleClick}
        size={size}
        aria-label={label}
        aria-pressed={isFavorite}
        sx={{
          bgcolor: floating ? "rgba(255,255,255,0.92)" : "transparent",
          color: isFavorite ? "#ff3b30" : "text.secondary",
          boxShadow: floating ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
          "&:hover": {
            bgcolor: floating ? "white" : "rgba(0,0,0,0.04)",
            color: "#ff3b30",
          },
          transition: "all 0.2s ease",
        }}
      >
        {isFavorite ? (
          <FavoriteRoundedIcon fontSize={size === "small" ? "small" : "medium"} />
        ) : (
          <FavoriteBorderRoundedIcon fontSize={size === "small" ? "small" : "medium"} />
        )}
      </IconButton>
    </Tooltip>
  );
}
