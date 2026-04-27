"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  Box,
  Button,
  Paper,
  Popper,
  Typography,
  ClickAwayListener,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CategoryIcon from "@mui/icons-material/Category";
import type { Category } from "@/lib/types";
import { categoriesApi } from "@/lib/api/categories";

export default function CategoriesMegaMenu() {
  const t = useTranslations("common");
  const tHome = useTranslations("home");
  const locale = useLocale();
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [tree, setTree] = useState<Category[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  const active = pathname.startsWith(`/${locale}/categories`);

  useEffect(() => {
    categoriesApi
      .getTree()
      .then((res) => {
        const data = res.data.data ?? [];
        setTree(data);
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch(() => {
        setTree([]);
      });
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  const handleOpen = (event: SyntheticEvent<HTMLElement>) => {
    cancelClose();
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const name = (c: Category) =>
    locale === "en" && c.name_en ? c.name_en : c.name;

  const activeNode = tree.find((c) => c.id === activeId) ?? tree[0] ?? null;
  const children = activeNode?.children ?? [];

  return (
    <Box
      onMouseEnter={handleOpen}
      onMouseLeave={scheduleClose}
      sx={{ position: "relative" }}
    >
      <Button
        component={Link}
        href={`/${locale}/categories`}
        size="small"
        onFocus={handleOpen}
        endIcon={
          <ExpandMoreIcon
            sx={{
              transition: "transform 0.2s ease",
              transform: open ? "rotate(180deg)" : "none",
            }}
          />
        }
        sx={{
          color: "white",
          fontWeight: active ? 700 : 500,
          borderRadius: 100,
          px: 2,
          py: 0.75,
          minWidth: "auto",
          fontSize: "0.875rem",
          bgcolor: active ? "rgba(255,255,255,0.18)" : "transparent",
          "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
          transition: "all 0.2s ease",
        }}
      >
        {t("categories")}
      </Button>

      <Popper
        open={open && tree.length > 0}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
        sx={{ zIndex: (theme) => theme.zIndex.appBar + 1 }}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            elevation={8}
            sx={{
              display: "flex",
              width: { md: 780, lg: 880 },
              maxWidth: "calc(100vw - 32px)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            {/* LEFT: parent categories list */}
            <Box
              sx={{
                width: 220,
                bgcolor: "grey.50",
                py: 1,
                maxHeight: 420,
                overflowY: "auto",
                borderRight: "1px solid",
                borderColor: "divider",
              }}
            >
              {tree.map((c) => {
                const isActive = c.id === activeNode?.id;
                return (
                  <Box
                    key={c.id}
                    onMouseEnter={() => setActiveId(c.id)}
                    component={Link}
                    href={`/${locale}/products?category_id=${c.id}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      px: 2,
                      py: 1.25,
                      textDecoration: "none",
                      color: isActive ? "primary.main" : "text.primary",
                      bgcolor: isActive ? "white" : "transparent",
                      borderLeft: isActive ? "3px solid" : "3px solid transparent",
                      borderLeftColor: isActive ? "primary.main" : "transparent",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.875rem",
                      transition: "all 0.15s ease",
                      "&:hover": { bgcolor: "white", color: "primary.main" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        bgcolor: "grey.200",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {c.image ? (
                        <Box
                          component="img"
                          src={c.image}
                          alt={name(c)}
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <CategoryIcon sx={{ fontSize: 16, color: "grey.500" }} />
                      )}
                    </Box>
                    <Box component="span" sx={{ flex: 1 }}>
                      {name(c)}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* RIGHT: children grid */}
            <Box sx={{ flex: 1, p: 3, maxHeight: 420, overflowY: "auto" }}>
              {activeNode && (
                <>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      textTransform: "uppercase",
                      mb: 2,
                    }}
                  >
                    {tHome("newIn")} {name(activeNode)}
                  </Typography>
                  {children.length > 0 ? (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 2,
                      }}
                    >
                      {children.map((child) => (
                        <Box
                          key={child.id}
                          component={Link}
                          href={`/${locale}/products?category_id=${child.id}`}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                            textDecoration: "none",
                            color: "text.primary",
                            p: 1,
                            borderRadius: 2,
                            transition: "all 0.2s ease",
                            "&:hover": {
                              bgcolor: "grey.50",
                              "& .mm-img": {
                                borderColor: "primary.main",
                                transform: "scale(1.05)",
                              },
                            },
                          }}
                        >
                          <Box
                            className="mm-img"
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: "50%",
                              overflow: "hidden",
                              border: "2px solid",
                              borderColor: "grey.200",
                              bgcolor: "grey.100",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {child.image ? (
                              <Box
                                component="img"
                                src={child.image}
                                alt={name(child)}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <CategoryIcon
                                sx={{ fontSize: 24, color: "grey.500" }}
                              />
                            )}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              textAlign: "center",
                              lineHeight: 1.2,
                            }}
                          >
                            {name(child)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.875rem",
                      }}
                    >
                      {tHome("browseCategory")}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
