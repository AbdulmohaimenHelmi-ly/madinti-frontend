"use client";

import { useState, MouseEvent } from "react";
import { Storefront, Group, ShoppingBag, Heart, Lock, LockOpen, Star, Ban, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Vendor } from "@/lib/types";
import { vendorsApi } from "@/lib/api/vendors";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";

interface VendorCardProps {
  vendor: Vendor;
  onBlockChange?: (vendorId: number, blocked: boolean) => void;
}

const BANNER_HEIGHT = 110;
const LOGO_SIZE = 84;
const LOGO_OVERLAP = 28;

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

  const name = locale === "en" && vendor.store_name_en ? vendor.store_name_en : vendor.store_name;
  const description = locale === "en" && vendor.description_en ? vendor.description_en : vendor.description;
  const sold = Number(vendor.total_sales) || 0;
  const productsCount = vendor.products_count ?? 0;
  const ratingValue = Number(vendor.rating) || 0;

  const stop = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleFollow = async (e: MouseEvent) => {
    stop(e);
    if (!isAuthenticated) { router.push(`/${locale}/login`); return; }
    if (followBusy) return;
    setFollowBusy(true);
    try {
      const res = await vendorsApi.toggleFollow(vendor.id);
      const data = res.data.data;
      setIsFollowing(data.is_following);
      setFollowers(data.followers_count);
      if (data.is_following && isBlocked) setIsBlocked(false);
    } catch { /* ignore */ } finally { setFollowBusy(false); }
  };

  const handleBlock = async (e: MouseEvent) => {
    stop(e);
    if (!isAuthenticated) { router.push(`/${locale}/login`); return; }
    if (blockBusy) return;
    setBlockBusy(true);
    try {
      const res = await vendorsApi.toggleBlock(vendor.id);
      const blocked = res.data.data.is_blocked;
      setIsBlocked(blocked);
      if (blocked && isFollowing) { setIsFollowing(false); setFollowers((c) => Math.max(0, c - 1)); }
      onBlockChange?.(vendor.id, blocked);
    } catch { /* ignore */ } finally { setBlockBusy(false); }
  };

  return (
    <Link
      href={`/${locale}/vendors/${vendor.id}`}
      className={cn(
        "group relative flex flex-col h-full rounded-2xl border bg-white overflow-hidden no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
        isBlocked ? "border-red-200 opacity-85" : "border-gray-200"
      )}
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {/* Block toggle */}
      <button
        type="button"
        onClick={handleBlock}
        disabled={blockBusy}
        title={isBlocked ? t("unblockShop") : t("blockShop")}
        className={cn(
          "absolute top-2 end-2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm transition",
          isBlocked ? "text-red-500" : "text-gray-400 hover:text-red-500"
        )}
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
      >
        {blockBusy ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isBlocked ? (
          <LockOpen size={14} />
        ) : (
          <Ban size={14} />
        )}
      </button>

      {/* Banner */}
      <div className="relative overflow-hidden" style={{ height: BANNER_HEIGHT }}>
        {vendor.banner ? (
          <img
            src={vendor.banner}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
          >
            <Storefront size={48} className="text-white opacity-55" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35 pointer-events-none" />
        {isBlocked && (
          <span className="absolute start-2 top-2 bg-red-500 text-white text-[0.7rem] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded">
            {t("blocked")}
          </span>
        )}
      </div>

      {/* Logo lane */}
      <div className="relative flex justify-center" style={{ height: LOGO_SIZE - LOGO_OVERLAP }}>
        <div
          className="absolute rounded-full border-4 border-white overflow-hidden transition-all duration-300 group-hover:scale-105 flex items-center justify-center font-extrabold text-white text-2xl"
          style={{
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            top: -LOGO_OVERLAP,
            backgroundColor: "var(--color-primary)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
          }}
        >
          {vendor.logo ? (
            <img src={vendor.logo} alt={name} className="w-full h-full object-cover" />
          ) : name[0]}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 px-5 pt-2 pb-5 flex-1 text-center">
        <p className="font-extrabold text-base leading-tight text-gray-900">{name}</p>

        {description && (
          <p className="text-[0.825rem] text-gray-500 line-clamp-2 leading-snug min-h-[2.6em]">
            {description}
          </p>
        )}

        {/* Stars */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < Math.round(ratingValue) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
            />
          ))}
          {ratingValue > 0 && (
            <span className="text-xs font-bold text-gray-400">{ratingValue.toFixed(1)}</span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-stretch gap-0 bg-gray-50 rounded-xl py-2.5 px-2 mt-1">
          {[
            { icon: <ShoppingBag size={14} />, value: fmtCount(sold), label: t("sold") },
            { icon: <Group size={14} />, value: fmtCount(followers), label: t("followers") },
            { icon: <Storefront size={14} />, value: fmtCount(productsCount), label: tCommon("products") },
          ].map((metric, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 px-1" style={{ borderRight: idx < 2 ? "1px solid #e5e7eb" : "none" }}>
              <div className="flex items-center gap-0.5" style={{ color: "var(--color-primary)" }}>
                {metric.icon}
                <span className="text-[0.85rem] font-extrabold text-gray-800">{metric.value}</span>
              </div>
              <span className="text-[0.62rem] text-gray-400 font-semibold uppercase tracking-wide leading-none">{metric.label}</span>
            </div>
          ))}
        </div>

        {/* Follow button */}
        <button
          type="button"
          onClick={handleFollow}
          disabled={followBusy}
          className={cn(
            "w-full flex items-center justify-center gap-2 mt-1 rounded-xl py-2 text-sm font-bold border transition",
            isFollowing
              ? "border-gray-200 text-gray-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              : "text-white border-transparent hover:opacity-90"
          )}
          style={!isFollowing ? { backgroundColor: "var(--color-primary)" } : {}}
        >
          {followBusy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isFollowing ? (
            <Heart size={14} className="fill-current" />
          ) : (
            <Heart size={14} />
          )}
          {isFollowing ? t("following") : t("follow")}
        </button>
      </div>
    </Link>
  );
}

// Fix icon imports - lucide doesn't have Storefront/Group, use alternatives
function Storefront(props: { size?: number; className?: string }) {
  return (
    <svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function Group(props: { size?: number; className?: string }) {
  return (
    <svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
