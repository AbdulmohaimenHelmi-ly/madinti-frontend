"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronUp, ChevronDown, Check, Square, CheckSquare, Circle, CheckCircle } from "lucide-react";
import type { Brand, Category, ProductOption } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FilterState {
  categoryId: string;
  brandIds: number[];
  optionValueIds: number[];
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
  priceBounds: { min: number; max: number };
}

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
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between py-3 select-none"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-sm font-bold tracking-wide">{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="pb-4">{children}</div>}
      <hr className="border-gray-200" />
    </div>
  );
}

function isDarkSwatch(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
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
    () => options.filter((o) => o.id !== colorOption?.id && o.id !== sizeOption?.id),
    [options, colorOption, sizeOption]
  );

  const labelOf = (item: { name?: string; name_en?: string | null; value?: string; value_en?: string | null }): string => {
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

  const commitPrice = () => {
    const [lo, hi] = priceRange;
    onChange({
      ...value,
      priceMin: lo > priceBounds.min ? lo : "",
      priceMax: hi < priceBounds.max ? hi : "",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between pb-3">
        <span className="text-lg font-extrabold">{t("product.filter") || "Filter"}</span>
        {activeCount > 0 && (
          <button
            type="button"
            className="text-sm font-bold hover:underline"
            style={{ color: "var(--color-primary)" }}
            onClick={() => {
              onChange(emptyFilterState());
              setPriceRange([priceBounds.min, priceBounds.max]);
            }}
          >
            {t("product.clearAll") || "Clear all"}
          </button>
        )}
      </div>
      <hr className="border-gray-200 mb-1" />

      {categories.length > 0 && (
        <FilterSection title={t("product.category") || "Category"}>
          <div className="flex flex-col gap-1.5">
            {[{ id: "", name: t("category.allCategories") || "All categories" } as { id: string | number; name: string }, ...categories.map(c => ({ id: c.id, name: labelOf(c) }))].map((cat) => {
              const selected = value.categoryId === String(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="flex items-center gap-2 text-sm py-0.5 w-full text-start"
                  onClick={() => onChange({ ...value, categoryId: String(cat.id === "" ? "" : cat.id) })}
                >
                  {selected
                    ? <CheckCircle size={15} style={{ color: "var(--color-primary)" }} />
                    : <Circle size={15} className="text-gray-300" />}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {colorOption && colorOption.values.length > 0 && (
        <FilterSection title={t("product.color") || "Color"}>
          <div className="flex flex-wrap gap-2">
            {colorOption.values.map((val) => {
              const selected = value.optionValueIds.includes(val.id);
              const swatchColor = val.hex_color || "#E0E0E0";
              return (
                <button
                  key={val.id}
                  type="button"
                  title={labelOf(val)}
                  onClick={() => onChange({ ...value, optionValueIds: toggleId(value.optionValueIds, val.id) })}
                  className="relative w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    backgroundColor: swatchColor,
                    border: selected ? `2px solid var(--color-primary)` : "1px solid rgba(0,0,0,0.15)",
                    boxShadow: selected ? "0 0 0 2px white inset" : "none",
                  }}
                >
                  {selected && (
                    <Check size={13} style={{ color: isDarkSwatch(swatchColor) ? "#fff" : "#000" }} />
                  )}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {sizeOption && sizeOption.values.length > 0 && (
        <FilterSection title={t("product.size") || "Size"}>
          <div className="flex flex-wrap gap-1.5">
            {sizeOption.values.map((val) => {
              const selected = value.optionValueIds.includes(val.id);
              return (
                <button
                  key={val.id}
                  type="button"
                  onClick={() => onChange({ ...value, optionValueIds: toggleId(value.optionValueIds, val.id) })}
                  className={cn(
                    "min-w-[44px] rounded px-3 py-1 text-sm font-semibold border transition",
                    selected ? "text-white border-transparent" : "bg-gray-100 border-transparent hover:bg-gray-200"
                  )}
                  style={selected ? { backgroundColor: "var(--color-primary)" } : {}}
                >
                  {labelOf(val)}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {otherOptions.map((opt) =>
        opt.values.length > 0 ? (
          <FilterSection key={opt.id} title={labelOf(opt)} defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {opt.values.map((val) => {
                const selected = value.optionValueIds.includes(val.id);
                return (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() => onChange({ ...value, optionValueIds: toggleId(value.optionValueIds, val.id) })}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                      selected ? "text-white border-transparent" : "border-gray-200 hover:border-gray-400"
                    )}
                    style={selected ? { backgroundColor: "var(--color-primary)" } : {}}
                  >
                    {labelOf(val)}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        ) : null
      )}

      {brands.length > 0 && (
        <FilterSection title={t("product.brand") || "Brand"} defaultOpen={false}>
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pe-1">
            {brands.map((b) => {
              const selected = value.brandIds.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  className="flex items-center gap-2 text-sm py-0.5 w-full text-start"
                  onClick={() => onChange({ ...value, brandIds: toggleId(value.brandIds, b.id) })}
                >
                  {selected
                    ? <CheckSquare size={15} style={{ color: "var(--color-primary)" }} />
                    : <Square size={15} className="text-gray-300" />}
                  {labelOf(b)}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title={t("product.price") || "Price"}>
        <div className="px-1">
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            value={priceRange[1]}
            onChange={(e) => setPriceRange(([lo]) => [lo, Number(e.target.value)])}
            onMouseUp={commitPrice}
            onTouchEnd={commitPrice}
            className="w-full accent-[var(--color-primary)]"
          />
          <div className="flex gap-2 mt-2">
            <div className="flex-1 relative">
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm pe-10"
                placeholder={t("product.min") || "Min"}
                value={priceRange[0]}
                onChange={(e) => setPriceRange(([, hi]) => [Number(e.target.value || 0), hi])}
                onBlur={commitPrice}
              />
              <span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{t("common.currency") || ""}</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm pe-10"
                placeholder={t("product.max") || "Max"}
                value={priceRange[1]}
                onChange={(e) => setPriceRange(([lo]) => [lo, Number(e.target.value || 0)])}
                onBlur={commitPrice}
              />
              <span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{t("common.currency") || ""}</span>
            </div>
          </div>
        </div>
      </FilterSection>

      <div className="pt-3 flex items-center justify-between">
        <span className="text-sm font-semibold">{t("product.inStockOnly") || "In stock only"}</span>
        <button
          type="button"
          role="switch"
          aria-checked={value.inStock}
          onClick={() => onChange({ ...value, inStock: !value.inStock })}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200",
            value.inStock ? "bg-[var(--color-primary)]" : "bg-gray-200"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
              value.inStock ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
    </div>
  );
}
