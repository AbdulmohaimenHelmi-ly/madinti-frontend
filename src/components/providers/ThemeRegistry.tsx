"use client";
import ThemeApplier from "./ThemeApplier";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeApplier />
      {children}
    </>
  );
}
