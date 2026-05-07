"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

import { citiesApi, type Area, type City } from "@/lib/api/cities";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type CityForm = { id?: number; name: string; name_en: string };
type AreaForm = {
  id?: number;
  city_id: number;
  name: string;
  name_en: string;
};

const emptyCity: CityForm = { name: "", name_en: "" };

export default function AdminCitiesPage() {
  const t = useTranslations("admin");
  const tCities = useTranslations("cities");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [cityDialog, setCityDialog] = useState<CityForm | null>(null);
  const [areaDialog, setAreaDialog] = useState<AreaForm | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await citiesApi.list({ with_areas: true, all: true });
      setCities(res.data.data);
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

  const cityLabel = (c: City) =>
    locale === "en" && c.name_en ? c.name_en : c.name;
  const areaLabel = (a: Area) =>
    locale === "en" && a.name_en ? a.name_en : a.name;

  const handleSaveCity = async () => {
    if (!cityDialog?.name.trim()) return;
    try {
      if (cityDialog.id) {
        await citiesApi.update(cityDialog.id, {
          name: cityDialog.name,
          name_en: cityDialog.name_en || undefined,
        });
        setSnackbar(t("updated"));
      } else {
        await citiesApi.create({
          name: cityDialog.name,
          name_en: cityDialog.name_en || undefined,
        });
        setSnackbar(t("created"));
      }
      setCityDialog(null);
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const handleToggleCity = async (c: City) => {
    try {
      await citiesApi.update(c.id, { is_active: !c.is_active });
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const handleDeleteCity = async (c: City) => {
    if (!confirm(t("confirmDeleteCity", { name: cityLabel(c) }))) return;
    try {
      await citiesApi.remove(c.id);
      setSnackbar(t("deleted"));
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const handleSaveArea = async () => {
    if (!areaDialog?.name.trim()) return;
    try {
      if (areaDialog.id) {
        await citiesApi.updateArea(areaDialog.id, {
          name: areaDialog.name,
          name_en: areaDialog.name_en || undefined,
        });
        setSnackbar(t("updated"));
      } else {
        await citiesApi.createArea(areaDialog.city_id, {
          name: areaDialog.name,
          name_en: areaDialog.name_en || undefined,
        });
        setSnackbar(t("created"));
      }
      setAreaDialog(null);
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const handleToggleArea = async (a: Area) => {
    try {
      await citiesApi.updateArea(a.id, { is_active: !a.is_active });
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const handleDeleteArea = async (a: Area) => {
    if (!confirm(t("confirmDeleteArea", { name: areaLabel(a) }))) return;
    try {
      await citiesApi.removeArea(a.id);
      setSnackbar(t("deleted"));
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={tCities("title")}
        subtitle={tCities("subtitle")}
        action={{
          label: tCities("newCity"),
          icon: <Plus size={16} />,
          onClick: () => setCityDialog({ ...emptyCity }),
        }}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={4} />
      ) : cities.length === 0 ? (
        <EmptyState message={tCities("noCities")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="w-12 px-4 py-3" />
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                  {tCities("cityName")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                  {tCities("cityNameEn")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                  {tCities("areasCount")}
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
              {cities.map((c) => (
                <Fragment key={c.id}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                        onClick={() =>
                          setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))
                        }
                      >
                        {expanded[c.id] ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-semibold">{c.name}</td>
                    <td className="px-4 py-3">{c.name_en || "—"}</td>
                    <td className="px-4 py-3">
                      {c.areas?.length ?? c.areas_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <label className="cursor-pointer">
                        <div className="relative inline-flex">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={c.is_active}
                            onChange={() => handleToggleCity(c)}
                          />
                          <div
                            className={`w-8 h-4 rounded-full transition-colors ${
                              c.is_active ? "bg-[var(--color-primary)]" : "bg-gray-300"
                            }`}
                          />
                          <div
                            className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
                              c.is_active ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </div>
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title={tCommon("edit")}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                          onClick={() =>
                            setCityDialog({
                              id: c.id,
                              name: c.name,
                              name_en: c.name_en ?? "",
                            })
                          }
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title={tCommon("delete")}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                          onClick={() => handleDeleteCity(c)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expanded[c.id] && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 p-0">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold">{tCities("areas")}</p>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                              onClick={() =>
                                setAreaDialog({
                                  city_id: c.id,
                                  name: "",
                                  name_en: "",
                                })
                              }
                            >
                              <Plus size={13} /> {tCities("newArea")}
                            </button>
                          </div>
                          {(c.areas ?? []).length === 0 ? (
                            <p className="text-sm text-gray-500">{tCities("noAreas")}</p>
                          ) : (
                            <div className="space-y-2">
                              {c.areas!.map((a) => (
                                <div
                                  key={a.id}
                                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2"
                                >
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm">{a.name}</p>
                                    {a.name_en && (
                                      <span className="text-xs text-gray-500">
                                        {a.name_en}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                      a.is_active
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {a.is_active ? t("active") : t("inactive")}
                                  </span>
                                  <label className="cursor-pointer">
                                    <div className="relative inline-flex">
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={a.is_active}
                                        onChange={() => handleToggleArea(a)}
                                      />
                                      <div
                                        className={`w-8 h-4 rounded-full transition-colors ${
                                          a.is_active
                                            ? "bg-[var(--color-primary)]"
                                            : "bg-gray-300"
                                        }`}
                                      />
                                      <div
                                        className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
                                          a.is_active ? "translate-x-4" : "translate-x-0"
                                        }`}
                                      />
                                    </div>
                                  </label>
                                  <button
                                    type="button"
                                    title={tCommon("edit")}
                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                                    onClick={() =>
                                      setAreaDialog({
                                        id: a.id,
                                        city_id: a.city_id,
                                        name: a.name,
                                        name_en: a.name_en ?? "",
                                      })
                                    }
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    title={tCommon("delete")}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                                    onClick={() => handleDeleteArea(a)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* City dialog */}
      {cityDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCityDialog(null)}
          />
          <div className="relative z-10 w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">
                {cityDialog.id ? tCities("editCity") : tCities("newCity")}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {tCities("cityName")}
                </label>
                <input
                  type="text"
                  value={cityDialog.name}
                  autoFocus
                  onChange={(e) =>
                    setCityDialog((c) => (c ? { ...c, name: e.target.value } : c))
                  }
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {tCities("cityNameEn")}
                </label>
                <input
                  type="text"
                  value={cityDialog.name_en}
                  onChange={(e) =>
                    setCityDialog((c) => (c ? { ...c, name_en: e.target.value } : c))
                  }
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={() => setCityDialog(null)}
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "var(--color-primary)" }}
                onClick={handleSaveCity}
              >
                {tCommon("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area dialog */}
      {areaDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setAreaDialog(null)}
          />
          <div className="relative z-10 w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">
                {areaDialog.id ? tCities("editArea") : tCities("newArea")}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {tCities("areaName")}
                </label>
                <input
                  type="text"
                  value={areaDialog.name}
                  autoFocus
                  onChange={(e) =>
                    setAreaDialog((a) => (a ? { ...a, name: e.target.value } : a))
                  }
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {tCities("areaNameEn")}
                </label>
                <input
                  type="text"
                  value={areaDialog.name_en}
                  onChange={(e) =>
                    setAreaDialog((a) => (a ? { ...a, name_en: e.target.value } : a))
                  }
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={() => setAreaDialog(null)}
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "var(--color-primary)" }}
                onClick={handleSaveArea}
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
