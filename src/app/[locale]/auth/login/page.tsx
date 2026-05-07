"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { LockKeyhole, PawPrint } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import AltchaWidget from "@/components/AltchaWidget";
import { GoogleLogin } from "@react-oauth/google";
import { googleClientId } from "@/components/providers/GoogleAuthProvider";

function InputField({ label, type = "text", value, onChange, required }: { label: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input type={type} value={value} onChange={onChange} required={required}
        className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white" />
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [_hp, setHp] = useState("");
  const [_altcha, setAltcha] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (_hp) return;
    if (!_altcha) { setError(t("common.error")); return; }
    try {
      const vRes = await fetch("/api/altcha", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ payload: _altcha }) });
      if (!vRes.ok) { setError(t("common.error")); return; }
    } catch { setError(t("common.error")); return; }
    try {
      await login(email, password);
      const u = useAuthStore.getState().user;
      if (u?.is_admin) router.push(`/${locale}/admin`);
      else if (u?.is_delivery) router.push(`/${locale}/delivery`);
      else if (u?.is_vendor) router.push(`/${locale}/vendor`);
      else router.push(`/${locale}`);
    } catch { setError(t("common.error")); }
  };

  const redirectAfterAuth = () => {
    const u = useAuthStore.getState().user;
    if (u?.is_admin) router.push(`/${locale}/admin`);
    else if (u?.is_delivery) router.push(`/${locale}/delivery`);
    else if (u?.is_vendor) router.push(`/${locale}/vendor`);
    else router.push(`/${locale}`);
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setError("");
    try { await loginWithGoogle(credentialResponse.credential); redirectAfterAuth(); }
    catch { setError(t("common.error")); }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="text" name="website" value={_hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} aria-hidden="true" autoComplete="off" className="hidden" />
      <InputField label={t("auth.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <InputField label={t("auth.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <AltchaWidget onSolve={setAltcha} />
      <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-60" style={{ background: "var(--color-primary)" }}>
        {t("auth.loginTitle")}
      </button>
    </form>
  );

  const googleSection = googleClientId && (
    <>
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400">{t("auth.orContinueWith")}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="flex justify-center">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError(t("common.error"))} useOneTap={false} width="100%" />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile */}
      <div className="flex md:hidden flex-col min-h-dvh">
        <div className="flex flex-col items-center pt-16 pb-12 px-6 text-white" style={{ background: "linear-gradient(160deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)" }}>
          <PawPrint size={56} className="mb-3 opacity-95" />
          <h1 className="text-xl font-extrabold tracking-wide">{t("common.appName")}</h1>
          <p className="text-sm opacity-75 mt-1 text-center">{t("home.heroSubtitle")}</p>
        </div>
        <div className="flex-1 bg-white rounded-t-[24px] -mt-6 px-6 pt-8 pb-10 flex flex-col">
          <h2 className="text-xl font-extrabold mb-1">{t("auth.loginTitle")}</h2>
          <p className="text-sm text-gray-500 mb-5">{t("auth.noAccount")}{" "}
            <Link href={`/${locale}/auth/register`} className="font-bold no-underline" style={{ color: "var(--color-primary)" }}>{t("common.register")}</Link>
          </p>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}
          {formContent}
          {googleSection}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center justify-center min-h-screen py-12 px-4">
        <div className="flex w-full max-w-2xl min-h-[500px] rounded-2xl overflow-hidden shadow-lg">
          <div className="flex flex-col justify-center items-center w-5/12 text-white p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 50%, var(--color-primary-light) 100%)" }}>
            <div className="absolute -top-1/2 -end-1/3 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-1/5 -start-1/5 w-36 h-36 rounded-full bg-white/4" />
            <LockKeyhole size={52} className="mb-4 opacity-90" />
            <h2 className="text-xl font-bold mb-1 text-center flex items-center gap-2">
              <PawPrint size={22} style={{ transform: "rotate(-15deg)" }} />{t("common.appName")}
            </h2>
            <p className="text-sm opacity-80 text-center">{t("home.heroSubtitle")}</p>
          </div>
          <div className="flex-1 bg-white p-10 flex flex-col justify-center rounded-e-2xl">
            <h2 className="text-3xl font-extrabold mb-6">{t("auth.loginTitle")}</h2>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}
            {formContent}
            {googleSection}
            <p className="mt-6 text-center text-sm text-gray-500">
              {t("auth.noAccount")}{" "}
              <Link href={`/${locale}/auth/register`} className="font-bold no-underline" style={{ color: "var(--color-primary)" }}>{t("common.register")}</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
