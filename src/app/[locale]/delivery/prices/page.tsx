"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
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

import { deliveryApi, type DeliveryPrice } from "@/lib/api/delivery";
import { citiesApi, type City, type Area } from "@/lib/api/cities";

export default function DeliveryPricesPage() {
  const t = useTranslations("delivery");
  const locale = useLocale();
  const isAr = locale === "ar";

  const [prices, setPrices] = useState<DeliveryPrice[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // Form state
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
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  // Areas for the selected city
  useEffect(() => {
    setAreaId("");
    if (!cityId) {
      setAreas([]);
      return;
    }
    citiesApi.areasOf(Number(cityId), { all: true }).then((r) => setAreas(r.data.data)).catch(() => setAreas([]));
  }, [cityId]);

  const cityName = (c?: City | { name: string; name_en?: string | null } | null) =>
    !c ? "-" : isAr ? c.name : (c.name_en || c.name);

  const onAdd = async () => {
    if (!cityId || !price || Number(price) < 0) return;
    setAdding(true);
    setError("");
    try {
      const res = await deliveryApi.addPrice({
        city_id: Number(cityId),
        area_id: areaId ? Number(areaId) : null,
        price: Number(price),
      });
      setPrices((rows) => [res.data.data, ...rows]);
      setCityId("");
      setAreaId("");
      setPrice("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || t("saveError"));
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
        const ca = cityName(a.city);
        const cb = cityName(b.city);
        return ca.localeCompare(cb);
      }),
    [prices, isAr]
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        {t("prices")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("pricesSubtitle")}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Add new price */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 2 }}>{t("addPrice")}</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label={t("city")}
                value={cityId}
                onChange={(e) => setCityId(e.target.value === "" ? "" : Number(e.target.value))}
                fullWidth
              >
                <MenuItem value="">{t("selectCity")}</MenuItem>
                {cities.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {cityName(c)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label={t("area")}
                value={areaId}
                onChange={(e) => setAreaId(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={!cityId}
                helperText={t("areaHelp")}
                fullWidth
              >
                <MenuItem value="">{t("anyArea")}</MenuItem>
                {areas.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {cityName(a)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label={t("price")}
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                variant="contained"
                onClick={onAdd}
                disabled={adding || !cityId || price === ""}
                fullWidth
                sx={{ height: "100%", minHeight: 56 }}
                startIcon={<AddIcon />}
              >
                {t("add")}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table of prices */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 700 }}>{t("city")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("area")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">{t("price")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPrices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      {t("noPrices")}
                    </TableCell>
                  </TableRow>
                )}
                {sortedPrices.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{cityName(p.city)}</TableCell>
                    <TableCell>
                      {p.area ? cityName(p.area) : (
                        <Typography component="span" variant="caption" color="text.secondary">
                          {t("anyArea")}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {Number(p.price).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t("delete")}>
                        <IconButton color="error" onClick={() => onDelete(p.id)} size="small">
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
    </Box>
  );
}
