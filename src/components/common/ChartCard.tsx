"use client";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  height?: number | string;
  children: React.ReactNode;
  flush?: boolean;
}

export default function ChartCard({
  title,
  subtitle,
  action,
  height = 280,
  children,
  flush,
}: ChartCardProps) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <p className="font-extrabold text-base leading-tight truncate">{title}</p>
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div
        className={`flex-1 min-h-0 ${flush ? "-mx-5 -mb-5" : ""}`}
        style={{ height }}
      >
        {children}
      </div>
    </div>
  );
}
