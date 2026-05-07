"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";

import { adminApi } from "@/lib/api/admin";
import type { Brand, Category, ContentType, Vendor } from "@/lib/types";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAudienceOptions } from "@/components/common/AudienceChip";

interface CreateForm {
  vendor_id: number | "";
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

export default function AdminCreateProductPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const uiLocale = useLocale();
  const audienceOptions = useAudienceOptions(false);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState<CreateForm>({
    vendor_id: "",
    category_id: "",
    brand_id: "",
    name: "",
    name_en: "",
    description: "",
    description_en: "",
    price: "",
    compare_price: "",
    cost: "",
    sku: "",
    quantity: "0",
    content_type: "unisex",
    is_active: true,
    is_featured: false,
    has_variants: false,
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.getVendors({ per_page: 200 }),
      adminApi.getCategories(),
      adminApi.getBrands(),
    ])
      .then(([v, c, b]) => {
        if (!active) return;
        setVendors(v.data.data);
        setCategories(c.data.data);
        setBrands(b.data.data);
      })
      .catch(() => active && setError(t("loadError")))
      .finally(() => active && setBootstrapping(false));
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const labelOf = (it: { name: string; name_en: string | null }) =>
    uiLocale === "en" && it.name_en ? it.name_en : it.name;

  const vendorLabel = (v: Vendor) =>
    uiLocale === "en" && v.store_name_en ? v.store_name_en : v.store_name;

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const fieldDisabled = bootstrapping || saving;

  const handleSave = async () => {
    setError("");
    if (!form.vendor_id) {
      setError(t("vendorRequired"));
      return;
    }
    if (!form.category_id) {
      setError(t("nameRequired"));
      return;
    }
    if (!form.name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("vendor_id", String(Number(form.vendor_id)));
      payload.append("category_id", String(Number(form.category_id)));
      if (form.brand_id !== "") payload.append("brand_id", String(Number(form.brand_id)));
      payload.append("name", form.name.trim());
      if (form.name_en.trim()) payload.append("name_en", form.name_en.trim());
      if (form.description) payload.append("description", form.description);
      if (form.description_en) payload.append("description_en", form.description_en);
      payload.append("price", String(form.has_variants ? 0 : Number(form.price) || 0));
      if (form.compare_price !== "") payload.append("compare_price", String(Number(form.compare_price)));
      if (form.cost !== "") payload.append("cost", String(Number(form.cost)));
      if (form.sku) payload.append("sku", form.sku);
      payload.append("quantity", String(form.has_variants ? 0 : Number(form.quantity) || 0));
      payload.append("content_type", form.content_type);
      payload.append("is_active", form.is_active ? "1" : "0");
      payload.append("is_featured", form.is_featured ? "1" : "0");
      payload.append("has_variants", form.has_variants ? "1" : "0");
      imageFiles.forEach((file) => payload.append("images[]", file));

      const created = await adminApi.createProduct(payload);
      router.push(`/${locale}/admin/products/${created.data.data.id}/edit`);
    } catch {
      setError(t("actionError"));
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={t("addProduct")}
        subtitle={t("addProductSubtitle")}
      />

      <div className="mb-4">
        <Link
          href={`/${locale}/admin/products`}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft
            size={16}
            style={{ transform: uiLocale === "ar" ? "scaleX(-1)" : "none" }}
          />
          {tCommon("back")}
        </Link>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Basic info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-base font-bold">{t("basicInfo")}</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Vendor */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {t("selectVendor")} *
              </label>
              <select
                value={form.vendor_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vendor_id: Number(e.target.value) || "" }))
                }
                disabled={fieldDisabled}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
              >
                <option value="">—</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendorLabel(vendor)}
                  </option>
                ))}
              </select>
            </div>

            {/* Name AR */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {t("nameAr")} *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={fieldDisabled}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
              />
            </div>

            {/* Name EN */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {t("nameEn")}
              </label>
              <input
                type="text"
                value={form.name_en}
                onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                disabled={fieldDisabled}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {t("category")} *
              </label>
              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category_id: Number(e.target.value) || "" }))
                }
                disabled={fieldDisabled}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
              >
                <option value="">—</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {labelOf(category)}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {t("brand")}
              </label>
              <select
                value={form.brand_id}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    brand_id: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                disabled={fieldDisabled}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
              >
                <option value="">{tCommon("none")}</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {labelOf(brand)}
                  </option>
                ))}
              </select>
            </div>

            {/* Audience */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {t("audience")}
              </label>
              <select
                value={form.content_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    content_type: e.target.value as ContentType,
                  }))
                }
                disabled={fieldDisabled}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
              >
                {audienceOptions.map((option) => (
                  <option key={option.value || "unisex"} value={option.value || "unisex"}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description AR */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {t("descriptionAr")}
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                disabled={fieldDisabled}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
              />
            </div>

            {/* Description EN */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {t("descriptionEn")}
              </label>
              <textarea
                rows={3}
                value={form.description_en}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description_en: e.target.value }))
                }
                disabled={fieldDisabled}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.is_active}
                    disabled={fieldDisabled}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_active: e.target.checked }))
                    }
                  />
                  <div
                    className={`h-5 w-10 rounded-full transition-colors ${form.is_active ? "bg-[var(--color-primary)]" : "bg-gray-300"}`}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0"}`}
                  />
                </div>
                <span className="text-sm font-medium">{t("active")}</span>
              </label>

              <label className="flex cursor-pointer select-none items-center gap-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.is_featured}
                    disabled={fieldDisabled}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_featured: e.target.checked }))
                    }
                  />
                  <div
                    className={`h-5 w-10 rounded-full transition-colors ${form.is_featured ? "bg-[var(--color-primary)]" : "bg-gray-300"}`}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_featured ? "translate-x-5" : "translate-x-0"}`}
                  />
                </div>
                <span className="text-sm font-medium">{t("featured")}</span>
              </label>
            </div>

            {/* Images */}
            <div className="md:col-span-2">
              <hr className="my-4 border-gray-100" />
              <p className="mb-1 text-sm font-bold">{t("images")}</p>
              <p className="mb-3 text-sm text-gray-500">{t("imagesReplaceHint")}</p>
              <div className="flex flex-col gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                  {t("uploadImages")}
                  <input
                    hidden
                    multiple
                    accept="image/*"
                    type="file"
                    onChange={handleImagesChange}
                    disabled={fieldDisabled}
                  />
                </label>
                <p className="text-sm text-gray-500">
                  {imageFiles.length
                    ? `${t("selectedImages")}: ${imageFiles.length}`
                    : t("noImagesSelected")}
                </p>
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((src, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={src}
                        src={src}
                        alt={`preview-${index + 1}`}
                        className="h-21 w-21 rounded-lg border border-gray-200 object-cover"
                        style={{ width: 84, height: 84 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & stock */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold">{t("pricingStock")}</h3>
            <label className="flex cursor-pointer select-none items-center gap-2">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.has_variants}
                  disabled={fieldDisabled}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, has_variants: e.target.checked }))
                  }
                />
                <div
                  className={`h-5 w-10 rounded-full transition-colors ${form.has_variants ? "bg-[var(--color-primary)]" : "bg-gray-300"}`}
                />
                <div
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.has_variants ? "translate-x-5" : "translate-x-0"}`}
                />
              </div>
              <span className="text-sm font-medium">{t("hasVariants")}</span>
            </label>
          </div>

          {form.has_variants ? (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              {t("createVariantsAfterSave")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="relative">
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {tCommon("price")}
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  disabled={fieldDisabled}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pe-8 ps-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                />
                <span className="absolute bottom-0 end-0 flex h-9 items-center pe-3 text-xs text-gray-400">
                  {tCommon("currency")}
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("comparePrice")}
                </label>
                <input
                  type="number"
                  value={form.compare_price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, compare_price: e.target.value }))
                  }
                  disabled={fieldDisabled}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {tCommon("quantity")}
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  disabled={fieldDisabled}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("sku")}
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  disabled={fieldDisabled}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={fieldDisabled}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--color-primary)" }}
            >
              <Save size={16} />
              {t("saveProduct")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
