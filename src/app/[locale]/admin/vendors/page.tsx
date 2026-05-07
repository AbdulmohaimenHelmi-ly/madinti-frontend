"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Pencil, Trash2, CheckCircle, Ban, AlertCircle } from "lucide-react";

import { adminApi, type UpdateVendorPayload } from "@/lib/api/admin";
import { citiesApi, type Area, type City } from "@/lib/api/cities";
import type { Vendor } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import DataPagination from "@/components/common/DataPagination";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";

interface EditForm {
  store_name: string;
  store_name_en: string;
  phone: string;
  description: string;
  description_en: string;
  city_id: string;
  area_id: string;
}

export default function AdminVendorsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<Vendor | null>(null);
  const [snackbar, setSnackbar] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [cityId, setCityId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cities, setCities] = useState<City[]>([]);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<EditForm>({
    store_name: "",
    store_name_en: "",
    phone: "",
    description: "",
    description_en: "",
    city_id: "",
    area_id: "",
  });
  const [formAreas, setFormAreas] = useState<Area[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    citiesApi
      .list({ all: true })
      .then((res) => setCities(res.data.data))
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = {
        per_page: 15,
        page,
        all: 1,
      };
      if (search) params.search = search;
      if (status !== "") params.is_active = status;
      if (cityId !== "") params.city_id = cityId;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await adminApi.getVendors(params);
      setVendors(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, search, status, cityId, dateFrom, dateTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(() => setSnackbar(""), 3000);
    return () => clearTimeout(timer);
  }, [snackbar]);

  const handleToggleActive = async (v: Vendor) => {
    setBusyId(v.id);
    try {
      if (v.is_active) {
        await adminApi.deactivateVendor(v.id);
        setSnackbar(t("deactivated"));
      } else {
        await adminApi.activateVendor(v.id);
        setSnackbar(t("activated"));
      }
      await load();
    } catch {
      setError(t("actionError"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await adminApi.deleteVendor(toDelete.id);
      setSnackbar(t("deleted"));
      setToDelete(null);
      await load();
    } catch {
      setError(t("actionError"));
      setToDelete(null);
    }
  };

  const storeName = (v: Vendor) =>
    locale === "en" && v.store_name_en ? v.store_name_en : v.store_name;

  const openEdit = async (v: Vendor) => {
    setEditing(v);
    setFormError("");
    setForm({
      store_name: v.store_name,
      store_name_en: v.store_name_en ?? "",
      phone: v.phone ?? "",
      description: v.description ?? "",
      description_en: v.description_en ?? "",
      city_id: v.city_id ? String(v.city_id) : "",
      area_id: v.area_id ? String(v.area_id) : "",
    });
    setFormAreas([]);
    if (v.city_id) {
      try {
        const res = await citiesApi.areasOf(v.city_id, { all: true });
        setFormAreas(res.data.data);
      } catch {
        /* noop */
      }
    }
  };

  const handleFormCityChange = async (value: string) => {
    setForm((f) => ({ ...f, city_id: value, area_id: "" }));
    setFormAreas([]);
    if (value) {
      try {
        const res = await citiesApi.areasOf(Number(value), { all: true });
        setFormAreas(res.data.data);
      } catch {
        /* noop */
      }
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!form.store_name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload: UpdateVendorPayload = {
        store_name: form.store_name,
        store_name_en: form.store_name_en || undefined,
        phone: form.phone || undefined,
        description: form.description || undefined,
        description_en: form.description_en || undefined,
        city_id: form.city_id ? Number(form.city_id) : null,
        area_id: form.area_id ? Number(form.area_id) : null,
      };
      await adminApi.updateVendor(editing.id, payload);
      setSnackbar(t("updated"));
      setEditing(null);
      await load();
    } catch {
      setFormError(t("actionError"));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(
        locale === "ar" ? "ar-LY" : "en-US",
        { year: "numeric", month: "short", day: "numeric" }
      );
    } catch {
      return "—";
    }
  };

  const cityLabel = (c: City) =>
    locale === "en" && c.name_en ? c.name_en : c.name;
  const areaLabel = (a: Area) =>
    locale === "en" && a.name_en ? a.name_en : a.name;

  return (
    <div>
      <AdminPageHeader title={t("vendors")} subtitle={t("vendorsSubtitle")} />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchVendors")}
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
            key: "city",
            label: t("city"),
            value: cityId,
            onChange: setCityId,
            options: [
              { value: "", label: t("allCities") },
              ...cities.map((c) => ({
                value: String(c.id),
                label: cityLabel(c),
              })),
            ],
          },
        ]}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        dateFromLabel={t("dateFrom")}
        dateToLabel={t("dateTo")}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={5} />
      ) : vendors.length === 0 ? (
        <EmptyState message={t("noVendors")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("storeName")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("city")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("phone")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("status")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("joinedAt")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold">{storeName(v)}</td>
                    <td className="px-4 py-3">{v.city_details ? v.city_details.name : v.city || "—"}</td>
                    <td className="px-4 py-3">{v.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {v.is_active ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(v.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title={tCommon("edit")}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                          onClick={() => openEdit(v)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title={v.is_active ? t("deactivate") : t("activate")}
                          disabled={busyId === v.id}
                          className={`p-1.5 rounded-lg transition disabled:opacity-40 ${v.is_active ? "text-yellow-600 hover:bg-yellow-50" : "text-green-500 hover:bg-green-50"}`}
                          onClick={() => handleToggleActive(v)}
                        >
                          {v.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          type="button"
                          title={tCommon("delete")}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                          onClick={() => setToDelete(v)}
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
          <DataPagination
            page={page}
            lastPage={lastPage}
            total={total}
            perPage={15}
            onChange={setPage}
          />
        </>
      )}

      {/* Edit vendor dialog */}
      {!!editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setEditing(null)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">{t("editVendor")}</h2>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("storeName")}</label>
                <input
                  type="text"
                  value={form.store_name}
                  onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("nameEn")}</label>
                <input
                  type="text"
                  value={form.store_name_en}
                  onChange={(e) => setForm((f) => ({ ...f, store_name_en: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("phone")}</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("city")}</label>
                <select
                  value={form.city_id}
                  onChange={(e) => handleFormCityChange(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">—</option>
                  {cities.map((c) => (
                    <option key={c.id} value={String(c.id)}>{cityLabel(c)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("area")}</label>
                <select
                  value={form.area_id}
                  onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
                  disabled={!form.city_id}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                >
                  <option value="">—</option>
                  {formAreas.map((a) => (
                    <option key={a.id} value={String(a.id)}>{areaLabel(a)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("description")}</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("description")} (EN)</label>
                <textarea
                  rows={2}
                  value={form.description_en}
                  onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
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

      {/* Delete confirmation dialog */}
      {!!toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setToDelete(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">{t("confirmDeleteTitle")}</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                {t("confirmDeleteVendor", { name: storeName(toDelete) })}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setToDelete(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
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
