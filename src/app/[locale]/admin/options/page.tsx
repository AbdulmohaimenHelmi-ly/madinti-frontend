"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

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

  return (
    <Box>
      <AdminPageHeader title={t("options") || "Options"} subtitle="Global options catalog" />

      <Paper sx={{ p: 3 }}>
        <Stack
          direction="row"
          sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="body2" color="text.secondary">
            Define the option groups (Color, Size, ...) that products can use.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add option
          </Button>
        </Stack>

        {loading ? (
          <TableRowsSkeleton rows={4} />
        ) : options.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
            No options yet.
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name (AR)</TableCell>
                  <TableCell>Name (EN)</TableCell>
                  <TableCell>Values</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {options.map((opt) => (
                  <TableRow key={opt.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{opt.name}</TableCell>
                    <TableCell>{opt.name_en || "—"}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {opt.values.map((v) => (
                          <Chip
                            key={v.id}
                            size="small"
                            label={v.value_en ? `${v.value} (${v.value_en})` : v.value}
                            icon={
                              v.hex_color ? (
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: v.hex_color,
                                    border: "1px solid rgba(0,0,0,0.2)",
                                    ml: 0.5,
                                  }}
                                />
                              ) : undefined
                            }
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(opt)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteOption(opt)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog.open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{dialog.draft.id ? "Edit option" : "Add option"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Name (AR)"
                value={dialog.draft.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
              />
              <TextField
                fullWidth
                size="small"
                label="Name (EN)"
                value={dialog.draft.name_en}
                onChange={(e) => updateDraft({ name_en: e.target.value })}
              />
            </Stack>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Values
              </Typography>
              <Stack spacing={1}>
                {dialog.draft.values.map((v, i) => (
                  <Stack key={i} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <TextField
                      size="small"
                      label="Value (AR)"
                      value={v.value}
                      onChange={(e) => updateValue(i, { value: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Value (EN)"
                      value={v.value_en}
                      onChange={(e) => updateValue(i, { value_en: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Hex"
                      value={v.hex_color}
                      onChange={(e) => updateValue(i, { hex_color: e.target.value })}
                      sx={{ width: 140 }}
                      slotProps={{
                        input: {
                          endAdornment: v.hex_color ? (
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                bgcolor: v.hex_color,
                                border: "1px solid rgba(0,0,0,0.2)",
                              }}
                            />
                          ) : undefined,
                        },
                      }}
                    />
                    <IconButton size="small" color="error" onClick={() => removeValue(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={addValue}
                sx={{ mt: 1 }}
              >
                Add value
              </Button>
            </Box>
            {dialog.draft.id && (
              <Alert severity="info">
                Removing a value that is currently used by a variant will be ignored.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveDraft}
            disabled={saving}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(null)}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
