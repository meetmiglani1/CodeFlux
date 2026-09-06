import React, { useRef, useState, useEffect } from "react";
import {
  Upload,
  Camera,
  X,
  MapPin,
  FileText,
  ScanLine,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { saveInspection } from "../utils/storage";

// Centralized API Base URL with environment override
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://192.168.1.87:8000";

function Inspection() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const stageIntervalRef = useRef(null);

  const [images, setImages] = useState([]);
  const [category, setCategory] = useState("Auto Detect");
  const [location, setLocation] = useState("");
  const [remarks, setRemarks] = useState("");
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current);
      }
    };
  }, []);

  // --------------------------------------------------
  // PROCESS FILES
  // --------------------------------------------------
  const processFiles = (files) => {
    setErrorMessage(null);
    const validFiles = Array.from(files || []).filter((file) =>
      ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)
    );

    if (validFiles.length === 0) {
      setErrorMessage("Please select valid image files (JPG, JPEG, PNG, or WEBP).");
      return;
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        setImages((prev) => [
          ...prev,
          {
            name: file.name,
            url: event.target.result,
            file
          }
        ]);
      };

      reader.onerror = () => {
        console.error("Failed to read image file:", file.name);
      };

      reader.readAsDataURL(file);
    });
  };

  // --------------------------------------------------
  // REMOVE IMAGE
  // --------------------------------------------------
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  // --------------------------------------------------
  // DRAG & DROP
  // --------------------------------------------------
  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    processFiles(event.dataTransfer.files);
  };

  // --------------------------------------------------
  // RUN COMPLIANCE SCAN
  // --------------------------------------------------
  const runScan = async () => {
    setErrorMessage(null);

    if (images.length === 0) {
      setErrorMessage("Please upload at least one product label or packaging image.");
      return;
    }

    const imageFile = images[0]?.file;
    if (!imageFile) {
      setErrorMessage("Could not access image buffer. Please re-upload your image.");
      return;
    }

    setScanning(true);
    setStage(0);

    let currentStage = 0;
    stageIntervalRef.current = setInterval(() => {
      currentStage += 1;
      setStage((prev) => Math.min(prev + 1, 4));
      if (currentStage >= 4) {
        clearInterval(stageIntervalRef.current);
      }
    }, 600);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch(`${API_BASE_URL}/check-compliance`, {
        method: "POST",
        body: formData
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The compliance server returned an invalid or unparseable response.");
      }

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.detail ||
          result?.message ||
          `Inspection screening failed (HTTP ${response.status}).`
        );
      }

      setStage(5);

      // Safe identifier resolution
      const scanId = result?.scan?.scan_id ?? result?.scan_id ?? null;
      const inspectionId =
        scanId !== null && scanId !== undefined
          ? `INS-${scanId}`
          : `INS-${Date.now().toString().slice(-6)}`;

      if (scanId !== null && scanId !== undefined) {
        try {
          localStorage.setItem("packsure_scan_id", String(scanId));
        } catch (storageError) {
          console.warn("Could not save scan ID to localStorage:", storageError);
        }
      }

      // Safe Data Normalization
      const productName =
        result?.product?.product_name ||
        result?.product?.name ||
        result?.product_name ||
        "Inspected Product";

      const detectedCategory =
        result?.product?.category ||
        result?.category ||
        (category !== "Auto Detect" ? category : "General Goods");

      const rawScore = Number(
        result?.compliance?.compliance_score ??
        result?.compliance_score ??
        result?.score ??
        0
      );
      const normalizedScore = Number.isFinite(rawScore)
        ? Math.max(0, Math.min(100, rawScore))
        : 0;

      const rawStatus = String(
        result?.compliance?.overall_status ||
        result?.overall_status ||
        result?.status ||
        "NEEDS_REVIEW"
      ).toUpperCase();

      let normalizedStatus = "NEEDS_REVIEW";
      if (rawStatus.includes("COMPLIANT") && !rawStatus.includes("NON")) {
        normalizedStatus = "COMPLIANT";
      } else if (rawStatus.includes("HIGH") || rawStatus.includes("NON")) {
        normalizedStatus = "HIGH_RISK";
      }

      const rawRisk = String(
        result?.compliance?.risk_level ||
        result?.risk_level ||
        result?.risk ||
        "MEDIUM"
      ).toUpperCase();

      let normalizedRisk = "MEDIUM";
      if (rawRisk.includes("HIGH")) normalizedRisk = "HIGH";
      else if (rawRisk.includes("LOW")) normalizedRisk = "LOW";

      // Formulate canonical inspection object
      const inspection = {
        id: inspectionId,
        scan_id: scanId,
        product: productName,
        category: detectedCategory,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        score: normalizedScore,
        status: normalizedStatus,
        risk: normalizedRisk,
        risk_level: normalizedRisk,
        location: location.trim() || "Facility Unit 1",
        remarks: remarks.trim(),
        apiResult: result
      };

      // Persist to central storage
      saveInspection(inspection);

      // Brief transition pause so user observes 100% completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      setScanning(false);

      // Navigate to Inspection Report via canonical route /inspection/:id
      navigate(`/inspection/${inspectionId}`, {
        state: {
          images,
          category: detectedCategory,
          location: location.trim() || "Facility Unit 1",
          remarks: remarks.trim(),
          inspectionId,
          scanId,
          apiResult: result,
          inspection
        }
      });
    } catch (error) {
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      setScanning(false);
      setStage(0);

      console.error("Compliance API Error:", error);

      const detailedMsg =
        error?.message ||
        `Could not connect to the compliance backend on ${API_BASE_URL}. Ensure FastAPI is active.`;
      setErrorMessage(detailedMsg);
    }
  };

  const stages = [
    "Image Preprocessing & Optimization",
    "OCR Text & Symbol Extraction",
    "Regulatory Knowledge Mapping",
    "Rule Engine Database Verification",
    "Final Compliance Scoring & Classification"
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          <Sparkles size={14} />
          <span>Automated Compliance Engine</span>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
          New Regulatory Inspection
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload product packaging, legal metrology labels, or barcode scans for instant AI verification.
        </p>
      </div>

      {/* IN-APP ERROR BANNER */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="flex-1 text-xs leading-relaxed">
            <p className="font-bold">Inspection Scan Halted</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* IMAGE UPLOAD CONTAINER */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <ScanLine size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Packaging & Label Evidence
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide high-resolution captures of the principal display panel, MRP, and ingredients.
            </p>
          </div>
        </div>

        {/* DROP ZONE */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-10 ${
            dragging
              ? "border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/20"
              : "border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-slate-600"
          }`}
        >
          <Upload className="mx-auto text-slate-400 dark:text-slate-500" size={36} />

          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white sm:text-base">
            Drag & drop label captures here
          </h3>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Supports JPG, JPEG, PNG, or WEBP (Max 15MB per file)
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
            >
              Browse Files
            </button>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:text-sm">
              <Camera size={16} />
              <span>Capture Label</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => processFiles(e.target.files)}
              />
            </label>
          </div>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => processFiles(e.target.files)}
          />
        </div>

        {/* PREVIEW GALLERY */}
        {images.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image, index) => (
              <div
                key={`${image.name}-${index}`}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="h-32 w-full object-cover sm:h-36"
                />

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 text-white transition hover:bg-rose-600"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>

                <div className="truncate px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* METADATA: CATEGORY & LOCATION */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* CATEGORY SELECT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-white">
            Regulatory Category
          </label>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Auto-detection executes multi-class classification from package text.
          </p>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
          >
            <option>Auto Detect</option>
            <option>Packaged Food & Beverages</option>
            <option>Cosmetics & Personal Care</option>
            <option>Pharmaceuticals & Medical</option>
            <option>Household Chemicals</option>
            <option>Electronics & Appliances</option>
            <option>General Commodities</option>
          </select>
        </div>

        {/* LOCATION INPUT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="mb-1 flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
            <span className="flex items-center gap-1.5">
              <MapPin size={15} />
              <span>Inspection Facility / Location</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400">Optional</span>
          </label>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Geo-tagging or warehouse facility identifier.
          </p>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Central Warehouse, Delhi NCR"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
          />
        </div>
      </div>

      {/* OFFICER REMARKS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="mb-1 flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
          <span className="flex items-center gap-1.5">
            <FileText size={15} />
            <span>Field Officer Remarks</span>
          </span>
          <span className="text-[11px] font-normal text-slate-400">Optional</span>
        </label>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Record initial physical condition notes, missing seal flags, or lot identifiers.
        </p>

        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. Batch stamp slightly smudged; manufacturing address verified against standard registry..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
        />
      </div>

      {/* SUBMISSION FOOTER */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-sm"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
        >
          {scanning ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Analyzing Compliance...</span>
            </>
          ) : (
            <>
              <ScanLine size={16} />
              <span>Scan & Check Compliance</span>
            </>
          )}
        </button>
      </div>

      {/* SCANNING MODAL */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Loader2 size={26} className="animate-spin" />
            </div>

            <h2 className="mt-4 text-center text-lg font-black text-slate-900 dark:text-white sm:text-xl">
              Screening Product Label
            </h2>

            <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
              Regulatory compliance engine executing automated rule evaluations.
            </p>

            <div className="mt-6 space-y-3.5">
              {stages.map((stepName, index) => {
                const isCompleted = stage > index;
                const isActive = stage === index;

                return (
                  <div key={stepName} className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : isActive
                          ? "bg-blue-50 text-blue-600 ring-2 ring-blue-500/20 dark:bg-blue-950/50 dark:text-blue-400"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={16} />
                      ) : isActive ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <span
                      className={`text-xs font-medium sm:text-sm ${
                        isCompleted || isActive
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {stepName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inspection;
export { Inspection as NewInspection };