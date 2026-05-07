"use client";

import { ChangeEvent, use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { AlertCircle, ArrowLeft, Pencil, Plus, Save, Star, Trash2 } from "lucide-react";

import {
  adminApi,
  type ProductPayload,
  type SaveVariantPayload,
} from "@/lib/api/admin";
import { productsApi } from "@/lib/api/products";
import type {
  Brand,
  Category,
  ContentType,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAudienceOptions } from "@/components/common/AudienceChip";

// ---------- Form types ----------
interface ProductFormState {
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  price: string;
  compare_price: string;
  cost: string;
  sku: string;
  quantity: string;
  category_id: number | "";
  brand_id: number | "";
  content_type: ContentType;
  is_active: boolean;
  is_featured: boolean;
  has_variants: boolean;
}

const emptyForm = (): ProductFormState => ({
  name: "",
  name_en: "",
  description: "",
  description_en: "",
  price: "",
  compare_price: "",
  cost: "",
  sku: "",
  quantity: "",
  category_id: "",
  brand_id: "",
  content_type: "unisex",
  is_active: true,
  is_featured: false,
  has_variants: false,
});

const toForm = (p: Product): ProductFormState => ({
  name: p.name ?? "",
  name_en: p.name_en ?? "",
  description: p.description ?? "",
  description_en: p.description_en ?? "",
  price: String(p.price ?? ""),
  compare_price: p.compare_price !== null && p.compare_price !== undefined ? String(p.compare_price) : "",
  cost: "",
  sku: p.sku ?? "",
  quantity: String(p.quantity ?? ""),
  category_id: p.category_id ?? "",
  brand_id: p.brand_id ?? "",
  content_type: (p.content_type as ContentType) ?? "unisex",
  is_active: !!p.is_active,
  is_featured: !!p.is_featured,
  has_variants: !!p.has_variants,
});

// ---------- Variant dialog state ----------
interface VariantDialogState {
  open: boolean;
  editingId: number | null;
  // option_id -> value_id
  picks: Record<number, number>;
  sku: string;
  price: string;
  compare_price: string;
  quantity: string;
  is_active: boolean;
  is_default: boolean;
}

const emptyVariantDialog = (): VariantDialogState => ({
  open: false,
  editingId: null,
  picks: {},
  sku: "",
  price: "",
  compare_price: "",
  quantity: "0",
  is_active: true,
  is_default: false,
});

export default function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = use(params);
  const productId = Number(id);
  const t = useTranslations();
  const currentLocale = useLocale();
  const audienceOptions = useAudienceOptions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Variants section
  const [allOptions, setAllOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [vDialog, setVDialog] = useState<VariantDialogState>(emptyVariantDialog());
  const [savingVariant, setSavingVariant] = useState(false);

  // Auto-dismiss snack
  useEffect(() => {
    if (!snack) return;
    const timer = setTimeout(() => setSnack(null), 3000);
    return () => clearTimeout(timer);
  }, [snack]);

  // ---------- Initial load ----------
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productRes, catsRes, brandsRes, optionsRes, variantsRes] = await Promise.all([
        productsApi.getById(productId),
        adminApi.getCategories(),
        adminApi.getBrands(),
        adminApi.listOptions(),
        adminApi.listVariants(productId),
      ]);
      const p = productRes.data.data;
      setProduct(p);
      setForm(toForm(p));
      setCategories(catsRes.data.data);
      setBrands(brandsRes.data.data);
      setAllOptions(optionsRes.data.data);
      setVariants(variantsRes.data.data);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  // ---------- Save product basics ----------
  const saveProduct = async () => {
    setSaving(true);
    try {
      const payload: ProductPayload | FormData = imageFiles.length > 0
        ? (() => {
            const formData = new FormData();
            formData.append("name", form.name);
            if (form.name_en) formData.append("name_en", form.name_en);
            if (form.description) formData.append("description", form.description);
            if (form.description_en) formData.append("description_en", form.description_en);
            formData.append("price", String(form.has_variants ? 0 : Number(form.price || 0)));
            if (form.compare_price) formData.append("compare_price", String(Number(form.compare_price)));
            if (form.sku) formData.append("sku", form.sku);
            formData.append("quantity", String(form.has_variants ? 0 : Number(form.quantity || 0)));
            if (form.category_id) formData.append("category_id", String(form.category_id));
            if (form.brand_id) formData.append("brand_id", String(form.brand_id));
            formData.append("content_type", form.content_type);
            formData.append("is_active", form.is_active ? "1" : "0");
            formData.append("is_featured", form.is_featured ? "1" : "0");
            formData.append("has_variants", form.has_variants ? "1" : "0");
            imageFiles.forEach((file) => formData.append("images[]", file));
            return formData;
          })()
        : {
            name: form.name,
            name_en: form.name_en || null,
            description: form.description || null,
            description_en: form.description_en || null,
            price: form.has_variants ? 0 : Number(form.price || 0),
            compare_price: form.compare_price ? Number(form.compare_price) : null,
            sku: form.sku || null,
            quantity: form.has_variants ? 0 : Number(form.quantity || 0),
            category_id: form.category_id || undefined,
            brand_id: form.brand_id || null,
            content_type: form.content_type,
            is_active: form.is_active,
            is_featured: form.is_featured,
            has_variants: form.has_variants,
          };
      await adminApi.updateProduct(productId, payload);
      setSnack({ msg: t("admin.productSaved") || "Product saved", sev: "success" });
      // If toggled off, server-side variants stay but flag is off; reload to sync.
      load();
    } catch {
      setSnack({ msg: t("common.error"), sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ---------- Variant helpers ----------
  const optionLabel = (opt: ProductOption) =>
    currentLocale === "en" && opt.name_en ? opt.name_en : opt.name;
  const valueLabel = (val: ProductOptionValue) =>
    currentLocale === "en" && val.value_en ? val.value_en : val.value;

  const variantLabel = useMemo(() => {
    return (variant: ProductVariant): string => {
      if (!variant.option_value_ids?.length) return "—";
      const parts: string[] = [];
      for (const opt of allOptions) {
        const valId = variant.option_value_ids.find((id) =>
          opt.values.some((v) => v.id === id)
        );
        if (!valId) continue;
        const val = opt.values.find((v) => v.id === valId);
        if (val) parts.push(`${optionLabel(opt)}: ${valueLabel(val)}`);
      }
      return parts.join(" / ");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOptions, currentLocale]);

  const openCreateVariant = () => {
    setVDialog({ ...emptyVariantDialog(), open: true });
  };

  const openEditVariant = (v: ProductVariant) => {
    const picks: Record<number, number> = {};
    for (const opt of allOptions) {
      const valId = v.option_value_ids.find((id) =>
        opt.values.some((vv) => vv.id === id)
      );
      if (valId) picks[opt.id] = valId;
    }
    setVDialog({
      open: true,
      editingId: v.id,
      picks,
      sku: v.sku ?? "",
      price: String(v.price),
      compare_price: v.compare_price !== null ? String(v.compare_price) : "",
      quantity: String(v.quantity),
      is_active: !!v.is_active,
      is_default: !!v.is_default,
    });
  };

  const closeVariantDialog = () => setVDialog((s) => ({ ...s, open: false }));

  const togglePick = (optionId: number, valueId: number) => {
    setVDialog((s) => {
      const next = { ...s.picks };
      if (next[optionId] === valueId) delete next[optionId];
      else next[optionId] = valueId;
      return { ...s, picks: next };
    });
  };

  const saveVariant = async () => {
    const ids = Object.values(vDialog.picks).filter((n): n is number => Number.isFinite(n));
    if (ids.length === 0) {
      setSnack({ msg: "Pick at least one option value.", sev: "error" });
      return;
    }
    if (!vDialog.price || Number(vDialog.price) < 0) {
      setSnack({ msg: "Enter a valid price.", sev: "error" });
      return;
    }
    const pickedSet = new Set(ids);
    const duplicate = variants.find(
      (v) =>
        v.id !== vDialog.editingId &&
        v.option_value_ids.length === pickedSet.size &&
        v.option_value_ids.every((id) => pickedSet.has(id))
    );
    if (duplicate) {
      setSnack({
        msg:
          t("admin.variantCombinationExists") ||
          "This combination already exists as another variant.",
        sev: "error",
      });
      return;
    }
    const payload: SaveVariantPayload = {
      option_value_ids: ids,
      sku: vDialog.sku || null,
      price: Number(vDialog.price),
      compare_price: vDialog.compare_price ? Number(vDialog.compare_price) : null,
      quantity: Number(vDialog.quantity || 0),
      is_active: vDialog.is_active,
      is_default: vDialog.is_default,
    };
    setSavingVariant(true);
    try {
      if (vDialog.editingId) {
        await adminApi.updateVariant(productId, vDialog.editingId, payload);
      } else {
        await adminApi.createVariant(productId, payload);
      }
      setSnack({ msg: "Variant saved", sev: "success" });
      closeVariantDialog();
      const [vRes, pRes] = await Promise.all([
        adminApi.listVariants(productId),
        productsApi.getById(productId),
      ]);
      setVariants(vRes.data.data);
      setProduct(pRes.data.data);
      setForm((f) => ({ ...f, has_variants: !!pRes.data.data.has_variants }));
    } catch {
      setSnack({ msg: "Could not save variant. Check option combination.", sev: "error" });
    } finally {
      setSavingVariant(false);
    }
  };

  const deleteVariant = async (v: ProductVariant) => {
    if (!confirm("Delete this variant?")) return;
    try {
      await adminApi.deleteVariant(productId, v.id);
      const [vRes, pRes] = await Promise.all([
        adminApi.listVariants(productId),
        productsApi.getById(productId),
      ]);
      setVariants(vRes.data.data);
      setProduct(pRes.data.data);
      setForm((f) => ({ ...f, has_variants: !!pRes.data.data.has_variants }));
      setSnack({ msg: "Variant deleted", sev: "success" });
    } catch {
      setSnack({ msg: t("common.error"), sev: "error" });
    }
  };

  const setAsDefault = async (v: ProductVariant) => {
    if (v.is_default) return;
    try {
      await adminApi.updateVariant(productId, v.id, {
        option_value_ids: v.option_value_ids,
        sku: v.sku,
        price: Number(v.price),
        compare_price: v.compare_price !== null ? Number(v.compare_price) : null,
        quantity: Number(v.quantity),
        image: v.image,
        is_active: v.is_active,
        is_default: true,
      });
      const vRes = await adminApi.listVariants(productId);
      setVariants(vRes.data.data);
      setSnack({
        msg: t("admin.defaultVariantSet") || "Default variant updated",
        sev: "success",
      });
    } catch {
      setSnack({ msg: t("common.error"), sev: "error" });
    }
  };

  const wouldDuplicate = (optionId: number, valueId: number): boolean => {
    if (vDialog.picks[optionId] === valueId) return false;
    const hypothetical: Record<number, number> = { ...vDialog.picks, [optionId]: valueId };
    const ids = Object.values(hypothetical);
    if (ids.length !== allOptions.length) return false;
    const set = new Set(ids);
    return variants.some(
      (vv) =>
        vv.id !== vDialog.editingId &&
        vv.option_value_ids.length === set.size &&
        vv.option_value_ids.every((id) => set.has(id))
    );
  };

  // ---------- Render ----------
  return (
    <div>
      <AdminPageHeader
        title={form.name || t("admin.editProduct") || "Edit Product"}
        subtitle={`#${productId}`}
      />

      <div className="mb-4">
        <Link
          href={`/${locale}/admin/products`}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          {t("common.back") || "Back"}
        </Link>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <TableRowsSkeleton rows={6} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* ---- Basics ---- */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-base font-bold">
              {t("admin.basicInfo") || "Basic info"}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Name AR */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("admin.nameAr") || "Name (AR)"}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              {/* Name EN */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("admin.nameEn") || "Name (EN)"}
                </label>
                <input
                  type="text"
                  value={form.name_en}
                  onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("admin.category") || "Category"}
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category_id: Number(e.target.value) || "" }))
                  }
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("admin.brand") || "Brand"}
                </label>
                <select
                  value={form.brand_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand_id: Number(e.target.value) || "" }))
                  }
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">—</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audience */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("admin.audience") || "Audience"}
                </label>
                <select
                  value={form.content_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content_type: e.target.value as ContentType }))
                  }
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {audienceOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description AR */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("admin.descriptionAr") || "Description (AR)"}
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              {/* Description EN */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("admin.descriptionEn") || "Description (EN)"}
                </label>
                <textarea
                  rows={3}
                  value={form.description_en}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description_en: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                  <span className="text-sm font-medium">
                    {t("admin.active") || "Active"}
                  </span>
                </label>

                <label className="flex cursor-pointer select-none items-center gap-2">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.is_featured}
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
                  <span className="text-sm font-medium">
                    {t("admin.featured") || "Featured"}
                  </span>
                </label>
              </div>

              {/* Images */}
              <div className="md:col-span-2">
                <hr className="my-4 border-gray-100" />
                <p className="mb-1 text-sm font-bold">{t("admin.images")}</p>
                <p className="mb-3 text-sm text-gray-500">
                  {t("admin.imagesReplaceHint")}
                </p>

                {!!product?.images?.length && (
                  <div className="mb-3 flex flex-col gap-2">
                    <p className="text-sm font-semibold">{t("admin.currentImages")}</p>
                    <div className="flex flex-wrap gap-3">
                      {product.images.map((image) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={image.id}
                          src={image.image}
                          alt={form.name || "product-image"}
                          className="rounded-lg border border-gray-200 object-cover"
                          style={{ width: 84, height: 84 }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                    {t("admin.uploadImages")}
                    <input
                      hidden
                      multiple
                      accept="image/*"
                      type="file"
                      onChange={handleImagesChange}
                    />
                  </label>
                  <p className="text-sm text-gray-500">
                    {imageFiles.length
                      ? `${t("admin.selectedImages")}: ${imageFiles.length}`
                      : t("admin.noImagesSelected")}
                  </p>
                  {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {imagePreviews.map((src, index) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={src}
                          src={src}
                          alt={`preview-${index + 1}`}
                          className="rounded-lg border border-gray-200 object-cover"
                          style={{ width: 84, height: 84 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ---- Pricing & stock OR variants notice ---- */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {t("admin.pricingStock") || "Pricing & stock"}
              </h3>
              <label className="flex cursor-pointer select-none items-center gap-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.has_variants}
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
                <span className="text-sm font-medium">
                  {t("admin.hasVariants") || "This product has variants"}
                </span>
              </label>
            </div>

            {form.has_variants ? (
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                {t("admin.variantsManagedBelow") ||
                  "Price and stock are managed per variant in the section below."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    {t("admin.price") || "Price"}
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    {t("admin.comparePrice") || "Compare price"}
                  </label>
                  <input
                    type="number"
                    value={form.compare_price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, compare_price: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    {t("admin.quantity") || "Quantity"}
                  </label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    {t("admin.sku") || "SKU"}
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={saveProduct}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                <Save size={16} />
                {t("common.save") || "Save"}
              </button>
            </div>
          </div>

          {/* ---- Variants ---- */}
          {form.has_variants && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold">
                    {t("admin.variants") || "Variants"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t("admin.variantsHint") ||
                      "Each variant is a combination of values from the global Options catalog."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateVariant}
                  disabled={allOptions.length === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <Plus size={13} />
                  {t("admin.addVariant") || "Add variant"}
                </button>
              </div>

              {allOptions.length === 0 && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {t("admin.noGlobalOptions") ||
                      "No options exist yet. Create options (Color, Size, ...) under Admin → Options first."}{" "}
                    <Link
                      href={`/${locale}/admin/options`}
                      className="underline hover:no-underline"
                    >
                      {t("admin.manageOptions") || "Manage options"}
                    </Link>
                  </span>
                </div>
              )}

              {variants.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  {t("admin.noVariantsYet") || "No variants yet."}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-gray-500 w-14">
                          {t("admin.default") || "Default"}
                        </th>
                        <th className="px-3 py-2 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                          {t("admin.variant") || "Variant"}
                        </th>
                        <th className="px-3 py-2 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                          {t("admin.sku") || "SKU"}
                        </th>
                        <th className="px-3 py-2 text-end text-xs font-bold uppercase tracking-wide text-gray-500">
                          {t("admin.price") || "Price"}
                        </th>
                        <th className="px-3 py-2 text-end text-xs font-bold uppercase tracking-wide text-gray-500">
                          {t("admin.quantity") || "Quantity"}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                          {t("admin.active") || "Active"}
                        </th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr
                          key={v.id}
                          className={`border-b border-gray-100 transition hover:bg-gray-50 ${v.is_default ? "bg-yellow-50/40" : ""}`}
                        >
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              title={
                                v.is_default
                                  ? t("admin.isDefaultVariant") || "Default variant"
                                  : t("admin.setAsDefault") || "Set as default"
                              }
                              onClick={() => setAsDefault(v)}
                              disabled={v.is_default}
                              className={`p-1.5 rounded-lg transition ${v.is_default ? "text-yellow-500 cursor-default" : "text-gray-300 hover:text-yellow-500 hover:bg-yellow-50"}`}
                            >
                              <Star
                                size={16}
                                fill={v.is_default ? "currentColor" : "none"}
                              />
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {allOptions.map((opt) => {
                                const valId = v.option_value_ids.find((id) =>
                                  opt.values.some((vv) => vv.id === id)
                                );
                                if (!valId) return null;
                                const val = opt.values.find((vv) => vv.id === valId);
                                if (!val) return null;
                                return (
                                  <span
                                    key={opt.id}
                                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-xs"
                                  >
                                    {val.hex_color && (
                                      <span
                                        className="inline-block h-3 w-3 rounded-full border border-black/20"
                                        style={{ background: val.hex_color }}
                                      />
                                    )}
                                    {optionLabel(opt)}: {valueLabel(val)}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-gray-600">{v.sku || "—"}</td>
                          <td className="px-3 py-2 text-end">{Number(v.price).toFixed(2)}</td>
                          <td className="px-3 py-2 text-end">{v.quantity}</td>
                          <td className="px-3 py-2 text-center">
                            {v.is_active ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                ✓
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title={t("common.edit") || "Edit"}
                                onClick={() => openEditVariant(v)}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                title={t("common.delete") || "Delete"}
                                onClick={() => deleteVariant(v)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---- Add/Edit Variant Dialog ---- */}
      {vDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeVariantDialog}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold">
                {vDialog.editingId
                  ? t("admin.editVariant") || "Edit variant"
                  : t("admin.addVariant") || "Add variant"}
              </h2>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <p className="mb-4 text-sm text-gray-500">
                {t("admin.pickOneValuePerOption") ||
                  "Pick one value per option from the global catalog."}
              </p>

              {allOptions.map((opt) => (
                <div key={opt.id} className="mb-4">
                  <p className="mb-2 text-sm font-semibold">{optionLabel(opt)}</p>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val) => {
                      const selected = vDialog.picks[opt.id] === val.id;
                      const blocked = wouldDuplicate(opt.id, val.id);
                      return (
                        <button
                          key={val.id}
                          type="button"
                          disabled={blocked}
                          title={
                            blocked
                              ? t("admin.variantCombinationExists") ||
                                "This combination already exists."
                              : undefined
                          }
                          onClick={() => !blocked && togglePick(opt.id, val.id)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${
                            selected
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          } ${blocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {val.hex_color && (
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-black/20"
                              style={{ background: val.hex_color }}
                            />
                          )}
                          {valueLabel(val)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <hr className="my-4 border-gray-100" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    {t("admin.sku") || "SKU"}
                  </label>
                  <input
                    type="text"
                    value={vDialog.sku}
                    onChange={(e) =>
                      setVDialog((s) => ({ ...s, sku: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    {t("admin.quantity") || "Quantity"}
                  </label>
                  <input
                    type="number"
                    value={vDialog.quantity}
                    onChange={(e) =>
                      setVDialog((s) => ({ ...s, quantity: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div className="relative">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    {t("admin.price") || "Price"}
                  </label>
                  <input
                    type="number"
                    value={vDialog.price}
                    onChange={(e) =>
                      setVDialog((s) => ({ ...s, price: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pe-8 ps-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="absolute bottom-0 end-0 flex h-9 items-center pe-3 text-xs text-gray-400">
                    {t("common.currency") || "د.ل"}
                  </span>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    {t("admin.comparePrice") || "Compare price"}
                  </label>
                  <input
                    type="number"
                    value={vDialog.compare_price}
                    onChange={(e) =>
                      setVDialog((s) => ({ ...s, compare_price: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="flex items-center gap-6 sm:col-span-2">
                  <label className="flex cursor-pointer select-none items-center gap-2">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={vDialog.is_active}
                        onChange={(e) =>
                          setVDialog((s) => ({ ...s, is_active: e.target.checked }))
                        }
                      />
                      <div
                        className={`h-5 w-10 rounded-full transition-colors ${vDialog.is_active ? "bg-[var(--color-primary)]" : "bg-gray-300"}`}
                      />
                      <div
                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${vDialog.is_active ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {t("admin.active") || "Active"}
                    </span>
                  </label>

                  <label className="flex cursor-pointer select-none items-center gap-2">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={vDialog.is_default}
                        onChange={(e) =>
                          setVDialog((s) => ({ ...s, is_default: e.target.checked }))
                        }
                      />
                      <div
                        className={`h-5 w-10 rounded-full transition-colors ${vDialog.is_default ? "bg-[var(--color-primary)]" : "bg-gray-300"}`}
                      />
                      <div
                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${vDialog.is_default ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {t("admin.setAsDefault") || "Set as default"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={closeVariantDialog}
                disabled={savingVariant}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                type="button"
                onClick={saveVariant}
                disabled={savingVariant}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                <Save size={16} />
                {t("common.save") || "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Toast ---- */}
      {snack && (
        <div
          className={`fixed bottom-4 left-1/2 z-[200] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${snack.sev === "error" ? "bg-red-600" : "bg-gray-900"}`}
        >
          {snack.msg}
        </div>
      )}
    </div>
  );
}

import {
  adminApi,
  type ProductPayload,
  type SaveVariantPayload,
} from "@/lib/api/admin";
import { productsApi } from "@/lib/api/products";
import type {
  Brand,
  Category,
  ContentType,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAudienceOptions } from "@/components/common/AudienceChip";

// ---------- Form types ----------
interface ProductFormState {
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  price: string;
  compare_price: string;
  cost: string;
  sku: string;
  quantity: string;
  category_id: number | "";
  brand_id: number | "";
  content_type: ContentType;
  is_active: boolean;
  is_featured: boolean;
  has_variants: boolean;
}

const emptyForm = (): ProductFormState => ({
  name: "",
  name_en: "",
  description: "",
  description_en: "",
  price: "",
  compare_price: "",
  cost: "",
  sku: "",
  quantity: "",
  category_id: "",
  brand_id: "",
  content_type: "unisex",
  is_active: true,
  is_featured: false,
  has_variants: false,
});

const toForm = (p: Product): ProductFormState => ({
  name: p.name ?? "",
  name_en: p.name_en ?? "",
  description: p.description ?? "",
  description_en: p.description_en ?? "",
  price: String(p.price ?? ""),
  compare_price: p.compare_price !== null && p.compare_price !== undefined ? String(p.compare_price) : "",
  cost: "",
  sku: p.sku ?? "",
  quantity: String(p.quantity ?? ""),
  category_id: p.category_id ?? "",
  brand_id: p.brand_id ?? "",
  content_type: (p.content_type as ContentType) ?? "unisex",
  is_active: !!p.is_active,
  is_featured: !!p.is_featured,
  has_variants: !!p.has_variants,
});

// ---------- Variant dialog state ----------
interface VariantDialogState {
  open: boolean;
  editingId: number | null;
  // option_id -> value_id
  picks: Record<number, number>;
  sku: string;
  price: string;
  compare_price: string;
  quantity: string;
  is_active: boolean;
  is_default: boolean;
}

const emptyVariantDialog = (): VariantDialogState => ({
  open: false,
  editingId: null,
  picks: {},
  sku: "",
  price: "",
  compare_price: "",
  quantity: "0",
  is_active: true,
  is_default: false,
});

export default function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = use(params);
  const productId = Number(id);
  const t = useTranslations();
  const currentLocale = useLocale();
  const audienceOptions = useAudienceOptions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Variants section
  const [allOptions, setAllOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [vDialog, setVDialog] = useState<VariantDialogState>(emptyVariantDialog());
  const [savingVariant, setSavingVariant] = useState(false);

  // ---------- Initial load ----------
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productRes, catsRes, brandsRes, optionsRes, variantsRes] = await Promise.all([
        productsApi.getById(productId),
        adminApi.getCategories(),
        adminApi.getBrands(),
        adminApi.listOptions(),
        adminApi.listVariants(productId),
      ]);
      const p = productRes.data.data;
      setProduct(p);
      setForm(toForm(p));
      setCategories(catsRes.data.data);
      setBrands(brandsRes.data.data);
      setAllOptions(optionsRes.data.data);
      setVariants(variantsRes.data.data);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  // ---------- Save product basics ----------
  const saveProduct = async () => {
    setSaving(true);
    try {
      const payload: ProductPayload | FormData = imageFiles.length > 0
        ? (() => {
            const formData = new FormData();
            formData.append("name", form.name);
            if (form.name_en) formData.append("name_en", form.name_en);
            if (form.description) formData.append("description", form.description);
            if (form.description_en) formData.append("description_en", form.description_en);
            formData.append("price", String(form.has_variants ? 0 : Number(form.price || 0)));
            if (form.compare_price) formData.append("compare_price", String(Number(form.compare_price)));
            if (form.sku) formData.append("sku", form.sku);
            formData.append("quantity", String(form.has_variants ? 0 : Number(form.quantity || 0)));
            if (form.category_id) formData.append("category_id", String(form.category_id));
            if (form.brand_id) formData.append("brand_id", String(form.brand_id));
            formData.append("content_type", form.content_type);
            formData.append("is_active", form.is_active ? "1" : "0");
            formData.append("is_featured", form.is_featured ? "1" : "0");
            formData.append("has_variants", form.has_variants ? "1" : "0");
            imageFiles.forEach((file) => formData.append("images[]", file));
            return formData;
          })()
        : {
            name: form.name,
            name_en: form.name_en || null,
            description: form.description || null,
            description_en: form.description_en || null,
            price: form.has_variants ? 0 : Number(form.price || 0),
            compare_price: form.compare_price ? Number(form.compare_price) : null,
            sku: form.sku || null,
            quantity: form.has_variants ? 0 : Number(form.quantity || 0),
            category_id: form.category_id || undefined,
            brand_id: form.brand_id || null,
            content_type: form.content_type,
            is_active: form.is_active,
            is_featured: form.is_featured,
            has_variants: form.has_variants,
          };
      await adminApi.updateProduct(productId, payload);
      setSnack({ msg: t("admin.productSaved") || "Product saved", sev: "success" });
      // If toggled off, server-side variants stay but flag is off; reload to sync.
      load();
    } catch {
      setSnack({ msg: t("common.error"), sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ---------- Variant helpers ----------
  const optionLabel = (opt: ProductOption) =>
    currentLocale === "en" && opt.name_en ? opt.name_en : opt.name;
  const valueLabel = (val: ProductOptionValue) =>
    currentLocale === "en" && val.value_en ? val.value_en : val.value;

  const variantLabel = useMemo(() => {
    return (variant: ProductVariant): string => {
      if (!variant.option_value_ids?.length) return "—";
      const parts: string[] = [];
      for (const opt of allOptions) {
        const valId = variant.option_value_ids.find((id) =>
          opt.values.some((v) => v.id === id)
        );
        if (!valId) continue;
        const val = opt.values.find((v) => v.id === valId);
        if (val) parts.push(`${optionLabel(opt)}: ${valueLabel(val)}`);
      }
      return parts.join(" / ");
    };
  }, [allOptions, currentLocale]);

  // Options that are eligible to be picked: any global option.
  const openCreateVariant = () => {
    setVDialog({ ...emptyVariantDialog(), open: true });
  };

  const openEditVariant = (v: ProductVariant) => {
    const picks: Record<number, number> = {};
    for (const opt of allOptions) {
      const valId = v.option_value_ids.find((id) =>
        opt.values.some((vv) => vv.id === id)
      );
      if (valId) picks[opt.id] = valId;
    }
    setVDialog({
      open: true,
      editingId: v.id,
      picks,
      sku: v.sku ?? "",
      price: String(v.price),
      compare_price: v.compare_price !== null ? String(v.compare_price) : "",
      quantity: String(v.quantity),
      is_active: !!v.is_active,
      is_default: !!v.is_default,
    });
  };

  const closeVariantDialog = () => setVDialog((s) => ({ ...s, open: false }));

  const togglePick = (optionId: number, valueId: number) => {
    setVDialog((s) => {
      const next = { ...s.picks };
      if (next[optionId] === valueId) delete next[optionId];
      else next[optionId] = valueId;
      return { ...s, picks: next };
    });
  };

  const saveVariant = async () => {
    const ids = Object.values(vDialog.picks).filter((n): n is number => Number.isFinite(n));
    if (ids.length === 0) {
      setSnack({ msg: "Pick at least one option value.", sev: "error" });
      return;
    }
    if (!vDialog.price || Number(vDialog.price) < 0) {
      setSnack({ msg: "Enter a valid price.", sev: "error" });
      return;
    }
    // Task 1: prevent duplicate combinations on the client before hitting the API.
    const pickedSet = new Set(ids);
    const duplicate = variants.find(
      (v) =>
        v.id !== vDialog.editingId &&
        v.option_value_ids.length === pickedSet.size &&
        v.option_value_ids.every((id) => pickedSet.has(id))
    );
    if (duplicate) {
      setSnack({
        msg:
          t("admin.variantCombinationExists") ||
          "This combination already exists as another variant.",
        sev: "error",
      });
      return;
    }
    const payload: SaveVariantPayload = {
      option_value_ids: ids,
      sku: vDialog.sku || null,
      price: Number(vDialog.price),
      compare_price: vDialog.compare_price ? Number(vDialog.compare_price) : null,
      quantity: Number(vDialog.quantity || 0),
      is_active: vDialog.is_active,
      is_default: vDialog.is_default,
    };
    setSavingVariant(true);
    try {
      if (vDialog.editingId) {
        await adminApi.updateVariant(productId, vDialog.editingId, payload);
      } else {
        await adminApi.createVariant(productId, payload);
      }
      setSnack({ msg: "Variant saved", sev: "success" });
      closeVariantDialog();
      // Reload variants AND product (has_variants might have flipped on).
      const [vRes, pRes] = await Promise.all([
        adminApi.listVariants(productId),
        productsApi.getById(productId),
      ]);
      setVariants(vRes.data.data);
      setProduct(pRes.data.data);
      setForm((f) => ({ ...f, has_variants: !!pRes.data.data.has_variants }));
    } catch {
      setSnack({ msg: "Could not save variant. Check option combination.", sev: "error" });
    } finally {
      setSavingVariant(false);
    }
  };

  const deleteVariant = async (v: ProductVariant) => {
    if (!confirm("Delete this variant?")) return;
    try {
      await adminApi.deleteVariant(productId, v.id);
      const [vRes, pRes] = await Promise.all([
        adminApi.listVariants(productId),
        productsApi.getById(productId),
      ]);
      setVariants(vRes.data.data);
      setProduct(pRes.data.data);
      setForm((f) => ({ ...f, has_variants: !!pRes.data.data.has_variants }));
      setSnack({ msg: "Variant deleted", sev: "success" });
    } catch {
      setSnack({ msg: t("common.error"), sev: "error" });
    }
  };

  // Quick action: promote a variant to be the product's default in one click.
  const setAsDefault = async (v: ProductVariant) => {
    if (v.is_default) return;
    try {
      await adminApi.updateVariant(productId, v.id, {
        option_value_ids: v.option_value_ids,
        sku: v.sku,
        price: Number(v.price),
        compare_price: v.compare_price !== null ? Number(v.compare_price) : null,
        quantity: Number(v.quantity),
        image: v.image,
        is_active: v.is_active,
        is_default: true,
      });
      const vRes = await adminApi.listVariants(productId);
      setVariants(vRes.data.data);
      setSnack({
        msg: t("admin.defaultVariantSet") || "Default variant updated",
        sev: "success",
      });
    } catch {
      setSnack({ msg: t("common.error"), sev: "error" });
    }
  };

  // For the Add/Edit dialog: would picking `valueId` for `optionId` complete a
  // combination that already exists on a different variant? Used to disable
  // chips that would form duplicates so the user can't even click them.
  const wouldDuplicate = (optionId: number, valueId: number): boolean => {
    if (vDialog.picks[optionId] === valueId) return false; // currently selected -> allow click to deselect
    const hypothetical: Record<number, number> = { ...vDialog.picks, [optionId]: valueId };
    const ids = Object.values(hypothetical);
    if (ids.length !== allOptions.length) return false; // not yet a complete combo
    const set = new Set(ids);
    return variants.some(
      (vv) =>
        vv.id !== vDialog.editingId &&
        vv.option_value_ids.length === set.size &&
        vv.option_value_ids.every((id) => set.has(id))
    );
  };

  // ---------- Render ----------
  return (
    <Box>
      <AdminPageHeader
        title={form.name || t("admin.editProduct") || "Edit Product"}
        subtitle={`#${productId}`}
      />

      <Box sx={{ mb: 2 }}>
        <Button
          component={Link}
          href={`/${locale}/admin/products`}
          startIcon={<ArrowBackIcon />}
          size="small"
        >
          {t("common.back") || "Back"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Paper sx={{ p: 3 }}>
          <TableRowsSkeleton rows={6} />
        </Paper>
      ) : (
        <Stack spacing={3}>
          {/* ---- Basics ---- */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {t("admin.basicInfo") || "Basic info"}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t("admin.nameAr") || "Name (AR)"}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t("admin.nameEn") || "Name (EN)"}
                  value={form.name_en}
                  onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t("admin.category") || "Category"}
                  value={form.category_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category_id: Number(e.target.value) || "" }))
                  }
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t("admin.brand") || "Brand"}
                  value={form.brand_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand_id: Number(e.target.value) || "" }))
                  }
                >
                  <MenuItem value="">—</MenuItem>
                  {brands.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t("admin.audience") || "Audience"}
                  value={form.content_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content_type: e.target.value as ContentType }))
                  }
                >
                  {audienceOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label={t("admin.descriptionAr") || "Description (AR)"}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label={t("admin.descriptionEn") || "Description (EN)"}
                  value={form.description_en}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description_en: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_active}
                      onChange={(_, v) => setForm((f) => ({ ...f, is_active: v }))}
                    />
                  }
                  label={t("admin.active") || "Active"}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_featured}
                      onChange={(_, v) => setForm((f) => ({ ...f, is_featured: v }))}
                    />
                  }
                  label={t("admin.featured") || "Featured"}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t("admin.images")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t("admin.imagesReplaceHint")}
                </Typography>
                {!!product?.images?.length && (
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t("admin.currentImages")}
                    </Typography>
                    <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                      {product.images.map((image) => (
                        <Box
                          key={image.id}
                          component="img"
                          src={image.image}
                          alt={form.name || "product-image"}
                          sx={{
                            width: 84,
                            height: 84,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                )}
                <Stack spacing={1.5}>
                  <Button component="label" variant="outlined" sx={{ alignSelf: "flex-start" }}>
                    {t("admin.uploadImages")}
                    <input hidden multiple accept="image/*" type="file" onChange={handleImagesChange} />
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {imageFiles.length
                      ? `${t("admin.selectedImages")}: ${imageFiles.length}`
                      : t("admin.noImagesSelected")}
                  </Typography>
                  {imagePreviews.length > 0 && (
                    <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                      {imagePreviews.map((src, index) => (
                        <Box
                          key={src}
                          component="img"
                          src={src}
                          alt={`preview-${index + 1}`}
                          sx={{
                            width: 84,
                            height: 84,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* ---- Pricing & stock OR variants notice ---- */}
          <Paper sx={{ p: 3 }}>
            <Stack
              direction="row"
              sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("admin.pricingStock") || "Pricing & stock"}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.has_variants}
                    onChange={(_, v) => setForm((f) => ({ ...f, has_variants: v }))}
                  />
                }
                label={t("admin.hasVariants") || "This product has variants"}
              />
            </Stack>
            {form.has_variants ? (
              <Alert severity="info">
                {t("admin.variantsManagedBelow") ||
                  "Price and stock are managed per variant in the section below."}
              </Alert>
            ) : (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t("admin.price") || "Price"}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t("admin.comparePrice") || "Compare price"}
                    value={form.compare_price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, compare_price: e.target.value }))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t("admin.quantity") || "Quantity"}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label={t("admin.sku") || "SKU"}
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  />
                </Grid>
              </Grid>
            )}
            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveProduct}
                disabled={saving}
              >
                {t("common.save") || "Save"}
              </Button>
            </Box>
          </Paper>

          {/* ---- Variants ---- */}
          {form.has_variants && (
            <Paper sx={{ p: 3 }}>
              <Stack
                direction="row"
                sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("admin.variants") || "Variants"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("admin.variantsHint") ||
                      "Each variant is a combination of values from the global Options catalog."}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateVariant}
                  disabled={allOptions.length === 0}
                >
                  {t("admin.addVariant") || "Add variant"}
                </Button>
              </Stack>

              {allOptions.length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {t("admin.noGlobalOptions") ||
                    "No options exist yet. Create options (Color, Size, ...) under Admin → Options first."}{" "}
                  <Link href={`/${locale}/admin/options`}>
                    {t("admin.manageOptions") || "Manage options"}
                  </Link>
                </Alert>
              )}

              {variants.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                  {t("admin.noVariantsYet") || "No variants yet."}
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ width: 56 }}>
                          {t("admin.default") || "Default"}
                        </TableCell>
                        <TableCell>{t("admin.variant") || "Variant"}</TableCell>
                        <TableCell>{t("admin.sku") || "SKU"}</TableCell>
                        <TableCell align="right">{t("admin.price") || "Price"}</TableCell>
                        <TableCell align="right">
                          {t("admin.quantity") || "Quantity"}
                        </TableCell>
                        <TableCell align="center">
                          {t("admin.active") || "Active"}
                        </TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {variants.map((v) => (
                        <TableRow key={v.id} hover selected={v.is_default}>
                          <TableCell align="center">
                            <Tooltip
                              title={
                                v.is_default
                                  ? t("admin.isDefaultVariant") || "Default variant"
                                  : t("admin.setAsDefault") || "Set as default"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => setAsDefault(v)}
                                  color={v.is_default ? "warning" : "default"}
                                  disabled={v.is_default}
                                >
                                  {v.is_default ? (
                                    <StarIcon fontSize="small" />
                                  ) : (
                                    <StarBorderIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {allOptions.map((opt) => {
                                const valId = v.option_value_ids.find((id) =>
                                  opt.values.some((vv) => vv.id === id)
                                );
                                if (!valId) return null;
                                const val = opt.values.find((vv) => vv.id === valId);
                                if (!val) return null;
                                return (
                                  <Chip
                                    key={opt.id}
                                    size="small"
                                    label={`${optionLabel(opt)}: ${valueLabel(val)}`}
                                    icon={
                                      val.hex_color ? (
                                        <Box
                                          sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: "50%",
                                            bgcolor: val.hex_color,
                                            border: "1px solid rgba(0,0,0,0.2)",
                                            ml: 0.5,
                                          }}
                                        />
                                      ) : undefined
                                    }
                                  />
                                );
                              })}
                            </Box>
                          </TableCell>
                          <TableCell>{v.sku || "—"}</TableCell>
                          <TableCell align="right">
                            {Number(v.price).toFixed(2)}
                          </TableCell>
                          <TableCell align="right">{v.quantity}</TableCell>
                          <TableCell align="center">
                            {v.is_active ? "✓" : "—"}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title={t("common.edit") || "Edit"}>
                              <IconButton size="small" onClick={() => openEditVariant(v)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("common.delete") || "Delete"}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteVariant(v)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}
        </Stack>
      )}

      {/* ---- Add/Edit Variant Dialog ---- */}
      <Dialog
        open={vDialog.open}
        onClose={closeVariantDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {vDialog.editingId
            ? t("admin.editVariant") || "Edit variant"
            : t("admin.addVariant") || "Add variant"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t("admin.pickOneValuePerOption") ||
                "Pick one value per option from the global catalog."}
            </Typography>
            {allOptions.map((opt) => (
              <Box key={opt.id}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  {optionLabel(opt)}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {opt.values.map((val) => {
                    const selected = vDialog.picks[opt.id] === val.id;
                    const blocked = wouldDuplicate(opt.id, val.id);
                    return (
                      <Tooltip
                        key={val.id}
                        title={
                          blocked
                            ? t("admin.variantCombinationExists") ||
                              "This combination already exists."
                            : ""
                        }
                        disableHoverListener={!blocked}
                      >
                        <span>
                          <Chip
                            label={valueLabel(val)}
                            clickable={!blocked}
                            disabled={blocked}
                            color={selected ? "primary" : "default"}
                            variant={selected ? "filled" : "outlined"}
                            onClick={() => !blocked && togglePick(opt.id, val.id)}
                            sx={{ opacity: blocked ? 0.45 : 1 }}
                            icon={
                              val.hex_color ? (
                                <Box
                                  sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    bgcolor: val.hex_color,
                                    border: "1px solid rgba(0,0,0,0.2)",
                                    ml: 0.5,
                                  }}
                                />
                              ) : undefined
                            }
                          />
                        </span>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Box>
            ))}
            <Divider />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("admin.sku") || "SKU"}
                  value={vDialog.sku}
                  onChange={(e) => setVDialog((s) => ({ ...s, sku: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t("admin.quantity") || "Quantity"}
                  value={vDialog.quantity}
                  onChange={(e) =>
                    setVDialog((s) => ({ ...s, quantity: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t("admin.price") || "Price"}
                  value={vDialog.price}
                  onChange={(e) => setVDialog((s) => ({ ...s, price: e.target.value }))}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          {t("common.currency") || "د.ل"}
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t("admin.comparePrice") || "Compare price"}
                  value={vDialog.compare_price}
                  onChange={(e) =>
                    setVDialog((s) => ({ ...s, compare_price: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={vDialog.is_active}
                      onChange={(_, v) =>
                        setVDialog((s) => ({ ...s, is_active: v }))
                      }
                    />
                  }
                  label={t("admin.active") || "Active"}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={vDialog.is_default}
                      onChange={(_, v) =>
                        setVDialog((s) => ({ ...s, is_default: v }))
                      }
                    />
                  }
                  label={t("admin.setAsDefault") || "Set as default"}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeVariantDialog} disabled={savingVariant}>
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveVariant}
            disabled={savingVariant}
          >
            {t("common.save") || "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert
            severity={snack.sev}
            onClose={() => setSnack(null)}
            variant="filled"
          >
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
