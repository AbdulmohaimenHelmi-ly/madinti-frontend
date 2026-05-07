"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Pencil, Trash2, ImageOff, AlertCircle } from "lucide-react";

import { adminApi, type BannerPayload } from "@/lib/api/admin";
import type { Banner, BannerPosition, ContentType } from "@/lib/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AudienceChip, { useAudienceOptions } from "@/components/common/AudienceChip";

interface FormState {
  position: BannerPosition;
  title: string;
  title_en: string;
  subtitle: string;
  subtitle_en: string;
  image: string;
  link: string;
  sort_order: string;
  is_active: boolean;
  content_type: ContentType;
}

const emptyForm: FormState = {
  position: "slider",
  title: "",
  title_en: "",
  subtitle: "",
  subtitle_en: "",
  image: "",
  link: "",
  sort_order: "0",
  is_active: true,
  content_type: "unisex",
};

const POSITION_ORDER: BannerPosition[] = [
  "slider",
  "left_1",
  "left_2",
  "left_3",
  "right_1",
  "right_2",
  "right_3",
];

export default function AdminBannersPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tContent = useTranslations("content");
  const locale = useLocale();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [audience, setAudience] = useState<string>("");
  const audienceOptions = useAudienceOptions(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBanners();
      setBanners(res.data.data);
    } catch {
      setError(tCommon("error"));
    } finally {
      setLoading(false);
    }
  }, [tCommon]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!snack) return;
    const timer = setTimeout(() => setSnack(null), 3000);
    return () => clearTimeout(timer);
  }, [snack]);

  const openCreate = (position: BannerPosition) => {
    setEditing(null);
    setForm({ ...emptyForm, position });
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      position: b.position,
      title: b.title ?? "",
      title_en: b.title_en ?? "",
      subtitle: b.subtitle ?? "",
      subtitle_en: b.subtitle_en ?? "",
      image: b.image,
      link: b.link ?? "",
      sort_order: String(b.sort_order ?? 0),
      is_active: b.is_active,
      content_type: b.content_type ?? "unisex",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.image.trim()) {
      setError(t("imageRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: BannerPayload = {
        position: form.position,
        title: form.title.trim() || null,
        title_en: form.title_en.trim() || null,
        subtitle: form.subtitle.trim() || null,
        subtitle_en: form.subtitle_en.trim() || null,
        image: form.image.trim(),
        link: form.link.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        content_type: form.content_type,
      };
      if (editing) {
        await adminApi.updateBanner(editing.id, payload);
      } else {
        await adminApi.createBanner(payload);
      }
      setSnack(tCommon("save"));
      setDialogOpen(false);
      await load();
    } catch {
      setError(tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (deletingId === null) return;
    try {
      await adminApi.deleteBanner(deletingId);
      setDeletingId(null);
      await load();
    } catch {
      setError(tCommon("error"));
    }
  };

  if (loading) return <LoadingSpinner />;

  const filteredBanners = audience
    ? banners.filter((b) => (b.content_type ?? "unisex") === audience)
    : banners;

  const grouped = POSITION_ORDER.reduce<Record<BannerPosition, Banner[]>>(
    (acc, p) => {
      acc[p] = filteredBanners
        .filter((b) => b.position === p)
        .sort((a, b) => a.sort_order - b.sort_order);
      return acc;
    },
    {} as Record<BannerPosition, Banner[]>
  );

  return (
    <div>
      <AdminPageHeader title={t("banners")} subtitle={t("bannersSubtitle")} />

      {/* Filter bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
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
        </div>
      </div>

      {POSITION_ORDER.map((pos) => {
        const list = grouped[pos];
        const isSlider = pos === "slider";
        return (
          <div key={pos} className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{t(`position_${pos}`)}</h2>
                <p className="text-sm text-gray-600">
                  {isSlider ? t("sliderHint") : t("singleTileHint")}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "var(--color-primary)" }}
                onClick={() => openCreate(pos)}
              >
                <Plus size={16} /> {t("addBanner")}
              </button>
            </div>

            {list.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center">
                <ImageOff size={40} className="opacity-40 mb-2" />
                <p className="text-sm">{t("noBannerInSlot")}</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {list.map((b) => (
                  <div
                    key={b.id}
                    className="w-64 rounded-xl border border-gray-200 bg-white overflow-hidden"
                  >
                    <div className="relative h-36 bg-gray-100">
                      {b.image ? (
                        <img
                          src={b.image}
                          alt={b.title ?? ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageOff size={32} />
                        </div>
                      )}
                      {!b.is_active && (
                        <span className="absolute top-2 start-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-black/70 text-white">
                          {t("inactive")}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold truncate">
                        {locale === "en" && b.title_en
                          ? b.title_en
                          : b.title || t("untitled")}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{b.link || "—"}</p>
                      <div className="flex items-center gap-1 mt-2">
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
                          onClick={() => setDeletingId(b.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="flex-1" />
                        <AudienceChip value={b.content_type} />
                        <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                          #{b.sort_order}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Edit/Create Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDialogOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">
                {editing ? t("editBanner") : t("newBanner")}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t("position")}
                </label>
                <select
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value as BannerPosition })
                  }
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {POSITION_ORDER.map((p) => (
                    <option key={p} value={p}>
                      {t(`position_${p}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t("imageUrl")} *
                </label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <p className="text-xs text-gray-400 mt-1">{t("imageHint")}</p>
              </div>

              {form.image && (
                <div className="rounded-xl overflow-hidden max-h-44 bg-gray-100">
                  <img
                    src={form.image}
                    alt="preview"
                    className="w-full max-h-44 object-cover block"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {t("bannerTitle")}
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {t("bannerTitleEn")}
                  </label>
                  <input
                    type="text"
                    value={form.title_en}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {t("subtitle")}
                  </label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {t("subtitleEn")}
                  </label>
                  <input
                    type="text"
                    value={form.subtitle_en}
                    onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t("link")}
                </label>
                <input
                  type="text"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <p className="text-xs text-gray-400 mt-1">{t("linkHint")}</p>
              </div>

              <div className="flex items-end gap-4 flex-wrap">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {t("sortOrder")}
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    className="h-9 w-28 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {tContent("contentType")}
                  </label>
                  <select
                    value={form.content_type}
                    onChange={(e) =>
                      setForm({ ...form, content_type: e.target.value as ContentType })
                    }
                    className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="unisex">{tContent("unisex")}</option>
                    <option value="female">{tContent("female")}</option>
                    <option value="male">{tContent("male")}</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
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
                  <span className="text-sm">{t("active")}</span>
                </label>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
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
                onClick={save}
                disabled={saving}
              >
                {tCommon("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeletingId(null)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">{t("confirmDeleteBanner")}</h2>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={() => setDeletingId(null)}
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                onClick={remove}
              >
                {tCommon("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {snack && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {snack}
        </div>
      )}
    </div>
  );
}
