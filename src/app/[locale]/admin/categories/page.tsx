"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";

import { adminApi, type CreateCategoryPayload } from "@/lib/api/admin";
import type { Category, ContentType } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";
import AudienceChip, { useAudienceOptions } from "@/components/common/AudienceChip";

interface FormState extends CreateCategoryPayload {
  id?: number;
}

const emptyForm: FormState = {
  name: "",
  name_en: "",
  description: "",
  description_en: "",
  parent_id: null,
  sort_order: 0,
  is_active: true,
  content_type: "unisex",
};

export default function AdminCategoriesPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tContent = useTranslations("content");
  const locale = useLocale();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [audience, setAudience] = useState("");
  const audienceOptions = useAudienceOptions(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data.data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(() => setSnackbar(""), 3000);
    return () => clearTimeout(timer);
  }, [snackbar]);

  const parentOptions = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  );

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setForm({
      id: c.id,
      name: c.name,
      name_en: c.name_en ?? "",
      description: c.description ?? "",
      description_en: "",
      parent_id: c.parent_id,
      is_active: c.is_active,
      sort_order: 0,
      content_type: c.content_type ?? "unisex",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const payload: CreateCategoryPayload = {
        name: form.name,
        name_en: form.name_en || undefined,
        description: form.description || undefined,
        description_en: form.description_en || undefined,
        parent_id: form.parent_id || null,
        is_active: form.is_active,
        content_type: form.content_type,
      };
      if (form.id) {
        await adminApi.updateCategory(form.id, payload);
        setSnackbar(t("updated"));
      } else {
        await adminApi.createCategory(payload);
        setSnackbar(t("created"));
      }
      setFormOpen(false);
      await load();
    } catch {
      setError(t("actionError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Category) => {
    if (!confirm(t("confirmDeleteCategory", { name: c.name }))) return;
    try {
      await adminApi.deleteCategory(c.id);
      setSnackbar(t("deleted"));
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const displayName = (c: Category) =>
    locale === "en" && c.name_en ? c.name_en : c.name;

  const filteredCategories = categories.filter((c) => {
    if (status === "1" && !c.is_active) return false;
    if (status === "0" && c.is_active) return false;
    if (audience && (c.content_type ?? "unisex") !== audience) return false;
    if (search) {
      const q = search.toLowerCase();
      const n = displayName(c).toLowerCase();
      const a = (c.name || "").toLowerCase();
      const e = (c.name_en || "").toLowerCase();
      if (!n.includes(q) && !a.includes(q) && !e.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <AdminPageHeader
        title={t("categories")}
        subtitle={t("categoriesSubtitle")}
        action={{
          label: t("newCategory"),
          icon: <Plus size={16} />,
          onClick: handleOpenCreate,
        }}
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchCategories")}
        selects={[
          {
            key: "status",
            label: t("status"),
            value: status,
            onChange: setStatus,
            options: [
              { value: "", label: t("allStatuses") },
              { value: "1", label: t("active") },
              { value: "0", label: t("inactive") },
            ],
          },
          {
            key: "audience",
            label: tContent("contentType"),
            value: audience,
            onChange: setAudience,
            options: audienceOptions,
          },
        ]}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={4} />
      ) : filteredCategories.length === 0 ? (
        <EmptyState message={t("noCategories")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("name")}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("parent")}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{tContent("contentType")}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("status")}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold">{displayName(c)}</td>
                  <td className="px-4 py-3">
                    {c.parent_id
                      ? displayName(categories.find((p) => p.id === c.parent_id) ?? c)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <AudienceChip value={c.content_type} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.is_active ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title={tCommon("edit")}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                        onClick={() => handleOpenEdit(c)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title={tCommon("delete")}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                        onClick={() => handleDelete(c)}
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
      )}

      {/* Create / Edit dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFormOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">{form.id ? t("editCategory") : t("newCategory")}</h2>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("nameAr")} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("nameEn")}</label>
                <input
                  type="text"
                  value={form.name_en || ""}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("parent")}</label>
                <select
                  value={form.parent_id ?? ""}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : null })}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">{t("noParent")}</option>
                  {parentOptions
                    .filter((c) => c.id !== form.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{displayName(c)}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("description")}</label>
                <textarea
                  rows={2}
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tContent("contentType")}</label>
                <select
                  value={form.content_type ?? "unisex"}
                  onChange={(e) => setForm({ ...form, content_type: e.target.value as ContentType })}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="unisex">{tContent("unisex")}</option>
                  <option value="female">{tContent("female")}</option>
                  <option value="male">{tContent("male")}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{tContent("contentTypeHint")}</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={!!form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${form.is_active ? "bg-[var(--color-primary)]" : "bg-gray-300"}`} />
                  <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <span className="text-sm">{t("active")}</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                {tCommon("save")}
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
