"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";

export default function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Keep the cart in sync with the authenticated user. Admins don't need it.
  useEffect(() => {
    if (isAuthenticated && user && !user.is_admin) {
      fetchCart();
    }
  }, [isAuthenticated, user, fetchCart]);

  return null;
}
