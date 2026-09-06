// ============================================================
// PACKSURE AI - STORAGE UTILITY
// ============================================================

const INSPECTIONS_KEY = "packsureInspections";
const REPORTS_KEY = "packsureReports";

// ============================================================
// DEMO DATA
// ============================================================

const demoInspections = [
  {
    id: "INS-1001",
    product: "Packaged Food",
    category: "Packaged Items",
    date: "2026-09-01",
    createdAt: "2026-09-01T10:30:00.000Z",
    score: 94,
    status: "COMPLIANT",
    risk_level: "LOW",
    risk: "LOW",
    location: "Delhi",
    remarks: ""
  },

  {
    id: "INS-1002",
    product: "Face Cream",
    category: "Cosmetics",
    date: "2026-09-02",
    createdAt: "2026-09-02T11:45:00.000Z",
    score: 87,
    status: "REVIEW",
    risk_level: "MEDIUM",
    risk: "MEDIUM",
    location: "New Delhi",
    remarks: ""
  },

  {
    id: "INS-1003",
    product: "Medicine Pack",
    category: "Pharma",
    date: "2026-09-02",
    createdAt: "2026-09-02T14:20:00.000Z",
    score: 72,
    status: "HIGH RISK",
    risk_level: "HIGH",
    risk: "HIGH",
    location: "Gurugram",
    remarks: ""
  },

  {
    id: "INS-1004",
    product: "Stationery Set",
    category: "Stationery",
    date: "2026-09-03",
    createdAt: "2026-09-03T09:15:00.000Z",
    score: 91,
    status: "COMPLIANT",
    risk_level: "LOW",
    risk: "LOW",
    location: "Delhi",
    remarks: ""
  }
];

// ============================================================
// SAFE STORAGE READ
// ============================================================

function readStorage(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);

    if (data === null) {
      return fallback;
    }

    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      console.warn(
        `Invalid data found for ${key}.`
      );

      return fallback;
    }

    return parsed;
  } catch (error) {
    console.error(
      `Error reading ${key}:`,
      error
    );

    return fallback;
  }
}

// ============================================================
// NORMALIZE SCORE
// ============================================================

function normalizeScore(value) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

// ============================================================
// NORMALIZE TEXT
// ============================================================

function normalizeText(value, fallback = "") {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

// ============================================================
// GET INSPECTIONS
// ============================================================

export function getInspections() {
  try {
    const data =
      localStorage.getItem(
        INSPECTIONS_KEY
      );

    // --------------------------------------------------------
    // First application load
    // --------------------------------------------------------

    if (data === null) {
      localStorage.setItem(
        INSPECTIONS_KEY,
        JSON.stringify(demoInspections)
      );

      return [...demoInspections];
    }

    // --------------------------------------------------------
    // Parse existing data
    // --------------------------------------------------------

    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      console.warn(
        "Invalid inspection data. Restoring demo data."
      );

      localStorage.setItem(
        INSPECTIONS_KEY,
        JSON.stringify(demoInspections)
      );

      return [...demoInspections];
    }

    return parsed;
  } catch (error) {
    console.error(
      "Failed to load inspections:",
      error
    );

    return [];
  }
}

// ============================================================
// SAVE INSPECTION
// ============================================================

export function saveInspection(
  inspection
) {
  try {
    if (
      !inspection ||
      typeof inspection !== "object"
    ) {
      throw new Error(
        "Invalid inspection data."
      );
    }

    const inspections =
      getInspections();

    // --------------------------------------------------------
    // Generate ID
    // --------------------------------------------------------

    const generatedId =
      `INS-${Date.now()
        .toString()
        .slice(-6)}`;

    const inspectionId =
      inspection.id ||
      generatedId;

    // --------------------------------------------------------
    // Normalize values
    // --------------------------------------------------------

    const score = normalizeScore(
      inspection.score ??
        inspection.compliance_score ??
        inspection.compliance
          ?.compliance_score
    );

    const status =
      inspection.status ||
      inspection.overall_status ||
      inspection.compliance
        ?.overall_status ||
      "UNKNOWN";

    const risk =
      inspection.risk_level ||
      inspection.risk ||
      inspection.compliance
        ?.risk_level ||
      "UNKNOWN";

    // --------------------------------------------------------
    // Create final object
    // --------------------------------------------------------

    const newInspection = {
      ...inspection,

      id: inspectionId,

      scan_id:
        inspection.scan_id ??
        null,

      product:
        inspection.product ||
        "Unknown Product",

      category:
        inspection.category ||
        "Auto Detect",

      date:
        inspection.date ||
        new Date()
          .toISOString()
          .split("T")[0],

      createdAt:
        inspection.createdAt ||
        new Date().toISOString(),

      score,

      status,

      risk_level: risk,

      risk,

      location:
        inspection.location ||
        "Not specified",

      remarks:
        inspection.remarks ||
        ""
    };

    // --------------------------------------------------------
    // Prevent accidental duplicate object
    // --------------------------------------------------------

    const existingIndex =
      inspections.findIndex(
        (item) =>
          String(item.id) ===
          String(newInspection.id)
      );

    let updatedInspections;

    if (existingIndex !== -1) {
      updatedInspections =
        [...inspections];

      updatedInspections[
        existingIndex
      ] = {
        ...updatedInspections[
          existingIndex
        ],
        ...newInspection
      };
    } else {
      updatedInspections = [
        newInspection,
        ...inspections
      ];
    }

    // --------------------------------------------------------
    // SAVE TO LOCAL STORAGE
    // --------------------------------------------------------

    localStorage.setItem(
      INSPECTIONS_KEY,
      JSON.stringify(
        updatedInspections
      )
    );

    // --------------------------------------------------------
    // Notify Dashboard / Analytics
    // --------------------------------------------------------

    window.dispatchEvent(
      new Event(
        "packsure-inspections-updated"
      )
    );

    return newInspection;
  } catch (error) {
    console.error(
      "Failed to save inspection:",
      error
    );

    throw error;
  }
}

// ============================================================
// GET INSPECTION BY ID
// ============================================================

export function getInspectionById(
  id
) {
  try {
    const inspections =
      getInspections();

    return inspections.find(
      (item) =>
        String(item.id) ===
        String(id)
    );
  } catch (error) {
    console.error(
      "Failed to find inspection:",
      error
    );

    return null;
  }
}

// ============================================================
// DELETE INSPECTION
// ============================================================

export function deleteInspection(
  id
) {
  try {
    const inspections =
      getInspections();

    const updatedInspections =
      inspections.filter(
        (item) =>
          String(item.id) !==
          String(id)
      );

    localStorage.setItem(
      INSPECTIONS_KEY,
      JSON.stringify(
        updatedInspections
      )
    );

    window.dispatchEvent(
      new Event(
        "packsure-inspections-updated"
      )
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to delete inspection:",
      error
    );

    return false;
  }
}

// ============================================================
// CLEAR ALL INSPECTIONS
// ============================================================

export function clearInspections() {
  try {
    localStorage.setItem(
      INSPECTIONS_KEY,
      JSON.stringify([])
    );

    window.dispatchEvent(
      new Event(
        "packsure-inspections-updated"
      )
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to clear inspections:",
      error
    );

    return false;
  }
}

// ============================================================
// RESET TO DEMO DATA
// ============================================================

export function resetInspections() {
  try {
    localStorage.setItem(
      INSPECTIONS_KEY,
      JSON.stringify(demoInspections)
    );

    window.dispatchEvent(
      new Event(
        "packsure-inspections-updated"
      )
    );

    return [
      ...demoInspections
    ];
  } catch (error) {
    console.error(
      "Failed to reset inspections:",
      error
    );

    return [];
  }
}

// ============================================================
// GET REPORTS
// ============================================================

export function getReports() {
  return readStorage(
    REPORTS_KEY,
    []
  );
}

// ============================================================
// SAVE REPORT
// ============================================================

export function saveReport(
  report
) {
  try {
    if (
      !report ||
      typeof report !== "object"
    ) {
      throw new Error(
        "Invalid report data."
      );
    }

    const reports =
      getReports();

    const reportId =
      report.id ||
      `REP-${Date.now()
        .toString()
        .slice(-6)}`;

    const newReport = {
      ...report,

      id: reportId,

      createdAt:
        report.createdAt ||
        new Date().toISOString()
    };

    // --------------------------------------------------------
    // Prevent duplicate report
    // --------------------------------------------------------

    const existingIndex =
      reports.findIndex(
        (item) =>
          String(item.id) ===
          String(newReport.id)
      );

    let updatedReports;

    if (existingIndex !== -1) {
      updatedReports = [
        ...reports
      ];

      updatedReports[
        existingIndex
      ] = {
        ...updatedReports[
          existingIndex
        ],
        ...newReport
      };
    } else {
      updatedReports = [
        newReport,
        ...reports
      ];
    }

    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    localStorage.setItem(
      REPORTS_KEY,
      JSON.stringify(
        updatedReports
      )
    );

    // --------------------------------------------------------
    // Notify reports page
    // --------------------------------------------------------

    window.dispatchEvent(
      new Event(
        "packsure-reports-updated"
      )
    );

    return newReport;
  } catch (error) {
    console.error(
      "Failed to save report:",
      error
    );

    throw error;
  }
}

// ============================================================
// GET REPORT BY ID
// ============================================================

export function getReportById(
  id
) {
  try {
    const reports =
      getReports();

    return reports.find(
      (report) =>
        String(report.id) ===
        String(id)
    );
  } catch (error) {
    console.error(
      "Failed to find report:",
      error
    );

    return null;
  }
}

// ============================================================
// DELETE REPORT
// ============================================================

export function deleteReport(
  id
) {
  try {
    const reports =
      getReports();

    const updatedReports =
      reports.filter(
        (report) =>
          String(report.id) !==
          String(id)
      );

    localStorage.setItem(
      REPORTS_KEY,
      JSON.stringify(
        updatedReports
      )
    );

    window.dispatchEvent(
      new Event(
        "packsure-reports-updated"
      )
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to delete report:",
      error
    );

    return false;
  }
}

// ============================================================
// CLEAR ALL REPORTS
// ============================================================

export function clearReports() {
  try {
    localStorage.setItem(
      REPORTS_KEY,
      JSON.stringify([])
    );

    window.dispatchEvent(
      new Event(
        "packsure-reports-updated"
      )
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to clear reports:",
      error
    );

    return false;
  }
}

// ============================================================
// CLEAR COMPLETE PACKSURE STORAGE
// ============================================================

export function clearAllStorage() {
  try {
    localStorage.removeItem(
      INSPECTIONS_KEY
    );

    localStorage.removeItem(
      REPORTS_KEY
    );

    localStorage.removeItem(
      "packsure_scan_id"
    );

    window.dispatchEvent(
      new Event(
        "packsure-inspections-updated"
      )
    );

    window.dispatchEvent(
      new Event(
        "packsure-reports-updated"
      )
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to clear PackSure storage:",
      error
    );

    return false;
  }
}