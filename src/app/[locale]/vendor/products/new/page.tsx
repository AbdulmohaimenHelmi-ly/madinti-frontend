"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { vendorApi } from "@/lib/api/vendor";
import type { Brand, Category, ContentType } from "@/lib/types";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { useAudienceOptions } from "@/components/common/AudienceChip";

interface CreateForm {
  category_id: number | "";
  brand_id: number | "";
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  price: string;
  compare_price: string;
  cost: string;
  sku: string;
  quantity: string;
  content_type: ContentType;
  is_active: boolean;
  is_featured: boolean;
  has_variants: boolean;
}

function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
        <div className={`w-10 h-5 rounded-full transition-colors ${checked ? "bg-[var(--color-primary)]" : "bg-gray-300"} ${disabled ? "opacity-50" : ""}`} />
        <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
    </label>
  );
}

export default function VendorCreateProductPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("vendor");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const audienceOptions = useAudienceOptions(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreateForm>({
    category_id: "", brand_id: "", name: "", name_en: "", description: "", description_en: "",
    price: "", compare_price: "", cost: "", sku: "", quantity: "0",
    content_type: "unisex", is_active: true, is_featured: false, has_variants: false,
  });

  useEffect(() => {
    let active = true;
    Promise.all([vendorApi.listCategories(), vendorApi.listBrands()])
      .then(([c, b]) => { if (!active) return; setCategories(c.data.data); setBrands(b.data.data); })
      .catch(() => active && setError(t("loadError")))
      .finally(() => active && setBootstrapping(false));
    return () => { active = false; };
  }, [t]);

  const labelOf = (it: { name: string; name_en: string | null }) => locale === "en" && it.name_en ? it.name_en : it.name;
  const fieldDisabled = bootstrapping || saving;

  const handleSave = async () => {
    setError("");
    if (!form.category_id) { setError(tAdmin("nameRequired")); return; }
    if (!form.name.trim()) { setError(tAdmin("nameRequired")); return; }
    setSaving(true);
    try {
      const created = await vendorApi.createProduct({
        category_id: Number(form.category_id),
        brand_id: form.brand_id === "" ? null : Number(form.brand_id),
        name: form.name.trim(),
        name_en: form.name_en.trim() || null,
        description: form.description || null,
        description_en: form.description_en || null,
        price: form.has_variants ? 0 : Number(form.price) || 0,
        compare_price: form.compare_price === "" ? null : Number(form.compare_price),
        cost: form.cost === "" ? null : Number(form.cost),
        sku: form.sku || null,
        quantity: form.has_variants ? 0 : Number(form.quantity) || 0,
        content_type: form.content_type,
        is_active: form.is_active,
        is_featured: form.is_featured,
        has_variants: form.has_variants,
      });
      router.push(`/${locale}/vendor/products/${created.data.data.id}/edit`);
    } catch {
      setError(t("actionError"));
      setSaving(false);
    }
  };

  const inp = "h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60";
  const sel = "h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60";

  return (
    <div>
      <Link href={`/${locale}/vendor/products`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 no-underline">
        <ArrowLeft size={16} className={locale === "ar" ? "rotate-180" : ""} /> {t("backToProducts")}
      </Link>

      <VendorPageHeader title={t("addProduct")} subtitle={t("addProductSubtitle")} />

      {error && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4"><span>{error}</span></div>}

      <div className="flex flex-col gap-4">
        {/* Basic info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold mb-4">{tAdmin("basicInfo")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{tAdmin("nameAr")} *</label>
              <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={fieldDisabled} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{tAdmin("nameEn")}</label>
              <input className={inp} value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} disabled={fieldDisabled} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t("category")} *</label>
              <select className={sel} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: Number(e.target.value) || "" }))} disabled={fieldDisabled}>
                <option value="">—</option>
                {categories.map(c => <option key={c.id} value={c.id}>{labelOf(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{tAdmin("brand")}</label>
              <select className={sel} value={form.brand_id} onChange={e => setForm(f => ({ ...f, brand_id: e.target.value === "" ? "" : Number(e.target.value) }))} disabled={fieldDisabled}>
                <option value="">{t("none")}</option>
                {brands.map(b => <option key={b.id} value={b.id}>{labelOf(b)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{tAdmin("audience")}</label>
              <select className={sel} value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value as ContentType }))} disabled={fieldDisabled}>
                {audienceOptions.map(o => <option key={o.value || "unisex"} value={o.value || "unisex"}>{o.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">{tAdmin("descriptionAr")}</label>
              <textarea rows={2} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} disabled={fieldDisabled} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">{tAdmin("descriptionEn")}</label>
              <textarea rows={2} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60" value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} disabled={fieldDisabled} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <Switch checked={form.is_active} onChange={v => setForm(f => ({ ...f, is_active: v }))} disabled={fieldDisabled} />
                {t("active")}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <Switch checked={form.is_featured} onChange={v => setForm(f => ({ ...f, is_featured: v }))} disabled={fieldDisabled} />
                {t("featured")}
              </label>
            </div>
          </div>
        </div>

        {/* Pricing & stock */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h2 className="text-lg font-bold">{tAdmin("pricingStock")}</h2>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Switch checked={form.has_variants} onChange={v => setForm(f => ({ ...f, has_variants: v }))} disabled={fieldDisabled} />
              {tAdmin("hasVariants")}
            </label>
          </div>

          {form.has_variants ? (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              <span>{tAdmin("createVariantsAfterSave")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tCommon("price")}</label>
                <div className="relative">
                  <input type="number" className={inp} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} disabled={fieldDisabled} />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{tCommon("currency")}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tAdmin("comparePrice")}</label>
                <input type="number" className={inp} value={form.compare_price} onChange={e => setForm(f => ({ ...f, compare_price: e.target.value }))} disabled={fieldDisabled} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tCommon("quantity")}</label>
                <input type="number" className={inp} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} disabled={fieldDisabled} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tAdmin("sku")}</label>
                <input className={inp} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} disabled={fieldDisabled} />
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button type="button" onClick={handleSave} disabled={fieldDisabled}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--color-primary)" }}>
              <Save size={16} /> {tCommon("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
