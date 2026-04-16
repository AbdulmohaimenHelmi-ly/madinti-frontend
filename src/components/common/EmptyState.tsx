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
        py: 8,
        gap: 2,
      }}
    >
      <InboxIcon sx={{ fontSize: 64, color: "text.disabled" }} />
      <Typography variant="h6" color="text.secondary">
        {message || t("noResults")}
      </Typography>
    </Box>
  );
}
