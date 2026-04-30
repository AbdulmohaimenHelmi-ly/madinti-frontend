"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";

export default function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const fetchCarts = useCartStore((s) => s.fetchCarts);
  const resetCart = useCartStore((s) => s.reset);
  const fetchWishlistIds = useWishlistStore((s) => s.fetchIds);
  const resetWishlist = useWishlistStore((s) => s.reset);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Keep the per-vendor carts + wishlist in sync with the authenticated
  // user. Admins don't need carts, but they can still favorite products.
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!user.is_admin) fetchCarts();
      fetchWishlistIds();
    } else if (!isAuthenticated) {
      resetCart();
      resetWishlist();
    }
  }, [isAuthenticated, user, fetchCarts, resetCart, fetchWishlistIds, resetWishlist]);

  return null;
}
