"use client";

import { Box, Pagination, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export interface DataPaginationProps {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}

/**
 * Server-side pagination control used by every admin & vendor list page.
 * Hides itself when there's only one page so empty/small lists stay clean.
 */
export default function DataPagination({
  page,
  lastPage,
  total,
  perPage,
  onChange,
}: DataPaginationProps) {
  const tCommon = useTranslations("common");
  if (lastPage <= 1 || total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{
        mt: 2,
        px: 1,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {tCommon("showingRange", { from, to, total })}
      </Typography>
      <Box>
        <Pagination
          page={page}
          count={lastPage}
          onChange={(_, p) => onChange(p)}
          color="primary"
          shape="rounded"
        />
      </Box>
    </Stack>
  );
}
