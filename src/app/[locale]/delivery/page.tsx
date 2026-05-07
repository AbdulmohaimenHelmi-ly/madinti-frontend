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
import {
  Building2,
  DollarSign,
  Store,
  Truck,
  Timer,
  CheckCircle,
  List,
  AlertCircle,
} from "lucide-react";

import { deliveryApi, type DeliveryDashboardPayload } from "@/lib/api/delivery";
import StatCard from "@/components/common/StatCard";
import DashboardHero from "@/components/common/DashboardHero";
import SectionTitle from "@/components/common/SectionTitle";
import ChartCard from "@/components/common/ChartCard";
import { StatCardsSkeleton } from "@/components/common/Skeletons";

const STATUS_COLORS: Record<string, string> = {
  pending: "#ed6c02",
  processing: "#0288d1",
  shipped: "#1976d2",
  delivered: "#2e7d32",
  cancelled: "#d32f2f",
  refunded: "#9c27b0",
};

export default function DeliveryDashboardPage() {
  const t = useTranslations("delivery");
  const tStatus = useTranslations("order.statuses");
  const locale = useLocale();
  const [data, setData] = useState<DeliveryDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    deliveryApi
      .dashboard()
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

  const stats = data
    ? [
        {
          key: "ordersTotal",
          label: t("ordersTotal"),
          value: data.stats.orders_total,
          icon: <List size={20} />,
          color: "#0F172A",
        },
        {
          key: "ordersPending",
          label: t("ordersPending"),
          value: data.stats.orders_pending,
          icon: <Timer size={20} />,
          color: "#ed6c02",
        },
        {
          key: "ordersInTransit",
          label: t("ordersInTransit"),
          value: data.stats.orders_in_transit,
          icon: <Truck size={20} />,
          color: "#1976d2",
        },
        {
          key: "ordersDelivered",
          label: t("ordersDelivered"),
          value: data.stats.orders_delivered,
          icon: <CheckCircle size={20} />,
          color: "#2e7d32",
        },
        {
          key: "prices",
          label: t("pricesCount"),
          value: data.stats.prices_count,
          icon: <DollarSign size={20} />,
          color: "#1976d2",
        },
        {
          key: "cities",
          label: t("citiesCovered"),
          value: data.stats.cities_covered,
          icon: <Building2 size={20} />,
          color: "#2e7d32",
        },
        {
          key: "vendors",
          label: t("vendorsCount"),
          value: data.stats.vendors_count,
          icon: <Store size={20} />,
          color: "#9c27b0",
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
    () => data?.charts?.orders_daily.map((p) => dateLabel(p.date)) ?? [],
    [data, dateLabel]
  );
  const chartOrders = useMemo(
    () => data?.charts?.orders_daily.map((p) => p.orders) ?? [],
    [data]
  );
  const statusPieData = useMemo(
    () =>
      data?.charts?.status_breakdown.map((s, i) => ({
        id: i,
        value: s.count,
        label: tStatus(s.status),
        color: STATUS_COLORS[s.status] ?? "#90a4ae",
      })) ?? [],
    [data, tStatus]
  );
  const topVendorsData = data?.charts?.top_vendors ?? [];
  const ordersByWeekday = data?.charts?.orders_by_weekday ?? [];
  const revenueByStatus = data?.charts?.revenue_by_status ?? [];
  const chartRevenue = useMemo(
    () => data?.charts?.orders_daily.map((p) => p.revenue) ?? [],
    [data]
  );
  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-US", {
      weekday: "short",
    });
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2024, 0, 7 + i))
    );
  }, [locale]);
  const currency = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", {
      maximumFractionDigits: 2,
    }).format(n || 0);
  const ordersLineData = chartDates.map((date, i) => ({ date, orders: chartOrders[i] }));
  const revenueLineData = chartDates.map((date, i) => ({ date, revenue: chartRevenue[i] }));
  const weekdayData = ordersByWeekday.map((d, i) => ({ label: weekdayLabels[i] ?? String(i), count: d.count }));
  const statusPieDataRecharts = statusPieData;
  const topVendorBarData = topVendorsData.map((v) => ({ name: v.name, count: v.count }));
  const revenueStatusData = revenueByStatus.map((s) => ({ label: tStatus(s.status), revenue: s.revenue }));

  return (
    <div>
      <DashboardHero
        eyebrow={data?.company?.name ?? t("dashboard")}
        title={t("dashboard")}
        subtitle={t("dashboardSubtitle")}
        icon={<Truck size={24} />}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <SectionTitle title={t("keyMetrics")} subtitle={t("atAGlance")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? null
          : stats.map((s) => (
              <StatCard
                key={s.key}
                label={s.label}
                value={s.value}
                icon={s.icon}
                color={s.color}
              />
            ))}
        {loading && <StatCardsSkeleton count={6} />}
      </div>

      {!loading && data?.charts && (
        <div className="mt-6">
          <SectionTitle
            title={t("analytics")}
            subtitle={t("analyticsSubtitle")}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-8">
              <ChartCard title={t("ordersTrend")} height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ordersLineData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip />
                    <Line type="monotone" dataKey="orders" stroke="#1976d2" strokeWidth={2} dot={false} name={t("ordersTrend")} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="md:col-span-4">
              <ChartCard title={t("statusBreakdown")} height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieDataRecharts}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      nameKey="label"
                    >
                      {statusPieDataRecharts.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            {topVendorBarData.length > 0 && (
              <div className="md:col-span-12">
                <ChartCard title={t("topVendorsChart")} height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topVendorBarData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ReTooltip />
                      <Bar dataKey="count" fill="#9c27b0" radius={[4, 4, 0, 0]} name={t("ordersTotal")} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}
            <div className="md:col-span-8">
              <ChartCard title={t("revenueTrend")} height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueLineData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#2e7d32" strokeWidth={2} dot={false} name={t("revenueTrend")} />
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
                    <Bar dataKey="count" fill="#0288d1" radius={[4, 4, 0, 0]} name={t("ordersTotal")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="md:col-span-12">
              <ChartCard title={t("revenueByStatus")} height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueStatusData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => currency(v)} />
                    <ReTooltip formatter={(v) => currency(Number(v))} />
                    <Bar dataKey="revenue" fill="#ed6c02" radius={[4, 4, 0, 0]} name={t("revenueTrend")} />
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
