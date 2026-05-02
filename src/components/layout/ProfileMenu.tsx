"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Avatar,
  Box,
  Button,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import { useAuthStore } from "@/lib/store/authStore";

export default function ProfileMenu() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  if (!user) return null;

  const close = () => setAnchorEl(null);
  const handleLogout = async () => {
    close();
    await logout();
    router.push(`/${locale}`);
  };

  const p = `/${locale}`;

  return (
    <>
      <Button
        onClick={(event) => {
          setAnchorEl((current) => current ? null : event.currentTarget);
        }}
        color="inherit"
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          display: { xs: "none", sm: "flex" },
          gap: 1,
          borderRadius: 100,
          pl: 0.5,
          pr: 1.5,
          py: 0.5,
          color: "#1A1A1A",
          border: "1px solid #EDE7E9",
          bgcolor: "white",
          "&:hover": { bgcolor: "#F5F0F2" },
        }}
      >
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: "#F5F0F2",
            color: "#1A1A1A",
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          {user.name?.[0]?.toUpperCase()}
        </Avatar>
        {user.name?.split(" ")[0]}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 260,
              borderRadius: 2,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 700 }} noWrap>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.email}
          </Typography>
        </Box>
        <Divider />

        {/* Elevated roles first, but clearly separated so user can also act as customer below. */}
        {user.is_admin && (
          <MenuItem component={Link} href={`${p}/admin`} onClick={close}>
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" color="primary" />
            </ListItemIcon>
            {t("adminPanel")}
          </MenuItem>
        )}
        {user.is_vendor && (
          <MenuItem component={Link} href={`${p}/vendor`} onClick={close}>
            <ListItemIcon>
              <StorefrontIcon fontSize="small" color="primary" />
            </ListItemIcon>
            {t("vendorDashboard")}
          </MenuItem>
        )}
        {user.is_delivery && (
          <MenuItem component={Link} href={`${p}/delivery`} onClick={close}>
            <ListItemIcon>
              <LocalShippingIcon fontSize="small" color="primary" />
            </ListItemIcon>
            {t("deliveryDashboard")}
          </MenuItem>
        )}
        {(user.is_admin || user.is_vendor || user.is_delivery) && <Divider />}

        {/* Customer-facing options — available to every logged-in user, including admin/vendor. */}
        <MenuItem component={Link} href={`${p}/profile`} onClick={close}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          {t("myProfile")}
        </MenuItem>
        <MenuItem component={Link} href={`${p}/orders`} onClick={close}>
          <ListItemIcon>
            <ReceiptLongIcon fontSize="small" />
          </ListItemIcon>
          {t("myOrders")}
        </MenuItem>
        <MenuItem component={Link} href={`${p}/cart`} onClick={close}>
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          {t("myCart")}
        </MenuItem>
        <MenuItem component={Link} href={`${p}/favorites`} onClick={close}>
          <ListItemIcon>
            <FavoriteRoundedIcon fontSize="small" sx={{ color: "#ff3b30" }} />
          </ListItemIcon>
          {t("myFavorites")}
        </MenuItem>

        {!user.is_vendor && !user.is_admin && !user.is_delivery && (
          <MenuItem
            component={Link}
            href={`${p}/become-vendor`}
            onClick={close}
          >
            <ListItemIcon>
              <AddBusinessIcon fontSize="small" />
            </ListItemIcon>
            {t("becomeVendor")}
          </MenuItem>
        )}

        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          {t("logout")}
        </MenuItem>
      </Menu>
    </>
  );
}
