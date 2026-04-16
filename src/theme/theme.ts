import { createTheme } from "@mui/material/styles";

export const createAppTheme = (direction: "rtl" | "ltr") =>
  createTheme({
    direction,
    palette: {
      primary: { main: "#1B5E20" },
      secondary: { main: "#BF360C" },
      background: { default: "#FAFAFA", paper: "#FFFFFF" },
    },
    typography: {
      fontFamily:
        direction === "rtl"
          ? '"Tajawal", "Cairo", "Arial", sans-serif'
          : '"Inter", "Roboto", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 500 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          },
        },
      },
    },
  });
