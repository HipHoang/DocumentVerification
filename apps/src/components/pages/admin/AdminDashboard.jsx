import React, { useEffect, useState } from "react";
import { getAdminStatistics } from "../../../services/admin.service";
import LoadingSpinner from "../../layout/LoadingSpinner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// ============================================================
// ICONS (inline SVG for zero dependency)
// ============================================================
const Icons = {
  University: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  Students: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Certificate: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ArrowUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

// ============================================================
// Skeleton Loader
// ============================================================
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-8 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-48 mb-6" />
    <div className="h-64 bg-gray-100 rounded-xl" />
  </div>
);

// ============================================================
// KPI Card Component
// ============================================================
const KpiCard = ({ title, value, icon, trend, trendLabel, color, sublabel }) => {
  const colorMap = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", badge: "bg-indigo-100 text-indigo-700" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
    red: { bg: "bg-red-50", text: "text-red-600", badge: "bg-red-100 text-red-700" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", badge: "bg-purple-100 text-purple-700" },
    cyan: { bg: "bg-cyan-50", text: "text-cyan-600", badge: "bg-cyan-100 text-cyan-700" },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1.5">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value ?? "—"}</p>
          <div className="flex items-center gap-2 mt-2">
            {trend !== undefined && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.badge}`}>
                <Icons.ArrowUp />
                {trend}
              </span>
            )}
            {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
          </div>
          {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center shrink-0 ml-4 group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Custom Tooltip
// ============================================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={`admintooltip-${entry.dataKey || idx}`} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// MAIN DASHBOARD
// ============================================================
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const data = await getAdminStatistics();
        setStats(data);
      } catch (err) {
        setError("Không thể tải thống kê. Vui lòng thử lại sau.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatistics();
  }, []);

  // ---- LOADING ----
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-96" />
        </div>
        {/* KPI skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        {/* Chart skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        {/* Table skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-48 mb-6" />
          <div className="h-10 bg-gray-100 rounded-lg mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  // ---- ERROR ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Lỗi tải dữ liệu</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // ---- EMPTY ----
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Không có dữ liệu</h3>
        <p className="text-gray-500">Chưa có thống kê nào để hiển thị.</p>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Tổng trường Đại học",
      value: stats.totalUniversities,
      icon: <Icons.University />,
      trend: stats.activeUniversities,
      trendLabel: "đang hoạt động",
      color: "indigo",
      sublabel: `${stats.suspendedUniversities || 0} tạm ngưng · ${stats.revokedUniversities || 0} thu hồi`,
    },
    {
      title: "Tổng sinh viên",
      value: stats.totalStudents,
      icon: <Icons.Students />,
      trend: stats.verifiedStudents,
      trendLabel: "đã xác minh",
      color: "blue",
    },
    {
      title: "Đã xác minh",
      value: stats.verifiedStudents,
      icon: <Icons.Check />,
      trend: stats.totalStudents ? Math.round((stats.verifiedStudents / stats.totalStudents) * 100) : 0,
      trendLabel: "% tổng số",
      color: "emerald",
    },
    {
      title: "Chờ duyệt",
      value: stats.pendingStudents,
      icon: <Icons.Clock />,
      color: "amber",
      sublabel: "cần xử lý",
    },
    {
      title: "Bị từ chối",
      value: stats.rejectedStudents,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "red",
    },
    {
      title: "Trường hoạt động",
      value: stats.activeUniversities,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: "emerald",
    },
    {
      title: "Trường tạm ngưng",
      value: stats.suspendedUniversities || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "amber",
    },
    {
      title: "Trường đã thu hồi",
      value: stats.revokedUniversities || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      color: "red",
    },
  ];

  const filteredUniversities = stats.universityStatistics.filter(
    (uni) =>
      uni.universityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart colors
  const CHART_COLORS = {
    primary: "#6366F1",
    secondary: "#10B981",
    tertiary: "#F59E0B",
    quaternary: "#EF4444",
    grid: "#F3F4F6",
    text: "#9CA3AF",
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tổng quan hệ thống</h1>
          <p className="text-gray-500 mt-1">Các chỉ số chính trên toàn bộ hệ thống</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Đang hoạt động
          </span>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, index) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Registration Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Đăng ký sinh viên</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">6 tháng gần nhất</span>
          </div>
          {stats.monthlyStudentActivity?.some((m) => m.count > 0) ? (
            <div className="w-full min-w-0">
              <div className="w-full h-[320px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="99%" height="99%">
                  <AreaChart data={stats.monthlyStudentActivity} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.12} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Đăng ký" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#studentGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="w-full min-w-0">
              <div className="w-full h-[320px] min-w-0 flex items-center justify-center overflow-hidden text-gray-400 text-sm">
                Chưa có dữ liệu đăng ký
              </div>
            </div>
          )}
        </div>

        {/* Verified Students Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Xác minh sinh viên</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">6 tháng gần nhất</span>
          </div>
          {stats.monthlyVerifiedActivity?.some((m) => m.count > 0) ? (
            <div className="w-full min-w-0">
              <div className="w-full h-[320px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="99%" height="99%">
                  <BarChart data={stats.monthlyVerifiedActivity} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="verifiedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Xác minh" fill={CHART_COLORS.secondary} radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="w-full min-w-0">
              <div className="w-full h-[320px] min-w-0 flex items-center justify-center overflow-hidden text-gray-400 text-sm">
                Chưa có dữ liệu xác minh
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== UNIVERSITY TABLE ===== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Thống kê theo trường</h2>
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Icons.Search />
              </div>
              <input
                type="text"
                placeholder="Tìm trường theo tên hoặc ví..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên trường</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Domain</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Địa chỉ ví</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng SV</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span className="text-emerald-600">Đã xác minh</span>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span className="text-amber-600">Chờ duyệt</span>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span className="text-red-600">Từ chối</span>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUniversities.length > 0 ? (
                filteredUniversities.map((uni) => (
                  <tr key={uni.walletAddress} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{uni.universityName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{uni.allowedDomain}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        {uni.walletAddress?.slice(0, 6)}...{uni.walletAddress?.slice(-4)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">{uni.totalStudents}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="text-emerald-600 font-medium">{uni.verifiedStudents}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="text-amber-600 font-medium">{uni.pendingStudents}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="text-red-600 font-medium">{uni.rejectedStudents}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <StatusBadge status={uni.status || "active"} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-sm text-gray-400">Không tìm thấy trường nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Hiển thị {filteredUniversities.length} / {stats.universityStatistics.length} trường
          </span>
          <span className="text-xs text-gray-400">Cập nhật gần nhất: vừa xong</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Status Badge
// ============================================================
const StatusBadge = ({ status }) => {
  const statusMap = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Hoạt động" },
    suspended: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "Tạm ngưng" },
    revoked: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400", label: "Thu hồi" },
  };
  const s = statusMap[status] || statusMap.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

export default AdminDashboard;