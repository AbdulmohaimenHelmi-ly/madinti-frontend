"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";

export default function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlistIds = useWishlistStore((s) => s.fetchIds);
  const resetWishlist = useWishlistStore((s) => s.reset);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Keep the cart + wishlist in sync with the authenticated user.
  // Admins don't need a cart, but they can still favorite products.
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!user.is_admin) fetchCart();
      fetchWishlistIds();
    } else if (!isAuthenticated) {
      resetWishlist();
    }
  }, [isAuthenticated, user, fetchCart, fetchWishlistIds, resetWishlist]);

  return null;
}
