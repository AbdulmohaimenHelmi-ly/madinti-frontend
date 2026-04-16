"use client";

import { useTranslations } from "next-intl";
import { Box, Container, Grid, Typography, Link as MuiLink } from "@mui/material";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "primary.main",
        color: "white",
        py: 6,
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              {t("common.appName")}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {t("footer.aboutText")}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              {t("footer.quickLinks")}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <MuiLink
                component={Link}
                href={`/${locale}/products`}
                color="inherit"
                underline="hover"
              >
                {t("common.products")}
              </MuiLink>
              <MuiLink
                component={Link}
                href={`/${locale}/categories`}
                color="inherit"
                underline="hover"
              >
                {t("common.categories")}
              </MuiLink>
              <MuiLink
                component={Link}
                href={`/${locale}/vendors`}
                color="inherit"
                underline="hover"
              >
                {t("common.vendors")}
              </MuiLink>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              {t("footer.contactUs")}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {t("footer.email")}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {t("footer.phone")}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.2)", mt: 4, pt: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} {t("common.appName")}. {t("footer.rights")}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
