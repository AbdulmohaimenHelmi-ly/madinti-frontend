"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import HomeIcon from "@mui/icons-material/Home";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { ordersApi } from "@/lib/api/orders";
import { citiesApi, type Area, type City } from "@/lib/api/cities";
import {
  cartApi,
  type CartDeliveryOption,
} from "@/lib/api/cart";
import {
  addressesApi,
  type UserAddress,
  type UserAddressPayload,
} from "@/lib/api/addresses";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(
  () => import("@/components/common/LocationPicker"),
  { ssr: false, loading: () => <Skeleton variant="rounded" height={280} /> }
);

const paymentMethods = ["cash_on_delivery", "bank_transfer"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  // The vendor whose cart is being checked out. The cart page links here
  // with `?vendor=ID`; if missing we'll fall back to the first cart below.
  const vendorParam = searchParams.get("vendor");
  const requestedVendorId = vendorParam ? Number(vendorParam) : null;

  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const carts = useCartStore((s) => s.carts);
  const fetchCarts = useCartStore((s) => s.fetchCarts);
  const clearVendorCart = useCartStore((s) => s.clearVendorCart);
  const cartLoading = useCartStore((s) => s.isLoading);

  // Pick the vendor cart to check out. Prefer the requested one; otherwise
  // fall back to the most recently updated cart so the page is still useful
  // when a user lands here directly.
  const cart = useMemo(() => {
    if (carts.length === 0) return null;
    if (requestedVendorId != null) {
      return carts.find((c) => c.vendor_id === requestedVendorId) ?? null;
    }
    return carts[0] ?? null;
  }, [carts, requestedVendorId]);
  const vendorId = cart?.vendor_id ?? null;
  const vendorName =
    (locale === "en" && cart?.vendor?.store_name_en) ||
    cart?.vendor?.store_name ||
    "";

  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [cityId, setCityId] = useState<number | "">("");
  const [areaId, setAreaId] = useState<number | "">("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Address book state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressEditing, setAddressEditing] = useState<UserAddress | null>(null);
  const [addressForm, setAddressForm] = useState<UserAddressPayload>({
    label: "",
    full_name: "",
    phone: "",
    city_id: 0,
    area_id: null,
    address: "",
    latitude: null,
    longitude: null,
    notes: "",
    is_default: false,
  });
  const [addressDialogAreas, setAddressDialogAreas] = useState<Area[]>([]);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressFormError, setAddressFormError] = useState("");

  // Delivery options
  const [deliveryOptions, setDeliveryOptions] = useState<CartDeliveryOption[]>([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("");

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isInitialized, isAuthenticated, locale, router]);

  useEffect(() => {
    if (isAuthenticated) fetchCarts();
  }, [isAuthenticated, fetchCarts]);

  useEffect(() => {
    citiesApi.list().then((res) => setCities(res.data.data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      setAreaId("");
      return;
    }
    citiesApi
      .areasOf(Number(cityId))
      .then((res) => setAreas(res.data.data))
      .catch(() => setAreas([]));
  }, [cityId]);

  useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user, phone]);

  // Load saved addresses
  useEffect(() => {
    if (!isAuthenticated) return;
    setAddressesLoading(true);
    addressesApi
      .list()
      .then((res) => {
        const list = res.data.data ?? [];
        setAddresses(list);
        const def = list.find((a) => a.is_default) ?? list[0];
        if (def) setSelectedAddressId(def.id);
      })
      .catch(() => undefined)
      .finally(() => setAddressesLoading(false));
  }, [isAuthenticated]);

  // When selected address changes, sync the shipping fields
  useEffect(() => {
    if (!selectedAddressId) return;
    const sel = addresses.find((a) => a.id === selectedAddressId);
    if (!sel) return;
    setCityId(sel.city_id);
    setAreaId(sel.area_id ?? "");
    setAddress(sel.address);
    setPhone(sel.phone);
  }, [selectedAddressId, addresses]);

  // Load delivery options whenever city/area or vendor changes
  useEffect(() => {
    if (!cityId || !vendorId) {
      setDeliveryOptions([]);
      setSelectedDeliveryId("");
      return;
    }
    setDeliveryLoading(true);
    cartApi
      .deliveryOptions(vendorId, {
        city_id: Number(cityId),
        area_id: areaId === "" ? null : Number(areaId),
      })
      .then((res) => {
        const data = res.data.data;
        setDeliveryOptions(data.options ?? []);
        setSelectedDeliveryId((prev) => {
          if (prev && data.options.some((o) => o.id === prev)) return prev;
          return data.options[0]?.id ?? "";
        });
      })
      .catch(() => {
        setDeliveryOptions([]);
        setSelectedDeliveryId("");
      })
      .finally(() => setDeliveryLoading(false));
  }, [cityId, areaId, vendorId]);

  const selectedDelivery = useMemo(
    () => deliveryOptions.find((o) => o.id === selectedDeliveryId) ?? null,
    [deliveryOptions, selectedDeliveryId]
  );
  const shippingCost = Number(selectedDelivery?.price ?? 0);

  const subtotal = useMemo(
    () =>
      cart?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0,
    [cart]
  );
  const grandTotal = subtotal + shippingCost;

  // ---- Address dialog handlers ----
  const openNewAddress = () => {
    setAddressEditing(null);
    setAddressForm({
      label: "",
      full_name: user?.name ?? "",
      phone: user?.phone ?? "",
      city_id: 0,
      area_id: null,
      address: "",
      latitude: null,
      longitude: null,
      notes: "",
      is_default: addresses.length === 0,
    });
    setAddressDialogAreas([]);
    setAddressFormError("");
    setAddressDialogOpen(true);
  };

  const openEditAddress = (addr: UserAddress) => {
    setAddressEditing(addr);
    setAddressForm({
      label: addr.label ?? "",
      full_name: addr.full_name,
      phone: addr.phone,
      city_id: addr.city_id,
      area_id: addr.area_id ?? null,
      address: addr.address,
      latitude: addr.latitude ?? null,
      longitude: addr.longitude ?? null,
      notes: addr.notes ?? "",
      is_default: addr.is_default,
    });
    setAddressFormError("");
    setAddressDialogOpen(true);
    if (addr.city_id) {
      citiesApi
        .areasOf(addr.city_id, { all: true })
        .then((res) => setAddressDialogAreas(res.data.data))
        .catch(() => setAddressDialogAreas([]));
    }
  };

  const loadDialogAreas = async (cityIdVal: number): Promise<Area[]> => {
    if (!cityIdVal) {
      setAddressDialogAreas([]);
      return [];
    }
    try {
      const res = await citiesApi.areasOf(cityIdVal, { all: true });
      const list = res.data.data ?? [];
      setAddressDialogAreas(list);
      return list;
    } catch {
      setAddressDialogAreas([]);
      return [];
    }
  };

  // Fuzzy-match a Nominatim place name against the cities/areas list.
  const matchPlace = <T extends { id: number; name: string; name_en?: string | null }>(
    list: T[],
    candidates: (string | undefined)[]
  ): T | undefined => {
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/[\u064B-\u0652\u0670]/g, "") // strip arabic diacritics
        .replace(/\s+/g, " ")
        .trim();
    const tokens = candidates.filter(Boolean).map((c) => norm(c as string));
    if (tokens.length === 0) return undefined;
    return list.find((item) => {
      const haystacks = [norm(item.name), item.name_en ? norm(item.name_en) : ""];
      return tokens.some((tok) =>
        haystacks.some(
          (h) => h && (h === tok || h.includes(tok) || tok.includes(h))
        )
      );
    });
  };

  // Haversine distance in km between two lat/lng pairs.
  const distanceKm = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  // Pick the city whose stored centroid is closest to the pin.
  const nearestCity = (lat: number, lng: number): City | undefined => {
    let best: { city: City; d: number } | null = null;
    for (const c of cities) {
      if (c.latitude == null || c.longitude == null) continue;
      const d = distanceKm(lat, lng, c.latitude, c.longitude);
      if (!best || d < best.d) best = { city: c, d };
    }
    return best?.city;
  };

  // Pick the area in `list` whose stored centroid is closest to the pin.
  const nearestArea = (
    list: Area[],
    lat: number,
    lng: number
  ): Area | undefined => {
    let best: { area: Area; d: number } | null = null;
    for (const a of list) {
      if (a.latitude == null || a.longitude == null) continue;
      const d = distanceKm(lat, lng, a.latitude, a.longitude);
      if (!best || d < best.d) best = { area: a, d };
    }
    return best?.area;
  };

  // When the pin moves: try Nominatim for a nice address string + fuzzy
  // city/area names, then ALWAYS reconcile city/area against our own
  // stored centroids so the dropdowns stay aligned with the pin even when
  // Nominatim's labels don't perfectly match our seed names.
  const reverseGeocode = async (lat: number, lng: number) => {
    let nominatimCityName: string[] = [];
    let nominatimAreaName: string[] = [];
    let display = "";
    try {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lng));
      url.searchParams.set("zoom", "16");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("accept-language", locale === "en" ? "en" : "ar");
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data: {
          display_name?: string;
          address?: Record<string, string>;
        } = await res.json();
        const a = data.address ?? {};
        nominatimCityName = [
          a.city,
          a.town,
          a.municipality,
          a.county,
          a.state_district,
          a.state,
        ].filter(Boolean) as string[];
        nominatimAreaName = [
          a.suburb,
          a.neighbourhood,
          a.quarter,
          a.city_district,
          a.village,
          a.hamlet,
        ].filter(Boolean) as string[];
        display = data.display_name ?? "";
      }
    } catch {
      // ignore, fall back to nearest-by-distance below
    }

    // 1. Prefer Nominatim's name; otherwise pick nearest city by distance.
    const cityByName = matchPlace(cities, nominatimCityName);
    const cityByDist = nearestCity(lat, lng);
    const matchedCity = cityByName ?? cityByDist;
    if (display) {
      setAddressForm((f) => ({ ...f, address: display }));
    }
    if (!matchedCity) return;

    // 2. Load that city's areas, then prefer Nominatim name, else nearest area.
    const areaList = await loadDialogAreas(matchedCity.id);
    const areaByName = matchPlace(areaList, nominatimAreaName);
    const areaByDist = nearestArea(areaList, lat, lng);
    const matchedArea = areaByName ?? areaByDist;
    setAddressForm((f) => ({
      ...f,
      city_id: matchedCity.id,
      area_id: matchedArea?.id ?? null,
    }));
  };

  const onLocationPicked = (lat: number, lng: number) => {
    setAddressForm((f) => ({ ...f, latitude: lat, longitude: lng }));
    reverseGeocode(lat, lng);
  };

  // When user picks an area from the dropdown: move the pin to that area's
  // centroid (or the city's centroid as fallback) so map stays in sync.
  const onDialogAreaChange = (area: Area | null) => {
    if (!area) {
      setAddressForm((f) => ({ ...f, area_id: null }));
      return;
    }
    const lat = area.latitude;
    const lng = area.longitude;
    setAddressForm((f) => ({
      ...f,
      area_id: area.id,
      ...(lat != null && lng != null
        ? { latitude: lat, longitude: lng }
        : null),
    }));
  };

  // When user picks a city from the dropdown: load its areas and recenter
  // the pin to the city centroid if no pin yet (or if the existing pin is
  // far away from the new city).
  const onDialogCityPicked = async (city: City | null) => {
    if (!city) {
      setAddressForm((f) => ({ ...f, city_id: 0, area_id: null }));
      setAddressDialogAreas([]);
      return;
    }
    setAddressForm((f) => {
      const shouldRecenter =
        city.latitude != null &&
        city.longitude != null &&
        (f.latitude == null ||
          f.longitude == null ||
          distanceKm(f.latitude, f.longitude, city.latitude!, city.longitude!) >
            50);
      return {
        ...f,
        city_id: city.id,
        area_id: null,
        ...(shouldRecenter
          ? { latitude: city.latitude!, longitude: city.longitude! }
          : null),
      };
    });
    await loadDialogAreas(city.id);
  };

  const saveAddress = async () => {
    if (
      !addressForm.full_name ||
      !addressForm.phone ||
      !addressForm.city_id
    ) {
      setAddressFormError(t("fillRequired"));
      return;
    }
    if (!addressForm.latitude || !addressForm.longitude) {
      setAddressFormError(t("gpsRequired"));
      return;
    }
    setAddressSaving(true);
    setAddressFormError("");
    try {
      const cityName =
        cities.find((c) => c.id === addressForm.city_id)?.name ?? "";
      const areaName =
        addressDialogAreas.find((a) => a.id === addressForm.area_id)?.name ??
        "";
      const fallbackAddress =
        addressForm.address?.trim() ||
        [cityName, areaName].filter(Boolean).join(", ") ||
        `${addressForm.latitude}, ${addressForm.longitude}`;
      const payload: UserAddressPayload = {
        ...addressForm,
        address: fallbackAddress,
        label: addressForm.label || null,
        notes: addressForm.notes || null,
      };
      const res = addressEditing
        ? await addressesApi.update(addressEditing.id, payload)
        : await addressesApi.create(payload);
      const saved = res.data.data;
      setAddresses((prev) => {
        const filtered = prev.filter((a) => a.id !== saved.id);
        const next = [saved, ...filtered];
        if (saved.is_default) {
          return next.map((a) =>
            a.id === saved.id ? a : { ...a, is_default: false }
          );
        }
        return next;
      });
      setSelectedAddressId(saved.id);
      setAddressDialogOpen(false);
    } catch {
      setAddressFormError(tCommon("error"));
    } finally {
      setAddressSaving(false);
    }
  };

  const deleteAddress = async (id: number) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteAddress"))) {
      return;
    }
    try {
      await addressesApi.remove(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddressId === id) {
        const next = addresses.find((a) => a.id !== id);
        setSelectedAddressId(next?.id ?? null);
      }
    } catch {
      setError(tCommon("error"));
    }
  };

  const setAddressDefault = async (id: number) => {
    try {
      await addressesApi.setDefault(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
    } catch {
      setError(tCommon("error"));
    }
  };

  if (!isInitialized || cartLoading) return <LoadingSpinner />;

  if (!cart || cart.items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          {tCart("empty")}
        </Typography>
        <Button
          component={Link}
          href={`/${locale}/products`}
          variant="contained"
          sx={{ borderRadius: 100, px: 4 }}
        >
          {tCart("continueShopping")}
        </Button>
      </Container>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedAddressId) {
      setError(t("selectAddress"));
      return;
    }
    if (!cityId || !address || !phone) {
      setError(t("fillRequired"));
      return;
    }
    if (deliveryOptions.length > 0 && !selectedDelivery) {
      setError(t("selectDelivery"));
      return;
    }
    const city = cities.find((c) => c.id === cityId);
    const area = areas.find((a) => a.id === areaId);
    const shippingCity = area ? `${city?.name}, ${area.name}` : city?.name ?? "";

    if (!vendorId) {
      setError(tCommon("error"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await ordersApi.create({
        vendor_id: vendorId,
        shipping_address: address,
        shipping_city: shippingCity,
        shipping_city_id: Number(cityId),
        shipping_area_id: areaId === "" ? null : Number(areaId),
        shipping_phone: phone,
        payment_method: paymentMethod,
        notes: notes || undefined,
        delivery_type: selectedDelivery ? selectedDelivery.type : null,
        delivery_company_id: selectedDelivery?.delivery_company_id ?? null,
      });
      const order = res.data.data;
      await clearVendorCart(vendorId);
      router.push(`/${locale}/orders/${order.id}`);
    } catch {
      setError(tCommon("error"));
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
          {t("title")}
        </Typography>
        <Typography color="text.secondary">
          {vendorName
            ? t("subtitleVendor", { vendor: vendorName })
            : t("subtitle")}
        </Typography>
      </Box>

      <Grid container spacing={4} component="form" onSubmit={submit}>
        <Grid size={{ xs: 12, md: 7 }}>
          {/* ---------- Address book picker ---------- */}
          <Card>
            <CardContent>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <HomeIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("shippingInfo")}
                  </Typography>
                </Stack>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={openNewAddress}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  {t("addAddress")}
                </Button>
              </Stack>

              {addressesLoading ? (
                <Stack spacing={1.5}>
                  <Skeleton variant="rounded" height={96} />
                  <Skeleton variant="rounded" height={96} />
                </Stack>
              ) : addresses.length === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    px: 2,
                    textAlign: "center",
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 3,
                  }}
                >
                  <HomeIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {t("noAddresses")}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openNewAddress}
                    sx={{ borderRadius: 2 }}
                  >
                    {t("addFirstAddress")}
                  </Button>
                </Box>
              ) : (
                <RadioGroup
                  value={selectedAddressId ? String(selectedAddressId) : ""}
                  onChange={(e) =>
                    setSelectedAddressId(Number(e.target.value))
                  }
                >
                  <Stack spacing={1.5}>
                    {addresses.map((addr) => {
                      const selected = selectedAddressId === addr.id;
                      const cityName =
                        locale === "en" && addr.city?.name_en
                          ? addr.city?.name_en
                          : addr.city?.name ?? "";
                      const areaName = addr.area
                        ? locale === "en" && addr.area.name_en
                          ? addr.area.name_en
                          : addr.area.name
                        : null;
                      return (
                        <Paper
                          key={addr.id}
                          elevation={0}
                          onClick={() => setSelectedAddressId(addr.id)}
                          sx={(theme) => ({
                            p: 2,
                            borderRadius: 3,
                            cursor: "pointer",
                            border: "2px solid",
                            borderColor: selected
                              ? theme.palette.primary.main
                              : theme.palette.divider,
                            bgcolor: selected
                              ? `${theme.palette.primary.main}0A`
                              : "background.paper",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              borderColor: theme.palette.primary.main,
                            },
                          })}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "flex-start" }}
                          >
                            <Radio
                              value={String(addr.id)}
                              checked={selected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              sx={{ p: 0.5, mt: 0.5 }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: "center", flexWrap: "wrap" }}
                                useFlexGap
                              >
                                <Typography sx={{ fontWeight: 700 }}>
                                  {addr.label || addr.full_name}
                                </Typography>
                                {addr.is_default && (
                                  <Chip
                                    size="small"
                                    color="primary"
                                    label={t("defaultAddress")}
                                    sx={{ fontWeight: 700 }}
                                  />
                                )}
                                {addr.latitude && addr.longitude && (
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    label={t("gpsAttached")}
                                    sx={{ fontWeight: 700 }}
                                  />
                                )}
                              </Stack>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {addr.full_name} · {addr.phone}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {cityName}
                                {areaName ? `, ${areaName}` : ""} — {addr.address}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip
                                title={
                                  addr.is_default
                                    ? t("defaultAddress")
                                    : t("makeDefault")
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    color={addr.is_default ? "primary" : "default"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!addr.is_default) setAddressDefault(addr.id);
                                    }}
                                    disabled={addr.is_default}
                                  >
                                    {addr.is_default ? (
                                      <StarIcon fontSize="small" />
                                    ) : (
                                      <StarBorderIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={tCommon("edit")}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditAddress(addr);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={tCommon("delete")}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteAddress(addr.id);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </RadioGroup>
              )}

              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <TextField
                  select
                  label={t("paymentMethod")}
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                  required
                  fullWidth
                >
                  {paymentMethods.map((m) => (
                    <MenuItem key={m} value={m}>
                      {t(`payment.${m}`)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={t("notes")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                />
                {error && <Alert severity="error">{error}</Alert>}
              </Stack>
            </CardContent>
          </Card>

          {/* Delivery method selection */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center", mb: 2 }}
              >
                <LocalShippingIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("deliveryMethod")}
                </Typography>
              </Stack>

              {!cityId ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  {t("selectCityFirst")}
                </Alert>
              ) : deliveryLoading ? (
                <Stack spacing={1.5}>
                  <Skeleton variant="rounded" height={72} />
                  <Skeleton variant="rounded" height={72} />
                </Stack>
              ) : deliveryOptions.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  {t("noDeliveryOptions")}
                </Alert>
              ) : (
                <RadioGroup
                  value={selectedDeliveryId}
                  onChange={(e) => setSelectedDeliveryId(e.target.value)}
                >
                  <Stack spacing={1.5}>
                    {deliveryOptions.map((opt) => {
                      const selected = opt.id === selectedDeliveryId;
                      const label =
                        locale === "en" && opt.name_en ? opt.name_en : opt.name;
                      return (
                        <Paper
                          key={opt.id}
                          elevation={0}
                          onClick={() => setSelectedDeliveryId(opt.id)}
                          sx={(theme) => ({
                            p: 2,
                            borderRadius: 3,
                            cursor: "pointer",
                            border: "2px solid",
                            borderColor: selected
                              ? theme.palette.primary.main
                              : theme.palette.divider,
                            bgcolor: selected
                              ? `${theme.palette.primary.main}0A`
                              : "background.paper",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              borderColor: theme.palette.primary.main,
                            },
                          })}
                        >
                          <FormControlLabel
                            value={opt.id}
                            control={<Radio />}
                            sx={{ m: 0, width: "100%", alignItems: "center" }}
                            label={
                              <Stack
                                direction="row"
                                spacing={2}
                                sx={{
                                  alignItems: "center",
                                  width: "100%",
                                  ml: 1,
                                }}
                              >
                                <Avatar
                                  src={opt.logo ?? undefined}
                                  variant="rounded"
                                  sx={{
                                    bgcolor:
                                      opt.type === "self"
                                        ? "primary.main"
                                        : "grey.200",
                                    color:
                                      opt.type === "self"
                                        ? "white"
                                        : "text.primary",
                                    width: 48,
                                    height: 48,
                                  }}
                                >
                                  {opt.type === "self" ? (
                                    <DeliveryDiningIcon />
                                  ) : (
                                    <LocalShippingIcon />
                                  )}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                      alignItems: "center",
                                      flexWrap: "wrap",
                                    }}
                                    useFlexGap
                                  >
                                    <Typography
                                      sx={{ fontWeight: 700 }}
                                      noWrap
                                    >
                                      {label || t("deliveryMethod")}
                                    </Typography>
                                    {opt.type === "self" && (
                                      <Chip
                                        size="small"
                                        color="primary"
                                        label={t("storeDelivery")}
                                        sx={{ fontWeight: 700 }}
                                      />
                                    )}
                                  </Stack>
                                  {opt.phone && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {opt.phone}
                                    </Typography>
                                  )}
                                </Box>
                                <Typography
                                  sx={{
                                    fontWeight: 800,
                                    color: "primary.main",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {Number(opt.price).toFixed(2)}{" "}
                                  {tCommon("currency")}
                                </Typography>
                              </Stack>
                            }
                          />
                        </Paper>
                      );
                    })}
                  </Stack>
                </RadioGroup>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ position: { md: "sticky" }, top: { md: 90 } }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {t("orderSummary")}
              </Typography>
              <Stack spacing={1.2}>
                {cart.items.map((item) => {
                  const productName =
                    item.product && locale === "en" && item.product.name_en
                      ? item.product.name_en
                      : item.product?.name ?? `#${item.product_id}`;
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography variant="body2" noWrap>
                        {productName} × {item.quantity}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                      >
                        {(item.price * item.quantity).toFixed(2)}{" "}
                        {tCommon("currency")}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography color="text.secondary">
                  {tCart("subtotal")}
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {subtotal.toFixed(2)} {tCommon("currency")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography color="text.secondary">
                  {tCart("shipping")}
                </Typography>
                <Typography
                  sx={{
                    color: shippingCost > 0 ? "text.primary" : "success.main",
                    fontWeight: 600,
                  }}
                >
                  {shippingCost.toFixed(2)} {tCommon("currency")}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {tCart("total")}
                </Typography>
                <Typography
                  variant="h6"
                  color="primary"
                  sx={{ fontWeight: 800 }}
                >
                  {grandTotal.toFixed(2)} {tCommon("currency")}
                </Typography>
              </Box>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                startIcon={<ShoppingCartCheckoutIcon />}
                sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
              >
                {t("placeOrder")}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ---------- Address dialog ---------- */}
      <Dialog
        open={addressDialogOpen}
        onClose={() => (addressSaving ? null : setAddressDialogOpen(false))}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {addressEditing ? t("editAddress") : t("addAddress")}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label={t("addressLabel")}
              placeholder={t("addressLabelPlaceholder")}
              value={addressForm.label ?? ""}
              onChange={(e) =>
                setAddressForm((f) => ({ ...f, label: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label={t("fullName")}
              value={addressForm.full_name}
              onChange={(e) =>
                setAddressForm((f) => ({ ...f, full_name: e.target.value }))
              }
              required
              fullWidth
            />
            <TextField
              label={t("phone")}
              value={addressForm.phone}
              onChange={(e) =>
                setAddressForm((f) => ({ ...f, phone: e.target.value }))
              }
              required
              fullWidth
            />
            <Autocomplete
              options={cities}
              getOptionLabel={(o) =>
                locale === "en" && o.name_en ? o.name_en : o.name
              }
              isOptionEqualToValue={(o, v) => o.id === v.id}
              value={cities.find((c) => c.id === addressForm.city_id) ?? null}
              onChange={(_e, v) => onDialogCityPicked(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("city")}
                  required
                  placeholder={t("searchCity")}
                />
              )}
            />
            <Autocomplete
              options={addressDialogAreas}
              getOptionLabel={(o) =>
                locale === "en" && o.name_en ? o.name_en : o.name
              }
              isOptionEqualToValue={(o, v) => o.id === v.id}
              value={
                addressDialogAreas.find(
                  (a) => a.id === addressForm.area_id
                ) ?? null
              }
              onChange={(_e, v) => onDialogAreaChange(v)}
              disabled={!addressForm.city_id || addressDialogAreas.length === 0}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("area")}
                  placeholder={t("searchArea")}
                />
              )}
            />
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                {t("gpsLocation")}{" "}
                <Typography component="span" color="error.main" sx={{ fontWeight: 700 }}>
                  *
                </Typography>
              </Typography>
              <LocationPicker
                value={
                  addressForm.latitude && addressForm.longitude
                    ? { lat: addressForm.latitude, lng: addressForm.longitude }
                    : null
                }
                onChange={({ lat, lng }) => onLocationPicked(lat, lng)}
                hintText={t("gpsHint")}
                myLocationLabel={t("useMyLocation")}
              />
              {addressForm.latitude && addressForm.longitude && (
                <Button
                  size="small"
                  color="error"
                  onClick={() =>
                    setAddressForm((f) => ({
                      ...f,
                      latitude: null,
                      longitude: null,
                    }))
                  }
                  sx={{ mt: 0.5, textTransform: "none" }}
                >
                  {t("clearLocation")}
                </Button>
              )}
            </Box>
            <TextField
              label={t("notes")}
              value={addressForm.notes ?? ""}
              onChange={(e) =>
                setAddressForm((f) => ({ ...f, notes: e.target.value }))
              }
              multiline
              minRows={2}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!addressForm.is_default}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, is_default: e.target.checked }))
                  }
                />
              }
              label={t("makeDefault")}
            />
            {addressFormError && (
              <Alert severity="error">{addressFormError}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setAddressDialogOpen(false)}
            disabled={addressSaving}
            sx={{ textTransform: "none" }}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={saveAddress}
            disabled={addressSaving}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            {addressSaving ? tCommon("loading") : tCommon("save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
