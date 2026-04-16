"use client";

import { Box, InputAdornment, MenuItem, Stack, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

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
        alignItems={{ xs: "stretch", sm: "center" }}
        flexWrap="wrap"
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
          <TextField
            type="date"
            size="small"
            label={dateFromLabel}
            value={dateFrom ?? ""}
            onChange={(e) => onDateFromChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 170 }}
          />
        )}
        {onDateToChange !== undefined && (
          <TextField
            type="date"
            size="small"
            label={dateToLabel}
            value={dateTo ?? ""}
            onChange={(e) => onDateToChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 170 }}
          />
        )}
      </Stack>
    </Box>
  );
}
