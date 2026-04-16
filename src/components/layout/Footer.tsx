"use client";

import { useTranslations } from "next-intl";
import {
  Box,
  Container,
  Grid,
  Typography,
  Link as MuiLink,
  IconButton,
  Stack,
} from "@mui/material";
import { useLocale } from "next-intl";
import Link from "next/link";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  const linkStyle = {
    opacity: 0.8,
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    "&:hover": { opacity: 1, transform: "translateX(4px)" },
  };

  return (
    <Box
      component="footer"
      sx={{
        background: "linear-gradient(135deg, #FFB744 0%, #E6A33E 40%, #FFB744 100%)",
        color: "white",
        pt: { xs: 6, md: 8 },
        pb: 4,
        mt: 10,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #E65100, #FF833A, #E65100)",
        },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 800,
                background: "linear-gradient(135deg, #FFFFFF 0%, #C8E6C9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("common.appName")}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, lineHeight: 1.8, mb: 3 }}>
              {t("footer.aboutText")}
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton
                size="small"
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
                aria-label="Facebook"
              >
                <FacebookIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
                aria-label="Instagram"
              >
                <InstagramIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
                aria-label="X"
              >
                <XIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 700, mb: 2 }}
            >
              {t("footer.quickLinks")}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <MuiLink
                component={Link}
                href={`/${locale}/products`}
                color="inherit"
                underline="none"
                sx={linkStyle}
              >
                {t("common.products")}
              </MuiLink>
              <MuiLink
                component={Link}
                href={`/${locale}/categories`}
                color="inherit"
                underline="none"
                sx={linkStyle}
              >
                {t("common.categories")}
              </MuiLink>
              <MuiLink
                component={Link}
                href={`/${locale}/vendors`}
                color="inherit"
                underline="none"
                sx={linkStyle}
              >
                {t("common.vendors")}
              </MuiLink>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 700, mb: 2 }}
            >
              {t("footer.contactUs")}
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, opacity: 0.85 }}>
                <EmailIcon fontSize="small" />
                <Typography variant="body2">
                  {t("footer.email")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, opacity: 0.85 }}>
                <PhoneIcon fontSize="small" />
                <Typography variant="body2">
                  {t("footer.phone")}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Box
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.15)",
            mt: 6,
            pt: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.6, fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} {t("common.appName")}. {t("footer.rights")}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
