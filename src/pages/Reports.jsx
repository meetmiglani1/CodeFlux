import React, { useEffect, useState } from "react";

import {
  FileText,
  Download,
  Eye,
  Plus,
  X,
  CheckCircle2
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getReports,
  saveReport,
  getInspections
} from "../utils/storage";

// --------------------------------------------------
// Parse inspection date safely
// --------------------------------------------------

function parseInspectionDate(item) {
  const raw =
    item?.date ??
    item?.createdAt ??
    item?.created ??
    item?.timestamp;

  if (!raw) {
    return null;
  }

  // DD/MM/YYYY
  if (
    typeof raw === "string" &&
    /^\d{2}\/\d{2}\/\d{4}$/.test(raw)
  ) {
    const [dd, mm, yyyy] = raw.split("/");

    const date = new Date(
      `${yyyy}-${mm}-${dd}T12:00:00`
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  const date = new Date(raw);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

// --------------------------------------------------
// Get inspection score safely
// --------------------------------------------------

function getInspectionScore(item) {
  const score = Number(
    item?.score ??
      item?.compliance_score ??
      item?.compliance?.compliance_score ??
      0
  );

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

// --------------------------------------------------
// Filter inspections by date
// --------------------------------------------------

function filterInspectionsByDate(
  inspections,
  from,
  to
) {
  const safeInspections = Array.isArray(
    inspections
  )
    ? inspections
    : [];

  const start = from
    ? new Date(`${from}T00:00:00`)
    : null;

  const end = to
    ? new Date(`${to}T23:59:59.999`)
    : null;

  return safeInspections.filter((item) => {
    if (!start && !end) {
      return true;
    }

    const date = parseInspectionDate(item);

    if (!date) {
      return false;
    }

    if (start && date < start) {
      return false;
    }

    if (end && date > end) {
      return false;
    }

    return true;
  });
}

// --------------------------------------------------
// Escape HTML before inserting user data
// --------------------------------------------------

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --------------------------------------------------
// Safe storage readers
// --------------------------------------------------

function readReports() {
  try {
    const data = getReports();

    return Array.isArray(data)
      ? data
      : [];
  } catch (error) {
    console.error(
      "Error loading reports:",
      error
    );

    return [];
  }
}

function readInspections() {
  try {
    const data = getInspections();

    return Array.isArray(data)
      ? data
      : [];
  } catch (error) {
    console.error(
      "Error loading inspections:",
      error
    );

    return [];
  }
}

// --------------------------------------------------
// Reports Component
// --------------------------------------------------

function Reports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);

  const [reportType, setReportType] = useState(
    "Compliance Summary"
  );

  const [from, setFrom] = useState("");

  const [to, setTo] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  // --------------------------------------------------
  // Load reports
  // --------------------------------------------------

  useEffect(() => {
    setReports(readReports());
  }, []);

  // --------------------------------------------------
  // Generate Report
  // --------------------------------------------------

  const generateReport = () => {
    // Validate dates
    if (from && to && from > to) {
      window.alert(
        "The From date cannot be later than the To date."
      );

      return;
    }

    const allInspections =
      readInspections();

    const filteredInspections =
      filterInspectionsByDate(
        allInspections,
        from,
        to
      );

    const scores =
      filteredInspections.map(
        getInspectionScore
      );

    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce(
              (sum, score) =>
                sum + score,
              0
            ) / scores.length
          )
        : 0;

    const report = {
      id: `RPT-${Date.now()
        .toString()
        .slice(-7)}`,

      type: reportType,

      from: from || "All dates",

      to: to || "Present",

      created:
        new Date().toLocaleDateString(
          "en-IN"
        ),

      inspections:
        filteredInspections.length,

      score: averageScore,

      inspectionIds:
        filteredInspections
          .map((item) => item?.id)
          .filter(
            (id) =>
              id !== undefined &&
              id !== null
          ),

      status: "Generated"
    };

    try {
      saveReport(report);

      setReports(readReports());

      setShowModal(false);

      // Reset filters after generation
      setFrom("");
      setTo("");

      window.alert(
        "Report generated successfully."
      );
    } catch (error) {
      console.error(
        "Error saving report:",
        error
      );

      window.alert(
        "Unable to save the report. Please try again."
      );
    }
  };

  // --------------------------------------------------
  // Download Report
  // --------------------------------------------------

  const downloadReport = (report) => {
    if (!report) {
      return;
    }

    const allInspections =
      readInspections();

    let inspections = [];

    // ------------------------------------------------
    // New reports:
    // Use exact inspection IDs
    // ------------------------------------------------

    if (
      Array.isArray(
        report.inspectionIds
      )
    ) {
      const selectedIds =
        new Set(
          report.inspectionIds.map(
            (id) => String(id)
          )
        );

      inspections =
        allInspections.filter((item) =>
          selectedIds.has(
            String(item?.id)
          )
        );
    }

    // ------------------------------------------------
    // Old reports:
    // Use date filtering
    // ------------------------------------------------

    else {
      const reportFrom =
        /^\d{4}-\d{2}-\d{2}$/.test(
          String(report.from || "")
        )
          ? report.from
          : "";

      const reportTo =
        /^\d{4}-\d{2}-\d{2}$/.test(
          String(report.to || "")
        )
          ? report.to
          : "";

      inspections =
        filterInspectionsByDate(
          allInspections,
          reportFrom,
          reportTo
        );
    }

    // ------------------------------------------------
    // Create table rows
    // ------------------------------------------------

    const tableRows =
      inspections.length > 0
        ? inspections
            .map((item) => {
              const score =
                getInspectionScore(
                  item
                );

              return `
                <tr>
                  <td>
                    ${escapeHtml(
                      item?.id ||
                        "N/A"
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      item?.product ||
                        "Unknown Product"
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      item?.category ||
                        "N/A"
                    )}
                  </td>

                  <td>
                    ${score.toFixed(1)}%
                  </td>

                  <td>
                    ${escapeHtml(
                      item?.status ||
                        "N/A"
                    )}
                  </td>
                </tr>
              `;
            })
            .join("")
        : `
            <tr>
              <td
                colspan="5"
                style="
                  text-align:center;
                  padding:20px;
                "
              >
                No inspection records found.
              </td>
            </tr>
          `;

    // ------------------------------------------------
    // Create HTML report
    // ------------------------------------------------

    const html = `
<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    ${escapeHtml(
      report.id || "Report"
    )} - PackSure AI
  </title>

  <style>

    * {
      box-sizing: border-box;
    }

    body {
      font-family:
        Arial,
        Helvetica,
        sans-serif;

      padding: 40px;

      color: #111827;

      background: #ffffff;

      line-height: 1.6;
    }

    .header {
      border-bottom:
        3px solid #2563eb;

      padding-bottom: 20px;

      margin-bottom: 30px;
    }

    h1 {
      margin: 0;

      color: #1d4ed8;

      font-size: 30px;
    }

    h2 {
      margin-top: 10px;

      color: #111827;

      font-size: 22px;
    }

    .info {
      display: grid;

      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 15px;

      margin-top: 25px;
    }

    .info-card {
      padding: 15px;

      border:
        1px solid #e5e7eb;

      border-radius: 10px;

      background: #f9fafb;
    }

    .label {
      font-size: 12px;

      text-transform: uppercase;

      color: #6b7280;

      font-weight: bold;
    }

    .value {
      margin-top: 4px;

      font-size: 17px;

      font-weight: bold;
    }

    table {
      width: 100%;

      border-collapse: collapse;

      margin-top: 30px;
    }

    th,
    td {
      border:
        1px solid #d1d5db;

      padding: 11px;

      text-align: left;
    }

    th {
      background: #f3f4f6;

      font-size: 13px;

      text-transform: uppercase;
    }

    td {
      font-size: 14px;
    }

    .footer {
      margin-top: 40px;

      padding-top: 20px;

      border-top:
        1px solid #e5e7eb;

      color: #6b7280;

      font-size: 12px;
    }

    @media print {

      body {
        padding: 20px;
      }

    }

  </style>

</head>

<body>

  <div class="header">

    <h1>
      PackSure AI
    </h1>

    <h2>
      ${escapeHtml(
        report.type ||
          "Compliance Report"
      )}
    </h2>

    <p>
      Automated compliance inspection report
    </p>

  </div>


  <div class="info">

    <div class="info-card">

      <div class="label">
        Report ID
      </div>

      <div class="value">
        ${escapeHtml(
          report.id ||
            "N/A"
        )}
      </div>

    </div>


    <div class="info-card">

      <div class="label">
        Generated
      </div>

      <div class="value">
        ${escapeHtml(
          report.created ||
            "N/A"
        )}
      </div>

    </div>


    <div class="info-card">

      <div class="label">
        Period
      </div>

      <div class="value">
        ${escapeHtml(
          report.from ||
            "All dates"
        )}
        -
        ${escapeHtml(
          report.to ||
            "Present"
        )}
      </div>

    </div>


    <div class="info-card">

      <div class="label">
        Total Inspections
      </div>

      <div class="value">
        ${Number(
          report.inspections || 0
        )}
      </div>

    </div>


    <div class="info-card">

      <div class="label">
        Average Compliance
      </div>

      <div class="value">
        ${Number(
          report.score || 0
        )}%
      </div>

    </div>

  </div>


  <h2>
    Inspection Details
  </h2>


  <table>

    <thead>

      <tr>

        <th>
          ID
        </th>

        <th>
          Product
        </th>

        <th>
          Category
        </th>

        <th>
          Score
        </th>

        <th>
          Status
        </th>

      </tr>

    </thead>


    <tbody>

      ${tableRows}

    </tbody>

  </table>


  <div class="footer">

    <p>
      PackSure AI provides preliminary
      screening and decision support.
      Final statutory assessment should
      be verified by an authorized officer.
    </p>

    <p>
      Generated automatically by PackSure AI.
    </p>

  </div>

</body>

</html>
`;

    // ------------------------------------------------
    // Create downloadable file
    // ------------------------------------------------

    try {
      const blob = new Blob(
        [html],
        {
          type: "text/html"
        }
      );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      const safeFileName =
        String(
          report.id ||
            "PackSure-Report"
        ).replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        );

      link.download =
        `${safeFileName}.html`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      setTimeout(() => {
        URL.revokeObjectURL(
          url
        );
      }, 1000);
    } catch (error) {
      console.error(
        "Download error:",
        error
      );

      window.alert(
        "Unable to download the report."
      );
    }
  };

  // --------------------------------------------------
  // Close modal
  // --------------------------------------------------

  const closeModal = () => {
    setShowModal(false);
  };

  // --------------------------------------------------
  // JSX
  // --------------------------------------------------

  return (
    <div className="mx-auto max-w-7xl">

      {/* -------------------------------------------- */}
      {/* Header */}
      {/* -------------------------------------------- */}

      <div
        className="
          flex
          flex-col
          justify-between
          gap-4
          md:flex-row
          md:items-center
        "
      >

        <div>

          <p
            className="
              text-xs
              font-bold
              uppercase
              tracking-widest
              text-blue-600
              dark:text-blue-400
            "
          >
            Documents
          </p>

          <h1
            className="
              mt-2
              text-3xl
              font-black
              text-slate-900
              dark:text-white
            "
          >
            Reports
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-slate-600
              dark:text-slate-400
            "
          >
            Generate, view and export
            inspection reports.
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            setShowModal(true)
          }
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-blue-600
            px-5
            py-3
            text-sm
            font-bold
            text-white
            transition
            hover:bg-blue-500
            active:scale-[0.98]
          "
        >

          <Plus size={17} />

          Generate Report

        </button>

      </div>


      {/* -------------------------------------------- */}
      {/* Information Banner */}
      {/* -------------------------------------------- */}

      <div
        className="
          mt-7
          rounded-3xl
          border
          border-blue-200
          bg-blue-50
          p-6
          dark:border-blue-500/20
          dark:bg-blue-500/5
        "
      >

        <div
          className="
            flex
            items-start
            gap-4
          "
        >

          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-blue-100
              text-blue-600
              dark:bg-blue-500/10
              dark:text-blue-400
            "
          >

            <FileText size={21} />

          </div>


          <div>

            <h2
              className="
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              Compliance Reports
            </h2>

            <p
              className="
                mt-1
                max-w-2xl
                text-sm
                leading-6
                text-slate-600
                dark:text-slate-400
              "
            >
              Create inspection summaries from
              your saved compliance records and
              export them directly from the browser.
            </p>

          </div>

        </div>

      </div>


      {/* -------------------------------------------- */}
      {/* Reports Table */}
      {/* -------------------------------------------- */}

      <div
        className="
          mt-6
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
          dark:shadow-none
        "
      >

        <div
          className="
            border-b
            border-slate-200
            p-5
            dark:border-slate-800
          "
        >

          <h2
            className="
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Generated Reports
          </h2>

        </div>


        {reports.length === 0 ? (

          /* ---------------------------------------- */
          /* Empty State */
          /* ---------------------------------------- */

          <div
            className="
              p-12
              text-center
            "
          >

            <FileText
              size={40}
              className="
                mx-auto
                text-slate-300
                dark:text-slate-700
              "
            />

            <h3
              className="
                mt-4
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              No reports generated yet
            </h3>

            <p
              className="
                mt-2
                text-sm
                text-slate-600
                dark:text-slate-400
              "
            >
              Click "Generate Report" to
              create your first report.
            </p>

          </div>

        ) : (

          /* ---------------------------------------- */
          /* Reports */
          /* ---------------------------------------- */

          <div className="overflow-x-auto">

            <table
              className="
                w-full
                text-left
                text-sm
              "
            >

              <thead
                className="
                  border-b
                  border-slate-200
                  bg-slate-50
                  text-xs
                  uppercase
                  tracking-wider
                  text-slate-500
                  dark:border-slate-800
                  dark:bg-slate-950
                  dark:text-slate-500
                "
              >

                <tr>

                  <th className="px-5 py-4">
                    Report ID
                  </th>

                  <th className="px-5 py-4">
                    Type
                  </th>

                  <th className="px-5 py-4">
                    Generated
                  </th>

                  <th className="px-5 py-4">
                    Inspections
                  </th>

                  <th className="px-5 py-4">
                    Score
                  </th>

                  <th className="px-5 py-4">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {reports.map(
                  (report, index) => (

                    <tr
                      key={
                        report?.id ||
                        `report-${index}`
                      }
                      className="
                        border-b
                        border-slate-200
                        last:border-0
                        dark:border-slate-800
                        transition
                        hover:bg-slate-50
                        dark:hover:bg-slate-800/50
                      "
                    >

                      <td
                        className="
                          px-5
                          py-4
                          font-bold
                          text-slate-900
                          dark:text-white
                        "
                      >
                        {report?.id ||
                          "N/A"}
                      </td>


                      <td
                        className="
                          px-5
                          py-4
                          text-slate-700
                          dark:text-slate-200
                        "
                      >
                        {report?.type ||
                          "Compliance Summary"}
                      </td>


                      <td
                        className="
                          px-5
                          py-4
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        {report?.created ||
                          "N/A"}
                      </td>


                      <td
                        className="
                          px-5
                          py-4
                          text-slate-700
                          dark:text-slate-200
                        "
                      >
                        {Number(
                          report?.inspections ||
                            0
                        )}
                      </td>


                      <td
                        className="
                          px-5
                          py-4
                          font-bold
                          text-emerald-600
                          dark:text-emerald-400
                        "
                      >
                        {Number(
                          report?.score ||
                            0
                        )}
                        %
                      </td>


                      <td className="px-5 py-4">

                        <div
                          className="
                            flex
                            gap-2
                          "
                        >

                          {/* View */}

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                report?.id
                              ) {
                                navigate(
                                  `/reports/view/${report.id}`
                                );
                              }
                            }}
                            className="
                              rounded-lg
                              border
                              border-slate-300
                              p-2
                              text-slate-500
                              transition
                              hover:border-blue-500
                              hover:bg-blue-50
                              hover:text-blue-500
                              dark:border-slate-700
                              dark:text-slate-400
                              dark:hover:bg-blue-500/10
                              dark:hover:text-blue-400
                            "
                            title="View Report"
                          >

                            <Eye
                              size={16}
                            />

                          </button>


                          {/* Download */}

                          <button
                            type="button"
                            onClick={() =>
                              downloadReport(
                                report
                              )
                            }
                            className="
                              rounded-lg
                              border
                              border-slate-300
                              p-2
                              text-slate-500
                              transition
                              hover:border-emerald-500
                              hover:bg-emerald-50
                              hover:text-emerald-500
                              dark:border-slate-700
                              dark:text-slate-400
                              dark:hover:bg-emerald-500/10
                              dark:hover:text-emerald-400
                            "
                            title="Download Report"
                          >

                            <Download
                              size={16}
                            />

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* -------------------------------------------- */}
      {/* Generate Report Modal */}
      {/* -------------------------------------------- */}

      {showModal && (

        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/50
            p-5
            backdrop-blur-sm
            dark:bg-black/80
          "
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div
            className="
              w-full
              max-w-lg
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-6
              text-slate-900
              shadow-2xl
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-white
            "
          >

            {/* Modal Header */}

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <h2
                className="
                  text-xl
                  font-black
                "
              >
                Generate Report
              </h2>


              <button
                type="button"
                onClick={
                  closeModal
                }
                className="
                  rounded-lg
                  p-2
                  text-slate-500
                  transition
                  hover:bg-slate-100
                  hover:text-slate-900
                  dark:hover:bg-slate-800
                  dark:hover:text-white
                "
                title="Close"
              >

                <X size={18} />

              </button>

            </div>


            {/* Modal Body */}

            <div
              className="
                mt-6
                space-y-5
              "
            >

              {/* Report Type */}

              <div>

                <label
                  htmlFor="report-type"
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                  "
                >
                  Report Type
                </label>


                <select
                  id="report-type"
                  value={
                    reportType
                  }
                  onChange={(e) =>
                    setReportType(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    px-4
                    py-3
                    text-slate-900
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-500/20
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:text-white
                  "
                >

                  <option value="Compliance Summary">
                    Compliance Summary
                  </option>

                  <option value="Inspection Report">
                    Inspection Report
                  </option>

                  <option value="Risk Analysis">
                    Risk Analysis
                  </option>

                  <option value="Monthly Compliance Report">
                    Monthly Compliance Report
                  </option>

                </select>

              </div>


              {/* Dates */}

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                "
              >

                {/* From */}

                <div>

                  <label
                    htmlFor="from-date"
                    className="
                      mb-2
                      block
                      text-sm
                      font-bold
                    "
                  >
                    From
                  </label>


                  <input
                    id="from-date"
                    type="date"
                    value={from}
                    onChange={(e) =>
                      setFrom(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-3
                      text-sm
                      text-slate-900
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-500/20
                      dark:border-slate-700
                      dark:bg-slate-950
                      dark:text-white
                    "
                  />

                </div>


                {/* To */}

                <div>

                  <label
                    htmlFor="to-date"
                    className="
                      mb-2
                      block
                      text-sm
                      font-bold
                    "
                  >
                    To
                  </label>


                  <input
                    id="to-date"
                    type="date"
                    value={to}
                    onChange={(e) =>
                      setTo(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-3
                      text-sm
                      text-slate-900
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-500/20
                      dark:border-slate-700
                      dark:bg-slate-950
                      dark:text-white
                    "
                  />

                </div>

              </div>


              {/* Generate */}

              <button
                type="button"
                onClick={
                  generateReport
                }
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  py-3.5
                  font-bold
                  text-white
                  transition
                  hover:bg-blue-500
                  active:scale-[0.99]
                "
              >

                <CheckCircle2
                  size={18}
                />

                Generate Report

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Reports;