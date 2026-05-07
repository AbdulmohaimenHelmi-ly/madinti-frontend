"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import VendorCard from "@/components/vendors/VendorCard";
import { VendorGridSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import type { Vendor } from "@/lib/types";
import { vendorsApi } from "@/lib/api/vendors";

export default function VendorsPage() {
  const t = useTranslations();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorsApi.getAll().then((res) => setVendors(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("vendor.title")}</h1>
      <VendorGridSkeleton count={6} />
    </div>
  );
  if (vendors.length === 0) return <EmptyState message={t("vendor.noVendors")} />;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("vendor.title")}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {vendors.map((v) => <VendorCard key={v.id} vendor={v} />)}
      </div>
    </div>
  );
}
