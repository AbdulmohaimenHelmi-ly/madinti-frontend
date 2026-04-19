"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SaveIcon from "@mui/icons-material/Save";

import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { deliveryApi, type DeliveryCompany } from "@/lib/api/delivery";

export default function VendorCarriersPage() {
  const t = useTranslations("vendor");
  const tDel = useTranslations("delivery");
  const locale = useLocale();

  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([deliveryApi.list(), deliveryApi.vendorTrustedIds()])
      .then(([list, ids]) => {
        setCompanies(list.data.data);
        setSelected(new Set(ids.data.data.delivery_company_ids));
      })
      .catch(() => setError(tDel("loadError")))
      .finally(() => setLoading(false));
  }, [tDel]);

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

  return (
    <Box>
      <VendorPageHeader title={t("trustedCarriers")} subtitle={t("trustedCarriersSubtitle")} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : companies.length === 0 ? (
        <Alert severity="info">{t("noCarriers")}</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {companies.map((c) => {
              const isSel = selected.has(c.id);
              const name = locale === "en" && c.name_en ? c.name_en : c.name;
              const desc = locale === "en" && c.description_en ? c.description_en : c.description;
              return (
                <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    onClick={() => toggle(c.id)}
                    sx={(theme) => ({
                      cursor: "pointer",
                      borderRadius: 3,
                      border: "2px solid",
                      borderColor: isSel ? theme.palette.primary.main : "divider",
                      transition: "all 0.2s",
                      bgcolor: isSel ? `${theme.palette.primary.main}08` : "white",
                      "&:hover": { borderColor: theme.palette.primary.main },
                    })}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Checkbox
                          checked={isSel}
                          onChange={() => toggle(c.id)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ p: 0, mt: 0.5 }}
                        />
                        <Avatar
                          src={c.logo || undefined}
                          sx={{ bgcolor: "primary.main", width: 44, height: 44 }}
                        >
                          <LocalShippingIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800 }} noWrap>
                            {name}
                          </Typography>
                          {desc && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                fontSize: "0.8rem",
                                mt: 0.25,
                              }}
                            >
                              {desc}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {tDel("basePrice")}: <b>{Number(c.base_price).toFixed(2)}</b>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              · {tDel("pricesCount")}: <b>{c.prices_count ?? 0}</b>
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={onSave}
              disabled={saving}
              startIcon={<SaveIcon />}
            >
              {saving ? tDel("saving") : tDel("save")}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}
