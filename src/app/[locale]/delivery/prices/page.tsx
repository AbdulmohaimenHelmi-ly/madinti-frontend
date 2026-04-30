"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
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
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { deliveryApi, type DeliveryPrice } from "@/lib/api/delivery";
import { citiesApi, type City, type Area } from "@/lib/api/cities";
import DeliveryPageHeader from "@/components/delivery/DeliveryPageHeader";

export default function DeliveryPricesPage() {
  const t = useTranslations("delivery");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";

  const [prices, setPrices] = useState<DeliveryPrice[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [fromAreas, setFromAreas] = useState<Area[]>([]);
  const [toAreas, setToAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");

  // Form state
  const [fromCityId, setFromCityId] = useState<number | "">("");
  const [fromAreaId, setFromAreaId] = useState<number | "">("");
  const [cityId, setCityId] = useState<number | "">("");
  const [areaId, setAreaId] = useState<number | "">("");
  const [price, setPrice] = useState<string>("");

  // Initial load
  useEffect(() => {
    Promise.all([deliveryApi.prices(), citiesApi.list({ all: true })])
      .then(([p, c]) => {
        setPrices(p.data.data);
        setCities(c.data.data);
      })
      .catch(() => setPageError(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  // Areas for the selected origin city
  useEffect(() => {
    setFromAreaId("");
    if (!fromCityId) {
      setFromAreas([]);
      return;
    }
    citiesApi
      .areasOf(Number(fromCityId), { all: true })
      .then((r) => setFromAreas(r.data.data))
      .catch(() => setFromAreas([]));
  }, [fromCityId]);

  // Areas for the selected destination city
  useEffect(() => {
    setAreaId("");
    if (!cityId) {
      setToAreas([]);
      return;
    }
    citiesApi
      .areasOf(Number(cityId), { all: true })
      .then((r) => setToAreas(r.data.data))
      .catch(() => setToAreas([]));
  }, [cityId]);

  const cityName = (
    c?: City | { name: string; name_en?: string | null } | null
  ) => (!c ? "-" : isAr ? c.name : c.name_en || c.name);

  const resetForm = () => {
    setFromCityId("");
    setFromAreaId("");
    setCityId("");
    setAreaId("");
    setPrice("");
    setFormError("");
  };

  const openDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (adding) return;
    setDialogOpen(false);
    setFormError("");
  };

  const onAdd = async () => {
    if (!cityId || !price || Number(price) < 0) return;
    setAdding(true);
    setFormError("");
    try {
      const res = await deliveryApi.addPrice({
        from_city_id: fromCityId ? Number(fromCityId) : null,
        from_area_id: fromAreaId ? Number(fromAreaId) : null,
        city_id: Number(cityId),
        area_id: areaId ? Number(areaId) : null,
        price: Number(price),
      });
      setPrices((rows) => [res.data.data, ...rows]);
      resetForm();
      setDialogOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e?.response?.data?.message || t("saveError"));
    } finally {
      setAdding(false);
    }
  };

  const onDelete = async (id: number) => {
    setPrices((rows) => rows.filter((r) => r.id !== id));
    try {
      await deliveryApi.deletePrice(id);
    } catch {
      // reload on failure
      const r = await deliveryApi.prices();
      setPrices(r.data.data);
    }
  };

  const sortedPrices = useMemo(
    () =>
      [...prices].sort((a, b) => {
        const fa = cityName(a.from_city);
        const fb = cityName(b.from_city);
        if (fa !== fb) return fa.localeCompare(fb);
        const ca = cityName(a.city);
        const cb = cityName(b.city);
        return ca.localeCompare(cb);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prices, isAr]
  );

  return (
    <Box>
      <DeliveryPageHeader
        title={t("prices")}
        subtitle={t("pricesSubtitle")}
        action={{
          label: t("addPrice"),
          icon: <AddIcon />,
          onClick: openDialog,
        }}
      />

      {pageError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {pageError}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("fromCity")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("fromArea")}</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 36 }} />
                <TableCell sx={{ fontWeight: 700 }}>{t("city")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("area")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  {t("price")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPrices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    {t("noPrices")}
                  </TableCell>
                </TableRow>
              )}
              {sortedPrices.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    {p.from_city ? (
                      cityName(p.from_city)
                    ) : (
                      <Chip
                        label={t("anyOrigin")}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {p.from_area ? (
                      cityName(p.from_area)
                    ) : (
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {t("anyArea")}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: "text.disabled", px: 0 }}>
                    <ArrowForwardIcon
                      fontSize="small"
                      sx={{
                        transform: isAr ? "rotate(180deg)" : "none",
                      }}
                    />
                  </TableCell>
                  <TableCell>{cityName(p.city)}</TableCell>
                  <TableCell>
                    {p.area ? (
                      cityName(p.area)
                    ) : (
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {t("anyArea")}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {Number(p.price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={t("delete")}>
                      <IconButton
                        color="error"
                        onClick={() => onDelete(p.id)}
                        size="small"
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

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>{t("addPrice")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <Typography variant="overline" color="text.secondary">
              {t("origin")}
            </Typography>

            <TextField
              select
              label={t("fromCity")}
              value={fromCityId}
              onChange={(e) =>
                setFromCityId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              helperText={t("fromCityHelp")}
              fullWidth
            >
              <MenuItem value="">{t("anyOrigin")}</MenuItem>
              {cities.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {cityName(c)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label={t("fromArea")}
              value={fromAreaId}
              onChange={(e) =>
                setFromAreaId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              disabled={!fromCityId}
              helperText={t("areaHelp")}
              fullWidth
            >
              <MenuItem value="">{t("anyArea")}</MenuItem>
              {fromAreas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {cityName(a)}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="overline" color="text.secondary">
              {t("destination")}
            </Typography>

            <TextField
              select
              label={t("city")}
              value={cityId}
              onChange={(e) =>
                setCityId(e.target.value === "" ? "" : Number(e.target.value))
              }
              fullWidth
            >
              <MenuItem value="">{t("selectCity")}</MenuItem>
              {cities.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {cityName(c)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label={t("area")}
              value={areaId}
              onChange={(e) =>
                setAreaId(e.target.value === "" ? "" : Number(e.target.value))
              }
              disabled={!cityId}
              helperText={t("areaHelp")}
              fullWidth
            >
              <MenuItem value="">{t("anyArea")}</MenuItem>
              {toAreas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {cityName(a)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label={t("price")}
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={adding}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={onAdd}
            disabled={adding || !cityId || price === ""}
            startIcon={<AddIcon />}
          >
            {t("add")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
