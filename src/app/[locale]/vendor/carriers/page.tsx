"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2, Save, Search, Eye, Phone, Mail, CheckCircle, Circle, Truck, X, DollarSign, Building2 } from "lucide-react";

import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import EmptyState from "@/components/common/EmptyState";
import { deliveryApi, type DeliveryCompany, type VendorSelfDeliveryPrice } from "@/lib/api/delivery";
import { citiesApi, type Area, type City } from "@/lib/api/cities";

function SwitchToggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className={`relative inline-block cursor-pointer ${disabled ? "opacity-50 pointer-events-none" : ""}`} onClick={() => onChange(!checked)}>
      <div className={`w-10 h-5 rounded-full transition-colors ${checked ? "bg-[var(--color-primary)]" : "bg-gray-300"}`} />
      <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </div>
  );
}

export default function VendorCarriersPage() {
  const t = useTranslations("vendor");
  const tDel = useTranslations("delivery");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";

  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [details, setDetails] = useState<DeliveryCompany | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [selfEnabled, setSelfEnabled] = useState(false);
  const [selfBasePrice, setSelfBasePrice] = useState("0");
  const [selfPrices, setSelfPrices] = useState<VendorSelfDeliveryPrice[]>([]);
  const [selfSaving, setSelfSaving] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [newCityId, setNewCityId] = useState<number | "">("");
  const [newAreaId, setNewAreaId] = useState<number | "">("");
  const [newAreas, setNewAreas] = useState<Area[]>([]);
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [priceFormError, setPriceFormError] = useState("");

  useEffect(() => {
    Promise.all([deliveryApi.list(), deliveryApi.vendorTrustedIds(), deliveryApi.vendorSelfDelivery(), citiesApi.list({ all: true })])
      .then(([list, ids, self, cityList]) => {
        setCompanies(list.data.data);
        setSelected(new Set(ids.data.data.delivery_company_ids));
        setSelfEnabled(self.data.data.enabled);
        setSelfBasePrice(String(self.data.data.base_price ?? 0));
        setSelfPrices(self.data.data.prices ?? []);
        setCities(cityList.data.data);
      })
      .catch(() => setError(tDel("loadError")))
      .finally(() => setLoading(false));
  }, [tDel]);

  useEffect(() => {
    if (detailsId == null) return;
    setDetailsLoading(true); setDetailsError(""); setDetails(null);
    deliveryApi.get(detailsId)
      .then(res => setDetails(res.data.data))
      .catch(() => setDetailsError(t("loadDetailsError")))
      .finally(() => setDetailsLoading(false));
  }, [detailsId, t]);

  useEffect(() => { if (!success) return; const id = setTimeout(() => setSuccess(""), 3000); return () => clearTimeout(id); }, [success]);

  const toggle = (id: number) => setSelected(s => { const next = new Set(s); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const onSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try { await deliveryApi.vendorSyncTrusted(Array.from(selected)); setSuccess(t("trustedSaved")); }
    catch { setError(tDel("saveError")); }
    finally { setSaving(false); }
  };

  const nameOf = (c: { name: string; name_en?: string | null }) => !isAr && c.name_en ? c.name_en : c.name;
  const descOf = (c: { description?: string | null; description_en?: string | null }) => !isAr && c.description_en ? c.description_en : c.description ?? "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(c => nameOf(c).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, search, isAr]);

  const currency = (n: number | string) => new Intl.NumberFormat(isAr ? "ar-LY" : "en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(n) || 0);
  const closeDetails = () => { setDetailsId(null); setDetails(null); setDetailsError(""); };
  const detailsTrusted = details != null && selected.has(details.id);

  const saveSelfDelivery = async (nextEnabled?: boolean, nextBasePrice?: string) => {
    setSelfSaving(true); setError("");
    try {
      const payload = { enabled: nextEnabled ?? selfEnabled, base_price: Number(nextBasePrice ?? selfBasePrice) || 0 };
      const res = await deliveryApi.vendorUpdateSelfDelivery(payload);
      setSelfEnabled(res.data.data.enabled); setSelfBasePrice(String(res.data.data.base_price ?? 0));
      setSuccess(t("selfDeliverySaved"));
    } catch { setError(tDel("saveError")); }
    finally { setSelfSaving(false); }
  };

  const onToggleSelf = async (checked: boolean) => { setSelfEnabled(checked); await saveSelfDelivery(checked, selfBasePrice); };
  const onBasePriceBlur = async () => { await saveSelfDelivery(selfEnabled, selfBasePrice); };

  const openPriceDialog = () => { setNewCityId(""); setNewAreaId(""); setNewAreas([]); setNewPrice(""); setPriceFormError(""); setPriceDialogOpen(true); };
  const onCityChange = async (cityId: number | "") => {
    setNewCityId(cityId); setNewAreaId("");
    if (cityId === "") { setNewAreas([]); return; }
    try { const res = await citiesApi.areasOf(Number(cityId), { all: true }); setNewAreas(res.data.data); }
    catch { setNewAreas([]); }
  };

  const onAddPrice = async () => {
    if (newCityId === "" || newPrice === "") { setPriceFormError(t("selectCity")); return; }
    setAdding(true); setPriceFormError("");
    try {
      const res = await deliveryApi.vendorAddSelfDeliveryPrice({ city_id: Number(newCityId), area_id: newAreaId === "" ? null : Number(newAreaId), price: Number(newPrice) || 0 });
      setSelfPrices(prev => { const f = prev.filter(p => p.id !== res.data.data.id); return [...f, res.data.data]; });
      setSuccess(t("priceAdded")); setPriceDialogOpen(false);
    } catch { setPriceFormError(tDel("saveError")); }
    finally { setAdding(false); }
  };

  const onDeleteSelfPrice = async (id: number) => {
    try { await deliveryApi.vendorDeleteSelfDeliveryPrice(id); setSelfPrices(prev => prev.filter(p => p.id !== id)); setSuccess(t("priceDeleted")); }
    catch { setError(tDel("saveError")); }
  };

  const inp = "h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60";
  const sel = "h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60";
  const btnPrimary = "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";
  const btnOutline = "inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50";

  return (
    <div>
      <VendorPageHeader title={t("trustedCarriers")} subtitle={t("trustedCarriersSubtitle")}
        action={{ label: saving ? tDel("saving") : tDel("save"), icon: <Save size={16} />, onClick: onSave, disabled: saving }} />

      {error && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4"><span>{error}</span></div>}
      {success && <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 mb-4"><span>{success}</span></div>}

      {/* Self-delivery card */}
      <div className={`rounded-2xl border p-5 mb-4 transition-colors ${selfEnabled ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,white)]" : "border-gray-200 bg-white"}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${selfEnabled ? "bg-[var(--color-primary)]" : "bg-gray-200"}`}>
              <Truck size={24} className={selfEnabled ? "text-white" : "text-gray-500"} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-extrabold text-base">{t("selfDelivery")}</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${selfEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{selfEnabled ? t("selfDeliveryEnabled") : t("selfDeliveryDisabled")}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{t("selfDeliveryDescription")}</p>
            </div>
          </div>
          <SwitchToggle checked={selfEnabled} onChange={onToggleSelf} disabled={selfSaving} />
        </div>

        {selfEnabled && (
          <>
            <hr className="border-gray-200 my-4" />
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-3">
              <div className="min-w-[220px]">
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("basePrice")}</label>
                <div className="relative">
                  <input type="number" className={inp} value={selfBasePrice} onChange={e => setSelfBasePrice(e.target.value)} onBlur={onBasePriceBlur} />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{tCommon("currency")}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{t("basePriceHelp")}</p>
              </div>
              <div className="flex-1" />
              <button type="button" onClick={openPriceDialog} className={btnPrimary} style={{ background: "var(--color-primary)" }}><Plus size={16} /> {t("addCityPrice")}</button>
            </div>
            {selfPrices.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">{t("noSelfPrices")}</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("city")}</th>
                    <th className="px-4 py-2 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("area")}</th>
                    <th className="px-4 py-2 text-end text-xs font-bold uppercase tracking-wide text-gray-500">{t("price")}</th>
                    <th className="px-4 py-2" />
                  </tr></thead>
                  <tbody>
                    {selfPrices.map(p => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2">{p.city ? nameOf(p.city) : "—"}</td>
                        <td className="px-4 py-2">{p.area ? nameOf(p.area) : <span className="text-gray-400 text-xs">{t("anyArea")}</span>}</td>
                        <td className="px-4 py-2 text-end font-bold">{currency(p.price)} {tCommon("currency")}</td>
                        <td className="px-4 py-2 text-end"><button type="button" title={tCommon("delete")} onClick={() => onDeleteSelfPrice(p.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Search & count */}
      <div className="p-4 mb-4 bg-white rounded-2xl border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute top-1/2 start-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchCarriers")} className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold border ${selected.size > 0 ? "bg-[var(--color-primary)] text-white border-transparent" : "bg-gray-100 text-gray-600 border-gray-200"}`}>{t("selectedCount", { count: selected.size })}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-[var(--color-primary)] animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState message={t("noCarriers")} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(c => {
            const isSel = selected.has(c.id);
            return (
              <div key={c.id} className={`rounded-2xl border p-4 sm:p-5 transition-colors ${isSel ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,white)]" : "border-gray-200 bg-white hover:border-[var(--color-primary)]"}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-14 w-14 shrink-0 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                      {c.logo ? <img src={c.logo} alt={nameOf(c)} className="h-full w-full object-cover" /> : <Truck size={24} className="text-gray-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-0.5">
                        <span className="font-extrabold text-base truncate">{nameOf(c)}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{c.is_active ? t("active") : t("inactive")}</span>
                        {isSel && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-[var(--color-primary)] text-white"><CheckCircle size={10} /> {t("trusted")}</span>}
                      </div>
                      {descOf(c) && <p className="text-sm text-gray-500 line-clamp-2">{descOf(c)}</p>}
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><DollarSign size={13} className="text-[var(--color-primary)]" />{t("basePriceShort")}: <b>{currency(c.base_price)}</b> {tCommon("currency")}</span>
                        <span className="flex items-center gap-1"><Building2 size={13} className="text-[var(--color-primary)]" />{tDel("pricesCount")}: <b>{c.prices_count ?? 0}</b></span>
                        {c.phone && <span className="flex items-center gap-1"><Phone size={13} className="text-[var(--color-primary)]" /><span dir="ltr">{c.phone}</span></span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => setDetailsId(c.id)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                      <Eye size={14} /> {t("viewDetails")}
                    </button>
                    <SwitchToggle checked={isSel} onChange={() => toggle(c.id)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details dialog */}
      {detailsId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetails} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold"><Truck size={18} className="text-[var(--color-primary)]" /> {t("carrierDetails")}</div>
              <button type="button" onClick={closeDetails} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-4">
              {detailsLoading ? (
                <div className="flex justify-center py-10"><div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-[var(--color-primary)] animate-spin" /></div>
              ) : detailsError ? (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{detailsError}</div>
              ) : details ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="h-18 w-18 shrink-0 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center" style={{ width: 72, height: 72 }}>
                      {details.logo ? <img src={details.logo} alt={nameOf(details)} className="h-full w-full object-cover" /> : <Truck size={28} className="text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-xl">{nameOf(details)}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${details.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{details.is_active ? t("active") : t("inactive")}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${detailsTrusted ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-gray-600"}`}>
                          {detailsTrusted ? <CheckCircle size={10} /> : <Circle size={10} />}
                          {detailsTrusted ? t("trusted") : t("notTrusted")}
                        </span>
                      </div>
                    </div>
                    <button type="button" onClick={() => toggle(details.id)}
                      className={detailsTrusted ? btnOutline : `${btnPrimary}`}
                      style={!detailsTrusted ? { background: "var(--color-primary)" } : {}}>
                      {detailsTrusted ? <><Circle size={14} /> {t("unmarkTrusted")}</> : <><CheckCircle size={14} /> {t("markTrusted")}</>}
                    </button>
                  </div>
                  <div>
                    <p className="font-bold mb-1">{t("about")}</p>
                    <p className={`text-sm ${descOf(details) ? "text-gray-800" : "text-gray-400"}`}>{descOf(details) || t("noDescription")}</p>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="font-bold mb-2">{t("contactInfo")}</p>
                      <div className="flex flex-col gap-2">
                        <span className="flex items-center gap-2 text-sm"><Phone size={15} className="text-[var(--color-primary)]" /> <span dir="ltr">{details.phone || "—"}</span></span>
                        <span className="flex items-center gap-2 text-sm"><Mail size={15} className="text-[var(--color-primary)]" /> <span dir="ltr" className="break-all">{details.email || "—"}</span></span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="font-bold mb-2">{t("basePriceShort")}</p>
                      <span className="text-3xl font-black text-[var(--color-primary)]">{currency(details.base_price)}</span>
                      <span className="text-sm text-gray-500 ms-1">{tCommon("currency")}</span>
                      <p className="text-xs text-gray-400 mt-1">{t("baseFallback")}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold mb-2">{t("pricingRules")} <span className="text-gray-400 font-normal">({details.prices?.length ?? 0})</span></p>
                    {details.prices && details.prices.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-gray-200">
                            <th className="px-4 py-2 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("city")}</th>
                            <th className="px-4 py-2 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("area")}</th>
                            <th className="px-4 py-2 text-end text-xs font-bold uppercase tracking-wide text-gray-500">{t("price")}</th>
                          </tr></thead>
                          <tbody>
                            {details.prices.map(p => (
                              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-2">{p.city ? nameOf(p.city) : "—"}</td>
                                <td className="px-4 py-2">{p.area ? nameOf(p.area) : <span className="text-gray-400 text-xs">{t("anyArea")}</span>}</td>
                                <td className="px-4 py-2 text-end font-bold">{currency(p.price)} {tCommon("currency")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">{t("noPricingRules")}</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button type="button" onClick={closeDetails} className={btnOutline}>{t("close")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add price dialog */}
      {priceDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPriceDialogOpen(false)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold"><DollarSign size={16} className="text-[var(--color-primary)]" /> {t("addCityPrice")}</div>
              <button type="button" onClick={() => setPriceDialogOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-3">
              {priceFormError && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><span>{priceFormError}</span></div>}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("city")}</label>
                <select className={sel} value={newCityId} onChange={e => onCityChange(e.target.value === "" ? "" : Number(e.target.value))}>
                  <option value="">{t("selectCity")}</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{nameOf(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("area")}</label>
                <select className={sel} value={newAreaId} onChange={e => setNewAreaId(e.target.value === "" ? "" : Number(e.target.value))} disabled={newCityId === "" || newAreas.length === 0}>
                  <option value="">{t("anyArea")}</option>
                  {newAreas.map(a => <option key={a.id} value={a.id}>{nameOf(a)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("price")}</label>
                <div className="relative">
                  <input type="number" className={inp} value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{tCommon("currency")}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={() => setPriceDialogOpen(false)} className={btnOutline}>{tCommon("cancel")}</button>
              <button type="button" onClick={onAddPrice} disabled={adding} className={btnPrimary} style={{ background: "var(--color-primary)" }}><Plus size={16} /> {adding ? tDel("saving") : t("addPrice")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
