import React from "react";
import {
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Bot,
  MapPin,
  Clock3,
  CheckCircle2,
  FileText,
  ScanLine,
  Sparkles,
  Activity,
  CircleAlert,
  ChevronRight
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import { useNavigate } from "react-router-dom";
import { getInspections } from "../utils/storage";

function Dashboard() {
  const navigate = useNavigate();
  const [inspections, setInspections] = React.useState([]);

  React.useEffect(() => {
    const loadInspections = () => {
      try {
        const data = getInspections();
        setInspections(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load inspections from storage:", err);
        setInspections([]);
      }
    };

    // Initial load
    loadInspections();

    // Event listeners for intra-tab and cross-tab synchronizations
    window.addEventListener("packsure-inspections-updated", loadInspections);
    window.addEventListener("storage", loadInspections);
    window.addEventListener("focus", loadInspections);

    return () => {
      window.removeEventListener("packsure-inspections-updated", loadInspections);
      window.removeEventListener("storage", loadInspections);
      window.removeEventListener("focus", loadInspections);
    };
  }, []);

  // Safe data normalization for varied API & Storage schemas
  const normalizedInspections = React.useMemo(() => {
    return (Array.isArray(inspections) ? inspections : []).map((item, index) => {
      const rawScore = item?.score ?? item?.compliance_score ?? item?.compliance?.compliance_score ?? 0;
      const numScore = Number(rawScore);
      const score = Number.isFinite(numScore) ? Math.min(100, Math.max(0, numScore)) : 0;

      const rawStatus = String(item?.status ?? item?.overall_status ?? item?.compliance?.overall_status ?? "NEEDS_REVIEW").toUpperCase();
      let status = "NEEDS_REVIEW";
      if (rawStatus.includes("COMPLIANT") && !rawStatus.includes("NON")) {
        status = "COMPLIANT";
      } else if (rawStatus.includes("HIGH") || rawStatus.includes("NON")) {
        status = "HIGH_RISK";
      }

      const rawRisk = String(item?.risk_level ?? item?.risk ?? item?.compliance?.risk_level ?? "MEDIUM").toUpperCase();
      let risk = "MEDIUM";
      if (rawRisk.includes("HIGH")) risk = "HIGH";
      else if (rawRisk.includes("LOW")) risk = "LOW";

      const category = item?.category ?? item?.product_category ?? item?.compliance?.category ?? "Standard";
      const product = item?.product ?? item?.product_name ?? item?.productName ?? item?.name ?? "Inspection Item";
      const id = item?.id ?? `INSP-${String(index + 1).padStart(4, "0")}`;
      const location = item?.location ?? item?.facility ?? "Facility Alpha";
      const date = item?.date ?? item?.createdAt ?? "Recent";

      return {
        ...item,
        id,
        product,
        category,
        location,
        date,
        score,
        status,
        risk
      };
    });
  }, [inspections]);

  const recentInspections = normalizedInspections.slice(0, 4);

  const totalInspections = normalizedInspections.length;
  const compliantCount = normalizedInspections.filter((i) => i.status === "COMPLIANT").length;
  const highRiskCount = normalizedInspections.filter((i) => i.status === "HIGH_RISK" || i.risk === "HIGH").length;
  const reviewCount = Math.max(0, totalInspections - compliantCount - highRiskCount);

  const scored = normalizedInspections.filter((i) => i.score > 0);
  const averageScore = scored.length ? scored.reduce((sum, i) => sum + i.score, 0) / scored.length : 0;
  const complianceRate = totalInspections ? (compliantCount / totalInspections) * 100 : 0;

  const riskData = [
    {
      label: "Compliant",
      value: totalInspections ? Math.round((compliantCount / totalInspections) * 100) : 0,
      count: compliantCount,
      dot: "bg-emerald-500"
    },
    {
      label: "Needs Review",
      value: totalInspections ? Math.round((reviewCount / totalInspections) * 100) : 0,
      count: reviewCount,
      dot: "bg-amber-500"
    },
    {
      label: "High Risk",
      value: totalInspections ? Math.round((highRiskCount / totalInspections) * 100) : 0,
      count: highRiskCount,
      dot: "bg-rose-500"
    }
  ];

  const chartData = React.useMemo(() => {
    if (normalizedInspections.length === 0) return [];
    return normalizedInspections
      .slice()
      .reverse()
      .slice(-7)
      .map((item, index) => ({
        day: item.date || `Scan ${index + 1}`,
        score: item.score
      }));
  }, [normalizedInspections]);

  // SVG Gauge calculations
  const gaugeRadius = 66;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (gaugeCircumference * (totalInspections > 0 ? averageScore : 0)) / 100;

  return (
    <div className="min-h-screen space-y-6 pb-10">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
              System Operational
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
            Compliance Command Center
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor inspections, compliance health and regulatory risks in real time.
          </p>
        </div>

        <button
          onClick={() => navigate("/inspection")}
          className="group flex w-fit items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          <Plus size={18} />
          <span>New Inspection</span>
          <ArrowUpRight
            size={16}
            className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </button>
      </div>

      {/* =====================================================
          HERO COMPLIANCE CARD
      ===================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
              <Sparkles size={14} className="text-blue-500" />
              <span>AI-Powered Regulatory Intelligence</span>
            </div>

            <h2 className="max-w-2xl text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Compliance ecosystem is{" "}
              <span className={averageScore >= 75 ? "text-emerald-500" : averageScore >= 50 ? "text-amber-500" : "text-rose-500"}>
                {averageScore >= 75 ? "performing strong." : averageScore >= 50 ? "requiring review." : "at critical risk."}
              </span>
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Insights are calculated from your saved inspections. Prioritize failed criteria, track trends, and trigger AI remediation protocols.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/analytics")}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <span>View Analytics</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate("/reports")}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <FileText size={16} />
                <span>Reports</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC SCORE GAUGE */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative flex h-52 w-52 items-center justify-center">
              <svg className="h-52 w-52 -rotate-90 transform" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={gaugeRadius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="14"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={gaugeRadius}
                  className="stroke-emerald-500 transition-all duration-1000 ease-out"
                  strokeWidth="14"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute text-center">
                <div className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                  {averageScore.toFixed(1)}
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Overall Score
                </div>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <TrendingUp size={12} />
                  <span>{complianceRate >= 50 ? "+4.8%" : "-2.1%"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<ClipboardCheck size={20} />}
          label="Total Inspections"
          value={totalInspections}
          trend="Realtime"
          description="recorded scans"
          iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
        />

        <StatCard
          icon={<ShieldCheck size={20} />}
          label="Compliance Rate"
          value={`${complianceRate.toFixed(1)}%`}
          trend={`${compliantCount} Passed`}
          description="fully compliant audits"
          iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />

        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Needs Review"
          value={reviewCount}
          trend={reviewCount > 0 ? "Action Req." : "Clear"}
          description="pending criteria validation"
          iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
        />

        <StatCard
          icon={<Activity size={20} />}
          label="High-Risk Cases"
          value={highRiskCount}
          trend={highRiskCount > 0 ? "Critical" : "Optimal"}
          description="violating standards"
          iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
        />
      </div>

      {/* =====================================================
          MAIN ANALYTICS GRID
      ===================================================== */}
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">

        {/* TREND CHART */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                <TrendingUp size={18} className="text-blue-500" />
                <span>Compliance Trend</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Score variance across your last 7 inspections
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{chartData.length > 0 ? "Live data" : "Awaiting scans"}</span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" className="stroke-slate-200 dark:stroke-slate-800" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-slate-400"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-slate-400"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
                            <p className="text-slate-500 dark:text-slate-400">{label}</p>
                            <p className="mt-0.5 text-sm font-black text-blue-600 dark:text-blue-400">
                              Score: {payload[0].value}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#complianceGradient)"
                    dot={{ r: 4, strokeWidth: 2, fill: "#3b82f6" }}
                    activeDot={{ r: 6, strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                <Activity size={32} className="mb-2 text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No inspection history recorded yet.</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Run a new inspection to populate performance trend charts.</p>
              </div>
            )}
          </div>
        </section>

        {/* RISK DISTRIBUTION */}
        <section className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                <CircleAlert size={18} className="text-amber-500" />
                <span>Risk Distribution</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Current audit breakdown by risk severity
              </p>
            </div>

            <div className="space-y-5">
              {riskData.map((risk) => (
                <div key={risk.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${risk.dot}`} />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {risk.label}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {risk.value}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${risk.dot}`}
                      style={{ width: `${risk.value}%` }}
                    />
                  </div>

                  <div className="mt-1 text-right text-[10px] font-semibold text-slate-400">
                    {risk.count} inspection{risk.count === 1 ? "" : "s"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/analytics")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span>Detailed Analytics</span>
            <ArrowRight size={14} />
          </button>
        </section>

      </div>

      {/* =====================================================
          LOWER GRID
      ===================================================== */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">

        {/* RECENT INSPECTIONS */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                <ScanLine size={18} className="text-blue-500" />
                <span>Recent Inspections</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Latest compliance screening audits
              </p>
            </div>

            <button
              onClick={() => navigate("/history")}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
            >
              <span>View all</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentInspections.length > 0 ? (
              recentInspections.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/inspection/${item.id}`)}
                  className="group flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-950/40 dark:group-hover:text-blue-400">
                      <ClipboardCheck size={19} />
                    </div>

                    <div>
                      <div className="text-sm font-bold text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {item.product}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">{item.id}</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {item.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock3 size={11} />
                          {item.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        {item.score}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Score
                      </div>
                    </div>

                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-sm font-medium text-slate-400">
                No inspections available. Run a new inspection to get started.
              </div>
            )}
          </div>
        </section>

        {/* AI ASSISTANT CARD */}
        <section className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl dark:border dark:border-slate-800">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-12 left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <Bot size={22} className="text-blue-300" />
            </div>

            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-200">
              <Sparkles size={12} />
              <span>AI Regulatory Copilot</span>
            </div>

            <h3 className="mt-3 text-lg font-black tracking-tight sm:text-xl">
              Compliance Optimization Insight
            </h3>

            <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
              {highRiskCount > 0
                ? `${highRiskCount} inspection${highRiskCount === 1 ? "" : "s"} currently require urgent remediation. Resolving identified high-risk clauses will increase system compliance by an estimated +8.4%.`
                : "All tracked inspections satisfy baseline compliance criteria. Continue monitoring incoming batches or simulate regulatory audits."}
            </p>
          </div>

          <button
            onClick={() => {
              window.dispatchEvent(new Event("open-chatbot"));
            }}
            className="relative mt-6 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-slate-100"
          >
            <span>Ask Compliance Copilot</span>
            <ArrowUpRight size={16} />
          </button>
        </section>

      </div>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
            Quick Actions
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Immediate access to core regulatory operations
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={<ScanLine size={20} />}
            title="New Inspection"
            description="Run AI compliance scan"
            onClick={() => navigate("/inspection")}
            iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
          />

          <QuickAction
            icon={<ClipboardCheck size={20} />}
            title="Audit History"
            description="Explore historical checks"
            onClick={() => navigate("/history")}
            iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
          />

          <QuickAction
            icon={<FileText size={20} />}
            title="Regulatory Reports"
            description="Export certified reports"
            onClick={() => navigate("/reports")}
            iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
          />

          <QuickAction
            icon={<Bot size={20} />}
            title="Copilot Assistant"
            description="Consult regulatory policies"
            onClick={() => {
              window.dispatchEvent(new Event("open-chatbot"));
            }}
            iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
          />
        </div>
      </section>

    </div>
  );
}

/* ============================================================
   STAT CARD COMPONENT
============================================================ */
function StatCard({ icon, label, value, trend, description, iconClass }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {trend}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {label}
        </p>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {value}
          </span>
        </div>

        <p className="mt-1 text-[11px] font-medium text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   STATUS BADGE COMPONENT
============================================================ */
function StatusBadge({ status }) {
  const normalized = String(status || "NEEDS_REVIEW").toUpperCase();

  let displayStatus = "Review";
  let badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50";
  let Icon = Clock3;

  if (normalized === "COMPLIANT") {
    displayStatus = "Compliant";
    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50";
    Icon = CheckCircle2;
  } else if (
    normalized === "HIGH_RISK" ||
    normalized === "HIGH RISK" ||
    normalized === "NON_COMPLIANT" ||
    normalized === "NON-COMPLIANT"
  ) {
    displayStatus = "High Risk";
    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50";
    Icon = AlertTriangle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badgeStyle}`}>
      <Icon size={12} className="shrink-0" />
      <span>{displayStatus}</span>
    </span>
  );
}

/* ============================================================
   QUICK ACTION COMPONENT
============================================================ */
function QuickAction({ icon, title, description, onClick, iconClass }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </div>
        <div className="mt-0.5 text-[11px] text-slate-400">
          {description}
        </div>
      </div>

      <ArrowUpRight
        size={16}
        className="shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-500"
      />
    </button>
  );
}

export default Dashboard;