import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Eye,
  Plus,
  ClipboardCheck,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Calendar,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getInspections } from "../utils/storage";

function History() {
  const navigate = useNavigate();

  const [inspections, setInspections] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const loadRecords = () => {
    try {
      const data = typeof getInspections === "function" ? getInspections() : [];
      setInspections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading inspection history:", err);
      setInspections([]);
    }
  };

  useEffect(() => {
    loadRecords();
    window.addEventListener("packsure-inspections-updated", loadRecords);
    window.addEventListener("storage", loadRecords);
    window.addEventListener("focus", loadRecords);

    return () => {
      window.removeEventListener("packsure-inspections-updated", loadRecords);
      window.removeEventListener("storage", loadRecords);
      window.removeEventListener("focus", loadRecords);
    };
  }, []);

  // --------------------------------------------------
  // Safe Data Normalization
  // --------------------------------------------------
  const normalizedInspections = useMemo(() => {
    return (Array.isArray(inspections) ? inspections : []).map((item, idx) => {
      const rawScore = Number(
        item?.score ?? item?.compliance_score ?? item?.compliance?.compliance_score ?? 0
      );
      const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : 0;

      const rawStatus = String(
        item?.status ?? item?.overall_status ?? item?.compliance?.overall_status ?? "NEEDS_REVIEW"
      ).toUpperCase();

      let status = "NEEDS_REVIEW";
      if (rawStatus.includes("COMPLIANT") && !rawStatus.includes("NON")) {
        status = "COMPLIANT";
      } else if (rawStatus.includes("HIGH") || rawStatus.includes("NON")) {
        status = "HIGH_RISK";
      }

      const rawRisk = String(
        item?.risk_level ?? item?.risk ?? item?.compliance?.risk_level ?? "MEDIUM"
      ).toUpperCase();

      let risk = "MEDIUM";
      if (rawRisk.includes("HIGH")) risk = "HIGH";
      else if (rawRisk.includes("LOW")) risk = "LOW";

      const id = item?.id ?? `INSP-${String(idx + 1).padStart(4, "0")}`;
      const product =
        item?.product ?? item?.product_name ?? item?.productName ?? item?.name ?? "Inspected Commodity";
      const category =
        item?.category ?? item?.product_category ?? item?.compliance?.category ?? "General Goods";
      const date = item?.date ?? (item?.createdAt ? item.createdAt.split("T")[0] : null) ?? "Recent";
      const location = item?.location ?? item?.facility ?? "Facility Unit 1";

      return {
        ...item,
        id,
        product,
        category,
        date,
        location,
        score,
        status,
        risk
      };
    });
  }, [inspections]);

  // Unique categories for secondary filter
  const categories = useMemo(() => {
    const set = new Set();
    normalizedInspections.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [normalizedInspections]);

  // --------------------------------------------------
  // Filtering Logic
  // --------------------------------------------------
  const filtered = useMemo(() => {
    return normalizedInspections.filter((item) => {
      const q = search.toLowerCase().trim();
      const idStr = String(item.id || "").toLowerCase();
      const prodStr = String(item.product || "").toLowerCase();
      const catStr = String(item.category || "").toLowerCase();

      const matchesSearch = !q || idStr.includes(q) || prodStr.includes(q) || catStr.includes(q);

      const matchesStatus =
        filter === "ALL" ||
        (filter === "COMPLIANT" && item.status === "COMPLIANT") ||
        (filter === "NEEDS_REVIEW" && item.status === "NEEDS_REVIEW") ||
        (filter === "HIGH_RISK" && item.status === "HIGH_RISK");

      const matchesCategory =
        categoryFilter === "ALL" ||
        item.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [normalizedInspections, search, filter, categoryFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            <ClipboardCheck size={14} />
            <span>Audit Registry</span>
          </div>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
            Inspection History
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Query, filter, and inspect past statutory compliance audits.
          </p>
        </div>

        <button
          onClick={() => navigate("/inspection")}
          className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99] sm:text-sm"
        >
          <Plus size={16} />
          <span>New Inspection</span>
        </button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, product name, or commodity..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:text-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="HIGH_RISK">High Risk</option>
          </select>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:text-sm"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* INSPECTIONS TABLE CONTAINER */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Inspection Registry Records
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filtered.length} of {normalizedInspections.length} recorded inspections
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white sm:text-base">
              No matching inspection records
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {normalizedInspections.length === 0
                ? "No compliance inspections recorded yet. Start a new inspection to build history."
                : "No inspections match your active search and filter criteria."}
            </p>
            {normalizedInspections.length === 0 && (
              <button
                onClick={() => navigate("/inspection")}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <Plus size={14} />
                <span>Run First Inspection</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <th className="px-5 py-3.5">Inspection ID</th>
                  <th className="px-5 py-3.5">Commodity / Product</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Audit Date</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {item.id}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      {item.product}
                    </td>

                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {item.category}
                    </td>

                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {item.date}
                    </td>

                    <td className="px-5 py-4 font-black text-slate-900 dark:text-white">
                      {item.score}%
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/inspection/${item.id}`, {
                            state: {
                              inspectionId: item.id,
                              product: item.product,
                              category: item.category,
                              location: item.location,
                              remarks: item.remarks,
                              score: item.score,
                              status: item.status,
                              risk_level: item.risk,
                              inspection: item
                            }
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                      >
                        <Eye size={14} />
                        <span>View Audit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------
// Status Badge Component
// --------------------------------------------------
function StatusBadge({ status }) {
  const normalized = String(status || "NEEDS_REVIEW").toUpperCase();

  let label = "Review";
  let badgeStyle =
    "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50";
  let Icon = Clock3;

  if (normalized === "COMPLIANT") {
    label = "Compliant";
    badgeStyle =
      "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50";
    Icon = CheckCircle2;
  } else if (
    normalized === "HIGH_RISK" ||
    normalized === "HIGH RISK" ||
    normalized === "NON_COMPLIANT" ||
    normalized === "NON-COMPLIANT"
  ) {
    label = "High Risk";
    badgeStyle =
      "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50";
    Icon = AlertTriangle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeStyle}`}>
      <Icon size={12} className="shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export default History;