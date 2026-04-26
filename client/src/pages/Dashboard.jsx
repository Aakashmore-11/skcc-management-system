import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  Users,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Search,
  ChevronRight,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ─── Design tokens ──────────────────────────────────────────── */
/* CSS has been moved to index.css */

/* ─── Mock / real data config ─────────────────────────────────── */
const MOCK_SUMMARY = {
  totalStudents: 348,
  todaysCollection: 42500,
  monthlyRevenue: 312000,
  totalPendingFees: 87600,
};

const WEEKLY_DATA = [
  { day: "Mon", amount: 18400 },
  { day: "Tue", amount: 27600 },
  { day: "Wed", amount: 22100 },
  { day: "Thu", amount: 35800 },
  { day: "Fri", amount: 42500 },
  { day: "Sat", amount: 31200 },
];

const MONTHLY_DATA = [
  { month: "Jan", amount: 210000 },
  { month: "Feb", amount: 190000 },
  { month: "Mar", amount: 260000 },
  { month: "Apr", amount: 312000 },
];

const DONUT_DATA = [
  { name: "Paid", value: 72, color: "#4f7cff" },
  { name: "Partial", value: 18, color: "#f5a623" },
  { name: "Pending", value: 10, color: "#f04b4b" },
];

const CLASS_PROGRESS = [
  { name: "Grade 9", collected: 82, color: "#4f7cff" },
  { name: "Grade 10", collected: 65, color: "#22d48f" },
  { name: "Grade 11", collected: 91, color: "#7c5cff" },
  { name: "Grade 7", collected: 48, color: "#f5a623" },
];

const RECENT_PAYMENTS = [
  { id: "STU-0291", name: "Ananya Rao", initials: "AR", cls: "9-A", amount: 12500, date: "25 Apr", status: "Paid", bg: "#1e3a6e" },
  { id: "STU-0187", name: "Rohan Verma", initials: "RV", cls: "11-B", amount: 8000, date: "24 Apr", status: "Partial", bg: "#3b2a6e" },
  { id: "STU-0344", name: "Meera Patel", initials: "MP", cls: "7-C", amount: 14200, date: "24 Apr", status: "Paid", bg: "#0d3a32" },
  { id: "STU-0102", name: "Kabir Shah", initials: "KS", cls: "5-A", amount: 6500, date: "23 Apr", status: "Overdue", bg: "#3a1a1a" },
  { id: "STU-0219", name: "Nisha Singh", initials: "NS", cls: "10-D", amount: 11000, date: "23 Apr", status: "Paid", bg: "#1e3a6e" },
];

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard", active: true, badge: null },
  { icon: "◎", label: "Students", active: false, badge: null },
  { icon: "₹", label: "Fees", active: false, badge: "3" },
  { icon: "⊡", label: "Reports", active: false, badge: null },
  { icon: "◱", label: "Schedule", active: false, badge: null },
  { icon: "◷", label: "Settings", active: false, badge: null },
];

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmt = (n) => "₹" + n.toLocaleString("en-IN");

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return val;
}

/* ─── Sub-components ──────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{label}</div>
      <div className="tooltip-value">{fmt(payload[0].value)}</div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, colorClass, iconBg, iconColor, change, changeType, period }) {
  const animated = useCountUp(value);
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: iconBg }}>
          <Icon size={16} color={iconColor} />
        </div>
      </div>
      <div className="stat-value">
        {typeof value === "number" && value > 999
          ? fmt(animated)
          : animated}
      </div>
      <div className="stat-footer">
        <div className={`stat-change ${changeType}`}>
          {changeType === "up"
            ? <ArrowUpRight size={13} />
            : <ArrowDownRight size={13} />}
          {change}
        </div>
        <span className="stat-period">{period}</span>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────────── */
export default function Dashboard() {
  const location = useLocation();
  const [summary, setSummary] = useState({
    totalStudents: 0,
    todaysCollection: 0,
    monthlyRevenue: 0,
    totalPendingFees: 0,
    totalExpectedFees: 0,
    pendingFeesCount: 0,
  });

  const [charts, setCharts] = useState({
    weeklyData: [],
    monthlyData: [],
    donutData: [],
    classProgress: [],
    recentPayments: []
  });

  const [chartTab, setChartTab] = useState("weekly");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateQuery = params.get('date') ? `?date=${params.get('date')}` : '';

    axios
      .get(`/api/dashboard/summary${dateQuery}`)
      .then((res) => setSummary(res.data))
      .catch((err) => console.error(err));

    axios
      .get(`/api/dashboard/charts${dateQuery}`)
      .then((res) => setCharts(res.data))
      .catch((err) => console.error(err));
  }, [location.search]);

  const chartData = chartTab === "weekly" ? charts.weeklyData : charts.monthlyData;
  const chartKey = chartTab === "weekly" ? "day" : "month";

  return (
    <>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Total Students"
          value={summary.totalStudents}
          icon={Users}
          colorClass="card-blue"
          iconBg="rgba(79,124,255,0.15)"
          iconColor="#4f7cff"
          change="+12 this month"
          changeType="up"
          period="vs last month"
        />
        <StatCard
          label="Today's Collection"
          value={summary.todaysCollection}
          icon={IndianRupee}
          colorClass="card-green"
          iconBg="rgba(34,212,143,0.15)"
          iconColor="#22d48f"
          change="+₹4,200"
          changeType="up"
          period="vs yesterday"
        />
        <StatCard
          label="Monthly Revenue"
          value={summary.monthlyRevenue}
          icon={TrendingUp}
          colorClass="card-amber"
          iconBg="rgba(245,166,35,0.15)"
          iconColor="#f5a623"
          change="+8.3%"
          changeType="up"
          period="vs last month"
        />
        <StatCard
          label="Pending Fees"
          value={summary.totalPendingFees}
          icon={AlertCircle}
          colorClass="card-red"
          iconBg="rgba(240,75,75,0.15)"
          iconColor="#f04b4b"
          change={`${summary.pendingFeesCount} students`}
          changeType="down"
          period="with unpaid fees"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Area / Bar chart */}
        <div className="chart-card lg:col-span-2">
          <div className="card-header">
            <div>
              <div className="card-title">Collection Trend</div>
              <div className="card-subtitle">Fee collections over time</div>
            </div>
            <div className="tab-group">
              <div
                className={`tab ${chartTab === "weekly" ? "active" : ""}`}
                onClick={() => setChartTab("weekly")}
              >Weekly</div>
              <div
                className={`tab ${chartTab === "monthly" ? "active" : ""}`}
                onClick={() => setChartTab("monthly")}
              >Monthly</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f7cff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f7cff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey={chartKey} tick={{ fontSize: 11, fill: "#555d74" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#555d74" }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + v / 1000 + "K"} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#4f7cff"
                strokeWidth={2}
                fill="url(#grad1)"
                dot={{ r: 3, fill: "#4f7cff", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#4f7cff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Collection Status</div>
              <div className="card-subtitle">April 2026</div>
            </div>
          </div>
          <div className="donut-wrap">
            <PieChart width={130} height={130}>
              <Pie
                data={charts.donutData}
                cx={60}
                cy={60}
                innerRadius={40}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
              >
                {charts.donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => v + "%"} />
            </PieChart>
            <div className="legend">
              {charts.donutData.map((d) => (
                <div className="legend-item" key={d.name}>
                  <div className="legend-left">
                    <div className="legend-dot" style={{ background: d.color }} />
                    <span className="legend-label">{d.name}</span>
                  </div>
                  <span className="legend-pct">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Class-wise progress */}
          <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>Class-wise collection</div>
            <div className="progress-row">
              {charts.classProgress.map((c) => (
                <div className="progress-item" key={c.name}>
                  <div className="progress-top">
                    <span className="progress-name">{c.name}</span>
                    <span className="progress-val">{c.collected}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${c.collected}%`, background: c.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row — table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Bar chart */}
        <div className="chart-card" style={{ animation: "fadeUp 0.4s ease 0.28s both" }}>
          <div className="card-header">
            <div>
              <div className="card-title">Daily Collections</div>
              <div className="card-subtitle">This week</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={charts.weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#555d74" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#555d74" }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + v / 1000 + "K"} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#22d48f" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent payments table */}
        <div className="table-card">
          <div className="table-header">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="card-title">Recent Payments</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Last 5 transactions</div>
              </div>
              <div className="view-all">View all <ChevronRight size={13} /></div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[500px]">
              <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {charts.recentPayments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="student-cell">
                      <div className="avatar-sm" style={{ background: p.bg }}>
                        {p.initials}
                      </div>
                      <div>
                        <div className="student-name">{p.name}</div>
                        <div className="student-id">{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="class-tag">{p.cls}</span></td>
                  <td><span className="amount-cell">{fmt(p.amount)}</span></td>
                  <td>
                    <span
                      className={`badge ${p.status === "Paid"
                        ? "badge-green"
                        : p.status === "Partial"
                          ? "badge-amber"
                          : "badge-red"
                        }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  );
}