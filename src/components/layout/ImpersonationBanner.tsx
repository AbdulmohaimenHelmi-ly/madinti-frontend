"use client";

import { useTranslations, useLocale } from "next-intl";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

export default function ImpersonationBanner() {
  const t = useTranslations("common");
  const impersonator = useAuthStore((s) => s.impersonator);
  const user = useAuthStore((s) => s.user);
  const stopImpersonation = useAuthStore((s) => s.stopImpersonation);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  if (!impersonator || !user) return null;

  const handleStop = () => {
    stopImpersonation();
    if (pathname?.startsWith(`/${locale}/admin`)) {
      router.refresh();
    } else {
      router.push(`/${locale}/admin/users`);
    }
  };

  return (
    <div className="sticky top-0 z-[1200] bg-purple-800 text-white">
      <div className="max-w-[1200px] mx-auto px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="font-semibold text-sm">{t("impersonatingAs", { name: user.name })}</span>
        <button
          type="button"
          onClick={handleStop}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-purple-800 hover:bg-purple-50 transition"
        >
          <LogOut size={14} />
          {t("stopImpersonating")}
        </button>
      </div>
    </div>
  );
}
