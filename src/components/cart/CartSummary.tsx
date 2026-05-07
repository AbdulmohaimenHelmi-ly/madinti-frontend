"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import type { Cart } from "@/lib/types";

interface CartSummaryProps {
  cart: Cart;
}

export default function CartSummary({ cart }: CartSummaryProps) {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale();

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="mt-2 p-5 rounded-2xl bg-gray-50 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{t("subtotal")}</span>
            <span className="font-bold text-sm">{subtotal.toFixed(2)} {tc("currency")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{t("shipping")}</span>
            <span className="text-sm text-gray-500 font-medium">{t("shippingAtCheckout")}</span>
          </div>
          <hr className="border-gray-200 my-1" />
          <div className="flex justify-between items-center">
            <span className="font-extrabold">{t("total")}</span>
            <span
              className="font-extrabold text-lg"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {subtotal.toFixed(2)} {tc("currency")}
            </span>
          </div>
        </div>

        <Link
          href={`/${locale}/checkout?vendor=${cart.vendor_id}`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-extrabold text-[0.95rem] text-white whitespace-nowrap sm:min-w-[220px] transition hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <ShoppingCart size={18} />
          {t("checkoutThisStore")}
        </Link>
      </div>
    </div>
  );
}
