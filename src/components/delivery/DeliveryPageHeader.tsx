"use client";

import { Box, Breadcrumbs, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

export interface DeliveryPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  };
}

export default function DeliveryPageHeader({
  title,
  subtitle,
  breadcrumb,
  action,
}: DeliveryPageHeaderProps) {
  const locale = useLocale();
  const t = useTranslations("delivery");
  const Chevron = locale === "ar" ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs
        separator={<Chevron fontSize="small" />}
        sx={{ mb: 1, "& a": { color: "text.secondary", textDecoration: "none" } }}
      >
        <Link href={`/${locale}/delivery`}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <HomeIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">{t("panel")}</Typography>
          </Stack>
        </Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
          {breadcrumb ?? title}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {action &&
          (action.href ? (
            <Button
              component={Link}
              href={action.href}
              variant="contained"
              startIcon={action.icon}
              disabled={action.disabled}
              sx={{ borderRadius: 2, px: 2.5, py: 1, flexShrink: 0 }}
            >
              {action.label}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={action.onClick}
              startIcon={action.icon}
              disabled={action.disabled}
              sx={{ borderRadius: 2, px: 2.5, py: 1, flexShrink: 0 }}
            >
              {action.label}
            </Button>
          ))}
      </Stack>
    </Box>
  );
}