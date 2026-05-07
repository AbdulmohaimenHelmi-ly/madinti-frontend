"use client";

import { Inbox } from "lucide-react";
import { useTranslations } from "next-intl";

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-2">
        <Inbox className="w-12 h-12 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-500">
        {message || t("noResults")}
      </h3>
    </div>
  );
}
