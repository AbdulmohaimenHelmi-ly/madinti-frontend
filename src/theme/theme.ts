import { createTheme, type PaletteOptions } from "@mui/material/styles";
import type { ContentFilter } from "@/lib/context/ContentFilterContext";

type PaletteKey = "female" | "male" | "neutral";

const PALETTES: Record<PaletteKey, PaletteOptions> = {
  // Feminine: refined pink / rose
  female: {
    primary: {
      main: "#D81B60",
      light: "#F06292",
      dark: "#880E4F",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#C48B6B",
      light: "#E6B8A2",
      dark: "#8D5A3C",
      contrastText: "#FFFFFF",
    },
    background: { default: "#FFF7FA", paper: "#FFFFFF" },
    text: { primary: "#2A1A23", secondary: "#6B5560" },
  },
  // Masculine: deep navy / slate
  male: {
    primary: {
      main: "#1E3A5F",
      light: "#3B5998",
      dark: "#0D1F33",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#546E7A",
      light: "#819CA9",
      dark: "#29434E",
      contrastText: "#FFFFFF",
    },
    background: { default: "#F4F6F9", paper: "#FFFFFF" },
    text: { primary: "#101827", secondary: "#455566" },
  },
  // Neutral (all / unisex): calm teal + warm neutrals
  neutral: {
    primary: {
      main: "#00796B",
      light: "#26A69A",
      dark: "#004D40",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#8D6E63",
      light: "#BCAAA4",
      dark: "#5D4037",
      contrastText: "#FFFFFF",
    },
    background: { default: "#F5F7FA", paper: "#FFFFFF" },
    text: { primary: "#1A2027", secondary: "#5A6670" },
  },
};

function resolvePaletteKey(filter: ContentFilter): PaletteKey {
  if (filter === "female") return "female";
  if (filter === "male") return "male";
  return "neutral";
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16);
  const g = parseInt(m.substring(2, 4), 16);
  const b = parseInt(m.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const createAppTheme = (
  direction: "rtl" | "ltr",
  contentFilter: ContentFilter = "all"
) => {
  const key = resolvePaletteKey(contentFilter);
  const palette = PALETTES[key];
  const primaryMain = (palette.primary as { main: string }).main;
  const shadowSoft = hexToRgba(primaryMain, 0.25);
  const shadowMedium = hexToRgba(primaryMain, 0.35);
  const focusRing = hexToRgba(primaryMain, 0.12);

  return createTheme({
    direction,
    palette,
    typography: {
      fontFamily:
        direction === "rtl"
          ? '"Tajawal", "Cairo", "Arial", sans-serif'
          : '"Inter", "Roboto", "Arial", sans-serif',
      h1: { fontWeight: 800, letterSpacing: "-0.02em" },
      h2: { fontWeight: 800, letterSpacing: "-0.01em" },
      h3: { fontWeight: 700, letterSpacing: "-0.01em" },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 12,
            padding: "8px 20px",
            transition: "all 0.2s ease-in-out",
          },
          contained: {
            boxShadow: `0 2px 8px ${shadowSoft}`,
            "&:hover": {
              boxShadow: `0 4px 16px ${shadowMedium}`,
              transform: "translateY(-1px)",
            },
          },
          outlined: {
            borderWidth: "1.5px",
            "&:hover": {
              borderWidth: "1.5px",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.04)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: 10,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              transition: "box-shadow 0.2s ease",
              "&.Mui-focused": {
                boxShadow: `0 0 0 3px ${focusRing}`,
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: "none",
          },
        },
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            "& .MuiPaginationItem-root": {
              borderRadius: 10,
              fontWeight: 500,
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
          },
        },
      },
    },
  });
};
