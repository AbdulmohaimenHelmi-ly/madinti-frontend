"use client";

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  dense?: boolean;
}

export default function SectionTitle({
  title,
  subtitle,
  action,
  dense,
}: SectionTitleProps) {
  return (
    <div className={`flex flex-row items-end justify-between gap-4 ${dense ? "mb-3 mt-2" : "mb-4 mt-3"}`}>
      <div className="min-w-0">
        <p className="text-base font-extrabold leading-tight tracking-tight">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
