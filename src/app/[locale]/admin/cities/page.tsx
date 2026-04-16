"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { citiesApi, type Area, type City } from "@/lib/api/cities";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type CityForm = { id?: number; name: string; name_en: string };
type AreaForm = {
  id?: number;
  city_id: number;
  name: string;
  name_en: string;
};

const emptyCity: CityForm = { name: "", name_en: "" };

export default function AdminCitiesPage() {
  const t = useTranslations("admin");
  const tCities = useTranslations("cities");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [cityDialog, setCityDialog] = useState<CityForm | null>(null);
  const [areaDialog, setAreaDialog] = useState<AreaForm | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await citiesApi.list({ with_areas: true, all: true });
      setCities(res.data.data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const cityLabel = (c: City) =>
    locale === "en" && c.name_en ? c.name_en : c.name;
  const areaLabel = (a: Area) =>
    locale === "en" && a.name_en ? a.name_en : a.name;

  const handleSaveCity = async () => {
    if (!cityDialog?.name.trim()) return;
    try {
      if (cityDialog.id) {
        await citiesApi.update(cityDialog.id, {
          name: cityDialog.name,
          name_en: cityDialog.name_en || undefined,
        });
        setSnackbar(t("updated"));
      } else {
        await citiesApi.create({
          name: cityDialog.name,
          name_en: cityDialog.name_en || undefined,
        });
        setSnackbar(t("created"));
      }
      setCityDialog(null);
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const handleToggleCity = async (c: City) => {
    try {
      await citiesApi.update(c.id, { is_active: !c.is_active });
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const handleDeleteCity = async (c: City) => {
    if (!confirm(t("confirmDeleteCity", { name: cityLabel(c) }))) return;
    try {
      await citiesApi.remove(c.id);
      setSnackbar(t("deleted"));
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const handleSaveArea = async () => {
    if (!areaDialog?.name.trim()) return;
    try {
      if (areaDialog.id) {
        await citiesApi.updateArea(areaDialog.id, {
          name: areaDialog.name,
          name_en: areaDialog.name_en || undefined,
        });
        setSnackbar(t("updated"));
      } else {
        await citiesApi.createArea(areaDialog.city_id, {
          name: areaDialog.name,
          name_en: areaDialog.name_en || undefined,
        });
        setSnackbar(t("created"));
      }
      setAreaDialog(null);
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const handleToggleArea = async (a: Area) => {
    try {
      await citiesApi.updateArea(a.id, { is_active: !a.is_active });
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const handleDeleteArea = async (a: Area) => {
    if (!confirm(t("confirmDeleteArea", { name: areaLabel(a) }))) return;
    try {
      await citiesApi.removeArea(a.id);
      setSnackbar(t("deleted"));
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  return (
    <Box>
      <AdminPageHeader
        title={tCities("title")}
        subtitle={tCities("subtitle")}
        action={{
          label: tCities("newCity"),
          icon: <AddIcon />,
          onClick: () => setCityDialog({ ...emptyCity }),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : cities.length === 0 ? (
        <EmptyState message={tCities("noCities")} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }} />
                <TableCell sx={{ fontWeight: 700 }}>
                  {tCities("cityName")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tCities("cityNameEn")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tCities("areasCount")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cities.map((c) => (
                <Fragment key={c.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))
                        }
                      >
                        {expanded[c.id] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                    <TableCell>{c.name_en || "—"}</TableCell>
                    <TableCell>
                      {c.areas?.length ?? c.areas_count ?? 0}
                    </TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={c.is_active}
                        onChange={() => handleToggleCity(c)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            setCityDialog({
                              id: c.id,
                              name: c.name,
                              name_en: c.name_en ?? "",
                            })
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCity(c)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell
                      colSpan={6}
                      sx={{ p: 0, bgcolor: "grey.50", border: 0 }}
                    >
                      <Collapse in={!!expanded[c.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2 }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1 }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {tCities("areas")}
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() =>
                                setAreaDialog({
                                  city_id: c.id,
                                  name: "",
                                  name_en: "",
                                })
                              }
                            >
                              {tCities("newArea")}
                            </Button>
                          </Stack>
                          {(c.areas ?? []).length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              {tCities("noAreas")}
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                              {c.areas!.map((a) => (
                                <Stack
                                  key={a.id}
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{
                                    p: 1,
                                    bgcolor: "white",
                                    borderRadius: 1,
                                    border: "1px solid",
                                    borderColor: "divider",
                                  }}
                                >
                                  <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 600 }}>
                                      {a.name}
                                    </Typography>
                                    {a.name_en && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {a.name_en}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Chip
                                    size="small"
                                    color={a.is_active ? "success" : "default"}
                                    label={
                                      a.is_active ? t("active") : t("inactive")
                                    }
                                  />
                                  <Switch
                                    size="small"
                                    checked={a.is_active}
                                    onChange={() => handleToggleArea(a)}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setAreaDialog({
                                        id: a.id,
                                        city_id: a.city_id,
                                        name: a.name,
                                        name_en: a.name_en ?? "",
                                      })
                                    }
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteArea(a)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* City dialog */}
      <Dialog
        open={!!cityDialog}
        onClose={() => setCityDialog(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {cityDialog?.id ? tCities("editCity") : tCities("newCity")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={tCities("cityName")}
              value={cityDialog?.name ?? ""}
              onChange={(e) =>
                setCityDialog((c) => (c ? { ...c, name: e.target.value } : c))
              }
              required
              autoFocus
            />
            <TextField
              label={tCities("cityNameEn")}
              value={cityDialog?.name_en ?? ""}
              onChange={(e) =>
                setCityDialog((c) =>
                  c ? { ...c, name_en: e.target.value } : c
                )
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCityDialog(null)}>
            {tCommon("cancel")}
          </Button>
          <Button variant="contained" onClick={handleSaveCity}>
            {tCommon("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Area dialog */}
      <Dialog
        open={!!areaDialog}
        onClose={() => setAreaDialog(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {areaDialog?.id ? tCities("editArea") : tCities("newArea")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={tCities("areaName")}
              value={areaDialog?.name ?? ""}
              onChange={(e) =>
                setAreaDialog((a) => (a ? { ...a, name: e.target.value } : a))
              }
              required
              autoFocus
            />
            <TextField
              label={tCities("areaNameEn")}
              value={areaDialog?.name_en ?? ""}
              onChange={(e) =>
                setAreaDialog((a) =>
                  a ? { ...a, name_en: e.target.value } : a
                )
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAreaDialog(null)}>
            {tCommon("cancel")}
          </Button>
          <Button variant="contained" onClick={handleSaveArea}>
            {tCommon("save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />
    </Box>
  );
}
