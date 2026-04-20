"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Switch,
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
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";

import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import EmptyState from "@/components/common/EmptyState";
import { deliveryApi, type DeliveryCompany } from "@/lib/api/delivery";

export default function VendorCarriersPage() {
  const t = useTranslations("vendor");
  const tDel = useTranslations("delivery");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";

  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [details, setDetails] = useState<DeliveryCompany | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    Promise.all([deliveryApi.list(), deliveryApi.vendorTrustedIds()])
      .then(([list, ids]) => {
        setCompanies(list.data.data);
        setSelected(new Set(ids.data.data.delivery_company_ids));
      })
      .catch(() => setError(tDel("loadError")))
      .finally(() => setLoading(false));
  }, [tDel]);

  useEffect(() => {
    if (detailsId == null) return;
    setDetailsLoading(true);
    setDetailsError("");
    setDetails(null);
    deliveryApi
      .get(detailsId)
      .then((res) => setDetails(res.data.data))
      .catch(() => setDetailsError(t("loadDetailsError")))
      .finally(() => setDetailsLoading(false));
  }, [detailsId, t]);

  const toggle = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await deliveryApi.vendorSyncTrusted(Array.from(selected));
      setSuccess(t("trustedSaved"));
    } catch {
      setError(tDel("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const nameOf = (c: { name: string; name_en?: string | null }) =>
    !isAr && c.name_en ? c.name_en : c.name;
  const descOf = (c: {
    description?: string | null;
    description_en?: string | null;
  }) => (!isAr && c.description_en ? c.description_en : c.description ?? "");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => nameOf(c).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, search, isAr]);

  const currency = (n: number | string) =>
    new Intl.NumberFormat(isAr ? "ar-LY" : "en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(Number(n) || 0);

  const closeDetails = () => {
    setDetailsId(null);
    setDetails(null);
    setDetailsError("");
  };

  const detailsTrusted = details != null && selected.has(details.id);

  return (
    <Box>
      <VendorPageHeader
        title={t("trustedCarriers")}
        subtitle={t("trustedCarriersSubtitle")}
        action={{
          label: saving ? tDel("saving") : tDel("save"),
          icon: <SaveIcon />,
          onClick: onSave,
          disabled: saving,
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            alignItems: { sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <TextField
            size="small"
            placeholder={t("searchCarriers")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.disabled" }} />
                ),
              },
            }}
            sx={{ minWidth: { xs: "100%", sm: 320 } }}
          />
          <Chip
            color={selected.size > 0 ? "primary" : "default"}
            variant={selected.size > 0 ? "filled" : "outlined"}
            label={t("selectedCount", { count: selected.size })}
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <EmptyState message={t("noCarriers")} />
      ) : (
        <Stack spacing={2}>
          {filtered.map((c) => {
            const isSel = selected.has(c.id);
            return (
              <Paper
                key={c.id}
                sx={(theme) => ({
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: isSel
                    ? theme.palette.primary.main
                    : "divider",
                  bgcolor: isSel
                    ? `${theme.palette.primary.main}0A`
                    : "background.paper",
                  transition:
                    "border-color 0.15s, background-color 0.15s",
                  "&:hover": { borderColor: theme.palette.primary.main },
                })}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  sx={{ alignItems: { md: "center" } }}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "center", flex: 1, minWidth: 0 }}
                  >
                    <Avatar
                      src={c.logo || undefined}
                      sx={{ bgcolor: "primary.main", width: 56, height: 56 }}
                      variant="rounded"
                    >
                      <LocalShippingIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center", flexWrap: "wrap" }}
                        useFlexGap
                      >
                        <Typography
                          sx={{ fontWeight: 800, fontSize: "1.05rem" }}
                          noWrap
                        >
                          {nameOf(c)}
                        </Typography>
                        <Chip
                          size="small"
                          color={c.is_active ? "success" : "default"}
                          label={c.is_active ? t("active") : t("inactive")}
                          sx={{ fontWeight: 600 }}
                        />
                        {isSel && (
                          <Chip
                            size="small"
                            color="primary"
                            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                            label={t("trusted")}
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                      </Stack>
                      {descOf(c) ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {descOf(c)}
                        </Typography>
                      ) : null}
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{ mt: 1, flexWrap: "wrap", color: "text.secondary" }}
                        useFlexGap
                      >
                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ alignItems: "center" }}
                        >
                          <PriceCheckIcon
                            sx={{ fontSize: 18, color: "primary.main" }}
                          />
                          <Typography variant="caption">
                            {t("basePriceShort")}: <b>{currency(c.base_price)}</b>{" "}
                            {tCommon("currency")}
                          </Typography>
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ alignItems: "center" }}
                        >
                          <LocationCityIcon
                            sx={{ fontSize: 18, color: "primary.main" }}
                          />
                          <Typography variant="caption">
                            {tDel("pricesCount")}: <b>{c.prices_count ?? 0}</b>
                          </Typography>
                        </Stack>
                        {c.phone && (
                          <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{ alignItems: "center" }}
                          >
                            <PhoneIcon
                              sx={{ fontSize: 18, color: "primary.main" }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ direction: "ltr" }}
                            >
                              {c.phone}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      justifyContent: { xs: "flex-start", md: "flex-end" },
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setDetailsId(c.id)}
                    >
                      {t("viewDetails")}
                    </Button>
                    <Tooltip
                      title={isSel ? t("unmarkTrusted") : t("markTrusted")}
                    >
                      <Switch
                        checked={isSel}
                        onChange={() => toggle(c.id)}
                        color="primary"
                      />
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Dialog
        open={detailsId != null}
        onClose={closeDetails}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ pr: 6 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", fontWeight: 700 }}
          >
            <LocalShippingIcon color="primary" />
            <Box component="span" sx={{ fontWeight: 800 }}>
              {t("carrierDetails")}
            </Box>
          </Stack>
          <IconButton
            onClick={closeDetails}
            sx={{ position: "absolute", top: 8, insetInlineEnd: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : detailsError ? (
            <Alert severity="error">{detailsError}</Alert>
          ) : details ? (
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ alignItems: { sm: "center" } }}
              >
                <Avatar
                  src={details.logo || undefined}
                  sx={{ bgcolor: "primary.main", width: 72, height: 72 }}
                  variant="rounded"
                >
                  <LocalShippingIcon fontSize="large" />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.25rem" }}>
                    {nameOf(details)}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 0.5, flexWrap: "wrap" }}
                    useFlexGap
                  >
                    <Chip
                      size="small"
                      color={details.is_active ? "success" : "default"}
                      label={details.is_active ? t("active") : t("inactive")}
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      color={detailsTrusted ? "primary" : "default"}
                      icon={
                        detailsTrusted ? (
                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />
                        )
                      }
                      label={detailsTrusted ? t("trusted") : t("notTrusted")}
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                </Box>
                <Button
                  variant={detailsTrusted ? "outlined" : "contained"}
                  color="primary"
                  startIcon={
                    detailsTrusted ? (
                      <RadioButtonUncheckedIcon />
                    ) : (
                      <CheckCircleIcon />
                    )
                  }
                  onClick={() => toggle(details.id)}
                >
                  {detailsTrusted ? t("unmarkTrusted") : t("markTrusted")}
                </Button>
              </Stack>

              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  {t("about")}
                </Typography>
                <Typography
                  variant="body2"
                  color={descOf(details) ? "text.primary" : "text.secondary"}
                >
                  {descOf(details) || t("noDescription")}
                </Typography>
              </Box>

              <Divider />

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{ alignItems: "stretch" }}
              >
                <Paper
                  variant="outlined"
                  sx={{ flex: 1, p: 2, borderRadius: 2 }}
                >
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>
                    {t("contactInfo")}
                  </Typography>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{ alignItems: "center" }}
                    >
                      <PhoneIcon sx={{ color: "primary.main" }} />
                      <Typography
                        variant="body2"
                        sx={{ direction: "ltr", flex: 1 }}
                      >
                        {details.phone || "—"}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{ alignItems: "center" }}
                    >
                      <EmailIcon sx={{ color: "primary.main" }} />
                      <Typography
                        variant="body2"
                        sx={{
                          direction: "ltr",
                          flex: 1,
                          wordBreak: "break-all",
                        }}
                      >
                        {details.email || "—"}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ flex: 1, p: 2, borderRadius: 2 }}
                >
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>
                    {t("basePriceShort")}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "baseline" }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "1.5rem",
                        color: "primary.main",
                      }}
                    >
                      {currency(details.base_price)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tCommon("currency")}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    {t("baseFallback")}
                  </Typography>
                </Paper>
              </Stack>

              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  {t("pricingRules")}{" "}
                  <Box
                    component="span"
                    sx={{ color: "text.secondary", fontWeight: 500 }}
                  >
                    ({details.prices?.length ?? 0})
                  </Box>
                </Typography>
                {details.prices && details.prices.length > 0 ? (
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {t("city")}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {t("area")}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">
                            {t("price")}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {details.prices.map((p) => (
                          <TableRow key={p.id} hover>
                            <TableCell>
                              {p.city ? nameOf(p.city) : "—"}
                            </TableCell>
                            <TableCell>
                              {p.area ? (
                                nameOf(p.area)
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
                              {currency(p.price)} {tCommon("currency")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    {t("noPricingRules")}
                  </Alert>
                )}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDetails}>{t("close")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
