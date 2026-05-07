"use client";

import { useMemo } from "react";
import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: number;
  size?: "small" | "medium";
  floating?: boolean;
}

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

  const iconSize = size === "small" ? 16 : 20;

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      aria-pressed={isFavorite}
      title={label}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200",
        size === "small" ? "w-8 h-8" : "w-10 h-10",
        floating
          ? "bg-white/90 shadow-md hover:bg-white"
          : "hover:bg-black/5",
        isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"
      )}
    >
      <Heart
        size={iconSize}
        fill={isFavorite ? "currentColor" : "none"}
      />
    </button>
  );
}
