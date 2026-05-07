"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Save, AlertCircle } from "lucide-react";

import { adminApi, type SaveOptionPayload } from "@/lib/api/admin";
import type { ProductOption } from "@/lib/types";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { TableRowsSkeleton } from "@/components/common/Skeletons";

interface ValueDraft {
  id?: number;
  value: string;
  value_en: string;
  hex_color: string;
}

interface OptionDraft {
  id?: number;
  name: string;
  name_en: string;
  values: ValueDraft[];
}

const newValue = (): ValueDraft => ({ value: "", value_en: "", hex_color: "" });
const newDraft = (): OptionDraft => ({ name: "", name_en: "", values: [newValue()] });

export default function AdminOptionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations();

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const [dialog, setDialog] = useState<{ open: boolean; draft: OptionDraft }>({
    open: false,
    draft: newDraft(),
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listOptions();
      setOptions(res.data.data);
    } catch {
      setSnack({ msg: t("common.error"), sev: "error" });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!snack) return;
    const timer = setTimeout(() => setSnack(null), 3000);
    return () => clearTimeout(timer);
  }, [snack]);

  const openCreate = () => setDialog({ open: true, draft: newDraft() });

  const openEdit = (opt: ProductOption) =>
    setDialog({
      open: true,
      draft: {
        id: opt.id,
        name: opt.name_ar ?? opt.name,
        name_en: opt.name_en ?? "",
        values: opt.values.map((v) => ({
          id: v.id,
          value: v.value,
          value_en: v.value_en ?? "",
          hex_color: v.hex_color ?? "",
        })),
      },
    });

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const updateDraft = (patch: Partial<OptionDraft>) =>
    setDialog((d) => ({ ...d, draft: { ...d.draft, ...patch } }));

  const updateValue = (i: number, patch: Partial<ValueDraft>) =>
    setDialog((d) => {
      const values = d.draft.values.slice();
      values[i] = { ...values[i], ...patch };
      return { ...d, draft: { ...d.draft, values } };
    });

  const addValue = () =>
    setDialog((d) => ({
      ...d,
      draft: { ...d.draft, values: [...d.draft.values, newValue()] },
    }));

  const removeValue = (i: number) =>
    setDialog((d) => {
      const values = d.draft.values.slice();
      values.splice(i, 1);
      return { ...d, draft: { ...d.draft, values: values.length ? values : [newValue()] } };
    });

  const saveDraft = async () => {
    const draft = dialog.draft;
    if (!draft.name.trim()) {
      setSnack({ msg: "Option name is required.", sev: "error" });
      return;
    }
    const cleanValues = draft.values
      .map((v) => ({
        ...v,
        value: v.value.trim(),
        value_en: v.value_en.trim(),
        hex_color: v.hex_color.trim(),
      }))
      .filter((v) => v.value.length > 0);
    if (cleanValues.length === 0) {
      setSnack({ msg: "Add at least one value.", sev: "error" });
      return;
    }
    const payload: SaveOptionPayload = {
      name: draft.name.trim(),
      name_en: draft.name_en.trim() || null,
      values: cleanValues.map((v, i) => ({
        id: v.id,
        value: v.value,
        value_en: v.value_en || null,
        hex_color: v.hex_color || null,
        position: i,
      })),
    };

    setSaving(true);
    try {
      if (draft.id) {
        await adminApi.updateOption(draft.id, payload);
      } else {
        await adminApi.createOption(payload);
      }
      setSnack({ msg: "Saved", sev: "success" });
      closeDialog();
      load();
    } catch {
      setSnack({ msg: "Could not save option.", sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  const deleteOption = async (opt: ProductOption) => {
    if (!confirm(`Delete option "${opt.name}"?`)) return;
    try {
      await adminApi.deleteOption(opt.id);
      setSnack({ msg: "Deleted", sev: "success" });
      load();
    } catch {
      setSnack({
        msg: "Cannot delete: option is in use by one or more variants.",
        sev: "error",
      });
    }
  };

  void locale;

  return (
    <div>
      <AdminPageHeader title={t("options") || "Options"} subtitle="Global options catalog" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Define the option groups (Color, Size, ...) that products can use.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: "var(--color-primary)" }}
            onClick={openCreate}
          >
            <Plus size={16} /> Add option
          </button>
        </div>

        {loading ? (
          <TableRowsSkeleton rows={4} />
        ) : options.length === 0 ? (
          <div className="py-8 text-center text-gray-400">No options yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    Name (AR)
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    Name (EN)
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    Values
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {options.map((opt) => (
                  <tr
                    key={opt.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 font-semibold">{opt.name}</td>
                    <td className="px-4 py-3">{opt.name_en || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {opt.values.map((v) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-600"
                          >
                            {v.hex_color && (
                              <span
                                className="inline-block w-3 h-3 rounded-full border border-black/20"
                                style={{ backgroundColor: v.hex_color }}
                              />
                            )}
                            {v.value_en ? `${v.value} (${v.value_en})` : v.value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                          onClick={() => openEdit(opt)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                          onClick={() => deleteOption(opt)}
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
        )}
      </div>

      {/* Dialog */}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDialog} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">
                {dialog.draft.id ? "Edit option" : "Add option"}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Name (AR)
                  </label>
                  <input
                    type="text"
                    value={dialog.draft.name}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Name (EN)
                  </label>
                  <input
                    type="text"
                    value={dialog.draft.name_en}
                    onChange={(e) => updateDraft({ name_en: e.target.value })}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Values</p>
                <div className="space-y-2">
                  {dialog.draft.values.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Value (AR)"
                        value={v.value}
                        onChange={(e) => updateValue(i, { value: e.target.value })}
                        className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text"
                        placeholder="Value (EN)"
                        value={v.value_en}
                        onChange={(e) => updateValue(i, { value_en: e.target.value })}
                        className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        style={{ flex: 1 }}
                      />
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg bg-gray-50 px-2 h-8">
                        <input
                          type="text"
                          placeholder="Hex"
                          value={v.hex_color}
                          onChange={(e) => updateValue(i, { hex_color: e.target.value })}
                          className="w-20 bg-transparent text-sm focus:outline-none"
                        />
                        {v.hex_color && (
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: v.hex_color }}
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                        onClick={() => removeValue(i)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 mt-2"
                  onClick={addValue}
                >
                  <Plus size={13} /> Add value
                </button>
              </div>
              {dialog.draft.id && (
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Removing a value that is currently used by a variant will be ignored.
                  </span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={closeDialog}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
                onClick={saveDraft}
                disabled={saving}
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {snack && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${
            snack.sev === "error" ? "bg-red-600" : "bg-gray-900"
          }`}
        >
          {snack.msg}
        </div>
      )}
    </div>
  );
}
