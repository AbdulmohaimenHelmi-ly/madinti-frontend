"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TrendingUp, Package, Receipt, Star, Store } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend } from "recharts";

import { StatCardsSkeleton } from "@/components/common/Skeletons";
import StatCard from "@/components/common/StatCard";
import DashboardHero from "@/components/common/DashboardHero";
import SectionTitle from "@/components/common/SectionTitle";
import ChartCard from "@/components/common/ChartCard";
import { vendorApi, type VendorDashboardPayload } from "@/lib/api/vendor";

const STATUS_COLORS: Record<string, string> = {
  pending: "#ed6c02",
  processing: "#0288d1",
  shipped: "#1976d2",
  delivered: "#2e7d32",
  cancelled: "#d32f2f",
  refunded: "#9c27b0",
};

export default function VendorDashboardPage() {
  const t = useTranslations("vendor");
  const tStatus = useTranslations("order.statuses");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<VendorDashboardPayload | null>(null);

  useEffect(() => {
    let active = true;
    vendorApi.getDashboard()
      .then((res) => { if (active) setData(res.data.data); })
      .catch(() => { if (active) setError(t("loadError")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);

  const currency = (n: number | string) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", { maximumFractionDigits: 2 }).format(Number(n) || 0);

  const stats = data ? [
    { key: "sales", label: t("totalSales"), value: currency(data.total_sales), icon: <TrendingUp size={20} />, color: "#2e7d32" },
    { key: "orders", label: t("totalOrders"), value: data.total_orders, icon: <Receipt size={20} />, color: "#1976d2" },
    { key: "products", label: t("totalProducts"), value: data.total_products, icon: <Package size={20} />, color: "#9c27b0" },
    { key: "rating", label: t("rating"), value: Number(data.rating || 0).toFixed(1), icon: <Star size={20} />, color: "#ed6c02" },
  ] : [];

  const dateLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-US", { month: "short", day: "numeric" });
    return (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : fmt.format(d); };
  }, [locale]);

  const lineData = useMemo(() => (data?.charts?.orders_daily ?? []).map((p) => ({ date: dateLabel(p.date), orders: p.orders, revenue: p.revenue })), [data, dateLabel]);
  const statusPieData = useMemo(() => (data?.charts?.status_breakdown ?? []).map((s, i) => ({ name: tStatus(s.status), value: s.count, color: STATUS_COLORS[s.status] ?? "#90a4ae" })), [data, tStatus]);
  const topProducts = data?.charts?.top_products ?? [];
  const ordersByWeekday = data?.charts?.orders_by_weekday ?? [];
  const revenueByStatus = data?.charts?.revenue_by_status ?? [];
  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-US", { weekday: "short" });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 7 + i)));
  }, [locale]);
  const weekdayData = weekdayLabels.map((label, i) => ({ label, count: ordersByWeekday[i]?.count ?? 0 }));
  const revenueStatusData = revenueByStatus.map((s) => ({ label: tStatus(s.status), revenue: s.revenue, color: STATUS_COLORS[s.status] ?? "#90a4ae" }));
  const topProductData = topProducts.map((p) => ({ name: p.name, quantity: p.quantity }));

  return (
    <div>
      <DashboardHero eyebrow={data?.vendor?.store_name ?? t("dashboard")} title={t("dashboard")} subtitle={t("dashboardSubtitle")} icon={<Store size={28} />} />

      {error && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4"><span>{error}</span></div>}

      <SectionTitle title={t("keyMetrics")} subtitle={t("atAGlance")} />

      {loading ? <StatCardsSkeleton count={4} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => <StatCard key={s.key} label={s.label} value={s.value} icon={s.icon} color={s.color} />)}
        </div>
      )}

      {!loading && data?.charts && (
        <div className="mt-6">
          <SectionTitle title={t("analytics")} subtitle={t("analyticsSubtitle")} />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <ChartCard title={t("revenueTrend")} height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip />
                    <Line type="monotone" dataKey="revenue" name={t("revenueTrend")} stroke="#2e7d32" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="md:col-span-4">
              <ChartCard title={t("statusBreakdown")} height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                      {statusPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Legend iconSize={10} />
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            {topProductData.length > 0 && (
              <div className="md:col-span-12">
                <ChartCard title={t("topProductsChart")} height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductData} margin={{ left: 10, right: 10, top: 8, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ReTooltip />
                      <Bar dataKey="quantity" name={t("totalProducts")} fill="#9c27b0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}
            <div className="md:col-span-8">
              <ChartCard title={t("ordersTrend")} height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip />
                    <Line type="monotone" dataKey="orders" name={t("totalOrders")} stroke="#1976d2" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="md:col-span-4">
              <ChartCard title={t("weekdayDistribution")} height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip />
                    <Bar dataKey="count" name={t("totalOrders")} fill="#0288d1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="md:col-span-12">
              <ChartCard title={t("revenueByStatus")} height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueStatusData} margin={{ left: 10, right: 10, top: 8, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip formatter={(v: number) => currency(v)} />
                    <Bar dataKey="revenue" name={t("totalSales")} fill="#2e7d32" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
