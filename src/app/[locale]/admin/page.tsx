"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";
import { Users, Store, Package, Receipt, CreditCard, LayoutDashboard, AlertCircle } from "lucide-react";

import { adminApi, type AdminDashboardPayload } from "@/lib/api/admin";
import { StatCardsSkeleton } from "@/components/common/Skeletons";
import StatCard from "@/components/common/StatCard";
import DashboardHero from "@/components/common/DashboardHero";
import SectionTitle from "@/components/common/SectionTitle";
import ChartCard from "@/components/common/ChartCard";

const STATUS_COLORS: Record<string, string> = {
  pending: "#ed6c02",
  processing: "#0288d1",
  shipped: "#1976d2",
  delivered: "#2e7d32",
  cancelled: "#d32f2f",
  refunded: "#9c27b0",
};

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const tStatus = useTranslations("order.statuses");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AdminDashboardPayload | null>(null);

  useEffect(() => {
    let active = true;
    adminApi
      .getDashboard()
      .then((res) => {
        if (active) setData(res.data.data);
      })
      .catch(() => {
        if (active) setError(t("loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  const currency = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", {
      maximumFractionDigits: 2,
    }).format(n || 0);

  const stats = data
    ? [
        {
          key: "users",
          label: t("users"),
          value: data.totals.users,
          icon: <Users size={20} />,
          color: "#1976d2",
        },
        {
          key: "vendors",
          label: t("vendors"),
          value: data.totals.vendors,
          icon: <Store size={20} />,
          color: "#2e7d32",
        },
        {
          key: "products",
          label: t("products"),
          value: data.totals.products,
          icon: <Package size={20} />,
          color: "#9c27b0",
        },
        {
          key: "orders",
          label: t("orders"),
          value: data.totals.orders,
          icon: <Receipt size={20} />,
          color: "#0F172A",
        },
        {
          key: "revenue",
          label: t("revenue"),
          value: currency(data.totals.revenue),
          icon: <CreditCard size={20} />,
          color: "#ed6c02",
        },
      ]
    : [];

  const dateLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-US", {
      month: "short",
      day: "numeric",
    });
    return (iso: string) => {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? iso : fmt.format(d);
    };
  }, [locale]);

  const chartDates = useMemo(
    () => data?.charts.orders_daily.map((p) => dateLabel(p.date)) ?? [],
    [data, dateLabel]
  );
  const chartOrders = useMemo(
    () => data?.charts.orders_daily.map((p) => p.orders) ?? [],
    [data]
  );
  const chartRevenue = useMemo(
    () => data?.charts.orders_daily.map((p) => p.revenue) ?? [],
    [data]
  );
  const chartUsers = useMemo(
    () => data?.charts.users_daily.map((p) => p.users) ?? [],
    [data]
  );

  const ordersRevenueData = useMemo(
    () => chartDates.map((date, i) => ({ date, orders: chartOrders[i], revenue: chartRevenue[i] })),
    [chartDates, chartOrders, chartRevenue]
  );
  const usersData = useMemo(
    () => chartDates.map((date, i) => ({ date, users: chartUsers[i] })),
    [chartDates, chartUsers]
  );

  const statusPieData = useMemo(
    () =>
      data?.charts.status_breakdown.map((s, i) => ({
        id: i,
        value: s.count,
        label: tStatus(s.status),
        color: STATUS_COLORS[s.status] ?? "#90a4ae",
      })) ?? [],
    [data, tStatus]
  );
  const topVendors = data?.charts.top_vendors ?? [];
  const topCategories = data?.charts.top_categories ?? [];
  const revenueByStatus = data?.charts.revenue_by_status ?? [];
  const ordersByWeekday = data?.charts.orders_by_weekday ?? [];

  const topVendorData = topVendors.map((v) => ({ name: v.name, revenue: v.revenue }));
  const topCategoryData = topCategories.map((c) => ({ name: c.name, products: c.products }));
  const revenueStatusData = revenueByStatus.map((s) => ({
    value: Math.round(s.revenue),
    label: tStatus(s.status),
    color: STATUS_COLORS[s.status] ?? "#90a4ae",
  }));

  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-US", {
      weekday: "short",
    });
    // DAYOFWEEK: 1=Sunday..7=Saturday. 2024-01-07 is Sunday.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2024, 0, 7 + i))
    );
  }, [locale]);

  const weekdayData = weekdayLabels.map((day, i) => ({
    day,
    count: ordersByWeekday[i]?.count ?? 0,
  }));

  return (
    <div>
      <DashboardHero
        eyebrow={t("adminPanel")}
        title={t("dashboard")}
        subtitle={t("dashboardSubtitle")}
        icon={<LayoutDashboard size={24} />}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <SectionTitle title={t("keyMetrics")} subtitle={t("atAGlance")} />

      {loading ? (
        <StatCardsSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
          {stats.map((s) => (
            <StatCard
              key={s.key}
              label={s.label}
              value={s.value}
              icon={s.icon}
              color={s.color}
            />
          ))}
        </div>
      )}

      {!loading && data && (
        <div className="mt-4">
          <SectionTitle
            title={t("analytics")}
            subtitle={t("analyticsSubtitle")}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-8">
              <ChartCard title={t("ordersTrend")} height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ordersRevenueData} margin={{ left: 10, right: 30, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <ReTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#1976d2" strokeWidth={2} dot={false} name={t("ordersTrend")} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#2e7d32" strokeWidth={2} dot={false} name={t("revenueTrend")} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="md:col-span-4">
              <ChartCard title={t("statusBreakdown")} height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {statusPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="md:col-span-6">
              <ChartCard title={t("newUsersTrend")} height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usersData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip />
                    <Bar dataKey="users" fill="#0288d1" radius={[4, 4, 0, 0]} name={t("users")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="md:col-span-6">
              <ChartCard title={t("topVendorsChart")} height={260}>
                {topVendors.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">—</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="horizontal" data={topVendorData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis type="number" tick={{ fontSize: 11 }} />
                      <ReTooltip />
                      <Bar dataKey="revenue" fill="#9c27b0" radius={[4, 4, 0, 0]} name={t("revenue")} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
            <div className="md:col-span-6">
              <ChartCard title={t("topCategoriesChart")} height={260}>
                {topCategories.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">—</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="horizontal" data={topCategoryData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis type="number" tick={{ fontSize: 11 }} />
                      <ReTooltip />
                      <Bar dataKey="products" fill="#0F172A" radius={[4, 4, 0, 0]} name={t("products")} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
            <div className="md:col-span-6">
              <ChartCard title={t("weekdayDistribution")} height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip />
                    <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} name={t("orders")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="md:col-span-6">
              <ChartCard title={t("revenueByStatus")} height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={revenueStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="label">
                      {revenueStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
