"use client";

import { useTranslations, useLocale } from "next-intl";
import { Alert, Box, Button, Container, Stack } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/authStore";

export default function ImpersonationBanner() {
  const t = useTranslations("common");
  const impersonator = useAuthStore((s) => s.impersonator);
  const user = useAuthStore((s) => s.user);
  const stopImpersonation = useAuthStore((s) => s.stopImpersonation);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  if (!impersonator || !user) return null;

  const handleStop = () => {
    stopImpersonation();
    if (pathname?.startsWith(`/${locale}/admin`)) {
      router.refresh();
    } else {
      router.push(`/${locale}/admin/users`);
    }
  };

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1,
      }}
    >
      <Alert
        severity="warning"
        icon={false}
        sx={{
          borderRadius: 0,
          bgcolor: "#6B21A8",
          color: "white",
          "& .MuiAlert-message": { width: "100%" },
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Box sx={{ fontWeight: 600 }}>
              {t("impersonatingAs", { name: user.name })}
            </Box>
            <Button
              size="small"
              variant="contained"
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleStop}
              sx={{
                bgcolor: "white",
                color: "#6B21A8",
                fontWeight: 700,
                "&:hover": { bgcolor: "#F3E8FF" },
              }}
            >
              {t("stopImpersonating")}
            </Button>
          </Stack>
        </Container>
      </Alert>
    </Box>
  );
}
