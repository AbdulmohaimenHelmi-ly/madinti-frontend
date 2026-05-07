"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  hint?: string;
  delta?: number;
  deltaLabel?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  color = "#1976d2",
  hint,
  delta,
  deltaLabel,
}: StatCardProps) {
  const trend =
    typeof delta === "number"
      ? delta > 0 ? "up" : delta < 0 ? "down" : "flat"
      : null;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendBg = trend === "up" ? "rgba(46,125,50,0.1)" : trend === "down" ? "rgba(211,47,47,0.1)" : undefined;
  const trendColor = trend === "up" ? "#2E7D32" : trend === "down" ? "#D32F2F" : "#666";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 h-full transition-all duration-180 hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div
        className="absolute end-0 top-0 pointer-events-none"
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle at center, ${color}22 0%, transparent 70%)`,
          transform: "translate(35%, -35%)",
        }}
      />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </span>
          <span className="block text-3xl font-black leading-tight mt-1 text-gray-900 truncate" style={{ letterSpacing: "-0.02em" }}>
            {value}
          </span>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          {icon}
        </div>
      </div>

      {(trend || hint) && (
        <div className="relative z-10 flex items-center gap-1.5 mt-4">
          {trend && (
            <span
              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5"
              style={{ backgroundColor: trendBg, color: trendColor }}
            >
              <TrendIcon size={12} />
              <span className="text-[11px] font-bold">{Math.abs(delta!).toFixed(1)}%</span>
            </span>
          )}
          {(deltaLabel || hint) && (
            <span className="text-xs text-gray-500 truncate">{deltaLabel ?? hint}</span>
          )}
        </div>
      )}
    </div>
  );
}
