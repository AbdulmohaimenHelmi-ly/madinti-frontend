"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, CheckCircle, Ban, LogIn, AlertCircle } from "lucide-react";

import { adminApi, type UpdateUserPayload } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/authStore";
import type { User } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";
import DataPagination from "@/components/common/DataPagination";

const PER_PAGE = 15;

const roleChipClass = (role: string) => {
  switch (role) {
    case "admin": return "bg-red-100 text-red-700";
    case "vendor": return "bg-yellow-100 text-yellow-700";
    default: return "bg-blue-100 text-blue-700";
  }
};

interface EditForm {
  name: string;
  email: string;
  phone: string;
  role: User["role"];
  is_active: boolean;
}

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const startImpersonation = useAuthStore((s) => s.startImpersonation);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<EditForm>({
    name: "",
    email: "",
    phone: "",
    role: "customer",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { per_page: PER_PAGE, page };
      if (search) params.search = search;
      if (role) params.role = role;
      if (status !== "") params.is_active = status;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await adminApi.getUsers(params);
      setUsers(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, search, role, status, dateFrom, dateTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(() => setSnackbar(""), 3000);
    return () => clearTimeout(timer);
  }, [snackbar]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await adminApi.deleteUser(toDelete.id);
      setSnackbar(t("deleted"));
      setToDelete(null);
      await load();
    } catch {
      setError(t("actionError"));
      setToDelete(null);
    }
  };

  const handleImpersonate = async (u: User) => {
    if (!confirm(t("confirmImpersonate", { name: u.name }))) return;
    try {
      const res = await adminApi.impersonateUser(u.id);
      const { token, user } = res.data.data;
      startImpersonation(token, user);
      router.push(`/${locale}`);
    } catch {
      setError(t("actionError"));
    }
  };

  const handleToggleActive = async (u: User) => {
    setBusyId(u.id);
    try {
      await adminApi.toggleUserActive(u.id);
      setSnackbar(u.is_active ? t("deactivated") : t("activated"));
      await load();
    } catch {
      setError(t("actionError"));
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setFormError("");
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      role: u.role,
      is_active: u.is_active,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!form.name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload: UpdateUserPayload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        is_active: form.is_active,
      };
      await adminApi.updateUser(editing.id, payload);
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

  return (
    <div>
      <AdminPageHeader title={t("users")} subtitle={t("usersSubtitle")} />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchUsers")}
        selects={[
          {
            key: "role",
            label: t("role"),
            value: role,
            onChange: setRole,
            options: [
              { value: "", label: t("allRoles") },
              { value: "customer", label: t("roles.customer") },
              { value: "vendor", label: t("roles.vendor") },
              { value: "admin", label: t("roles.admin") },
              { value: "delivery", label: t("roles.delivery") },
            ],
          },
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
      ) : users.length === 0 ? (
        <EmptyState message={t("noUsers")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("name")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("email")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("phone")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("role")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("status")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("joinedAt")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleChipClass(u.role)}`}>
                        {t(`roles.${u.role}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {u.is_active ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title={tCommon("edit")}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title={u.is_active ? t("deactivate") : t("activate")}
                          disabled={busyId === u.id || u.is_admin}
                          className={`p-1.5 rounded-lg transition disabled:opacity-40 ${u.is_active ? "text-yellow-600 hover:bg-yellow-50" : "text-green-500 hover:bg-green-50"}`}
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          type="button"
                          title={t("loginAs")}
                          disabled={u.is_admin}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition disabled:opacity-40"
                          onClick={() => handleImpersonate(u)}
                        >
                          <LogIn size={16} />
                        </button>
                        <button
                          type="button"
                          title={tCommon("delete")}
                          disabled={u.is_admin}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                          onClick={() => setToDelete(u)}
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
            perPage={PER_PAGE}
            onChange={setPage}
          />
        </>
      )}

      {/* Edit user dialog */}
      {!!editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setEditing(null)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">{t("editUser")}</h2>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("name")}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("email")}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("role")}</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as User["role"] }))}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="customer">{t("roles.customer")}</option>
                  <option value="vendor">{t("roles.vendor")}</option>
                  <option value="admin">{t("roles.admin")}</option>
                  <option value="delivery">{t("roles.delivery")}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${form.is_active ? "bg-[var(--color-primary)]" : "bg-gray-300"}`} />
                  <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <span className="text-sm">{form.is_active ? t("active") : t("inactive")}</span>
              </label>
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
              <p className="text-sm text-gray-600">{t("confirmDeleteUser", { name: toDelete.name })}</p>
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

