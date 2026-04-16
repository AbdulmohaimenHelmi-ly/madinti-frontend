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
      <Alert
        severity="error"
        variant="outlined"
        sx={{
          borderRadius: 3,
          "& .MuiAlert-icon": { fontSize: 24 },
        }}
      >
        {message || t("error")}
      </Alert>
    </Box>
  );
}
