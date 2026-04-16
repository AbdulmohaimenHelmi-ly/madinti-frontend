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
        py: 12,
        gap: 3,
      }}
    >
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress
          size={56}
          thickness={3}
          sx={{
            color: "primary.main",
            animationDuration: "1.2s",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "primary.main",
              opacity: 0.3,
            }}
          />
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {t("loading")}
      </Typography>
    </Box>
  );
}
