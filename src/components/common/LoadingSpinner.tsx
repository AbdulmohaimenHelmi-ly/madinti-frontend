"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export default function LoadingSpinner() {
  const t = useTranslations("common");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        gap: 2,
      }}
    >
      <CircularProgress color="primary" />
      <Typography variant="body2" color="text.secondary">
        {t("loading")}
      </Typography>
    </Box>
  );
}
