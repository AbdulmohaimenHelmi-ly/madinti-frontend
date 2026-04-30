"use client";

import { Box, InputAdornment, MenuItem, Stack, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import SearchIcon from "@mui/icons-material/Search";

function parseIsoDate(v?: string): Date | null {
  if (!v) return null;
  const [y, m, d] = v.split("-").map((n) => Number(n));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatIsoDate(d: Date | null): string {
  if (!d || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
    <Box
      sx={{
        p: 2,
        mb: 2,
        bgcolor: "white",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          flexWrap: "wrap",
        }}
        useFlexGap
      >
        {onSearchChange !== undefined && (
          <TextField
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
        {selects.map((s) => (
          <TextField
            key={s.key}
            select
            size="small"
            label={s.label}
            value={s.value}
            onChange={(e) => s.onChange(e.target.value)}
            sx={{ minWidth: s.width ?? 160 }}
          >
            {s.options.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        ))}
        {onDateFromChange !== undefined && (
          <DatePicker
            label={dateFromLabel}
            value={parseIsoDate(dateFrom)}
            onChange={(v) => onDateFromChange(formatIsoDate(v))}
            format="dd/MM/yyyy"
            slotProps={{
              textField: { size: "small", sx: { minWidth: 170 } },
              field: { clearable: true },
            }}
          />
        )}
        {onDateToChange !== undefined && (
          <DatePicker
            label={dateToLabel}
            value={parseIsoDate(dateTo)}
            onChange={(v) => onDateToChange(formatIsoDate(v))}
            format="dd/MM/yyyy"
            slotProps={{
              textField: { size: "small", sx: { minWidth: 170 } },
              field: { clearable: true },
            }}
          />
        )}
      </Stack>
    </Box>
  );
}
