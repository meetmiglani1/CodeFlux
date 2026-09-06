import React, { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  Printer,
  Sparkles,
  MapPin,
  Calendar,
  Clock3,
  FileText,
  Tag,
  ScanLine
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getInspections } from "../utils/storage";

function InspectionReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: paramId } = useParams();

  // --------------------------------------------------
  // 1. Resilient Data Hydration (State or Storage)
  // --------------------------------------------------
  const inspectionData = useMemo(() => {
    const stateData = location.state || {};
    if (stateData && (stateData.apiResult || stateData.score !== undefined || stateData.inspection)) {
      return stateData.inspection || stateData;
    }

    // Direct link or page refresh: Fallback to localStorage
    if (paramId) {
      try {
        const savedList = typeof getInspections === "function" ? getInspections() : [];
        if (Array.isArray(savedList)) {
          const found = savedList.find(
            (i) => String(i?.id).toLowerCase() === String(paramId).toLowerCase()
          );
          if (found) return found;
        }
      } catch (err) {
        console.error("Failed to recover inspection from storage:", err);
      }
    }

    return stateData;
  }, [location.state, paramId]);

  const apiResult = inspectionData?.apiResult || {};
  const compliance = apiResult?.compliance || inspectionData?.compliance || {};

  // --------------------------------------------------
  // 2. Safe Field Extraction & Normalization
  // --------------------------------------------------
  const inspectionId =
    inspectionData?.inspectionId ||
    inspectionData?.id ||
    paramId ||
    "INS-OFFLINE";

  const rawScore = Number(
    compliance?.compliance_score ??
    inspectionData?.score ??
    inspectionData?.compliance_score ??
    0
  );
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : 0;

  const rawStatus = String(
    compliance?.overall_status ||
    inspectionData?.status ||
    inspectionData?.overall_status ||
    "NEEDS_REVIEW"
  ).toUpperCase();

  let overallStatus = "NEEDS_REVIEW";
  if (rawStatus.includes("COMPLIANT") && !rawStatus.includes("NON")) {
    overallStatus = "COMPLIANT";
  } else if (rawStatus.includes("HIGH") || rawStatus.includes("NON")) {
    overallStatus = "HIGH_RISK";
  }

  const rawRisk = String(
    compliance?.risk_level ||
    inspectionData?.risk_level ||
    inspectionData?.risk ||
    "MEDIUM"
  ).toUpperCase();

  let riskLevel = "MEDIUM";
  if (rawRisk.includes("HIGH")) riskLevel = "HIGH";
  else if (rawRisk.includes("LOW")) riskLevel = "LOW";

  const productName =
    apiResult?.product?.product_name ||
    apiResult?.product?.name ||
    inspectionData?.product ||
    "Inspected Commodity";

  const category =
    apiResult?.product?.category ||
    inspectionData?.category ||
    "Packaged Commodity";

  const locationName =
    inspectionData?.location ||
    apiResult?.location ||
    "Facility Unit 1";

  const scanId =
    inspectionData?.scanId ??
    inspectionData?.scan_id ??
    apiResult?.scan?.scan_id ??
    apiResult?.scan_id ??
    "N/A";

  const date =
    inspectionData?.date ||
    (inspectionData?.createdAt ? inspectionData.createdAt.split("T")[0] : null) ||
    new Date().toISOString().split("T")[0];

  const remarks = inspectionData?.remarks || "";
  const images = inspectionData?.images || [];

  // --------------------------------------------------
  // 3. Rule Matrix Normalization
  // --------------------------------------------------
  const rawRules =
    compliance?.rule_results ||
    apiResult?.rule_results ||
    apiResult?.rules ||
    inspectionData?.ruleResults ||
    [];

  const checks = useMemo(() => {
    return (Array.isArray(rawRules) ? rawRules : []).map((rule, idx) => {
      const code =
        rule.rule_code ||
        rule.rule_name ||
        rule.rule ||
        `Rule-${String(idx + 1).padStart(2, "0")}`;

      const extracted =
        rule.extracted_value === null ||
        rule.extracted_value === undefined ||
        rule.extracted_value === ""
          ? "Not Detected"
          : String(rule.extracted_value);

      const statusUpper = String(rule.status || "").toUpperCase();
      let result = "REVIEW";
      if (statusUpper === "PASS" || statusUpper === "COMPLIANT") {
        result = "PASS";
      } else if (statusUpper === "FAIL" || statusUpper === "NON_COMPLIANT") {
        result = "FAIL";
      }

      const description = rule.description || rule.clause || "Statutory packaging declaration requirement.";

      return {
        id: code,
        name: code,
        detection: extracted,
        result,
        description
      };
    });
  }, [rawRules]);

  const passedChecksCount = checks.filter((c) => c.result === "PASS").length;
  const failedChecksCount = checks.filter((c) => c.result === "FAIL").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-14">
      {/* NAVIGATION & ACTION BAR (HIDDEN IN PRINT) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => navigate("/inspection")}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:text-sm"
        >
          <ArrowLeft size={16} />
          <span>New Inspection</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/history")}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-sm"
          >
            Audit History
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
          >
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* =====================================================
          REPORT CARD CONTAINER
      ===================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:p-8 print:border-none print:p-0 print:shadow-none">

        {/* HEADER BLOCK */}
        <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              <Sparkles size={14} />
              <span>Inspection Screening Result</span>
            </div>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Compliance Verification Audit
            </h1>

            <p className="mt-1 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
              Inspection Reference: {inspectionId}
            </p>
          </div>

          {/* COMPLIANCE SCORE BADGE */}
          <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
              <ShieldCheck size={26} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Compliance Score
              </p>
              <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {score}%
              </p>
            </div>
          </div>
        </div>

        {/* METADATA GRID */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-slate-400">
              <Tag size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Commodity Class</span>
            </div>
            <p className="mt-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
              {category}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Audit Facility</span>
            </div>
            <p className="mt-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
              {locationName}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Inspection Date</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
              {date}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock3 size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Risk Level</span>
            </div>
            <div className="mt-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-black ${
                  riskLevel === "LOW"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : riskLevel === "HIGH"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                {riskLevel}
              </span>
            </div>
          </div>
        </div>

        {/* COMMODITY DETAILS STRIP */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Product Title</p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{productName}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Scan Session ID</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{scanId}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status Assessment</p>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    overallStatus === "COMPLIANT"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : overallStatus === "HIGH_RISK"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                  }`}
                >
                  {overallStatus.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* EVIDENCE GALLERY (IF IMAGES ATTACHED) */}
        {images.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ScanLine size={16} className="text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Packaging Evidence Artifacts ({images.length})
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img, idx) => (
                <div key={idx} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img
                    src={img.url || img}
                    alt={`Evidence ${idx + 1}`}
                    className="h-32 w-full object-cover sm:h-36"
                  />
                  <div className="truncate px-2 py-1 text-[10px] text-slate-400">
                    {img.name || `Capture ${idx + 1}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPLIANCE RULES MATRIX */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                Statutory Declaration Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rule engine evaluation under Legal Metrology Act (Packaged Commodities Rules)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                {passedChecksCount} Passed
              </span>
              {failedChecksCount > 0 && (
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  {failedChecksCount} Failed
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3.5">Mandatory Rule Clause</th>
                  <th className="px-4 py-3.5">OCR Extracted Text</th>
                  <th className="px-4 py-3.5 text-right">Statutory Result</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {checks.length > 0 ? (
                  checks.map((rule) => (
                    <tr key={rule.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{rule.name}</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">{rule.description}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {rule.detection}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {rule.result === "PASS" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <CheckCircle2 size={12} />
                            <span>Compliant</span>
                          </span>
                        ) : rule.result === "FAIL" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                            <XCircle size={12} />
                            <span>Violation</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                            <AlertTriangle size={12} />
                            <span>Needs Review</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-xs text-slate-400">
                      No automated rule evaluations recorded. Please run an image compliance scan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI REMEDIATION & RECOMMENDATIONS */}
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            <Sparkles size={16} />
            <span>AI Regulatory Remediation Protocol</span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {failedChecksCount > 0
              ? `Remediation Required: Scanned commodity exhibits ${failedChecksCount} non-compliant statutory elements. Ensure principal display panel declares Maximum Retail Price (MRP inclusive of all taxes), standardized net quantity units, and verifiable consumer grievance contacts.`
              : "Remediation Clear: No statutory violations flagged. Verify date of packaging and physical seal integrity prior to issuing clearance certificate."}
          </p>
        </div>

        {/* OFFICER REMARKS */}
        {remarks && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <FileText size={15} />
              <span>Officer Field Notes</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {remarks}
            </p>
          </div>
        )}

        {/* STATUTORY DISCLAIMER */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] leading-relaxed">
            <strong>Statutory Notice: </strong> PackSure AI delivers automated decision support under the Legal Metrology (Packaged Commodities) Rules. Final regulatory enforcement or sanction must be endorsed by an authorized compliance officer.
          </p>
        </div>

      </div>
    </div>
  );
}

export default InspectionReport;