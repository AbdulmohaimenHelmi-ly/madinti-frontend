"use client";

import { useTranslations } from "next-intl";

export default function LoadingSpinner() {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative inline-flex">
        <div
          className="w-14 h-14 rounded-full border-4 border-gray-200"
          style={{ borderTopColor: "var(--color-primary)", animation: "spin 1.2s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-3 h-3 rounded-full opacity-30"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500">{t("loading")}</p>
    </div>
  );
}
