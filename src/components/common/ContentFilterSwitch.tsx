"use client";

import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import FemaleIcon from "@mui/icons-material/Female";
import MaleIcon from "@mui/icons-material/Male";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import { useTranslations } from "next-intl";
import {
  useContentFilter,
  type ContentFilter,
} from "@/lib/context/ContentFilterContext";

export default function ContentFilterSwitch({
  size = "medium",
  sx,
}: {
  size?: "small" | "medium" | "large";
  sx?: object;
}) {
  const { filter, setFilter } = useContentFilter();
  const t = useTranslations("content");

  const handle = (_: unknown, value: ContentFilter | null) => {
    if (value) setFilter(value);
  };

  return (
    <Box sx={sx}>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={handle}
        size={size}
        sx={{
          borderRadius: 100,
          bgcolor: "white",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          p: 0.5,
          "& .MuiToggleButton-root": {
            border: "none",
            borderRadius: "100px !important",
            px: 2.5,
            py: 1,
            textTransform: "none",
            fontWeight: 700,
            color: "text.secondary",
            gap: 0.75,
            "&.Mui-selected": {
              bgcolor: "primary.main",
              color: "white",
              "&:hover": { bgcolor: "primary.dark" },
            },
          },
        }}
      >
        <ToggleButton value="all">
          <AllInclusiveIcon fontSize="small" />
          {t("all")}
        </ToggleButton>
        <ToggleButton value="female">
          <FemaleIcon fontSize="small" />
          {t("female")}
        </ToggleButton>
        <ToggleButton value="male">
          <MaleIcon fontSize="small" />
          {t("male")}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
