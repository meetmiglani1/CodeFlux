import React, { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Download,
  Eye,
  Plus,
  X,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Printer,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getReports,
  saveReport,
  getInspections
} from "../utils/storage";

// --------------------------------------------------
// Safe Data Normalizers
// --------------------------------------------------
function parseInspectionDate(item) {
  const raw = item?.date ?? item?.createdAt ?? item?.created ?? item?.timestamp;
  if (!raw) return null;

  // DD/MM/YYYY support
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

  const rawRisk = String(
    item?.risk_level ?? item?.risk ?? item?.compliance?.risk_level ?? "MEDIUM"
  ).toUpperCase();
  let risk = "MEDIUM";
  if (rawRisk.includes("HIGH")) risk = "HIGH";
  else if (rawRisk.includes("LOW")) risk = "LOW";

  return {
    id: item?.id ?? `INSP-${String(index + 1).padStart(4, "0")}`,
    product: item?.product ?? item?.product_name ?? item?.productName ?? item?.name ?? "Inspected Item",
    category: item?.category ?? item?.product_category ?? item?.compliance?.category ?? "General",
    score,
    status,
    risk,
    date: item?.date ?? item?.createdAt ?? "Recent"
  };
}

function filterInspectionsByDate(inspections, from, to) {
  const safeInspections = Array.isArray(inspections) ? inspections : [];
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const end = to ? new Date(`${to}T23:59:59.999`) : null;

  return safeInspections.filter((item) => {
    if (!start && !end) return true;
    const date = parseInspectionDate(item);
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function readReports() {
  try {
    const data = getReports();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error reading reports:", error);
    return [];
  }
}

function readInspections() {
  try {
    const data = getInspections();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error reading inspections:", error);
    return [];
  }
}

// --------------------------------------------------
// Main Component
// --------------------------------------------------
function Reports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [reportType, setReportType] = useState("Compliance Summary");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [previewReport, setPreviewReport] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [validationError, setValidationError] = useState("");

  const refreshReports = () => {
    setReports(readReports());
  };

  useEffect(() => {
    refreshReports();
    window.addEventListener("packsure-reports-updated", refreshReports);
    window.addEventListener("storage", refreshReports);
    window.addEventListener("focus", refreshReports);

    return () => {
      window.removeEventListener("packsure-reports-updated", refreshReports);
      window.removeEventListener("storage", refreshReports);
      window.removeEventListener("focus", refreshReports);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------
  // Generate Report Action
  // --------------------------------------------------
  const generateReport = () => {
    setValidationError("");

    if (from && to && from > to) {
      setValidationError("The 'From' date cannot be later than the 'To' date.");
      return;
    }

    const allInspections = readInspections();
    const filteredInspections = filterInspectionsByDate(allInspections, from, to);
    const normalizedList = filteredInspections.map((item, idx) => normalizeInspection(item, idx));

    const scores = normalizedList.map((i) => i.score);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;

    const report = {
      id: `RPT-${Date.now().toString().slice(-7)}`,
      type: reportType,
      from: from || "All Dates",
      to: to || "Present",
      created: new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric"
      }),
      inspections: normalizedList.length,
      score: averageScore,
      inspectionIds: normalizedList.map((item) => item.id),
      status: "Generated"
    };

    try {
      saveReport(report);
      refreshReports();
      setShowModal(false);
      setFrom("");
      setTo("");
      showToast(`Report ${report.id} generated successfully.`);
    } catch (error) {
      console.error("Error saving report:", error);
      setValidationError("Unable to save report to local storage.");
    }
  };

  // --------------------------------------------------
  // HTML Document Generator
  // --------------------------------------------------
  const generateHtmlDocument = (report) => {
    const allInspections = readInspections();
    let targetInspections = [];

    if (Array.isArray(report.inspectionIds) && report.inspectionIds.length > 0) {
      const idSet = new Set(report.inspectionIds.map(String));
      targetInspections = allInspections.filter((item) => idSet.has(String(item?.id)));
    } else {
      const rFrom = /^\d{4}-\d{2}-\d{2}$/.test(String(report.from || "")) ? report.from : "";
      const rTo = /^\d{4}-\d{2}-\d{2}$/.test(String(report.to || "")) ? report.to : "";
      targetInspections = filterInspectionsByDate(allInspections, rFrom, rTo);
    }

    const normalizedRecords = targetInspections.map((item, idx) => normalizeInspection(item, idx));

    const tableRows = normalizedRecords.length > 0
      ? normalizedRecords
          .map((item) => {
            const statusClass =
              item.status === "COMPLIANT"
                ? "color:#059669; font-weight:bold;"
                : item.status === "HIGH_RISK"
                ? "color:#dc2626; font-weight:bold;"
                : "color:#d97706; font-weight:bold;";

            return `
              <tr>
                <td style="font-family: monospace; font-weight:bold;">${escapeHtml(item.id)}</td>
                <td>${escapeHtml(item.product)}</td>
                <td>${escapeHtml(item.category)}</td>
                <td style="font-weight:bold;">${item.score.toFixed(1)}%</td>
                <td style="${statusClass}">${escapeHtml(item.status.replace(/_/g, " "))}</td>
              </tr>
            `;
          })
          .join("")
      : `
          <tr>
            <td colspan="5" style="text-align:center; padding:24px; color:#6b7280;">
              No matching inspection records linked to this report period.
            </td>
          </tr>
        `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(report.id || "Report")} - PackSure AI Compliance</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      padding: 40px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #2563eb;
      margin-bottom: 6px;
    }
    h1 { font-size: 26px; font-weight: 900; color: #0f172a; }
    h2 { font-size: 18px; font-weight: 800; color: #334155; margin-top: 4px; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 24px 0;
    }
    .meta-card {
      padding: 14px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
    }
    .meta-card .lbl {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .meta-card .val {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #475569;
    }
    .footer {
      margin-top: 36px;
      padding-top: 18px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="tag">Statutory Regulatory Compliance Audit</div>
    <h1>PackSure Compliance Intelligence</h1>
    <h2>${escapeHtml(report.type || "Compliance Report")}</h2>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <div class="lbl">Report Reference</div>
      <div class="val">${escapeHtml(report.id || "N/A")}</div>
    </div>
    <div class="meta-card">
      <div class="lbl">Issued Date</div>
      <div class="val">${escapeHtml(report.created || "N/A")}</div>
    </div>
    <div class="meta-card">
      <div class="lbl">Sample Size</div>
      <div class="val">${Number(report.inspections || 0)}</div>
    </div>
    <div class="meta-card">
      <div class="lbl">Aggregate Score</div>
      <div class="val" style="color: #059669;">${Number(report.score || 0)}%</div>
    </div>
  </div>

  <h3 style="font-size: 15px; font-weight: 800; margin-top: 24px; color: #0f172a;">
    Verified Batch & Audit Records
  </h3>

  <table>
    <thead>
      <tr>
        <th>Inspection ID</th>
        <th>Product Description</th>
        <th>Commodity Class</th>
        <th>Compliance Score</th>
        <th>Regulatory Status</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <span>PackSure AI Automated Decision Support Document</span>
    <span>Certified Verification Record</span>
  </div>
</body>
</html>`;
  };

  // --------------------------------------------------
  // Download Report File
  // --------------------------------------------------
  const downloadReport = (report) => {
    if (!report) return;

    try {
      const htmlContent = generateHtmlDocument(report);
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      const cleanFileName = String(report.id || "PackSure-Report").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${cleanFileName}.html`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Downloaded ${report.id}.html`);
    } catch (error) {
      console.error("Download failed:", error);
      showToast("Unable to download report file.");
    }
  };

  // --------------------------------------------------
  // Filtered Reports
  // --------------------------------------------------
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item?.id && item.id.toLowerCase().includes(q)) ||
        (item?.type && item.type.toLowerCase().includes(q));

      const matchesType =
        typeFilter === "ALL" ||
        (item?.type && item.type.toLowerCase() === typeFilter.toLowerCase());

      return matchesSearch && matchesType;
    });
  }, [reports, searchQuery, typeFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl dark:bg-white dark:text-slate-900">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            <ShieldCheck size={14} />
            <span>Statutory Verification</span>
          </div>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
            Compliance Reports
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Synthesize, inspect, and export formal regulatory compliance audits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setValidationError("");
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
        >
          <Plus size={16} />
          <span>Generate Report</span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Report ID (e.g. RPT-...) or Type..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="Compliance Summary">Compliance Summary</option>
            <option value="Inspection Report">Inspection Report</option>
            <option value="Risk Analysis">Risk Analysis</option>
            <option value="Monthly Compliance Report">Monthly Report</option>
          </select>
        </div>
      </div>

      {/* REPORTS TABLE CONTAINER */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Generated Regulatory Records
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredReports.length} of {reports.length} reports
            </p>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white sm:text-base">
              No matching reports found
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {reports.length === 0
                ? "No compliance reports generated yet. Click 'Generate Report' above."
                : "Try adjusting your search query or filter selection."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <th className="px-5 py-3.5">Report ID</th>
                  <th className="px-5 py-3.5">Audit Type</th>
                  <th className="px-5 py-3.5">Generated On</th>
                  <th className="px-5 py-3.5">Inspections</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReports.map((report, index) => (
                  <tr
                    key={report?.id || `report-${index}`}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {report?.id || "N/A"}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {report?.type || "Compliance Summary"}
                    </td>

                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {report?.created || "N/A"}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {Number(report?.inspections || 0)} audits
                    </td>

                    <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(report?.score || 0)}%
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Preview Button */}
                        <button
                          type="button"
                          onClick={() => setPreviewReport(report)}
                          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                          title="Preview Report"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Download Button */}
                        <button
                          type="button"
                          onClick={() => downloadReport(report)}
                          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                          title="Download Report"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          GENERATE REPORT MODAL
      ===================================================== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">
                  Generate Compliance Report
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Filter inspection records by timeframe and classification
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {validationError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-900 dark:text-white">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
                >
                  <option value="Compliance Summary">Compliance Summary</option>
                  <option value="Inspection Report">Inspection Report</option>
                  <option value="Risk Analysis">Risk Analysis</option>
                  <option value="Monthly Compliance Report">Monthly Compliance Report</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-900 dark:text-white">
                    From Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-900 dark:text-white">
                    To Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={generateReport}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <CheckCircle2 size={16} />
                  <span>Generate Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          REPORT PREVIEW MODAL
      ===================================================== */}
      {previewReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPreviewReport(null);
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">
                    {previewReport.id} - {previewReport.type}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Generated: {previewReport.created} • Scope: {previewReport.from} to {previewReport.to}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadReport(previewReport)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewReport(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Embedded Live Preview */}
            <div className="flex-1 overflow-hidden p-4">
              <div className="h-[55vh] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800">
                <iframe
                  title="Report Document Preview"
                  srcDoc={generateHtmlDocument(previewReport)}
                  className="h-full w-full border-none"
                />
              </div>
            </div>

            {/* Preview Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-400 dark:border-slate-800">
              <span>Includes certified audit breakdown & compliance metrics.</span>
              <button
                type="button"
                onClick={() => setPreviewReport(null)}
                className="font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;