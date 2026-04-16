"use client";

import { useState, useEffect, useCallback } from "react";
import type { Product } from "@/lib/types";
import { productsApi } from "@/lib/api/products";

export function useProducts(params?: Record<string, string | number>) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productsApi.getAll(params);
      setProducts(response.data.data);
      if (response.data.meta) {
        setTotalPages(response.data.meta.last_page);
      }
    } catch {
      setError("Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, totalPages, refetch: fetchProducts };
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    productsApi
      .getFeatured()
      .then((res) => setProducts(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return { products, isLoading };
}
