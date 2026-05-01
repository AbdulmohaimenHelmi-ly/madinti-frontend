"use client";

import { useTranslations } from "next-intl";
import { Box, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FemaleRoundedIcon from "@mui/icons-material/FemaleRounded";
import MaleRoundedIcon from "@mui/icons-material/MaleRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import { useContentFilter, type ContentFilter } from "@/lib/context/ContentFilterContext";

const SEGMENTS: { key: ContentFilter; Icon: React.ElementType; labelKey: string }[] = [
  { key: "female", Icon: FemaleRoundedIcon, labelKey: "female" },
  { key: "male",   Icon: MaleRoundedIcon,   labelKey: "male"   },
  { key: "all",    Icon: WcRoundedIcon,     labelKey: "all"    },
];

export default function MobileAudienceIconBar() {
  const { filter, setFilter } = useContentFilter();
  const theme = useTheme();
  const t = useTranslations("common");

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        bgcolor: "#F5F0F2",
        borderRadius: 100,
        border: "1px solid #EDE7E9",
        p: "3px",
        height: 40,
      }}
    >
      {SEGMENTS.map(({ key, Icon, labelKey }) => {
        const active = key === filter;
        return (
          <Tooltip key={key} title={t(labelKey)} arrow>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => setFilter(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setFilter(key);
              }}
              sx={{
                width: 42,
                height: 34,
                borderRadius: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                background: active
                  ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${
                      (theme.palette as { secondary?: { main?: string } }).secondary?.main ??
                      theme.palette.primary.dark
                    })`
                  : "transparent",
                boxShadow: active
                  ? `0 4px 10px ${theme.palette.primary.main}52`
                  : "none",
              }}
            >
              <Icon
                sx={{
                  fontSize: 19,
                  color: active ? "white" : "#6B6B6B",
                  transition: "color 0.22s ease",
                  display: "block",
                }}
              />
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}
