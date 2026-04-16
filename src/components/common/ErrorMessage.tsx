"use client";

import { Alert, Box } from "@mui/material";
import { useTranslations } from "next-intl";

interface ErrorMessageProps {
  message?: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  const t = useTranslations("common");

  return (
    <Box sx={{ py: 4 }}>
      <Alert severity="error">{message || t("error")}</Alert>
    </Box>
  );
}
