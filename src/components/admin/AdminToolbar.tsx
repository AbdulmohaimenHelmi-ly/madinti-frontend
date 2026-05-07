"use client";

import { Search } from "lucide-react";

export interface AdminToolbarOption {
  value: string;
  label: string;
}

export interface AdminToolbarSelect {
  key: string;
  label: string;
  value: string;
  options: AdminToolbarOption[];
  onChange: (value: string) => void;
  width?: number;
}

export interface AdminToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  selects?: AdminToolbarSelect[];
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  dateFromLabel?: string;
  dateToLabel?: string;
}

export default function AdminToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  selects = [],
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  dateFromLabel,
  dateToLabel,
}: AdminToolbarProps) {
  return (
    <div className="p-4 mb-4 bg-white rounded-2xl border border-gray-100">
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute top-1/2 start-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>
        )}
        {selects.map((s) => (
          <div key={s.key} className="min-w-[160px]">
            <select
              value={s.value}
              onChange={(e) => s.onChange(e.target.value)}
              title={s.label}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              style={s.width ? { minWidth: s.width } : {}}
            >
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
        {onDateFromChange !== undefined && (
          <div className="min-w-[170px]">
            {dateFromLabel && <label className="block text-xs text-gray-500 mb-0.5">{dateFromLabel}</label>}
            <input
              type="date"
              value={dateFrom ?? ""}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        )}
        {onDateToChange !== undefined && (
          <div className="min-w-[170px]">
            {dateToLabel && <label className="block text-xs text-gray-500 mb-0.5">{dateToLabel}</label>}
            <input
              type="date"
              value={dateTo ?? ""}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
