"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ErrorMessageProps {
  message?: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  const t = useTranslations("common");

  return (
    <div className="py-8">
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span className="text-sm font-medium">{message || t("error")}</span>
      </div>
    </div>
  );
}
