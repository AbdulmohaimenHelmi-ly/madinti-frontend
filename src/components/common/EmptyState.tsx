"use client";

import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import { useTranslations } from "next-intl";

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  const t = useTranslations("common");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 10,
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          bgcolor: "grey.100",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1,
        }}
      >
        <InboxIcon sx={{ fontSize: 48, color: "text.disabled" }} />
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
        {message || t("noResults")}
      </Typography>
      <Typography variant="body2" color="text.disabled">
        {t("noResults")}
      </Typography>
    </Box>
  );
}
