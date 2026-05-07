"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2, ArrowRight, AlertCircle } from "lucide-react";

import { deliveryApi, type DeliveryPrice } from "@/lib/api/delivery";
import { citiesApi, type City, type Area } from "@/lib/api/cities";
import DeliveryPageHeader from "@/components/delivery/DeliveryPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";

export default function DeliveryPricesPage() {
  const t = useTranslations("delivery");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";

  const [prices, setPrices] = useState<DeliveryPrice[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [fromAreas, setFromAreas] = useState<Area[]>([]);
  const [toAreas, setToAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");

  // Filter state
  const [search, setSearch] = useState("");
  const [filterFromCity, setFilterFromCity] = useState<string>("");
  const [filterToCity, setFilterToCity] = useState<string>("");

  // Form state
  const [fromCityId, setFromCityId] = useState<number | "">("");
  const [fromAreaId, setFromAreaId] = useState<number | "">("");
  const [cityId, setCityId] = useState<number | "">("");
  const [areaId, setAreaId] = useState<number | "">("");
  const [price, setPrice] = useState<string>("");

  // Initial load
  useEffect(() => {
    Promise.all([deliveryApi.prices(), citiesApi.list({ all: true })])
      .then(([p, c]) => {
        setPrices(p.data.data);
        setCities(c.data.data);
      })
      .catch(() => setPageError(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  // Areas for the selected origin city
  useEffect(() => {
    setFromAreaId("");
    if (!fromCityId) {
      setFromAreas([]);
      return;
    }
    citiesApi
      .areasOf(Number(fromCityId), { all: true })
      .then((r) => setFromAreas(r.data.data))
      .catch(() => setFromAreas([]));
  }, [fromCityId]);

  // Areas for the selected destination city
  useEffect(() => {
    setAreaId("");
    if (!cityId) {
      setToAreas([]);
      return;
    }
    citiesApi
      .areasOf(Number(cityId), { all: true })
      .then((r) => setToAreas(r.data.data))
      .catch(() => setToAreas([]));
  }, [cityId]);

  const cityName = (
    c?: City | { name: string; name_en?: string | null } | null
  ) => (!c ? "-" : isAr ? c.name : c.name_en || c.name);

  const resetForm = () => {
    setFromCityId("");
    setFromAreaId("");
    setCityId("");
    setAreaId("");
    setPrice("");
    setFormError("");
  };

  const openDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (adding) return;
    setDialogOpen(false);
    setFormError("");
  };

  const onAdd = async () => {
    if (!cityId || !price || Number(price) < 0) return;
    setAdding(true);
    setFormError("");
    try {
      const res = await deliveryApi.addPrice({
        from_city_id: fromCityId ? Number(fromCityId) : null,
        from_area_id: fromAreaId ? Number(fromAreaId) : null,
        city_id: Number(cityId),
        area_id: areaId ? Number(areaId) : null,
        price: Number(price),
      });
      setPrices((rows) => [res.data.data, ...rows]);
      resetForm();
      setDialogOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e?.response?.data?.message || t("saveError"));
    } finally {
      setAdding(false);
    }
  };

  const onDelete = async (id: number) => {
    setPrices((rows) => rows.filter((r) => r.id !== id));
    try {
      await deliveryApi.deletePrice(id);
    } catch {
      // reload on failure
      const r = await deliveryApi.prices();
      setPrices(r.data.data);
    }
  };

  const sortedPrices = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      return [...prices]
        .filter((p) => {
          if (filterFromCity === "__any__") {
            if (p.from_city) return false;
          } else if (filterFromCity) {
            if (!p.from_city || String(p.from_city.id) !== filterFromCity)
              return false;
          }
          if (filterToCity && (!p.city || String(p.city.id) !== filterToCity))
            return false;
          if (q) {
            const haystack = [
              p.from_city ? cityName(p.from_city) : "",
              p.from_area ? cityName(p.from_area) : "",
              p.city ? cityName(p.city) : "",
              p.area ? cityName(p.area) : "",
            ]
              .join(" ")
              .toLowerCase();
            if (!haystack.includes(q)) return false;
          }
          return true;
        })
        .sort((a, b) => {
          const fa = cityName(a.from_city);
          const fb = cityName(b.from_city);
          if (fa !== fb) return fa.localeCompare(fb);
          const ca = cityName(a.city);
          const cb = cityName(b.city);
          return ca.localeCompare(cb);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prices, isAr, search, filterFromCity, filterToCity]
  );

  return (
    <div>
      <DeliveryPageHeader
        title={t("prices")}
        subtitle={t("pricesSubtitle")}
        action={{
          label: t("addPrice"),
          icon: <Plus size={16} />,
          onClick: openDialog,
        }}
      />

      {pageError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{pageError}</span>
        </div>
      )}

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPricesPlaceholder")}
        selects={[
          {
            key: "from",
            label: t("fromCity"),
            value: filterFromCity,
            onChange: setFilterFromCity,
            width: 200,
            options: [
              { value: "", label: t("filterAll") },
              { value: "__any__", label: t("anyOrigin") },
              ...cities.map((c) => ({
                value: String(c.id),
                label: cityName(c),
              })),
            ],
          },
          {
            key: "to",
            label: t("city"),
            value: filterToCity,
            onChange: setFilterToCity,
            width: 200,
            options: [
              { value: "", label: t("filterAll") },
              ...cities.map((c) => ({
                value: String(c.id),
                label: cityName(c),
              })),
            ],
          },
        ]}
      />

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--color-primary)]" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("fromCity")}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("fromArea")}</th>
                <th className="px-4 py-3 w-9" />
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("city")}</th>
                <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("area")}</th>
                <th className="px-4 py-3 text-end text-xs font-bold uppercase tracking-wide text-gray-500">{t("price")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sortedPrices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    {t("noPrices")}
                  </td>
                </tr>
              )}
              {sortedPrices.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    {p.from_city ? (
                      cityName(p.from_city)
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                        {t("anyOrigin")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.from_area ? (
                      cityName(p.from_area)
                    ) : (
                      <span className="text-xs text-gray-400">{t("anyArea")}</span>
                    )}
                  </td>
                  <td className="px-1 py-3 text-gray-300">
                    <ArrowRight size={16} className={isAr ? "rotate-180" : ""} />
                  </td>
                  <td className="px-4 py-3">{cityName(p.city)}</td>
                  <td className="px-4 py-3">
                    {p.area ? (
                      cityName(p.area)
                    ) : (
                      <span className="text-xs text-gray-400">{t("anyArea")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end font-bold">
                    {Number(p.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      title={t("delete")}
                      onClick={() => onDelete(p.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDialog} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">{t("addPrice")}</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("origin")}</p>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("fromCity")}</label>
                <select
                  value={fromCityId}
                  onChange={(e) => setFromCityId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">{t("anyOrigin")}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{cityName(c)}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-0.5">{t("fromCityHelp")}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("fromArea")}</label>
                <select
                  value={fromAreaId}
                  onChange={(e) => setFromAreaId(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={!fromCityId}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                >
                  <option value="">{t("anyArea")}</option>
                  {fromAreas.map((a) => (
                    <option key={a.id} value={a.id}>{cityName(a)}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-0.5">{t("areaHelp")}</p>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("destination")}</p>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("city")}</label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">{t("selectCity")}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{cityName(c)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("area")}</label>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={!cityId}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                >
                  <option value="">{t("anyArea")}</option>
                  {toAreas.map((a) => (
                    <option key={a.id} value={a.id}>{cityName(a)}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-0.5">{t("areaHelp")}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("price")}</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDialog}
                disabled={adding}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={onAdd}
                disabled={adding || !cityId || price === ""}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                <Plus size={16} /> {t("add")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
