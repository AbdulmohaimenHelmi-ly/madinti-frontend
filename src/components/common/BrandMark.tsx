"use client";

import { PawPrint } from "lucide-react";
import Link from "next/link";

interface BrandMarkProps {
  name: string;
  href?: string;
  variant?: "light" | "color";
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { text: "text-[1.05rem]", icon: 18, gap: "gap-2" },
  md: { text: "text-[1.3rem]", icon: 22, gap: "gap-2" },
  lg: { text: "text-[1.5rem]", icon: 26, gap: "gap-3" },
};

export default function BrandMark({
  name,
  href,
  variant = "light",
  size = "md",
}: BrandMarkProps) {
  const s = SIZES[size];

  const inner = (
    <span className={`inline-flex items-center ${s.gap} no-underline`}>
      <PawPrint
        size={s.icon}
        style={{
          color: variant === "light" ? "white" : "var(--color-primary)",
          transform: "rotate(-15deg)",
          filter: variant === "light" ? "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" : "none",
        }}
      />
      <span
        className={`font-extrabold ${s.text} leading-none tracking-wide`}
        style={
          variant === "light"
            ? {
                background: "linear-gradient(135deg, #FFFFFF 0%, #E8F5E9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }
            : { color: "var(--color-primary)" }
        }
      >
        {name}
      </span>
    </span>
  );

  if (!href) return inner;

  return (
    <Link href={href} className="inline-flex no-underline shrink-0">
      {inner}
    </Link>
  );
}
