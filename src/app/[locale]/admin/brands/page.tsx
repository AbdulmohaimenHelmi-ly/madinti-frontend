"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";

import { adminApi, type BrandPayload } from "@/lib/api/admin";
import type { Brand, Category, ContentType } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AudienceChip, { useAudienceOptions } from "@/components/common/AudienceChip";

interface FormState {
  name: string;
  name_en: string;
  logo: string;
  description: string;
  description_en: string;
  sort_order: string;
  is_active: boolean;
  is_featured: boolean;
  content_type: ContentType;
  category_ids: number[];
}

const emptyForm: FormState = {
  name: "",
  name_en: "",
  logo: "",
  description: "",
  description_en: "",
  sort_order: "0",
  is_active: true,
  is_featured: false,
  content_type: "unisex",
  category_ids: [],
};

function flattenCategories(
  nodes: Category[],
  depth = 0,
  acc: Array<{ category: Category; depth: number }> = []
): Array<{ category: Category; depth: number }> {
  for (const node of nodes) {
    acc.push({ category: node, depth });
    if (node.children && node.children.length > 0) {
      flattenCategories(node.children, depth + 1, acc);
    }
  }
  return acc;
}

export default function AdminBrandsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tContent = useTranslations("content");
  const uiLocale = useLocale();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const audienceOptions = useAudienceOptions(true);

  const flatCategories = flattenCategories(categories);
  const categoryLabel = (c: Category) =>
    uiLocale === "en" && c.name_en ? c.name_en : c.name;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState<Brand | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.category_id = categoryFilter;
      const res = await adminApi.getBrands(params);
      setBrands(res.data.data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getCategories()
      .then((res) => {
        if (!cancelled) setCategories(res.data.data);
      })
      .catch(() => {
        /* non-fatal */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(() => setSnackbar(""), 3000);
    return () => clearTimeout(timer);
  }, [snackbar]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({
      name: b.name,
      name_en: b.name_en ?? "",
      logo: b.logo ?? "",
      description: b.description ?? "",
      description_en: b.description_en ?? "",
      sort_order: String(b.sort_order ?? 0),
      is_active: b.is_active,
      is_featured: b.is_featured,
      content_type: b.content_type ?? "unisex",
      category_ids:
        b.category_ids ?? (b.categories?.map((c) => c.id) ?? []),
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload: BrandPayload = {
        name: form.name,
        name_en: form.name_en || null,
        logo: form.logo || null,
        description: form.description || null,
        description_en: form.description_en || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        is_featured: form.is_featured,
        content_type: form.content_type,
        category_ids: form.category_ids,
      };
      if (editing) {
        await adminApi.updateBrand(editing.id, payload);
        setSnackbar(t("updated"));
      } else {
        await adminApi.createBrand(payload);
        setSnackbar(t("created"));
      }
      setDialogOpen(false);
      await load();
    } catch {
      setFormError(t("actionError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await adminApi.deleteBrand(toDelete.id);
      setSnackbar(t("deleted"));
      setToDelete(null);
      await load();
    } catch {
      setError(t("actionError"));
      setToDelete(null);
    }
  };

  const brandLabel = (b: Brand) =>
    uiLocale === "en" && b.name_en ? b.name_en : b.name;

  return (
    <div>
      <AdminPageHeader
        title={t("brands")}
        subtitle={t("brandsSubtitle")}
        action={{
          label: t("newBrand"),
          icon: <Plus size={16} />,
          onClick: openCreate,
        }}
      />

      {/* Filter bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tCommon("search")}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              style={{ minWidth: 260 }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tContent("contentType")}
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {audienceOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {t("category")}
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              style={{ minWidth: 220 }}
            >
              <option value="">{tCommon("all")}</option>
              {flatCategories.map(({ category, depth }) => (
                <option key={category.id} value={String(category.id)}>
                  {"\u00A0\u00A0".repeat(depth)}
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={4} />
      ) : brands.length === 0 ? (
        <EmptyState message={t("noBrands")} />
      ) : (
        (() => {
          const filteredBrands = audience
            ? brands.filter((b) => (b.content_type ?? "unisex") === audience)
            : brands;
          if (filteredBrands.length === 0) {
            return <EmptyState message={t("noBrands")} />;
          }
          return (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("logo")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("name")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("nameEn")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("slug")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("productsCount")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("categories")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("sortOrder")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {tContent("contentType")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("featured")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("status")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600 overflow-hidden shrink-0">
                          {b.logo ? (
                            <img
                              src={b.logo}
                              className="h-full w-full object-cover"
                              alt=""
                            />
                          ) : (
                            brandLabel(b)[0]?.toUpperCase()
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{brandLabel(b)}</td>
                      <td className="px-4 py-3">{b.name_en || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">{b.slug}</span>
                      </td>
                      <td className="px-4 py-3">{b.products_count ?? 0}</td>
                      <td className="px-4 py-3">
                        {b.categories && b.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {b.categories.map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-600"
                              >
                                {uiLocale === "en" && c.name_en ? c.name_en : c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "\u2014"
                        )}
                      </td>
                      <td className="px-4 py-3">{b.sort_order}</td>
                      <td className="px-4 py-3">
                        <AudienceChip value={b.content_type} />
                      </td>
                      <td className="px-4 py-3">
                        {b.is_featured ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">
                            {t("featured")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            b.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {b.is_active ? t("active") : t("inactive")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title={tCommon("edit")}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                            onClick={() => openEdit(b)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            title={tCommon("delete")}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                            onClick={() => setToDelete(b)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()
      )}

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !saving && setDialogOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">
                {editing ? t("editBrand") : t("newBrand")}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {t("name")}
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {t("nameEn")}
                  </label>
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t("logoUrl")}
                </label>
                <input
                  type="text"
                  value={form.logo}
                  onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                  placeholder="https://..."
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              {form.logo && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    <img src={form.logo} className="h-full w-full object-cover" alt="" />
                  </div>
                  <span className="text-xs text-gray-500">{t("logoPreview")}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t("description")}
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t("descriptionEn")}
                </label>
                <textarea
                  rows={2}
                  value={form.description_en}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description_en: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t("sortOrder")}
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {tContent("contentType")}
                </label>
                <select
                  value={form.content_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      content_type: e.target.value as ContentType,
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="unisex">{tContent("unisex")}</option>
                  <option value="female">{tContent("female")}</option>
                  <option value="male">{tContent("male")}</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">{tContent("contentTypeHint")}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t("categories")}
                </label>
                <div className="rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                  {flatCategories.map(({ category, depth }) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={form.category_ids.includes(category.id)}
                        onChange={(e) => {
                          const ids = e.target.checked
                            ? [...form.category_ids, category.id]
                            : form.category_ids.filter((id) => id !== category.id);
                          setForm((f) => ({ ...f, category_ids: ids }));
                        }}
                      />
                      <span className="text-sm">
                        {"\u00A0\u00A0".repeat(depth)}
                        {categoryLabel(category)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
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
                      className={`w-10 h-5 rounded-full transition-colors ${
                        form.is_active ? "bg-[var(--color-primary)]" : "bg-gray-300"
                      }`}
                    />
                    <div
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        form.is_active ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <span className="text-sm">
                    {form.is_active ? t("active") : t("inactive")}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
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
                      className={`w-10 h-5 rounded-full transition-colors ${
                        form.is_featured ? "bg-[var(--color-primary)]" : "bg-gray-300"
                      }`}
                    />
                    <div
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        form.is_featured ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <span className="text-sm">{t("featured")}</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
                onClick={handleSave}
                disabled={saving}
              >
                {tCommon("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setToDelete(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">{t("confirmDeleteTitle")}</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                {t("confirmDeleteBrand", { name: brandLabel(toDelete) })}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={() => setToDelete(null)}
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                onClick={handleDelete}
              >
                {tCommon("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {snackbar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {snackbar}
        </div>
      )}
    </div>
  );
}
