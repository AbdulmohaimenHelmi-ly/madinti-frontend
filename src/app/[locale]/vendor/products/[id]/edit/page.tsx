"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Save, Plus, Pencil, Trash2, Star, X } from "lucide-react";

import { vendorApi } from "@/lib/api/vendor";
import { productsApi } from "@/lib/api/products";
import type { SaveVariantPayload } from "@/lib/api/admin";
import type { Brand, Category, ContentType, Product, ProductOption, ProductOptionValue, ProductVariant } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { useAudienceOptions } from "@/components/common/AudienceChip";

interface ProductFormState {
  name: string; name_en: string; description: string; description_en: string;
  price: string; compare_price: string; sku: string; quantity: string;
  category_id: number | ""; brand_id: number | ""; content_type: ContentType;
  is_active: boolean; is_featured: boolean; has_variants: boolean;
}

const emptyForm = (): ProductFormState => ({
  name: "", name_en: "", description: "", description_en: "", price: "", compare_price: "",
  sku: "", quantity: "", category_id: "", brand_id: "", content_type: "unisex",
  is_active: true, is_featured: false, has_variants: false,
});

const toForm = (p: Product): ProductFormState => ({
  name: p.name ?? "", name_en: p.name_en ?? "", description: p.description ?? "",
  description_en: p.description_en ?? "", price: String(p.price ?? ""),
  compare_price: p.compare_price !== null && p.compare_price !== undefined ? String(p.compare_price) : "",
  sku: p.sku ?? "", quantity: String(p.quantity ?? ""),
  category_id: p.category_id ?? "", brand_id: p.brand_id ?? "",
  content_type: (p.content_type as ContentType) ?? "unisex",
  is_active: !!p.is_active, is_featured: !!p.is_featured, has_variants: !!p.has_variants,
});

interface VariantDialogState {
  open: boolean; editingId: number | null; picks: Record<number, number>;
  sku: string; price: string; compare_price: string; quantity: string;
  is_active: boolean; is_default: boolean;
}

const emptyVariantDialog = (): VariantDialogState => ({
  open: false, editingId: null, picks: {}, sku: "", price: "", compare_price: "",
  quantity: "0", is_active: true, is_default: false,
});

function SwitchToggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="relative inline-block">
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
      <div onClick={() => !disabled && onChange(!checked)} className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${checked ? "bg-[var(--color-primary)]" : "bg-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`} />
      <div className={`pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </div>
  );
}

export default function VendorProductEditPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = use(params);
  const productId = Number(id);
  const t = useTranslations();
  const tVendor = useTranslations("vendor");
  const currentLocale = useLocale();
  const audienceOptions = useAudienceOptions(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allOptions, setAllOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [vDialog, setVDialog] = useState<VariantDialogState>(emptyVariantDialog());
  const [savingVariant, setSavingVariant] = useState(false);

  useEffect(() => { if (!snack) return; const id = setTimeout(() => setSnack(null), 3500); return () => clearTimeout(id); }, [snack]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [productRes, catsRes, brandsRes, optionsRes, variantsRes] = await Promise.all([
        productsApi.getById(productId), vendorApi.listCategories(), vendorApi.listBrands(),
        vendorApi.listOptions(), vendorApi.listVariants(productId),
      ]);
      const p = productRes.data.data;
      setProduct(p); setForm(toForm(p));
      setCategories(catsRes.data.data); setBrands(brandsRes.data.data);
      setAllOptions(optionsRes.data.data); setVariants(variantsRes.data.data);
    } catch { setError(t("common.error")); }
    finally { setLoading(false); }
  }, [productId, t]);

  useEffect(() => { load(); }, [load]);

  const saveProduct = async () => {
    setSaving(true);
    try {
      await vendorApi.updateProduct(productId, {
        name: form.name, name_en: form.name_en || null,
        description: form.description || null, description_en: form.description_en || null,
        price: form.has_variants ? 0 : Number(form.price || 0),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        sku: form.sku || null, quantity: form.has_variants ? 0 : Number(form.quantity || 0),
        category_id: form.category_id || undefined, brand_id: form.brand_id || null,
        content_type: form.content_type, is_active: form.is_active,
        is_featured: form.is_featured, has_variants: form.has_variants,
      });
      setSnack({ msg: tVendor("productSaved"), sev: "success" });
      load();
    } catch { setSnack({ msg: t("common.error"), sev: "error" }); }
    finally { setSaving(false); }
  };

  const optionLabel = (opt: ProductOption) => currentLocale === "en" && opt.name_en ? opt.name_en : opt.name;
  const valueLabel = (val: ProductOptionValue) => currentLocale === "en" && val.value_en ? val.value_en : val.value;

  const variantLabel = useMemo(() => (variant: ProductVariant): string => {
    if (!variant.option_value_ids?.length) return "—";
    const parts: string[] = [];
    for (const opt of allOptions) {
      const valId = variant.option_value_ids.find(id => opt.values.some(v => v.id === id));
      if (!valId) continue;
      const val = opt.values.find(v => v.id === valId);
      if (val) parts.push(`${optionLabel(opt)}: ${valueLabel(val)}`);
    }
    return parts.join(" / ");
  }, [allOptions, currentLocale]);
  void variantLabel;

  const openCreateVariant = () => setVDialog({ ...emptyVariantDialog(), open: true });
  const openEditVariant = (v: ProductVariant) => {
    const picks: Record<number, number> = {};
    for (const opt of allOptions) {
      const valId = v.option_value_ids.find(id => opt.values.some(vv => vv.id === id));
      if (valId) picks[opt.id] = valId;
    }
    setVDialog({ open: true, editingId: v.id, picks, sku: v.sku ?? "", price: String(v.price),
      compare_price: v.compare_price !== null ? String(v.compare_price) : "",
      quantity: String(v.quantity), is_active: !!v.is_active, is_default: !!v.is_default });
  };
  const closeVariantDialog = () => setVDialog(s => ({ ...s, open: false }));

  const togglePick = (optionId: number, valueId: number) => {
    setVDialog(s => { const next = { ...s.picks }; if (next[optionId] === valueId) delete next[optionId]; else next[optionId] = valueId; return { ...s, picks: next }; });
  };

  const wouldDuplicate = (optionId: number, valueId: number): boolean => {
    if (vDialog.picks[optionId] === valueId) return false;
    const hypothetical: Record<number, number> = { ...vDialog.picks, [optionId]: valueId };
    const ids = Object.values(hypothetical);
    if (ids.length !== allOptions.length) return false;
    const set = new Set(ids);
    return variants.some(vv => vv.id !== vDialog.editingId && vv.option_value_ids.length === set.size && vv.option_value_ids.every(id => set.has(id)));
  };

  const saveVariant = async () => {
    const ids = Object.values(vDialog.picks).filter((n): n is number => Number.isFinite(n));
    if (ids.length === 0) { setSnack({ msg: "Pick at least one option value.", sev: "error" }); return; }
    if (!vDialog.price || Number(vDialog.price) < 0) { setSnack({ msg: "Enter a valid price.", sev: "error" }); return; }
    const pickedSet = new Set(ids);
    const duplicate = variants.find(v => v.id !== vDialog.editingId && v.option_value_ids.length === pickedSet.size && v.option_value_ids.every(id => pickedSet.has(id)));
    if (duplicate) { setSnack({ msg: t("admin.variantCombinationExists"), sev: "error" }); return; }
    const payload: SaveVariantPayload = {
      option_value_ids: ids, sku: vDialog.sku || null, price: Number(vDialog.price),
      compare_price: vDialog.compare_price ? Number(vDialog.compare_price) : null,
      quantity: Number(vDialog.quantity || 0), is_active: vDialog.is_active, is_default: vDialog.is_default,
    };
    setSavingVariant(true);
    try {
      if (vDialog.editingId) await vendorApi.updateVariant(productId, vDialog.editingId, payload);
      else await vendorApi.createVariant(productId, payload);
      setSnack({ msg: "Variant saved", sev: "success" });
      closeVariantDialog();
      const [vRes, pRes] = await Promise.all([vendorApi.listVariants(productId), productsApi.getById(productId)]);
      setVariants(vRes.data.data); setProduct(pRes.data.data);
      setForm(f => ({ ...f, has_variants: !!pRes.data.data.has_variants }));
    } catch { setSnack({ msg: "Could not save variant. Check option combination.", sev: "error" }); }
    finally { setSavingVariant(false); }
  };

  const deleteVariant = async (v: ProductVariant) => {
    if (!confirm("Delete this variant?")) return;
    try {
      await vendorApi.deleteVariant(productId, v.id);
      const [vRes, pRes] = await Promise.all([vendorApi.listVariants(productId), productsApi.getById(productId)]);
      setVariants(vRes.data.data); setProduct(pRes.data.data);
      setForm(f => ({ ...f, has_variants: !!pRes.data.data.has_variants }));
      setSnack({ msg: "Variant deleted", sev: "success" });
    } catch { setSnack({ msg: t("common.error"), sev: "error" }); }
  };

  const setAsDefault = async (v: ProductVariant) => {
    if (v.is_default) return;
    try {
      await vendorApi.updateVariant(productId, v.id, {
        option_value_ids: v.option_value_ids, sku: v.sku, price: Number(v.price),
        compare_price: v.compare_price !== null ? Number(v.compare_price) : null,
        quantity: Number(v.quantity), image: v.image, is_active: v.is_active, is_default: true,
      });
      const vRes = await vendorApi.listVariants(productId);
      setVariants(vRes.data.data);
      setSnack({ msg: t("admin.defaultVariantSet"), sev: "success" });
    } catch { setSnack({ msg: t("common.error"), sev: "error" }); }
  };

  const labelOf = (it: { name: string; name_en: string | null }) => currentLocale === "en" && it.name_en ? it.name_en : it.name;

  const inp = "h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";
  const sel = "h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";
  const btnPrimary = "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";
  const btnOutline = "inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50";

  return (
    <div>
      <Link href={`/${locale}/vendor/products`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 no-underline">
        <ArrowLeft size={16} className={currentLocale === "ar" ? "rotate-180" : ""} /> {tVendor("backToProducts")}
      </Link>

      <VendorPageHeader title={form.name || tVendor("editProduct")} subtitle={tVendor("editProductSubtitle")} />

      {error && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4"><span>{error}</span></div>}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6"><TableRowsSkeleton rows={6} /></div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Basic info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold mb-4">{t("admin.basicInfo")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.nameAr")}</label><input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.nameEn")}</label><input className={inp} value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} /></div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tVendor("category")}</label>
                <select className={sel} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: Number(e.target.value) || "" }))}>
                  {categories.map(c => <option key={c.id} value={c.id}>{labelOf(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.brand")}</label>
                <select className={sel} value={form.brand_id ?? ""} onChange={e => setForm(f => ({ ...f, brand_id: Number(e.target.value) || "" }))}>
                  <option value="">{tVendor("none")}</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{labelOf(b)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tVendor("audience")}</label>
                <select className={sel} value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value as ContentType }))}>
                  {audienceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.descriptionAr")}</label><textarea rows={2} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.descriptionEn")}</label><textarea rows={2} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} /></div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none"><SwitchToggle checked={form.is_active} onChange={v => setForm(f => ({ ...f, is_active: v }))} /> {tVendor("active")}</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none"><SwitchToggle checked={form.is_featured} onChange={v => setForm(f => ({ ...f, is_featured: v }))} /> {tVendor("featured")}</label>
              </div>
            </div>
          </div>

          {/* Pricing & stock */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h2 className="text-lg font-bold">{t("admin.pricingStock")}</h2>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none"><SwitchToggle checked={form.has_variants} onChange={v => setForm(f => ({ ...f, has_variants: v }))} /> {t("admin.hasVariants")}</label>
            </div>
            {form.has_variants ? (
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">{t("admin.variantsManagedBelow")}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">{t("common.price")}</label><input type="number" className={inp} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.comparePrice")}</label><input type="number" className={inp} value={form.compare_price} onChange={e => setForm(f => ({ ...f, compare_price: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">{t("common.quantity")}</label><input type="number" className={inp} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.sku")}</label><input className={inp} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} /></div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button type="button" onClick={saveProduct} disabled={saving} className={btnPrimary} style={{ background: "var(--color-primary)" }}><Save size={16} /> {t("common.save")}</button>
            </div>
          </div>

          {/* Variants */}
          {form.has_variants && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div>
                  <h2 className="text-lg font-bold">{t("admin.variants")}</h2>
                  <p className="text-sm text-gray-500">{t("admin.variantsHint")}</p>
                </div>
                <button type="button" onClick={openCreateVariant} disabled={allOptions.length === 0} className={btnPrimary} style={{ background: "var(--color-primary)" }}><Plus size={16} /> {t("admin.addVariant")}</button>
              </div>
              {allOptions.length === 0 && <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700 mb-2">{t("admin.noGlobalOptions")}</div>}
              {variants.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">{t("admin.noVariantsYet")}</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200">
                      <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-gray-500">{t("admin.default")}</th>
                      <th className="px-3 py-2 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("admin.variant")}</th>
                      <th className="px-3 py-2 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("admin.sku")}</th>
                      <th className="px-3 py-2 text-end text-xs font-bold uppercase tracking-wide text-gray-500">{t("admin.price")}</th>
                      <th className="px-3 py-2 text-end text-xs font-bold uppercase tracking-wide text-gray-500">{t("admin.quantity")}</th>
                      <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-gray-500">{t("admin.active")}</th>
                      <th className="px-3 py-2" />
                    </tr></thead>
                    <tbody>
                      {variants.map(v => (
                        <tr key={v.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${v.is_default ? "bg-yellow-50" : ""}`}>
                          <td className="px-3 py-2 text-center">
                            <button type="button" title={v.is_default ? t("admin.isDefaultVariant") : t("admin.setAsDefault")} onClick={() => setAsDefault(v)} disabled={v.is_default} className={`p-1 rounded ${v.is_default ? "text-yellow-500 cursor-default" : "text-gray-400 hover:text-yellow-400"}`}>
                              <Star size={16} className={v.is_default ? "fill-yellow-400" : ""} />
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {allOptions.map(opt => {
                                const valId = v.option_value_ids.find(id => opt.values.some(vv => vv.id === id));
                                if (!valId) return null;
                                const val = opt.values.find(vv => vv.id === valId);
                                if (!val) return null;
                                return (
                                  <span key={opt.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                    {val.hex_color && <span className="h-3 w-3 rounded-full border border-gray-300 shrink-0" style={{ background: val.hex_color }} />}
                                    {optionLabel(opt)}: {valueLabel(val)}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-2">{v.sku || "—"}</td>
                          <td className="px-3 py-2 text-end">{Number(v.price).toFixed(2)}</td>
                          <td className="px-3 py-2 text-end">{v.quantity}</td>
                          <td className="px-3 py-2 text-center">{v.is_active ? "✓" : "—"}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 justify-end">
                              <button type="button" title={t("common.edit")} onClick={() => openEditVariant(v)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"><Pencil size={14} /></button>
                              <button type="button" title={t("common.delete")} onClick={() => deleteVariant(v)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
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

      {/* Variant dialog */}
      {vDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeVariantDialog} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">{vDialog.editingId ? t("admin.editVariant") : t("admin.addVariant")}</h2>
              <button type="button" onClick={closeVariantDialog} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-4">
              <p className="text-sm text-gray-500">{t("admin.pickOneValuePerOption")}</p>
              {allOptions.map(opt => (
                <div key={opt.id}>
                  <p className="text-sm font-semibold mb-2">{optionLabel(opt)}</p>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map(val => {
                      const isSelected = vDialog.picks[opt.id] === val.id;
                      const blocked = wouldDuplicate(opt.id, val.id);
                      return (
                        <button key={val.id} type="button" disabled={blocked}
                          onClick={() => !blocked && togglePick(opt.id, val.id)}
                          title={blocked ? t("admin.variantCombinationExists") : ""}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${isSelected ? "border-transparent text-white" : "border-gray-200 text-gray-700 hover:border-gray-300"} ${blocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                          style={isSelected ? { background: "var(--color-primary)" } : {}}>
                          {val.hex_color && <span className="h-3 w-3 rounded-full border border-white/40" style={{ background: val.hex_color }} />}
                          {valueLabel(val)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <hr className="border-gray-200" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.sku")}</label><input className={inp} value={vDialog.sku} onChange={e => setVDialog(s => ({ ...s, sku: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.quantity")}</label><input type="number" className={inp} value={vDialog.quantity} onChange={e => setVDialog(s => ({ ...s, quantity: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.price")}</label><input type="number" className={inp} value={vDialog.price} onChange={e => setVDialog(s => ({ ...s, price: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">{t("admin.comparePrice")}</label><input type="number" className={inp} value={vDialog.compare_price} onChange={e => setVDialog(s => ({ ...s, compare_price: e.target.value }))} /></div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none"><SwitchToggle checked={vDialog.is_active} onChange={v => setVDialog(s => ({ ...s, is_active: v }))} /> {t("admin.active")}</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none"><SwitchToggle checked={vDialog.is_default} onChange={v => setVDialog(s => ({ ...s, is_default: v }))} /> {t("admin.isDefaultVariant")}</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={closeVariantDialog} disabled={savingVariant} className={btnOutline}>{t("common.cancel")}</button>
              <button type="button" onClick={saveVariant} disabled={savingVariant} className={btnPrimary} style={{ background: "var(--color-primary)" }}><Save size={16} /> {t("common.save")}</button>
            </div>
          </div>
        </div>
      )}

      {snack && <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${snack.sev === "error" ? "bg-red-600" : "bg-gray-900"}`}>{snack.msg}</div>}
    </div>
  );
}
