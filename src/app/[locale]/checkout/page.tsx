"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, Plus, Edit2, Trash2, Star, Truck, ShoppingCart, Bike } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { ordersApi } from "@/lib/api/orders";
import { citiesApi, type Area, type City } from "@/lib/api/cities";
import { cartApi, type CartDeliveryOption } from "@/lib/api/cart";
import { addressesApi, type UserAddress, type UserAddressPayload } from "@/lib/api/addresses";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/common/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-xl bg-gray-200 animate-pulse" />,
});

const paymentMethods = ["cash_on_delivery", "bank_transfer"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

const inputCls = "border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white w-full";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorParam = searchParams.get("vendor");
  const requestedVendorId = vendorParam ? Number(vendorParam) : null;

  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const carts = useCartStore((s) => s.carts);
  const fetchCarts = useCartStore((s) => s.fetchCarts);
  const clearVendorCart = useCartStore((s) => s.clearVendorCart);
  const cartLoading = useCartStore((s) => s.isLoading);

  const cart = useMemo(() => {
    if (carts.length === 0) return null;
    if (requestedVendorId != null) return carts.find((c) => c.vendor_id === requestedVendorId) ?? null;
    return carts[0] ?? null;
  }, [carts, requestedVendorId]);
  const vendorId = cart?.vendor_id ?? null;
  const vendorName = (locale === "en" && cart?.vendor?.store_name_en) || cart?.vendor?.store_name || "";

  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [cityId, setCityId] = useState<number | "">("");
  const [areaId, setAreaId] = useState<number | "">("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressEditing, setAddressEditing] = useState<UserAddress | null>(null);
  const [addressForm, setAddressForm] = useState<UserAddressPayload>({ label: "", full_name: "", phone: "", city_id: 0, area_id: null, address: "", latitude: null, longitude: null, notes: "", is_default: false });
  const [addressDialogAreas, setAddressDialogAreas] = useState<Area[]>([]);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressFormError, setAddressFormError] = useState("");

  const [deliveryOptions, setDeliveryOptions] = useState<CartDeliveryOption[]>([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("");

  useEffect(() => { if (isInitialized && !isAuthenticated) router.push(`/${locale}/auth/login`); }, [isInitialized, isAuthenticated, locale, router]);
  useEffect(() => { if (isAuthenticated) fetchCarts(); }, [isAuthenticated, fetchCarts]);
  useEffect(() => { citiesApi.list().then((res) => setCities(res.data.data)).catch(() => undefined); }, []);
  useEffect(() => { if (!cityId) { setAreas([]); setAreaId(""); return; } citiesApi.areasOf(Number(cityId)).then((res) => setAreas(res.data.data)).catch(() => setAreas([])); }, [cityId]);
  useEffect(() => { if (user?.phone && !phone) setPhone(user.phone); }, [user, phone]);
  useEffect(() => {
    if (!isAuthenticated) return;
    setAddressesLoading(true);
    addressesApi.list().then((res) => {
      const list = res.data.data ?? [];
      setAddresses(list);
      const def = list.find((a) => a.is_default) ?? list[0];
      if (def) setSelectedAddressId(def.id);
    }).catch(() => undefined).finally(() => setAddressesLoading(false));
  }, [isAuthenticated]);
  useEffect(() => {
    if (!selectedAddressId) return;
    const sel = addresses.find((a) => a.id === selectedAddressId);
    if (!sel) return;
    setCityId(sel.city_id); setAreaId(sel.area_id ?? ""); setAddress(sel.address); setPhone(sel.phone);
  }, [selectedAddressId, addresses]);
  useEffect(() => {
    if (!cityId || !vendorId) { setDeliveryOptions([]); setSelectedDeliveryId(""); return; }
    setDeliveryLoading(true);
    cartApi.deliveryOptions(vendorId, { city_id: Number(cityId), area_id: areaId === "" ? null : Number(areaId) })
      .then((res) => { const data = res.data.data; setDeliveryOptions(data.options ?? []); setSelectedDeliveryId((prev) => prev && data.options.some((o) => o.id === prev) ? prev : data.options[0]?.id ?? ""); })
      .catch(() => { setDeliveryOptions([]); setSelectedDeliveryId(""); }).finally(() => setDeliveryLoading(false));
  }, [cityId, areaId, vendorId]);

  const selectedDelivery = useMemo(() => deliveryOptions.find((o) => o.id === selectedDeliveryId) ?? null, [deliveryOptions, selectedDeliveryId]);
  const shippingCost = Number(selectedDelivery?.price ?? 0);
  const subtotal = useMemo(() => cart?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0, [cart]);
  const grandTotal = subtotal + shippingCost;

  const openNewAddress = () => {
    setAddressEditing(null);
    setAddressForm({ label: "", full_name: user?.name ?? "", phone: user?.phone ?? "", city_id: 0, area_id: null, address: "", latitude: null, longitude: null, notes: "", is_default: addresses.length === 0 });
    setAddressDialogAreas([]); setAddressFormError(""); setAddressDialogOpen(true);
  };
  const openEditAddress = (addr: UserAddress) => {
    setAddressEditing(addr);
    setAddressForm({ label: addr.label ?? "", full_name: addr.full_name, phone: addr.phone, city_id: addr.city_id, area_id: addr.area_id ?? null, address: addr.address, latitude: addr.latitude ?? null, longitude: addr.longitude ?? null, notes: addr.notes ?? "", is_default: addr.is_default });
    setAddressFormError(""); setAddressDialogOpen(true);
    if (addr.city_id) citiesApi.areasOf(addr.city_id, { all: true }).then((res) => setAddressDialogAreas(res.data.data)).catch(() => setAddressDialogAreas([]));
  };
  const loadDialogAreas = async (cityIdVal: number): Promise<Area[]> => {
    if (!cityIdVal) { setAddressDialogAreas([]); return []; }
    try { const res = await citiesApi.areasOf(cityIdVal, { all: true }); const list = res.data.data ?? []; setAddressDialogAreas(list); return list; }
    catch { setAddressDialogAreas([]); return []; }
  };

  const matchPlace = <T extends { id: number; name: string; name_en?: string | null }>(list: T[], candidates: (string | undefined)[]): T | undefined => {
    const norm = (s: string) => s.toLowerCase().replace(/[\u064B-\u0652\u0670]/g, "").replace(/\s+/g, " ").trim();
    const tokens = candidates.filter(Boolean).map((c) => norm(c as string));
    if (tokens.length === 0) return undefined;
    return list.find((item) => { const haystacks = [norm(item.name), item.name_en ? norm(item.name_en) : ""]; return tokens.some((tok) => haystacks.some((h) => h && (h === tok || h.includes(tok) || tok.includes(h)))); });
  };
  const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371; const dLat = toRad(lat2 - lat1); const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  const nearestCity = (lat: number, lng: number): City | undefined => { let best: { city: City; d: number } | null = null; for (const c of cities) { if (c.latitude == null || c.longitude == null) continue; const d = distanceKm(lat, lng, c.latitude, c.longitude); if (!best || d < best.d) best = { city: c, d }; } return best?.city; };
  const nearestArea = (list: Area[], lat: number, lng: number): Area | undefined => { let best: { area: Area; d: number } | null = null; for (const a of list) { if (a.latitude == null || a.longitude == null) continue; const d = distanceKm(lat, lng, a.latitude, a.longitude); if (!best || d < best.d) best = { area: a, d }; } return best?.area; };
  const reverseGeocode = async (lat: number, lng: number) => {
    let nominatimCityName: string[] = []; let nominatimAreaName: string[] = []; let display = "";
    try {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("format", "jsonv2"); url.searchParams.set("lat", String(lat)); url.searchParams.set("lon", String(lng)); url.searchParams.set("zoom", "16"); url.searchParams.set("addressdetails", "1"); url.searchParams.set("accept-language", locale === "en" ? "en" : "ar");
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (res.ok) { const data: { display_name?: string; address?: Record<string, string> } = await res.json(); const a = data.address ?? {}; nominatimCityName = [a.city, a.town, a.municipality, a.county, a.state_district, a.state].filter(Boolean) as string[]; nominatimAreaName = [a.suburb, a.neighbourhood, a.quarter, a.city_district, a.village, a.hamlet].filter(Boolean) as string[]; display = data.display_name ?? ""; }
    } catch {}
    const cityByName = matchPlace(cities, nominatimCityName); const cityByDist = nearestCity(lat, lng); const matchedCity = cityByName ?? cityByDist;
    if (display) setAddressForm((f) => ({ ...f, address: display }));
    if (!matchedCity) return;
    const areaList = await loadDialogAreas(matchedCity.id); const areaByName = matchPlace(areaList, nominatimAreaName); const areaByDist = nearestArea(areaList, lat, lng); const matchedArea = areaByName ?? areaByDist;
    setAddressForm((f) => ({ ...f, city_id: matchedCity.id, area_id: matchedArea?.id ?? null }));
  };
  const onLocationPicked = (lat: number, lng: number) => { setAddressForm((f) => ({ ...f, latitude: lat, longitude: lng })); reverseGeocode(lat, lng); };
  const onDialogAreaChange = (areaId: number | null) => { if (!areaId) { setAddressForm((f) => ({ ...f, area_id: null })); return; } const area = addressDialogAreas.find(a => a.id === areaId); if (!area) return; const lat = area.latitude; const lng = area.longitude; setAddressForm((f) => ({ ...f, area_id: area.id, ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : null) })); };
  const onDialogCityPicked = async (cityIdVal: number | null) => {
    if (!cityIdVal) { setAddressForm((f) => ({ ...f, city_id: 0, area_id: null })); setAddressDialogAreas([]); return; }
    const city = cities.find(c => c.id === cityIdVal);
    setAddressForm((f) => { const shouldRecenter = city?.latitude != null && city?.longitude != null && (f.latitude == null || f.longitude == null || distanceKm(f.latitude, f.longitude, city.latitude!, city.longitude!) > 50); return { ...f, city_id: cityIdVal, area_id: null, ...(shouldRecenter ? { latitude: city!.latitude!, longitude: city!.longitude! } : null) }; });
    await loadDialogAreas(cityIdVal);
  };

  const saveAddress = async () => {
    if (!addressForm.full_name || !addressForm.phone || !addressForm.city_id) { setAddressFormError(t("fillRequired")); return; }
    if (!addressForm.latitude || !addressForm.longitude) { setAddressFormError(t("gpsRequired")); return; }
    setAddressSaving(true); setAddressFormError("");
    try {
      const cityName = cities.find((c) => c.id === addressForm.city_id)?.name ?? ""; const areaName = addressDialogAreas.find((a) => a.id === addressForm.area_id)?.name ?? "";
      const fallbackAddress = addressForm.address?.trim() || [cityName, areaName].filter(Boolean).join(", ") || `${addressForm.latitude}, ${addressForm.longitude}`;
      const payload: UserAddressPayload = { ...addressForm, address: fallbackAddress, label: addressForm.label || null, notes: addressForm.notes || null };
      const res = addressEditing ? await addressesApi.update(addressEditing.id, payload) : await addressesApi.create(payload);
      const saved = res.data.data;
      setAddresses((prev) => { const filtered = prev.filter((a) => a.id !== saved.id); const next = [saved, ...filtered]; if (saved.is_default) return next.map((a) => a.id === saved.id ? a : { ...a, is_default: false }); return next; });
      setSelectedAddressId(saved.id); setAddressDialogOpen(false);
    } catch { setAddressFormError(tCommon("error")); } finally { setAddressSaving(false); }
  };

  const deleteAddress = async (id: number) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteAddress"))) return;
    try { await addressesApi.remove(id); setAddresses((prev) => prev.filter((a) => a.id !== id)); if (selectedAddressId === id) { const next = addresses.find((a) => a.id !== id); setSelectedAddressId(next?.id ?? null); } }
    catch { setError(tCommon("error")); }
  };

  const setAddressDefault = async (id: number) => {
    try { await addressesApi.setDefault(id); setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id }))); }
    catch { setError(tCommon("error")); }
  };

  if (!isInitialized || cartLoading) return <LoadingSpinner />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold mb-4">{tCart("empty")}</h2>
        <Link href={`/${locale}/products`} className="inline-flex items-center px-8 py-3 rounded-full text-white font-bold no-underline" style={{ background: "var(--color-primary)" }}>
          {tCart("continueShopping")}
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!selectedAddressId) { setError(t("selectAddress")); return; }
    if (!cityId || !address || !phone) { setError(t("fillRequired")); return; }
    if (deliveryOptions.length > 0 && !selectedDelivery) { setError(t("selectDelivery")); return; }
    const city = cities.find((c) => c.id === cityId); const area = areas.find((a) => a.id === areaId);
    const shippingCity = area ? `${city?.name}, ${area.name}` : city?.name ?? "";
    if (!vendorId) { setError(tCommon("error")); return; }
    setSubmitting(true);
    try {
      const res = await ordersApi.create({ vendor_id: vendorId, shipping_address: address, shipping_city: shippingCity, shipping_city_id: Number(cityId), shipping_area_id: areaId === "" ? null : Number(areaId), shipping_phone: phone, payment_method: paymentMethod, notes: notes || undefined, delivery_type: selectedDelivery ? selectedDelivery.type : null, delivery_company_id: selectedDelivery?.delivery_company_id ?? null });
      const order = res.data.data;
      await clearVendorCart(vendorId);
      router.push(`/${locale}/orders/${order.id}`);
    } catch { setError(tCommon("error")); setSubmitting(false); }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-1">{t("title")}</h1>
        <p className="text-gray-500">{vendorName ? t("subtitleVendor", { vendor: vendorName }) : t("subtitle")}</p>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Address book */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Home size={18} style={{ color: "var(--color-primary)" }} />
                <h2 className="text-lg font-bold">{t("shippingInfo")}</h2>
              </div>
              <button type="button" onClick={openNewAddress} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                <Plus size={14} />{t("addAddress")}
              </button>
            </div>

            {addressesLoading ? (
              <div className="flex flex-col gap-3">
                <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                <Home size={44} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 mb-4">{t("noAddresses")}</p>
                <button type="button" onClick={openNewAddress} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold mx-auto" style={{ background: "var(--color-primary)" }}>
                  <Plus size={14} />{t("addFirstAddress")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {addresses.map((addr) => {
                  const selected = selectedAddressId === addr.id;
                  const cityName = locale === "en" && addr.city?.name_en ? addr.city?.name_en : addr.city?.name ?? "";
                  const areaName = addr.area ? (locale === "en" && addr.area.name_en ? addr.area.name_en : addr.area.name) : null;
                  return (
                    <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)} className="flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all" style={{ borderColor: selected ? "var(--color-primary)" : "#E5E7EB", background: selected ? "color-mix(in srgb, var(--color-primary) 5%, transparent)" : "white" }}>
                      <input type="radio" checked={selected} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-[var(--color-primary)]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold">{addr.label || addr.full_name}</span>
                          {addr.is_default && <span className="text-xs px-2 py-0.5 rounded-full text-white font-bold" style={{ background: "var(--color-primary)" }}>{t("defaultAddress")}</span>}
                          {addr.latitude && addr.longitude && <span className="text-xs px-2 py-0.5 rounded-full border border-green-400 text-green-600 font-bold">{t("gpsAttached")}</span>}
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">{addr.full_name} · {addr.phone}</p>
                        <p className="text-sm text-gray-400">{cityName}{areaName ? `, ${areaName}` : ""} — {addr.address}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" title={addr.is_default ? t("defaultAddress") : t("makeDefault")} onClick={(e) => { e.stopPropagation(); if (!addr.is_default) setAddressDefault(addr.id); }} disabled={addr.is_default} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors" style={{ color: addr.is_default ? "var(--color-primary)" : "#9CA3AF" }}>
                          <Star size={15} fill={addr.is_default ? "currentColor" : "none"} />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); openEditAddress(addr); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><Edit2 size={15} /></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-4 mt-5">
              <div>
                <label className="text-sm font-medium text-gray-700">{t("paymentMethod")}</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} required className={`${inputCls} mt-1`}>
                  {paymentMethods.map((m) => <option key={m} value={m}>{t(`payment.${m}`)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t("notes")}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} mt-1 resize-none`} />
              </div>
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}
            </div>
          </div>

          {/* Delivery method */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck size={18} style={{ color: "var(--color-primary)" }} />
              <h2 className="text-lg font-bold">{t("deliveryMethod")}</h2>
            </div>
            {!cityId ? (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl">{t("selectCityFirst")}</div>
            ) : deliveryLoading ? (
              <div className="flex flex-col gap-3"><div className="h-18 bg-gray-200 rounded-xl animate-pulse" /><div className="h-18 bg-gray-200 rounded-xl animate-pulse" /></div>
            ) : deliveryOptions.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl">{t("noDeliveryOptions")}</div>
            ) : (
              <div className="flex flex-col gap-3">
                {deliveryOptions.map((opt) => {
                  const selected = opt.id === selectedDeliveryId;
                  const label = locale === "en" && opt.name_en ? opt.name_en : opt.name;
                  return (
                    <div key={opt.id} onClick={() => setSelectedDeliveryId(opt.id)} className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all" style={{ borderColor: selected ? "var(--color-primary)" : "#E5E7EB", background: selected ? "color-mix(in srgb, var(--color-primary) 5%, transparent)" : "white" }}>
                      <input type="radio" checked={selected} onChange={() => setSelectedDeliveryId(opt.id)} className="accent-[var(--color-primary)]" />
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0" style={{ background: opt.type === "self" ? "var(--color-primary)" : "#E5E7EB" }}>
                        {opt.logo ? <img src={opt.logo} alt="" className="w-full h-full object-cover" /> : opt.type === "self" ? <Bike size={22} className="text-white" /> : <Truck size={22} className="text-gray-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold truncate">{label || t("deliveryMethod")}</span>
                          {opt.type === "self" && <span className="text-xs px-2 py-0.5 rounded-full text-white font-bold" style={{ background: "var(--color-primary)" }}>{t("storeDelivery")}</span>}
                        </div>
                        {opt.phone && <p className="text-xs text-gray-400">{opt.phone}</p>}
                      </div>
                      <span className="font-extrabold shrink-0" style={{ color: "var(--color-primary)" }}>{Number(opt.price).toFixed(2)} {tCommon("currency")}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — order summary */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:sticky md:top-[90px]">
            <h2 className="text-lg font-bold mb-4">{t("orderSummary")}</h2>
            <div className="flex flex-col gap-3 mb-4">
              {cart.items.map((item) => {
                const productName = item.product && locale === "en" && item.product.name_en ? item.product.name_en : item.product?.name ?? `#${item.product_id}`;
                return (
                  <div key={item.id} className="flex justify-between gap-4">
                    <span className="text-sm text-gray-600 truncate">{productName} × {item.quantity}</span>
                    <span className="text-sm font-semibold shrink-0">{(item.price * item.quantity).toFixed(2)} {tCommon("currency")}</span>
                  </div>
                );
              })}
            </div>
            <hr className="border-gray-100 my-3" />
            <div className="flex justify-between mb-2"><span className="text-gray-500">{tCart("subtotal")}</span><span className="font-semibold">{subtotal.toFixed(2)} {tCommon("currency")}</span></div>
            <div className="flex justify-between mb-3"><span className="text-gray-500">{tCart("shipping")}</span><span className={`font-semibold ${shippingCost === 0 ? "text-green-600" : ""}`}>{shippingCost.toFixed(2)} {tCommon("currency")}</span></div>
            <hr className="border-gray-100 my-3" />
            <div className="flex justify-between mb-6">
              <span className="text-lg font-extrabold">{tCart("total")}</span>
              <span className="text-lg font-extrabold" style={{ color: "var(--color-primary)" }}>{grandTotal.toFixed(2)} {tCommon("currency")}</span>
            </div>
            <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-base disabled:opacity-60 transition-opacity" style={{ background: "var(--color-primary)" }}>
              <ShoppingCart size={18} />{t("placeOrder")}
            </button>
          </div>
        </div>
      </form>

      {/* Address dialog */}
      {addressDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !addressSaving && setAddressDialogOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold">{addressEditing ? t("editAddress") : t("addAddress")}</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div><label className="text-sm font-medium text-gray-700">{t("addressLabel")}</label><input placeholder={t("addressLabelPlaceholder")} value={addressForm.label ?? ""} onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))} className={`${inputCls} mt-1`} /></div>
              <div><label className="text-sm font-medium text-gray-700">{t("fullName")} *</label><input required value={addressForm.full_name} onChange={(e) => setAddressForm((f) => ({ ...f, full_name: e.target.value }))} className={`${inputCls} mt-1`} /></div>
              <div><label className="text-sm font-medium text-gray-700">{t("phone")} *</label><input required value={addressForm.phone} onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))} className={`${inputCls} mt-1`} /></div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t("city")} *</label>
                <select required value={addressForm.city_id || ""} onChange={(e) => onDialogCityPicked(e.target.value ? Number(e.target.value) : null)} className={`${inputCls} mt-1`}>
                  <option value="">{t("searchCity")}</option>
                  {cities.map((c) => <option key={c.id} value={c.id}>{locale === "en" && c.name_en ? c.name_en : c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t("area")}</label>
                <select value={addressForm.area_id || ""} onChange={(e) => onDialogAreaChange(e.target.value ? Number(e.target.value) : null)} disabled={!addressForm.city_id || addressDialogAreas.length === 0} className={`${inputCls} mt-1 disabled:opacity-50`}>
                  <option value="">{t("searchArea")}</option>
                  {addressDialogAreas.map((a) => <option key={a.id} value={a.id}>{locale === "en" && a.name_en ? a.name_en : a.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-sm font-bold mb-1">{t("gpsLocation")} <span className="text-red-500">*</span></p>
                <LocationPicker value={addressForm.latitude && addressForm.longitude ? { lat: addressForm.latitude, lng: addressForm.longitude } : null} onChange={({ lat, lng }) => onLocationPicked(lat, lng)} hintText={t("gpsHint")} myLocationLabel={t("useMyLocation")} />
                {addressForm.latitude && addressForm.longitude && (
                  <button type="button" onClick={() => setAddressForm((f) => ({ ...f, latitude: null, longitude: null }))} className="mt-1.5 text-sm text-red-500 font-medium">{t("clearLocation")}</button>
                )}
              </div>
              <div><label className="text-sm font-medium text-gray-700">{t("notes")}</label><textarea value={addressForm.notes ?? ""} onChange={(e) => setAddressForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} mt-1 resize-none`} /></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!addressForm.is_default} onChange={(e) => setAddressForm((f) => ({ ...f, is_default: e.target.checked }))} className="w-4 h-4 rounded accent-[var(--color-primary)]" />
                <span className="text-sm font-medium text-gray-700">{t("makeDefault")}</span>
              </label>
              {addressFormError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{addressFormError}</div>}
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button type="button" onClick={() => setAddressDialogOpen(false)} disabled={addressSaving} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">{tCommon("cancel")}</button>
              <button type="button" onClick={saveAddress} disabled={addressSaving} className="px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: "var(--color-primary)" }}>
                {addressSaving ? tCommon("loading") : tCommon("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
