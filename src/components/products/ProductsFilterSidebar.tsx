"use client";

/**
 * SHEIN-style filter sidebar for the storefront products listing.
 *
 * Renders a sticky vertical column of collapsible groups: Category, Brand,
 * Color (swatches), Size (chips), Price range, In-stock toggle. Designed to
 * fit a 280px column on the products page (and to be reusable inside a Drawer
 * on mobile via the same component).
 */
import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Box,
  Stack,
  Typography,
  Divider,
  IconButton,
  Collapse,
  Slider,
  TextField,
  InputAdornment,
  FormControlLabel,
  Switch,
  Button,
  Chip,
  Tooltip,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckIcon from "@mui/icons-material/Check";
import type { Brand, Category, ProductOption } from "@/lib/types";

export interface FilterState {
  categoryId: string; // single select; "" == all
  brandIds: number[]; // multi
  optionValueIds: number[]; // multi (color + size + ...)
  priceMin: number | "";
  priceMax: number | "";
  inStock: boolean;
}

export const emptyFilterState = (): FilterState => ({
  categoryId: "",
  brandIds: [],
  optionValueIds: [],
  priceMin: "",
  priceMax: "",
  inStock: false,
});

interface Props {
  categories: Category[];
  brands: Brand[];
  options: ProductOption[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  /** Range bounds for the price slider; computed from the catalog. */
  priceBounds: { min: number; max: number };
}

/**
 * Section wrapper: bold title with collapse toggle, hairline divider below.
 * Matches the SHEIN look (uppercase title, +/- chevron on right).
 */
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.5,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: 0.3,
            color: "text.primary",
          }}
        >
          {title}
        </Typography>
        <IconButton size="small" sx={{ p: 0.25 }} aria-label={title}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ pb: 2 }}>{children}</Box>
      </Collapse>
      <Divider sx={{ borderColor: "grey.200" }} />
    </Box>
  );
}

export default function ProductsFilterSidebar({
  categories,
  brands,
  options,
  value,
  onChange,
  priceBounds,
}: Props) {
  const t = useTranslations();
  const locale = useLocale();

  // Local price slider state — only commits to parent on `onChangeCommitted`
  // so we don't refetch on every drag tick.
  const [priceRange, setPriceRange] = useState<[number, number]>([
    typeof value.priceMin === "number" ? value.priceMin : priceBounds.min,
    typeof value.priceMax === "number" ? value.priceMax : priceBounds.max,
  ]);

  const colorOption = useMemo(
    () => options.find((o) => /color|لون/i.test(o.name) || (o.name_en && /color/i.test(o.name_en))),
    [options]
  );
  const sizeOption = useMemo(
    () => options.find((o) => /size|مقاس|حجم/i.test(o.name) || (o.name_en && /size/i.test(o.name_en))),
    [options]
  );
  const otherOptions = useMemo(
    () =>
      options.filter(
        (o) => o.id !== colorOption?.id && o.id !== sizeOption?.id
      ),
    [options, colorOption, sizeOption]
  );

  const labelOf = (
    item: { name?: string; name_en?: string | null; value?: string; value_en?: string | null }
  ): string => {
    if (locale === "en") return (item.name_en || item.value_en || item.name || item.value || "") as string;
    return (item.name || item.value || item.name_en || item.value_en || "") as string;
  };

  const toggleId = (list: number[], id: number): number[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const activeCount =
    (value.categoryId ? 1 : 0) +
    value.brandIds.length +
    value.optionValueIds.length +
    (value.priceMin !== "" || value.priceMax !== "" ? 1 : 0) +
    (value.inStock ? 1 : 0);

  return (
    <Box
      sx={{
        bgcolor: "white",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "grey.200",
        p: 2,
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
          {t("product.filter") || "Filter"}
        </Typography>
        {activeCount > 0 && (
          <Button
            size="small"
            color="primary"
            onClick={() => {
              onChange(emptyFilterState());
              setPriceRange([priceBounds.min, priceBounds.max]);
            }}
            sx={{ fontWeight: 700, textTransform: "none" }}
          >
            {t("product.clearAll") || "Clear all"}
          </Button>
        )}
      </Stack>
      <Divider sx={{ borderColor: "grey.200", mb: 0.5 }} />

      {/* Category — single select radio list */}
      {categories.length > 0 && (
        <FilterSection title={t("product.category") || "Category"}>
          <Stack spacing={0.75}>
            <Stack
              direction="row"
              sx={{ alignItems: "center", cursor: "pointer", py: 0.25 }}
              onClick={() => onChange({ ...value, categoryId: "" })}
            >
              {value.categoryId === "" ? (
                <RadioButtonCheckedIcon fontSize="small" color="primary" />
              ) : (
                <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "grey.400" }} />
              )}
              <Typography sx={{ ml: 1, fontSize: 14 }}>
                {t("category.allCategories") || "All categories"}
              </Typography>
            </Stack>
            {categories.map((cat) => {
              const selected = value.categoryId === String(cat.id);
              return (
                <Stack
                  key={cat.id}
                  direction="row"
                  sx={{ alignItems: "center", cursor: "pointer", py: 0.25 }}
                  onClick={() => onChange({ ...value, categoryId: String(cat.id) })}
                >
                  {selected ? (
                    <RadioButtonCheckedIcon fontSize="small" color="primary" />
                  ) : (
                    <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "grey.400" }} />
                  )}
                  <Typography sx={{ ml: 1, fontSize: 14 }}>{labelOf(cat)}</Typography>
                </Stack>
              );
            })}
          </Stack>
        </FilterSection>
      )}

      {/* Color — swatch grid; tick mark when selected */}
      {colorOption && colorOption.values.length > 0 && (
        <FilterSection title={t("product.color") || "Color"}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {colorOption.values.map((val) => {
              const selected = value.optionValueIds.includes(val.id);
              const swatchColor = val.hex_color || "#E0E0E0";
              return (
                <Tooltip key={val.id} title={labelOf(val)}>
                  <Box
                    onClick={() =>
                      onChange({
                        ...value,
                        optionValueIds: toggleId(value.optionValueIds, val.id),
                      })
                    }
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: swatchColor,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: selected
                        ? "2px solid"
                        : "1px solid rgba(0,0,0,0.15)",
                      borderColor: selected ? "primary.main" : "rgba(0,0,0,0.15)",
                      boxShadow: selected
                        ? "0 0 0 2px rgba(255,255,255,1) inset"
                        : "none",
                      transition: "all 120ms",
                      "&:hover": {
                        transform: "scale(1.07)",
                      },
                    }}
                  >
                    {selected && (
                      <CheckIcon
                        sx={{
                          fontSize: 16,
                          color: isDarkSwatch(swatchColor) ? "#fff" : "#000",
                        }}
                      />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </FilterSection>
      )}

      {/* Size — squarish chips */}
      {sizeOption && sizeOption.values.length > 0 && (
        <FilterSection title={t("product.size") || "Size"}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {sizeOption.values.map((val) => {
              const selected = value.optionValueIds.includes(val.id);
              return (
                <Chip
                  key={val.id}
                  label={labelOf(val)}
                  clickable
                  onClick={() =>
                    onChange({
                      ...value,
                      optionValueIds: toggleId(value.optionValueIds, val.id),
                    })
                  }
                  sx={{
                    minWidth: 44,
                    borderRadius: 1,
                    fontWeight: 600,
                    bgcolor: selected ? "primary.main" : "grey.100",
                    color: selected ? "white" : "text.primary",
                    border: selected
                      ? "1px solid"
                      : "1px solid transparent",
                    borderColor: selected ? "primary.main" : "transparent",
                    "&:hover": {
                      bgcolor: selected ? "primary.dark" : "grey.200",
                    },
                  }}
                />
              );
            })}
          </Box>
        </FilterSection>
      )}

      {/* Other generic option groups (Material, Style, ...) as chip lists */}
      {otherOptions.map(
        (opt) =>
          opt.values.length > 0 && (
            <FilterSection key={opt.id} title={labelOf(opt)} defaultOpen={false}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {opt.values.map((val) => {
                  const selected = value.optionValueIds.includes(val.id);
                  return (
                    <Chip
                      key={val.id}
                      label={labelOf(val)}
                      clickable
                      size="small"
                      variant={selected ? "filled" : "outlined"}
                      color={selected ? "primary" : "default"}
                      onClick={() =>
                        onChange({
                          ...value,
                          optionValueIds: toggleId(value.optionValueIds, val.id),
                        })
                      }
                    />
                  );
                })}
              </Box>
            </FilterSection>
          )
      )}

      {/* Brand — checkbox list */}
      {brands.length > 0 && (
        <FilterSection title={t("product.brand") || "Brand"} defaultOpen={false}>
          <Stack spacing={0.5} sx={{ maxHeight: 220, overflowY: "auto", pr: 0.5 }}>
            {brands.map((b) => {
              const selected = value.brandIds.includes(b.id);
              return (
                <Stack
                  key={b.id}
                  direction="row"
                  sx={{ alignItems: "center", cursor: "pointer", py: 0.25 }}
                  onClick={() =>
                    onChange({ ...value, brandIds: toggleId(value.brandIds, b.id) })
                  }
                >
                  {selected ? (
                    <CheckBoxIcon fontSize="small" color="primary" />
                  ) : (
                    <CheckBoxOutlineBlankIcon fontSize="small" sx={{ color: "grey.400" }} />
                  )}
                  <Typography sx={{ ml: 1, fontSize: 14 }}>{labelOf(b)}</Typography>
                </Stack>
              );
            })}
          </Stack>
        </FilterSection>
      )}

      {/* Price — slider + min/max inputs */}
      <FilterSection title={t("product.price") || "Price"}>
        <Box sx={{ px: 0.5 }}>
          <Slider
            value={priceRange}
            min={priceBounds.min}
            max={priceBounds.max}
            onChange={(_, v) => setPriceRange(v as [number, number])}
            onChangeCommitted={(_, v) => {
              const [lo, hi] = v as [number, number];
              onChange({
                ...value,
                priceMin: lo > priceBounds.min ? lo : "",
                priceMax: hi < priceBounds.max ? hi : "",
              });
            }}
            valueLabelDisplay="auto"
            size="small"
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField
              size="small"
              type="number"
              placeholder={t("product.min") || "Min"}
              value={priceRange[0]}
              onChange={(e) =>
                setPriceRange(([_, hi]) => [Number(e.target.value || 0), hi])
              }
              onBlur={() => {
                const [lo, hi] = priceRange;
                onChange({
                  ...value,
                  priceMin: lo > priceBounds.min ? lo : "",
                  priceMax: hi < priceBounds.max ? hi : "",
                });
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {t("common.currency") || ""}
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              size="small"
              type="number"
              placeholder={t("product.max") || "Max"}
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange(([lo]) => [lo, Number(e.target.value || 0)])
              }
              onBlur={() => {
                const [lo, hi] = priceRange;
                onChange({
                  ...value,
                  priceMin: lo > priceBounds.min ? lo : "",
                  priceMax: hi < priceBounds.max ? hi : "",
                });
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {t("common.currency") || ""}
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </Box>
      </FilterSection>

      {/* In-stock toggle */}
      <Box sx={{ pt: 1.5 }}>
        <FormControlLabel
          control={
            <Switch
              checked={value.inStock}
              onChange={(_, v) => onChange({ ...value, inStock: v })}
            />
          }
          label={
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {t("product.inStockOnly") || "In stock only"}
            </Typography>
          }
        />
      </Box>
    </Box>
  );
}

/**
 * Decide tick-mark color for a swatch: dark hex -> white tick, light -> black.
 */
function isDarkSwatch(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  // Perceived luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.55;
}
