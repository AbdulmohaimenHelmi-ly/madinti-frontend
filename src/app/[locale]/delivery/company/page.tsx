"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Save, AlertCircle, CheckCircle } from "lucide-react";

import { deliveryApi, type DeliveryCompany } from "@/lib/api/delivery";
import DeliveryPageHeader from "@/components/delivery/DeliveryPageHeader";

export default function DeliveryCompanyPage() {
  const t = useTranslations("delivery");
  const [company, setCompany] = useState<DeliveryCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    deliveryApi
      .myCompany()
      .then((res) => setCompany(res.data.data))
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const update = <K extends keyof DeliveryCompany>(k: K, v: DeliveryCompany[K]) => {
    setCompany((c) => (c ? { ...c, [k]: v } : c));
  };

  const onSave = async () => {
    if (!company) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await deliveryApi.updateCompany({
        name: company.name,
        name_en: company.name_en ?? null,
        description: company.description ?? null,
        description_en: company.description_en ?? null,
        phone: company.phone ?? null,
        email: company.email ?? null,
        base_price: Number(company.base_price) || 0,
        is_active: company.is_active,
      });
      setCompany(res.data.data);
      setSuccess(t("saved"));
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--color-primary)]" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <span>{error || t("loadError")}</span>
      </div>
    );
  }

  return (
    <div>
      <DeliveryPageHeader
        title={t("company")}
        subtitle={t("companySubtitle")}
        action={{
          label: saving ? t("saving") : t("save"),
          icon: <Save size={16} />,
          onClick: onSave,
          disabled: saving,
        }}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 mb-4">
          <CheckCircle size={16} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t("nameAr")}</label>
            <input
              type="text"
              value={company.name}
              onChange={(e) => update("name", e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t("nameEn")}</label>
            <input
              type="text"
              value={company.name_en ?? ""}
              onChange={(e) => update("name_en", e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t("phone")}</label>
            <input
              type="text"
              value={company.phone ?? ""}
              onChange={(e) => update("phone", e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t("email")}</label>
            <input
              type="text"
              value={company.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t("basePrice")}</label>
            <input
              type="number"
              value={company.base_price}
              onChange={(e) => update("base_price", Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <p className="text-xs text-gray-400 mt-0.5">{t("basePriceHelp")}</p>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={!!company.is_active}
                  onChange={(e) => update("is_active", e.target.checked)}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${company.is_active ? "bg-[var(--color-primary)]" : "bg-gray-300"}`} />
                <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${company.is_active ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <span className="text-sm">{t("isActive")}</span>
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t("descriptionAr")}</label>
            <textarea
              rows={3}
              value={company.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t("descriptionEn")}</label>
            <textarea
              rows={3}
              value={company.description_en ?? ""}
              onChange={(e) => update("description_en", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
