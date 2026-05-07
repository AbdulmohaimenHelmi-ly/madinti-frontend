"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "");
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EDE7E9] bg-white text-[#1A1A1A] transition hover:bg-[#F5F0F2]"
    >
      <Languages size={20} />
    </button>
  );
}
