"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ContentType } from "@/lib/types";

export type ContentFilter = ContentType | "all";

interface ContentFilterContextValue {
  filter: ContentFilter;
  setFilter: (value: ContentFilter) => void;
  /** Value safe for API calls: undefined when "all" or unisex. */
  apiParam: "male" | "female" | undefined;
}

const STORAGE_KEY = "ajjmal.contentFilter";

const ContentFilterContext = createContext<ContentFilterContextValue | null>(
  null
);

export function ContentFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<ContentFilter>(() => {
    if (typeof window === "undefined") {
      return "all";
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "male" || saved === "female" || saved === "all") {
        return saved;
      }
    } catch {
      // ignore storage errors (SSR / privacy)
    }

    return "all";
  });

  const setFilter = useCallback((value: ContentFilter) => {
    setFilterState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }, []);

  const apiParam =
    filter === "male" || filter === "female" ? filter : undefined;

  return (
    <ContentFilterContext.Provider value={{ filter, setFilter, apiParam }}>
      {children}
    </ContentFilterContext.Provider>
  );
}

export function useContentFilter(): ContentFilterContextValue {
  const ctx = useContext(ContentFilterContext);
  if (!ctx) {
    throw new Error(
      "useContentFilter must be used inside ContentFilterProvider"
    );
  }
  return ctx;
}
