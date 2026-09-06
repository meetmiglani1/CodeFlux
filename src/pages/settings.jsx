import React, { useEffect, useState, useRef } from "react";
import {
  User,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  Server,
  Building2,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from "lucide-react";

function Settings() {
  const [name, setName] = useState("Inspector R. Sharma");
  const [email, setEmail] = useState("officer.sharma@regulatory.gov.in");
  const [department, setDepartment] = useState("Legal Metrology & Standards");
  const [apiUrl, setApiUrl] = useState("http://192.168.1.87:8000");
  const [notifications, setNotifications] = useState(true);
  const [autoVerify, setAutoVerify] = useState(true);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // --------------------------------------------------
  // Load Saved Settings
  // --------------------------------------------------
  useEffect(() => {
    try {
      const savedName = localStorage.getItem("packsureOfficerName");
      const savedEmail = localStorage.getItem("packsureOfficerEmail");
      const savedDept = localStorage.getItem("packsureDepartment");
      const savedApi = localStorage.getItem("packsureApiUrl");
      const savedNotifications = localStorage.getItem("packsureNotifications");
      const savedAutoVerify = localStorage.getItem("packsureAutoVerify");

      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
      if (savedDept) setDepartment(savedDept);
      if (savedApi) setApiUrl(savedApi);
      if (savedNotifications !== null) setNotifications(savedNotifications === "true");
      if (savedAutoVerify !== null) setAutoVerify(savedAutoVerify === "true");
    } catch (err) {
      console.error("Error retrieving settings from storage:", err);
    }
  }, []);

  // --------------------------------------------------
  // Save Settings
  // --------------------------------------------------
  const save = () => {
    setError("");
    setSaved(false);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedDept = department.trim();
    const trimmedApi = apiUrl.trim().replace(/\/+$/, ""); // Strip trailing slash

    if (!trimmedName) {
      setError("Please specify the officer or inspector name.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please provide an official contact email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please provide a valid email format.");
      return;
    }

    if (!trimmedApi) {
      setError("FastAPI backend endpoint cannot be left empty.");
      return;
    }

    try {
      localStorage.setItem("packsureOfficerName", trimmedName);
      localStorage.setItem("packsureOfficerEmail", trimmedEmail);
      localStorage.setItem("packsureDepartment", trimmedDept);
      localStorage.setItem("packsureApiUrl", trimmedApi);
      localStorage.setItem("packsureNotifications", String(notifications));
      localStorage.setItem("packsureAutoVerify", String(autoVerify));

      setName(trimmedName);
      setEmail(trimmedEmail);
      setDepartment(trimmedDept);
      setApiUrl(trimmedApi);

      // Dispatch event to update Header / Sidebar live
      window.dispatchEvent(new Event("packsure-settings-updated"));

      setSaved(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error("Error persisting settings:", err);
      setError("Unable to commit configuration to local storage.");
    }
  };

  // --------------------------------------------------
  // Reset Mock Demo Data
  // --------------------------------------------------
  const handleResetStorage = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }

    try {
      localStorage.removeItem("packsure_inspections");
      localStorage.removeItem("packsure_reports");
      window.dispatchEvent(new Event("packsure-inspections-updated"));
      window.dispatchEvent(new Event("packsure-reports-updated"));
      setResetConfirm(false);
      setSaved(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Reset error:", err);
      setError("Could not clear inspection database.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          <Sparkles size={14} />
          <span>System Governance</span>
        </div>

        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
          Regulatory Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage officer credentials, FastAPI endpoints, compliance rules, and notification triggers.
        </p>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* 1. OFFICER PROFILE */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Officer & Inspector Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authorized regulatory officer credentials embedded into generated compliance certificates.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="officer-name" className="mb-1.5 block text-xs font-bold text-slate-900 dark:text-white">
                Officer Full Name
              </label>
              <input
                id="officer-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                  setError("");
                }}
                placeholder="e.g. Inspector R. Sharma"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="officer-email" className="mb-1.5 block text-xs font-bold text-slate-900 dark:text-white">
                Official Government Email
              </label>
              <input
                id="officer-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSaved(false);
                  setError("");
                }}
                placeholder="e.g. officer@regulatory.gov.in"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="officer-dept" className="mb-1.5 block text-xs font-bold text-slate-900 dark:text-white">
                Department / Directorate
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="officer-dept"
                  type="text"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setSaved(false);
                    setError("");
                  }}
                  placeholder="e.g. Directorate of Legal Metrology & Consumer Protection"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. FASTAPI BACKEND CONFIGURATION */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                FastAPI Compliance Server Target
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure network endpoint hosting the OCR & regulatory verification engine.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <label htmlFor="api-url" className="mb-1.5 block text-xs font-bold text-slate-900 dark:text-white">
                API Base URL
              </label>
              <input
                id="api-url"
                type="text"
                value={apiUrl}
                onChange={(e) => {
                  setApiUrl(e.target.value);
                  setSaved(false);
                  setError("");
                }}
                placeholder="http://192.168.1.87:8000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
              />
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400">
              Default LAN host is set to <code className="rounded bg-slate-100 px-1 py-0.5 font-mono dark:bg-slate-800">http://192.168.1.87:8000</code>. For local testing, switch to <code className="rounded bg-slate-100 px-1 py-0.5 font-mono dark:bg-slate-800">http://127.0.0.1:8000</code>.
            </p>
          </div>
        </section>

        {/* 3. NOTIFICATIONS & AUTOMATION */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Alerts & Rule Automation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage automated compliance notifications and risk escalation flags.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3.5">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                  High-Risk Compliance Alerts
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Receive instant alerts when scanned commodities fail mandatory statutory clauses.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notifications}
                onClick={() => {
                  setNotifications(!notifications);
                  setSaved(false);
                }}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  notifications ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                    notifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                  Auto-Classify Commodity Hierarchy
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Allow neural models to infer regulatory framework when category is unspecified.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={autoVerify}
                onClick={() => {
                  setAutoVerify(!autoVerify);
                  setSaved(false);
                }}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  autoVerify ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                    autoVerify ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 4. SECURITY & STATUTORY NOTICE */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Statutory Compliance Security Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited against national digital governance and Legal Metrology standard guidelines.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:bg-slate-950 dark:text-slate-400">
            Inspection records and AI inference decisions are cryptographically indexed with local hash signatures. All image buffers are processed under high-integrity sandbox constraints.
          </div>
        </section>

        {/* 5. DATABASE MAINTENANCE / DEMO RESET */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Demonstration Data Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clear cached inspections and mock test logs before SIH jury evaluation.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetStorage}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                resetConfirm
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <RotateCcw size={14} />
              <span>{resetConfirm ? "Click to Confirm Wipe" : "Clear Cached Records"}</span>
            </button>
          </div>
        </section>

        {/* ACTIONS BAR */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={save}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white shadow-md transition-all sm:text-sm ${
              saved
                ? "bg-emerald-600 shadow-emerald-600/20"
                : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 size={16} />
                <span>Configuration Saved</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;