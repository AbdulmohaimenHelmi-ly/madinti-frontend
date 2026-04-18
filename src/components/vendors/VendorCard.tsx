"use client";

import { useState, MouseEvent } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Rating,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import GroupIcon from "@mui/icons-material/Group";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Vendor } from "@/lib/types";
import { vendorsApi } from "@/lib/api/vendors";
import { useAuthStore } from "@/lib/store/authStore";

interface VendorCardProps {
  vendor: Vendor;
  /** Optional callback so the parent list can react to a block toggle. */
  onBlockChange?: (vendorId: number, blocked: boolean) => void;
}

const BANNER_HEIGHT = 110;
const LOGO_SIZE = 84;
// How much of the logo overlaps the banner; the rest sits inside the body so
// the entire avatar (and its border) is always fully visible.
const LOGO_OVERLAP = 28;

/** Compact a number like 12_345 -> "12.3k". */
function fmtCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000) return Math.round(n / 1000) + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

export default function VendorCard({ vendor, onBlockChange }: VendorCardProps) {
  const locale = useLocale();
  const t = useTranslations("vendor");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isFollowing, setIsFollowing] = useState(!!vendor.is_following);
  const [isBlocked, setIsBlocked] = useState(!!vendor.is_blocked);
  const [followers, setFollowers] = useState(vendor.followers_count ?? 0);
  const [followBusy, setFollowBusy] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);

  const name =
    locale === "en" && vendor.store_name_en
      ? vendor.store_name_en
      : vendor.store_name;
  const description =
    locale === "en" && vendor.description_en
      ? vendor.description_en
      : vendor.description;

  const sold = Number(vendor.total_sales) || 0;
  const productsCount = vendor.products_count ?? 0;
  const ratingValue = Number(vendor.rating) || 0;

  // Both action buttons live inside a Card that's also a Link. Stop the click
  // from bubbling up so the user stays on the listing page.
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFollow = async (e: MouseEvent) => {
    stop(e);
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    if (followBusy) return;
    setFollowBusy(true);
    try {
      const res = await vendorsApi.toggleFollow(vendor.id);
      const data = res.data.data;
      setIsFollowing(data.is_following);
      setFollowers(data.followers_count);
      // Following implicitly unblocks server-side too.
      if (data.is_following && isBlocked) setIsBlocked(false);
    } catch {
      // ignore – keep current state
    } finally {
      setFollowBusy(false);
    }
  };

  const handleBlock = async (e: MouseEvent) => {
    stop(e);
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    if (blockBusy) return;
    setBlockBusy(true);
    try {
      const res = await vendorsApi.toggleBlock(vendor.id);
      const blocked = res.data.data.is_blocked;
      setIsBlocked(blocked);
      // The server unfollows when blocking; mirror that locally.
      if (blocked && isFollowing) {
        setIsFollowing(false);
        setFollowers((c) => Math.max(0, c - 1));
      }
      onBlockChange?.(vendor.id, blocked);
    } catch {
      // ignore
    } finally {
      setBlockBusy(false);
    }
  };

  return (
    <Card
      component={Link}
      href={`/${locale}/vendors/${vendor.id}`}
      sx={(theme) => ({
        textDecoration: "none",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 3,
        border: "1px solid",
        borderColor: isBlocked ? "error.light" : "grey.200",
        bgcolor: "white",
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        opacity: isBlocked ? 0.85 : 1,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.10)",
          borderColor: isBlocked ? theme.palette.error.main : theme.palette.primary.main,
          "& .vendor-banner-img": { transform: "scale(1.06)" },
          "& .vendor-logo": {
            borderColor: isBlocked ? theme.palette.error.main : theme.palette.primary.main,
            transform: "scale(1.04)",
          },
        },
      })}
    >
      {/* Block toggle — top-right corner. Visible always so unblocking is easy. */}
      <Tooltip title={isBlocked ? t("unblockShop") : t("blockShop")} placement="left">
        <IconButton
          onClick={handleBlock}
          disabled={blockBusy}
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            bgcolor: "rgba(255,255,255,0.92)",
            color: isBlocked ? "error.main" : "text.secondary",
            backdropFilter: "blur(4px)",
            "&:hover": {
              bgcolor: "white",
              color: "error.main",
            },
          }}
        >
          {blockBusy ? (
            <CircularProgress size={16} color="inherit" />
          ) : isBlocked ? (
            <LockOpenIcon sx={{ fontSize: 18 }} />
          ) : (
            <BlockIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Tooltip>

      {/* Banner */}
      <Box sx={{ position: "relative", overflow: "hidden", height: BANNER_HEIGHT }}>
        {vendor.banner ? (
          <Box
            className="vendor-banner-img"
            component="img"
            src={vendor.banner}
            alt={name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        ) : (
          <Box
            sx={(theme) => ({
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <StorefrontIcon sx={{ fontSize: 48, color: "white", opacity: 0.55 }} />
          </Box>
        )}
        {/* Gradient so the avatar on top has consistent contrast. */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* "Blocked" overlay badge */}
        {isBlocked && (
          <Box
            sx={{
              position: "absolute",
              left: 8,
              top: 8,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: "error.main",
              color: "white",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            {t("blocked")}
          </Box>
        )}
      </Box>

      {/* Logo lane — reserves space so the avatar is entirely visible. */}
      <Box
        sx={{
          position: "relative",
          height: LOGO_SIZE - LOGO_OVERLAP,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Avatar
          src={vendor.logo || undefined}
          alt={name}
          className="vendor-logo"
          sx={(theme) => ({
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            position: "absolute",
            top: -LOGO_OVERLAP,
            border: "4px solid white",
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
            bgcolor: theme.palette.primary.main,
            color: "white",
            fontSize: "1.6rem",
            fontWeight: 800,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          })}
        >
          {name[0]}
        </Avatar>
      </Box>

      {/* Body */}
      <CardContent
        sx={{
          pt: 1,
          pb: 2.25,
          px: 2.25,
          textAlign: "center",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography
          variant="subtitle1"
          color="text.primary"
          sx={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1.25 }}
        >
          {name}
        </Typography>

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.55,
              fontSize: "0.825rem",
              minHeight: "2.6em",
            }}
          >
            {description}
          </Typography>
        )}

        {/* Rating row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
          }}
        >
          <Rating
            value={ratingValue}
            readOnly
            size="small"
            precision={0.5}
            sx={{ fontSize: "1rem" }}
          />
          {ratingValue > 0 && (
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              {ratingValue.toFixed(1)}
            </Typography>
          )}
        </Box>

        {/* Stats — 3 mini metrics: sold, followers, products */}
        <Stack
          direction="row"
          divider={
            <Box
              sx={{
                width: "1px",
                bgcolor: "divider",
                alignSelf: "stretch",
              }}
            />
          }
          sx={{
            mt: 0.5,
            justifyContent: "space-around",
            bgcolor: "grey.50",
            borderRadius: 2,
            py: 1,
            px: 1,
          }}
        >
          <MetricBlock
            icon={<ShoppingBagIcon sx={{ fontSize: 16 }} />}
            value={fmtCount(sold)}
            label={t("sold")}
          />
          <MetricBlock
            icon={<GroupIcon sx={{ fontSize: 16 }} />}
            value={fmtCount(followers)}
            label={t("followers")}
          />
          <MetricBlock
            icon={<StorefrontIcon sx={{ fontSize: 16 }} />}
            value={fmtCount(productsCount)}
            label={tCommon("products")}
          />
        </Stack>

        {/* Follow / Unfollow */}
        <Button
          onClick={handleFollow}
          variant={isFollowing ? "outlined" : "contained"}
          color={isFollowing ? "inherit" : "primary"}
          size="small"
          fullWidth
          disabled={followBusy}
          startIcon={
            followBusy ? (
              <CircularProgress size={14} color="inherit" />
            ) : isFollowing ? (
              <FavoriteIcon sx={{ fontSize: 16 }} />
            ) : (
              <FavoriteBorderIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={{
            mt: 0.5,
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 2,
            ...(isFollowing && {
              borderColor: "grey.300",
              color: "text.primary",
              "&:hover": { borderColor: "primary.main", color: "primary.main" },
            }),
          }}
        >
          {isFollowing ? t("following") : t("follow")}
        </Button>
      </CardContent>
    </Card>
  );
}

function MetricBlock({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.25,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          color: "primary.main",
        }}
      >
        {icon}
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "text.primary" }}>
          {value}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: "0.65rem",
          color: "text.secondary",
          fontWeight: 600,
          letterSpacing: 0.2,
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}