"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
