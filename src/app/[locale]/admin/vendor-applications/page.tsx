"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, CheckCircle, X, AlertCircle } from "lucide-react";

import {
  vendorApplicationsApi,
  type VendorApplication,
} from "@/lib/api/vendorApplications";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import DataPagination from "@/components/common/DataPagination";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";

const appStatusClass = (s: string) => {
  if (s === "approved") return "bg-green-100 text-green-700";
  if (s === "rejected") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
};

export default function AdminVendorApplicationsPage() {
  const t = useTranslations("admin");
  const tApp = useTranslations("vendorApplication");
  const tCommon = useTranslations("common");

  const [apps, setApps] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [viewApp, setViewApp] = useState<VendorApplication | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [actionTarget, setActionTarget] = useState<VendorApplication | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { per_page: 15, page };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await vendorApplicationsApi.list(params);
      setApps(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, search, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(() => setSnackbar(""), 3000);
    return () => clearTimeout(timer);
  }, [snackbar]);

  const handleConfirm = async () => {
    if (!action || !actionTarget) return;
    setBusy(true);
    try {
      if (action === "approve") {
        await vendorApplicationsApi.approve(actionTarget.id, notes || undefined);
        setSnackbar(tApp("approved"));
      } else {
        await vendorApplicationsApi.reject(actionTarget.id, notes || undefined);
        setSnackbar(tApp("rejected"));
      }
      setAction(null);
      setActionTarget(null);
      setNotes("");
      await load();
    } catch {
      setError(t("actionError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={tApp("adminTitle")}
        subtitle={tApp("adminSubtitle")}
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={tApp("searchPlaceholder")}
        selects={[
          {
            key: "status",
            label: t("status"),
            value: status,
            onChange: setStatus,
            options: [
              { value: "", label: t("allStatuses") },
              { value: "pending", label: tApp("status.pending") },
              { value: "approved", label: tApp("status.approved") },
              { value: "rejected", label: tApp("status.rejected") },
            ],
          },
        ]}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <TableRowsSkeleton rows={6} columns={5} />
      ) : apps.length === 0 ? (
        <EmptyState message={tApp("noApplications")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{tApp("storeName")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("name")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("email")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("city")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("status")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold">{a.store_name}</td>
                    <td className="px-4 py-3">{a.user?.name ?? "—"}</td>
                    <td className="px-4 py-3">{a.user?.email ?? "—"}</td>
                    <td className="px-4 py-3">{a.city_details?.name ?? a.city ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${appStatusClass(a.status)}`}>
                        {tApp(`status.${a.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title={tCommon("view")}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                          onClick={() => setViewApp(a)}
                        >
                          <Eye size={16} />
                        </button>
                        {a.status === "pending" && (
                          <>
                            <button
                              type="button"
                              title={tApp("approve")}
                              className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition"
                              onClick={() => {
                                setAction("approve");
                                setActionTarget(a);
                                setNotes("");
                              }}
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              type="button"
                              title={tApp("reject")}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                              onClick={() => {
                                setAction("reject");
                                setActionTarget(a);
                                setNotes("");
                              }}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
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
            perPage={15}
            onChange={setPage}
          />
        </>
      )}

      {/* View details */}
      {!!viewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewApp(null)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">{tApp("applicationDetails")}</h2>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              <Row label={tApp("storeName")} value={viewApp.store_name} />
              {viewApp.store_name_en && (
                <Row label={tApp("storeNameEn")} value={viewApp.store_name_en} />
              )}
              {viewApp.user && (
                <>
                  <Row label={t("name")} value={viewApp.user.name} />
                  <Row label={t("email")} value={viewApp.user.email} />
                  <Row
                    label={t("phone")}
                    value={viewApp.user.phone ?? viewApp.phone ?? "—"}
                  />
                </>
              )}
              {(viewApp.city_details || viewApp.city) && (
                <Row
                  label={t("city")}
                  value={viewApp.city_details?.name ?? viewApp.city ?? ""}
                />
              )}
              {viewApp.area_details && (
                <Row label={tApp("area")} value={viewApp.area_details.name} />
              )}
              {viewApp.address && (
                <Row label={tApp("address")} value={viewApp.address} />
              )}
              {viewApp.description && (
                <Row label={tApp("description")} value={viewApp.description} />
              )}
              {viewApp.admin_notes && (
                <Row label={tApp("adminNotes")} value={viewApp.admin_notes} />
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewApp(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {tCommon("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject confirmation with notes */}
      {!!action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setAction(null); setActionTarget(null); }} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">
                {action === "approve" ? tApp("approveTitle") : tApp("rejectTitle")}
              </h2>
            </div>
            <div className="px-6 py-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tApp("adminNotes")}</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setAction(null); setActionTarget(null); }}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {tCommon("cancel")}
              </button>
              {action === "approve" ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {tApp("approve")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {tApp("reject")}
                </button>
              )}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
