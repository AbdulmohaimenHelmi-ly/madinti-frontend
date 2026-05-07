"use client";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { profileApi } from "@/lib/api/profile";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState("");

  useEffect(() => { if (isInitialized && !isAuthenticated) router.push(`/${locale}/auth/login`); }, [isInitialized, isAuthenticated, locale, router]);
  useEffect(() => { if (user) { setName(user.name ?? ""); setPhone(user.phone ?? ""); } }, [user]);

  if (!isInitialized || !user) return <LoadingSpinner />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password && password !== passwordConfirmation) { setError(t("passwordMismatch")); return; }
    setSaving(true);
    try {
      const payload: Record<string, string> = { name, phone };
      if (password) { payload.password = password; payload.password_confirmation = passwordConfirmation; }
      const res = await profileApi.update(payload);
      setUser(res.data.data);
      setPassword(""); setPasswordConfirmation("");
      setSnack(t("saved"));
      setTimeout(() => setSnack(""), 3000);
    } catch { setError(tCommon("error")); }
    finally { setSaving(false); }
  };

  const inputCls = "border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white w-full";

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold mb-1">{t("title")}</h1>
        <p className="text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex flex-wrap gap-2">
          {user.is_admin && <span className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ background: "var(--color-primary)" }}>{tCommon("adminPanel")}</span>}
          {user.is_vendor && <span className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ background: "var(--color-secondary)" }}>{tCommon("vendorDashboard")}</span>}
          {!user.is_admin && !user.is_vendor && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">{t("customer")}</span>}
        </div>
        <p className="text-sm text-gray-400 mt-3">{user.email}</p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t("name")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t("phone")}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </div>
          <p className="text-sm text-gray-400 pt-1">{t("changePassword")}</p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t("newPassword")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t("confirmPassword")}</label>
            <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className={inputCls} autoComplete="new-password" />
          </div>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}
          <button type="submit" disabled={saving} className="self-start flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold disabled:opacity-60 transition-opacity" style={{ background: "var(--color-primary)" }}>
            <Save size={16} />{tCommon("save")}
          </button>
        </div>
      </form>

      {snack && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg z-[9999] text-sm font-medium">
          {snack}
        </div>
      )}
    </div>
  );
}
