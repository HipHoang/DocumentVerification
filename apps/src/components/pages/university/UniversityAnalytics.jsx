import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useContract } from "../../../hooks/useContract";
import {
  getUniversityAnalytics,
  getUniversityName,
} from "../../../services/university.service";
import {
  getIssuedCertificates,
} from "../../../services/blockchain.service";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// ============================================================
// ICONS
// ============================================================
const Icons = {
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Certificate: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ArrowUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
};

// ============================================================
// SAFE DATA HELPERS
// ============================================================
const safePieData = (data) => {
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => item && item.name && typeof item.value === "number")
    .map((item) => ({
      name: item.name || "Unknown",
      value: Math.max(0, item.value || 0),
      color: item.color || "#6366F1",
    }));
};

const safeBarData = (data) => {
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => item && item.name && item.name !== "undefined")
    .map((item, index) => ({
      id: item.key || index,
      name: item.name || "Unknown",
      count: Math.max(0, Number(item.count || 0)),
    }));
};

// ============================================================
// CUSTOM TOOLTIP
// ============================================================
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-3">
      <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
      {payload.map((entry, idx) => (
        <div key={`tooltip-${entry.dataKey || idx}`} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// PIE CHART TOOLTIP
// ============================================================
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-3">
      <p className="text-xs font-semibold text-gray-900">{payload[0].name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{payload[0].value} sinh viên</p>
    </div>
  );
};

// ============================================================
// KPI CARD
// ============================================================
const KpiCard = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "hover:border-emerald-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "hover:border-amber-200" },
    red: { bg: "bg-red-50", text: "text-red-600", border: "hover:border-red-200" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "hover:border-blue-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "hover:border-purple-200" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "hover:border-indigo-200" },
  };
  const c = colorClasses[color] || colorClasses.blue;
  const safeValue = value ?? "—";

  return (
    <div className={`group bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 hover:shadow-2xl ${c.border} transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{safeValue}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EMPTY STATE
// ============================================================
const EmptyState = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-12">
    {icon || (
      <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )}
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
);

// ============================================================
// REUSABLE CHART CARD WRAPPER
// Always pre-mounted with fixed 320px height so Recharts never gets -1
// ============================================================
// ============================================================
// DEBOUNCED MOUNT HOOK — ensures ResponsiveContainer only renders after layout stabilizes
// ============================================================
const useMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
};

// ============================================================
// CHART WRAPPER — safe container for ResponsiveContainer
// Prevents width(-1)/height(-1) by:
//  1. Always mounting the wrapper (never conditional)
//  2. Using fixed h-[320px] (never h-full)
//  3. Wrapping ResponsiveContainer in two nested divs
//  4. Using requestAnimationFrame mount guard
//  5. Using 99% instead of 100% to avoid grid measurement edge cases
// ============================================================
const SafeChartWrapper = ({ isEmpty, emptyMessage, children }) => {
  const mounted = useMounted();
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="w-full h-[320px] min-w-0">
        {isEmpty ? (
          <div className="flex items-center justify-center w-full h-full">
            <EmptyState message={emptyMessage || "Chưa có dữ liệu"} />
          </div>
        ) : !mounted ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="animate-pulse bg-gray-100 rounded-xl w-full h-full" />
          </div>
        ) : (
          <ResponsiveContainer width="99%" height="99%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// ============================================================
// CHART CARD — reusable card with title + SafeChartWrapper
// ============================================================
const ChartCard = ({ title, subtitle, isEmpty, emptyMessage, children }) => (
  <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 min-w-0 overflow-hidden">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <SafeChartWrapper isEmpty={isEmpty} emptyMessage={emptyMessage}>
      {children}
    </SafeChartWrapper>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
const UniversityAnalytics = () => {
  const { walletAddress } = useAuth();
  const { contract } = useContract();
  const [analytics, setAnalytics] = useState(null);
  const [universityName, setUniversityName] = useState("Trường Đại học");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [analyticsData, uniName] = await Promise.all([
          getUniversityAnalytics(walletAddress),
          getUniversityName(walletAddress),
        ]);

        if (analyticsData) {
          if (contract) {
            try {
              const certificates = await getIssuedCertificates(contract, walletAddress);
              analyticsData.totalCertificates = certificates.length;
              analyticsData.rawCertificates = certificates;

              analyticsData.recentCertificates = certificates
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5);

              const monthlyCertActivity = calculateMonthlyCertActivity(certificates);
              analyticsData.monthlyCertificateActivity = monthlyCertActivity;
            } catch (certError) {
              // Silently handle certificate fetch errors
            }
          }

          setAnalytics(analyticsData);
          setLastUpdated(new Date().toLocaleString("vi-VN"));
        } else {
          setError("Không thể tải dữ liệu thống kê");
        }

        if (uniName) {
          setUniversityName(uniName);
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [walletAddress, contract]);

  const calculateMonthlyCertActivity = (certs) => {
    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleString("vi", {
        month: "short",
        year: "numeric",
      });
      months.push({ key: monthKey, name: monthName, count: 0 });
    }

    certs.forEach((cert) => {
      if (cert && cert.timestamp) {
        const jsDate = new Date(cert.timestamp * 1000);
        const monthKey = `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, "0")}`;
        const month = months.find((m) => m.key === monthKey);
        if (month) {
          month.count++;
        }
      }
    });

    return months;
  };

  // ===== SANITIZED CHART DATA =====
  const safeStatusDist = useMemo(
    () => safePieData(analytics?.statusDistribution),
    [analytics?.statusDistribution]
  );
  const safeMonthlyStudent = useMemo(
    () => safeBarData(analytics?.monthlyStudentActivity),
    [analytics?.monthlyStudentActivity]
  );
  const safeMonthlyCert = useMemo(
    () => safeBarData(analytics?.monthlyCertificateActivity),
    [analytics?.monthlyCertificateActivity]
  );

  const hasPieData = safeStatusDist.some((s) => s.value > 0);
  const hasMonthlyStudentActivity = safeMonthlyStudent.some((m) => m.count > 0);
  const hasMonthlyCertActivity = safeMonthlyCert.some((m) => m.count > 0);

  const hasRecentCerts = Array.isArray(analytics?.recentCertificates) && analytics.recentCertificates.length > 0;
  const hasRecentVerified = Array.isArray(analytics?.recentlyVerified) && analytics.recentlyVerified.length > 0;

  // Chart color palette
  const COLORS = {
    primary: "#6366F1",
    secondary: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#06B6D4",
    purple: "#8B5CF6",
    grid: "#F3F4F6",
    text: "#9CA3AF",
    pieColors: ["#10B981", "#F59E0B", "#EF4444", "#6366F1", "#06B6D4"],
    chart: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
  };

  // Render logic for the splash/loading/error states
  // These render the same chart grid skeleton with visibility toggle,
  // ensuring chart wrappers are ALWAYS in the DOM with valid dimensions.
  const renderChartGrid = () => (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
      {/* 1. Student Status Distribution - Pie Chart */}
      <ChartCard
        title="Phân bố trạng thái sinh viên"
        subtitle="Xác minh, chờ duyệt, từ chối"
        isEmpty={!hasPieData}
        emptyMessage="Chưa có dữ liệu sinh viên"
      >
        <PieChart>
            <Pie
              data={safeStatusDist}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
            >
              {safeStatusDist.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => {
                const labels = { Verified: "Đã xác minh", Pending: "Chờ duyệt", Rejected: "Từ chối" };
                return (
                  <span className="text-xs text-gray-600">{labels[value] || value}</span>
                );
              }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
      </ChartCard>

      {/* 2. Student Registration Trend */}
      <ChartCard
        title="Đăng ký sinh viên theo tháng"
        subtitle="6 tháng gần nhất"
        isEmpty={!hasMonthlyStudentActivity}
        emptyMessage="Chưa có dữ liệu hoạt động"
      >
        <BarChart data={safeMonthlyStudent} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="count" name="Đăng ký" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={28} />
          </BarChart>
      </ChartCard>

      {/* 3. Certificate Issuance Trend */}
      <ChartCard
        title="Cấp chứng chỉ theo tháng"
        subtitle="6 tháng gần nhất"
        isEmpty={!hasMonthlyCertActivity}
        emptyMessage="Chưa có dữ liệu chứng chỉ"
      >
        <AreaChart data={safeMonthlyCert} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.12} />
                <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="count" name="Chứng chỉ" stroke={COLORS.secondary} strokeWidth={2} fill="url(#areaGrad)" />
          </AreaChart>
      </ChartCard>

      {/* 4. Certificate Overview */}
      <ChartCard title="Tổng quan chứng chỉ" subtitle="Trên blockchain">
        <div className="flex items-center justify-center w-full h-full">
          <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Icons.Certificate />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng chứng chỉ đã cấp</p>
                  <p className="text-4xl font-bold text-gray-900 mt-1">{analytics?.totalCertificates || 0}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center">
                <p className="text-xs text-gray-500 mb-1">Gần đây</p>
                <p className="text-2xl font-bold text-emerald-600">{hasRecentCerts ? analytics.recentCertificates.length : 0}</p>
              </div>
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 text-center">
                <p className="text-xs text-gray-500 mb-1">Blockchain</p>
                <p className="text-2xl font-bold text-indigo-600">{analytics?.totalCertificates || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bảng thống kê</h1>
          <p className="text-gray-500 mt-1">{universityName}</p>
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-400">Cập nhật lúc: {lastUpdated}</span>
        )}
      </div>

      {/* ===== LOADING / ERROR OVERLAY ===== */}
      {/* KPI cards and chart grid are always rendered to keep DOM stable; only the data changes */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-3xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-gray-500 font-medium">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium ml-4"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ===== KPI CARDS ROW ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <KpiCard
            title="Sinh viên đã xác minh"
            value={analytics?.totalVerified}
            icon={<Icons.CheckCircle />}
            color="emerald"
            subtitle="Tài khoản đã được xác thực"
          />
          <KpiCard
            title="Yêu cầu chờ duyệt"
            value={analytics?.totalPending}
            icon={<Icons.Clock />}
            color="amber"
            subtitle="Đang chờ xử lý"
          />
          <KpiCard
            title="Sinh viên bị từ chối"
            value={analytics?.totalRejected}
            icon={<Icons.XCircle />}
            color="red"
            subtitle="Không đạt yêu cầu"
          />
          <KpiCard
            title="Chứng chỉ đã cấp"
            value={analytics?.totalCertificates}
            icon={<Icons.Certificate />}
            color="blue"
            subtitle="Trên blockchain"
          />
          <KpiCard
            title="Tổng sinh viên"
            value={(analytics?.totalVerified || 0) + (analytics?.totalPending || 0) + (analytics?.totalRejected || 0)}
            icon={<Icons.Users />}
            color="purple"
            subtitle="Tất cả tài khoản"
          />
          <KpiCard
            title="Tỉ lệ xác minh"
            value={
              (analytics?.totalVerified + analytics?.totalPending + analytics?.totalRejected) > 0
                ? `${Math.round((analytics.totalVerified / (analytics.totalVerified + analytics.totalPending + analytics.totalRejected)) * 100)}%`
                : "—"
            }
            icon={<Icons.ArrowUp />}
            color="indigo"
            subtitle="Trên tổng số SV"
          />
        </div>

        {/* ===== CHARTS SECTION ===== */}
        {/* Chart wrappers are ALWAYS in the DOM with fixed 320px height.
            Only the inner content (empty state vs chart) toggles. */}
        {renderChartGrid()}
      </div>

      {/* ===== RECENT ACTIVITY TABLES ===== */}
      {!loading && !error && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Verified Students */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl overflow-hidden min-w-0">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Sinh viên vừa xác minh</h2>
            </div>
            {hasRecentVerified ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-50">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">MSSV</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Xác minh lúc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {analytics.recentlyVerified.map((student, index) => (
                      <tr key={student.id || `student-${index}`} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">{student.fullName || "—"}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">{student.studentId || "—"}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">{student.email || "—"}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">
                          {student.verifiedAt
                            ? student.verifiedAt.toDate
                              ? student.verifiedAt.toDate().toLocaleDateString("vi", { month: "short", day: "numeric", year: "numeric" })
                              : new Date(student.verifiedAt).toLocaleDateString("vi", { month: "short", day: "numeric", year: "numeric" })
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8">
                <EmptyState message="Chưa có sinh viên nào được xác minh gần đây" />
              </div>
            )}
          </div>

          {/* Recently Issued Certificates */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl overflow-hidden min-w-0">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Chứng chỉ vừa cấp</h2>
            </div>
            {hasRecentCerts ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-50">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chứng chỉ</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sinh viên</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày cấp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {analytics.recentCertificates.map((cert, index) => (
                      <tr key={cert.hash || cert.id || cert.certificateId || `cert-${index}`} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">{cert.certificateName || cert.name || "Chứng chỉ"}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">{cert.studentName || "Không xác định"}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">
                          {cert.issueDate
                            ? cert.issueDate.toDate
                              ? cert.issueDate.toDate().toLocaleDateString("vi", { month: "short", day: "numeric", year: "numeric" })
                              : new Date(cert.issueDate).toLocaleDateString("vi", { month: "short", day: "numeric", year: "numeric" })
                            : cert.timestamp
                              ? new Date(cert.timestamp * 1000).toLocaleDateString("vi", { month: "short", day: "numeric", year: "numeric" })
                              : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8">
                <EmptyState message="Chưa có chứng chỉ nào được cấp" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityAnalytics;