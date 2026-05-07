"use client";

export interface DashboardHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function DashboardHero({
  eyebrow,
  title,
  subtitle,
  icon,
  action,
}: DashboardHeroProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-6 p-6 md:p-8 text-white"
      style={{
        background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
        boxShadow: "0 18px 36px -22px rgba(15,23,42,0.45)",
      }}
    >
      <div
        className="pointer-events-none absolute end-0 top-0 rounded-full"
        style={{ width: 240, height: 240, background: "rgba(255,255,255,0.12)", transform: "translate(33%, -33%)" }}
      />
      <div
        className="pointer-events-none absolute end-16 bottom-0 rounded-full"
        style={{ width: 140, height: 140, background: "rgba(255,255,255,0.08)", transform: "translateY(50%)" }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {icon && (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm [&>svg]:w-7 [&>svg]:h-7">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <span className="block text-xs font-semibold uppercase tracking-wider opacity-85 mb-0.5">
                {eyebrow}
              </span>
            )}
            <h1 className="text-xl font-extrabold leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-sm opacity-90 mt-1">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0 w-full md:w-auto">{action}</div>}
      </div>
    </div>
  );
}
