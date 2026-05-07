"use client";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { vendorApplicationsApi, type ApplyVendorPayload, type VendorApplication } from "@/lib/api/vendorApplications";
import { citiesApi, type Area, type City } from "@/lib/api/cities";
import { useAuthStore } from "@/lib/store/authStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const emptyForm: ApplyVendorPayload = { store_name: "", store_name_en: "", description: "", phone: "", city_id: null, area_id: null, address: "" };
const statusClasses = { approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700", pending: "bg-amber-100 text-amber-700" };

export default function BecomeVendorPage() {
  const t = useTranslations("vendorApplication");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const initialize = useAuthStore((s) => s.initialize);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [form, setForm] = useState<ApplyVendorPayload>(emptyForm);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => { citiesApi.list().then((res) => setCities(res.data.data)).catch(() => undefined); }, []);
  useEffect(() => {
    if (!form.city_id) { setAreas([]); return; }
    citiesApi.areasOf(form.city_id).then((res) => setAreas(res.data.data)).catch(() => setAreas([]));
  }, [form.city_id]);
  useEffect(() => { if (!user && !token) initialize(); }, [user, token, initialize]);
  useEffect(() => { if (!user && !token) router.replace(`/${locale}/auth/login`); }, [user, token, locale, router]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try { const res = await vendorApplicationsApi.getMine(); if (active) setApplication(res.data.data); } catch {}
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.store_name.trim()) { setError(t("storeNameRequired")); return; }
    setSaving(true); setError("");
    try {
      const res = await vendorApplicationsApi.apply(form);
      setApplication(res.data.data);
      setSnackbar(t("submitted")); setTimeout(() => setSnackbar(""), 3000);
      setForm(emptyForm);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t("submitError"));
    } finally { setSaving(false); }
  };

  if (!user || loading) return <LoadingSpinner />;

  const inputCls = "border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white w-full";

  if (user.is_vendor) {
    return (
      <div className="max-w-screen-md mx-auto px-4 py-16">
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl mb-4">{t("alreadyVendor")}</div>
        <button onClick={() => router.push(`/${locale}/vendor`)} className="px-6 py-2.5 rounded-xl text-white font-bold" style={{ background: "var(--color-primary)" }}>
          {t("goToDashboard")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}>
          <Store size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{t("title")}</h1>
          <p className="text-gray-500 text-sm">{t("subtitle")}</p>
        </div>
      </div>

      {application && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">{t("yourApplication")}</p>
              <p className="text-lg font-bold">{application.store_name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusClasses[application.status] || "bg-gray-100 text-gray-600"}`}>
              {t(`status.${application.status}`)}
            </span>
          </div>
          {application.admin_notes && <div className="mt-3 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl">{application.admin_notes}</div>}
        </div>
      )}

      {(!application || application.status === "rejected") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">{application ? t("reapply") : t("applyNow")}</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div><label className="text-sm font-medium text-gray-700">{t("storeName")} *</label><input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} required className={inputCls} /></div>
            <div><label className="text-sm font-medium text-gray-700">{t("storeNameEn")}</label><input value={form.store_name_en} onChange={(e) => setForm({ ...form, store_name_en: e.target.value })} className={inputCls} /></div>
            <div><label className="text-sm font-medium text-gray-700">{t("phone")}</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("city")}</label>
              <select value={form.city_id ?? ""} onChange={(e) => setForm({ ...form, city_id: e.target.value ? Number(e.target.value) : null, area_id: null })} className={inputCls}>
                <option value="">{tCommon("none")}</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("area")}</label>
              <select value={form.area_id ?? ""} onChange={(e) => setForm({ ...form, area_id: e.target.value ? Number(e.target.value) : null })} disabled={!form.city_id || areas.length === 0} className={`${inputCls} disabled:opacity-50`}>
                <option value="">{tCommon("none")}</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium text-gray-700">{t("address")}</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} /></div>
            <div><label className="text-sm font-medium text-gray-700">{t("description")}</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} /></div>
            <button type="submit" disabled={saving} className="self-start px-8 py-3 rounded-xl text-white font-bold disabled:opacity-60" style={{ background: "var(--color-primary)" }}>
              {tCommon("submit")}
            </button>
          </form>
        </div>
      )}

      {snackbar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg z-[9999] text-sm font-medium">
          {snackbar}
        </div>
      )}
    </div>
  );
}
