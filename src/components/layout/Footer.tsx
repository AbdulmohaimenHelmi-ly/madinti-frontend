"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PawPrint, X, Globe, Mail, Phone } from "lucide-react";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();

  if (
    pathname?.startsWith(`/${locale}/admin`) ||
    pathname?.startsWith(`/${locale}/vendor`) ||
    pathname?.startsWith(`/${locale}/delivery`)
  ) return null;

  return (
    <footer
      className="hidden md:block text-white mt-10 pt-12 pb-8 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 40%, var(--color-primary) 100%)" }}
    >
      {/* top accent line */}
      <div className="absolute top-0 start-0 end-0 h-1" style={{ background: "linear-gradient(90deg, var(--color-secondary-dark), var(--color-secondary), var(--color-secondary-dark))" }} />

      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-12 gap-8">
        {/* brand */}
        <div className="col-span-12 md:col-span-4">
          <h2 className="inline-flex items-center gap-2 text-xl font-extrabold mb-3">
            <PawPrint size={22} className="-rotate-[15deg]" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }} />
            {t("common.appName")}
          </h2>
          <p className="text-sm opacity-80 leading-[1.8] mb-4">{t("footer.aboutText")}</p>
          <div className="flex gap-2">
            {[{ Icon: X, label: "Twitter" }, { Icon: Globe, label: "Website" }].map(({ Icon, label }) => (
              <button key={label} type="button" aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* quick links */}
        <div className="col-span-12 md:col-span-4">
          <h3 className="text-base font-bold mb-3">{t("footer.quickLinks")}</h3>
          <div className="flex flex-col gap-2">
            {[
              { href: `/${locale}/products`, label: t("common.products") },
              { href: `/${locale}/categories`, label: t("common.categories") },
              { href: `/${locale}/vendors`, label: t("common.vendors") },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-sm opacity-80 no-underline hover:opacity-100 transition-all hover:translate-x-1">
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* contact */}
        <div className="col-span-12 md:col-span-4">
          <h3 className="text-base font-bold mb-3">{t("footer.contactUs")}</h3>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 text-sm opacity-85">
              <Mail size={15} /> {t("footer.email")}
            </div>
            <div className="flex items-center gap-2.5 text-sm opacity-85">
              <Phone size={15} /> {t("footer.phone")}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 mt-10 pt-4 border-t border-white/15 text-center">
        <p className="text-xs opacity-60">
          © {new Date().getFullYear()} {t("common.appName")}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
