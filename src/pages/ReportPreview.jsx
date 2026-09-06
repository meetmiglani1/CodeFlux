import React, { useMemo } from "react";
import {
  ArrowLeft,
  Printer,
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Calendar,
  Building2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getReportById,
  getReports,
  getInspections
} from "../utils/storage";

// --------------------------------------------------
// Safe Data Normalizers
// --------------------------------------------------
function parseInspectionDate(item) {
  const raw = item?.date ?? item?.createdAt ?? item?.created ?? item?.timestamp;
  if (!raw) return null;

  if (typeof raw === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split("/");
    const date = new Date(`${yyyy}-${mm}-${dd}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeInspection(item, index) {
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

  return {
    id: item?.id ?? `INSP-${String(index + 1).padStart(4, "0")}`,
    product: item?.product ?? item?.product_name ?? item?.productName ?? item?.name ?? "Inspected Commodity",
    category: item?.category ?? item?.product_category ?? item?.compliance?.category ?? "General",
    score,
    status,
    date: item?.date ?? item?.createdAt ?? "Recent"
  };
}

function ReportPreview() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Resilient report retrieval
  const report = useMemo(() => {
    try {
      if (typeof getReportById === "function") {
        const found = getReportById(id);
        if (found) return found;
      }
      const allReports = typeof getReports === "function" ? getReports() : [];
      return Array.isArray(allReports)
        ? allReports.find((r) => String(r?.id).toLowerCase() === String(id).toLowerCase())
        : null;
    } catch (err) {
      console.error("Error retrieving report record:", err);
      return null;
    }
  }, [id]);

  // Strictly filter inspections linked to this specific report
  const linkedInspections = useMemo(() => {
    if (!report) return [];

    let all = [];
    try {
      all = typeof getInspections === "function" ? getInspections() : [];
    } catch {
      all = [];
    }

    if (!Array.isArray(all)) return [];

    if (Array.isArray(report.inspectionIds) && report.inspectionIds.length > 0) {
      const idSet = new Set(report.inspectionIds.map(String));
      return all
        .filter((item) => idSet.has(String(item?.id)))
        .map((item, idx) => normalizeInspection(item, idx));
    }

    // Fallback: Date range filter
    const fromDate = report.from && /^\d{4}-\d{2}-\d{2}$/.test(report.from) ? new Date(`${report.from}T00:00:00`) : null;
    const toDate = report.to && /^\d{4}-\d{2}-\d{2}$/.test(report.to) ? new Date(`${report.to}T23:59:59.999`) : null;

    return all
      .filter((item) => {
        if (!fromDate && !toDate) return true;
        const d = parseInspectionDate(item);
        if (!d) return false;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      })
      .map((item, idx) => normalizeInspection(item, idx));
  }, [report]);

  if (!report) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <FileText size={32} />
        </div>

        <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          Report Record Not Found
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The requested compliance report identifier <code className="font-mono text-blue-600 dark:text-blue-400">{id}</code> is not in storage.
        </p>

        <button
          onClick={() => navigate("/reports")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
        >
          <ArrowLeft size={16} />
          <span>Return to Reports</span>
        </button>
      </div>
    );
  }

  const printReport = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* ACTION BAR (HIDDEN IN PRINT) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => navigate("/reports")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Reports</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={printReport}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
          >
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE REPORT SHEET */}
      <div
        id="print-area"
        className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:p-10 print:border-none print:p-0 print:shadow-none"
      >
        {/* REPORT HEADER */}
        <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-7 dark:border-slate-800 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-md shadow-blue-600/30">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight sm:text-xl">
                  PackSure <span className="text-blue-600 dark:text-blue-400">AI</span>
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  National Regulatory Compliance System
                </p>
              </div>
            </div>

            <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {report.type || "Compliance Audit Report"}
            </h2>

            <p className="mt-1 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
              Reference: {report.id}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left dark:border-slate-800 dark:bg-slate-950 sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Audit Generation Date
            </p>
            <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
              {report.created || "Verified"}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              <span>Certified Audit</span>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Audited Batches
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {linkedInspections.length}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Inspections evaluated</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Aggregate Compliance
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {Number(report.score || 0)}%
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Standard compliance rating</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Timeframe
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">
              <Calendar size={14} className="text-slate-400" />
              <span>{report.from || "All"} → {report.to || "Present"}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Sampling period</p>
          </div>
        </div>

        {/* INSPECTION TABLE */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Inspection ID</th>
                  <th className="px-4 py-3.5">Product Description</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Score</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {linkedInspections.length > 0 ? (
                  linkedInspections.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {item.id}
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {item.product}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                        {item.category}
                      </td>

                      <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white">
                        {item.score}%
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-xs text-slate-400">
                      No inspection logs found for this report scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* STATUTORY DISCLAIMER */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">Official Verification Advisory: </span>
              PackSure AI delivers automated compliance decision support under regulatory inspection guidelines. Final enforcement actions must be endorsed by an authorized compliance officer.
            </div>
          </div>
        </div>

        {/* SIGNATURE BLOCK */}
        <div className="mt-10 flex flex-col justify-between gap-6 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center">
          <div className="text-xs text-slate-400">
            Certified Digital Regulatory Document • PackSure AI Framework
          </div>

          <div className="text-left sm:text-right">
            <div className="font-serif italic text-slate-800 dark:text-slate-200">
              Inspector Verification Signature
            </div>
            <div className="mt-1 text-[11px] font-bold text-slate-500">
              Authorized Enforcement Directorate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// Status Badge Helper
// --------------------------------------------------
function StatusBadge({ status }) {
  const normalized = String(status || "NEEDS_REVIEW").toUpperCase();

  let label = "Review";
  let badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50";
  let Icon = Clock3;

  if (normalized === "COMPLIANT") {
    label = "Compliant";
    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50";
    Icon = CheckCircle2;
  } else if (
    normalized === "HIGH_RISK" ||
    normalized === "HIGH RISK" ||
    normalized === "NON_COMPLIANT" ||
    normalized === "NON-COMPLIANT"
  ) {
    label = "High Risk";
    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50";
    Icon = AlertTriangle;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeStyle}`}>
      <Icon size={11} className="shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export default ReportPreview;
export { ReportPreview };