"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
} from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import ProductGrid from "@/components/products/ProductGrid";
import EmptyState from "@/components/common/EmptyState";
import { ProductGridSkeleton } from "@/components/common/Skeletons";
import { useAuthStore } from "@/lib/store/authStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { wishlistApi } from "@/lib/api/wishlist";
import type { Product } from "@/lib/types";

export default function FavoritesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const wishlistIds = useWishlistStore((s) => s.ids);
  const wishlistInitialized = useWishlistStore((s) => s.isInitialized);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      setIsLoading(false);
      setHasFetched(true);
      return;
    }
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const response = await wishlistApi.list({ per_page: 24 });
        const data = response.data.data ?? [];
        if (!cancelled) setProducts(data);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setHasFetched(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isInitialized]);

  // Once we have both the server list and a trustworthy local ids set,
  // filter out anything the user un-favorited in-session so the UI reacts
  // instantly. Before the ids set is ready, trust the server response as-is
  // to avoid a flash of "no favorites" on hard refresh.
  const visibleProducts = useMemo(
    () =>
      wishlistInitialized
        ? products.filter((p) => wishlistIds.has(p.id))
        : products,
    [products, wishlistIds, wishlistInitialized],
  );

  if (isInitialized && !isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <EmptyState message={t("product.noFavorites")} />
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button
            component={Link}
            href={`/${locale}/auth/login`}
            variant="contained"
            sx={{ borderRadius: 100, px: 4, py: 1.2 }}
          >
            {t("auth.loginTitle")}
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <FavoriteRoundedIcon sx={{ color: "#ff3b30" }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t("product.myFavorites")}
        </Typography>
      </Box>

      {isLoading || !hasFetched ? (
        <ProductGridSkeleton count={8} />
      ) : visibleProducts.length === 0 ? (
        <>
          <EmptyState message={t("product.noFavorites")} />
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Button
              component={Link}
              href={`/${locale}/products`}
              variant="contained"
              sx={{ borderRadius: 100, px: 4, py: 1.2 }}
            >
              {t("cart.continueShopping")}
            </Button>
          </Box>
        </>
      ) : (
        <ProductGrid products={visibleProducts} />
      )}
    </Container>
  );
}
