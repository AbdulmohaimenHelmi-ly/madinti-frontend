import { createTheme } from "@mui/material/styles";

export const createAppTheme = (direction: "rtl" | "ltr") =>
  createTheme({
    direction,
    palette: {
      primary: {
        main: "#FFB744",
        light: "#FFD180",
        dark: "#CC8800",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: "#E65100",
        light: "#FF833A",
        dark: "#AC1900",
        contrastText: "#FFFFFF",
      },
      background: { default: "#F5F7FA", paper: "#FFFFFF" },
      text: {
        primary: "#1A2027",
        secondary: "#5A6670",
      },
    },
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
            boxShadow: "0 2px 8px rgba(255, 183, 68, 0.25)",
            "&:hover": {
              boxShadow: "0 4px 16px rgba(255, 183, 68, 0.35)",
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
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
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
                boxShadow: "0 0 0 3px rgba(255, 183, 68, 0.12)",
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
