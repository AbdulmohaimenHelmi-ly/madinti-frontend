"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

import { adminApi, type BannerPayload } from "@/lib/api/admin";
import type { Banner, BannerPosition, ContentType } from "@/lib/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AudienceChip, { useAudienceOptions } from "@/components/common/AudienceChip";

interface FormState {
  position: BannerPosition;
  title: string;
  title_en: string;
  subtitle: string;
  subtitle_en: string;
  image: string;
  link: string;
  sort_order: string;
  is_active: boolean;
  content_type: ContentType;
}

const emptyForm: FormState = {
  position: "slider",
  title: "",
  title_en: "",
  subtitle: "",
  subtitle_en: "",
  image: "",
  link: "",
  sort_order: "0",
  is_active: true,
  content_type: "unisex",
};

const POSITION_ORDER: BannerPosition[] = [
  "slider",
  "left_1",
  "left_2",
  "left_3",
  "right_1",
  "right_2",
  "right_3",
];

export default function AdminBannersPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tContent = useTranslations("content");
  const locale = useLocale();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [audience, setAudience] = useState<string>("");
  const audienceOptions = useAudienceOptions(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBanners();
      setBanners(res.data.data);
    } catch {
      setError(tCommon("error"));
    } finally {
      setLoading(false);
    }
  }, [tCommon]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = (position: BannerPosition) => {
    setEditing(null);
    setForm({ ...emptyForm, position });
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      position: b.position,
      title: b.title ?? "",
      title_en: b.title_en ?? "",
      subtitle: b.subtitle ?? "",
      subtitle_en: b.subtitle_en ?? "",
      image: b.image,
      link: b.link ?? "",
      sort_order: String(b.sort_order ?? 0),
      is_active: b.is_active,
      content_type: b.content_type ?? "unisex",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.image.trim()) {
      setError(t("imageRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: BannerPayload = {
        position: form.position,
        title: form.title.trim() || null,
        title_en: form.title_en.trim() || null,
        subtitle: form.subtitle.trim() || null,
        subtitle_en: form.subtitle_en.trim() || null,
        image: form.image.trim(),
        link: form.link.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        content_type: form.content_type,
      };
      if (editing) {
        await adminApi.updateBanner(editing.id, payload);
      } else {
        await adminApi.createBanner(payload);
      }
      setSnack(tCommon("save"));
      setDialogOpen(false);
      await load();
    } catch {
      setError(tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (deletingId === null) return;
    try {
      await adminApi.deleteBanner(deletingId);
      setDeletingId(null);
      await load();
    } catch {
      setError(tCommon("error"));
    }
  };

  if (loading) return <LoadingSpinner />;

  const filteredBanners = audience
    ? banners.filter((b) => (b.content_type ?? "unisex") === audience)
    : banners;

  const grouped = POSITION_ORDER.reduce<Record<BannerPosition, Banner[]>>(
    (acc, p) => {
      acc[p] = filteredBanners
        .filter((b) => b.position === p)
        .sort((a, b) => a.sort_order - b.sort_order);
      return acc;
    },
    {} as Record<BannerPosition, Banner[]>
  );

  return (
    <Box>
      <AdminPageHeader
        title={t("banners")}
        subtitle={t("bannersSubtitle")}
      />

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{tContent("contentType")}</InputLabel>
            <Select
              value={audience}
              label={tContent("contentType")}
              onChange={(e) => setAudience(e.target.value)}
            >
              {audienceOptions.map((o) => (
                <MenuItem key={o.value || "all"} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {POSITION_ORDER.map((pos) => {
        const list = grouped[pos];
        const isSlider = pos === "slider";
        return (
          <Paper
            key={pos}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t(`position_${pos}`)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isSlider ? t("sliderHint") : t("singleTileHint")}
                </Typography>
              </Box>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => openCreate(pos)}
              >
                {t("addBanner")}
              </Button>
            </Stack>

            {list.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  color: "text.secondary",
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <ImageNotSupportedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                <Typography variant="body2">{t("noBannerInSlot")}</Typography>
              </Box>
            ) : (
              <Stack
                direction="row"
                spacing={2}
                sx={{ flexWrap: "wrap" }}
                useFlexGap
              >
                {list.map((b) => (
                  <Paper
                    key={b.id}
                    variant="outlined"
                    sx={{
                      width: 260,
                      overflow: "hidden",
                      borderRadius: 2,
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        height: 140,
                        bgcolor: "grey.100",
                      }}
                    >
                      {b.image ? (
                        <Box
                          component="img"
                          src={b.image}
                          alt={b.title ?? ""}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "grey.400",
                          }}
                        >
                          <ImageNotSupportedIcon />
                        </Box>
                      )}
                      {!b.is_active && (
                        <Chip
                          label={t("inactive")}
                          size="small"
                          color="default"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            bgcolor: "rgba(0,0,0,0.7)",
                            color: "white",
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ p: 1.5 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700 }}
                        noWrap
                      >
                        {locale === "en" && b.title_en
                          ? b.title_en
                          : b.title || t("untitled")}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ display: "block" }}
                      >
                        {b.link || "—"}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => openEdit(b)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeletingId(b.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <Box sx={{ flex: 1 }} />
                        <AudienceChip value={b.content_type} />
                        <Chip
                          size="small"
                          label={`#${b.sort_order}`}
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        );
      })}

      {/* Edit/Create Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editing ? t("editBanner") : t("newBanner")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("position")}</InputLabel>
              <Select
                value={form.position}
                label={t("position")}
                onChange={(e) =>
                  setForm({ ...form, position: e.target.value as BannerPosition })
                }
              >
                {POSITION_ORDER.map((p) => (
                  <MenuItem key={p} value={p}>
                    {t(`position_${p}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label={t("imageUrl")}
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              fullWidth
              size="small"
              required
              helperText={t("imageHint")}
            />
            {form.image && (
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  maxHeight: 180,
                  bgcolor: "grey.100",
                }}
              >
                <Box
                  component="img"
                  src={form.image}
                  alt="preview"
                  sx={{
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Box>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("bannerTitle")}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                label={t("bannerTitleEn")}
                value={form.title_en}
                onChange={(e) =>
                  setForm({ ...form, title_en: e.target.value })
                }
                fullWidth
                size="small"
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("subtitle")}
                value={form.subtitle}
                onChange={(e) =>
                  setForm({ ...form, subtitle: e.target.value })
                }
                fullWidth
                size="small"
              />
              <TextField
                label={t("subtitleEn")}
                value={form.subtitle_en}
                onChange={(e) =>
                  setForm({ ...form, subtitle_en: e.target.value })
                }
                fullWidth
                size="small"
              />
            </Stack>

            <TextField
              label={t("link")}
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              fullWidth
              size="small"
              helperText={t("linkHint")}
            />

            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <TextField
                label={t("sortOrder")}
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: e.target.value })
                }
                size="small"
                sx={{ maxWidth: 140 }}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>{tContent("contentType")}</InputLabel>
                <Select
                  label={tContent("contentType")}
                  value={form.content_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content_type: e.target.value as ContentType,
                    })
                  }
                >
                  <MenuItem value="unisex">{tContent("unisex")}</MenuItem>
                  <MenuItem value="female">{tContent("female")}</MenuItem>
                  <MenuItem value="male">{tContent("male")}</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                  />
                }
                label={t("active")}
              />
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            {tCommon("cancel")}
          </Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {tCommon("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deletingId !== null} onClose={() => setDeletingId(null)}>
        <DialogTitle>{t("confirmDeleteBanner")}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeletingId(null)}>
            {tCommon("cancel")}
          </Button>
          <Button color="error" variant="contained" onClick={remove}>
            {tCommon("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack !== null}
        autoHideDuration={2500}
        onClose={() => setSnack(null)}
        message={snack ?? ""}
      />
    </Box>
  );
}
