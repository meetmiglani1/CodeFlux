import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // STEP 1: SEND VERIFICATION CODE
  // --------------------------------------------------
  const sendCode = (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = String(email || "").trim().toLowerCase();

    // Check against authorized email domains or officer emails
    const isValidOfficer =
      cleanEmail === "chinmaygarglalit@gmail.com" ||
      cleanEmail === "admin@packsureai.com" ||
      cleanEmail.endsWith("@regulatory.gov.in");

    if (!isValidOfficer) {
      setError("This email is not registered in the regulatory officer database.");
      return;
    }

    setStep(2);
  };

  // --------------------------------------------------
  // STEP 2: VERIFY OTP
  // --------------------------------------------------
  const verifyCode = (e) => {
    e.preventDefault();
    setError("");

    const cleanCode = String(code || "").trim();

    if (cleanCode !== "123456") {
      setError("Invalid 6-digit verification code. Use demo code 123456.");
      return;
    }

    setStep(3);
  };

  // --------------------------------------------------
  // STEP 3: PERSIST NEW PASSWORD
  // --------------------------------------------------
  const resetPassword = (e) => {
    e.preventDefault();
    setError("");

    const cleanPassword = String(password || "").trim();
    const cleanConfirm = String(confirm || "").trim();

    if (cleanPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    try {
      // Synchronized with Login.jsx authentication checks
      localStorage.setItem("PackSureAIPassword", cleanPassword);
      localStorage.setItem("packsure_password", cleanPassword);
      setStep(4);
    } catch (storageErr) {
      console.error("Storage error:", storageErr);
      setError("Unable to update password. Please check browser storage settings.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">

        {/* TOP BRANDING & BACK LINK */}
        {step < 4 && (
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>

            <span className="text-[11px] font-mono font-bold text-slate-400">
              Step {step} of 3
            </span>
          </div>
        )}

        {/* STEPPER PROGRESS BAR */}
        {step < 4 && (
          <div className="mb-6 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  step >= s
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        )}

        {/* =====================================================
            STEP 1: REQUEST VERIFICATION CODE
        ===================================================== */}
        {step === 1 && (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Mail size={22} />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Password Recovery
            </h1>

            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
              Enter your registered officer email to receive a statutory authentication code.
            </p>

            <form onSubmit={sendCode} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-900 dark:text-white">
                  Registered Officer Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. chinmaygarglalit@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
              >
                Send Verification Code
              </button>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <strong>Demo Registered Accounts:</strong>{" "}
                <code className="text-blue-600 dark:text-blue-400">chinmaygarglalit@gmail.com</code> or{" "}
                <code className="text-blue-600 dark:text-blue-400">admin@PackSureAI.com</code>.
              </div>
            </form>
          </>
        )}

        {/* =====================================================
            STEP 2: VERIFY OTP CODE
        ===================================================== */}
        {step === 2 && (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <KeyRound size={22} />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Verify Security Code
            </h1>

            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
              A single-use verification code was transmitted to{" "}
              <strong className="text-slate-800 dark:text-slate-200">{email}</strong>.
            </p>

            <form onSubmit={verifyCode} className="mt-6 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    6-Digit Security Code
                  </label>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    Demo Code: 123456
                  </span>
                </div>

                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-center font-mono text-lg font-black tracking-widest text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
              >
                Validate & Continue
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Change Email Address
              </button>
            </form>
          </>
        )}

        {/* =====================================================
            STEP 3: NEW PASSWORD CREATION
        ===================================================== */}
        {step === 3 && (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Lock size={22} />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Create New Password
            </h1>

            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
              Set a secure password for officer portal access (minimum 6 characters).
            </p>

            <form onSubmit={resetPassword} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-900 dark:text-white">
                  New Access Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-900 dark:text-white">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      setError("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
              >
                Update Password & Save
              </button>
            </form>
          </>
        )}

        {/* =====================================================
            STEP 4: SUCCESS CONFIRMATION
        ===================================================== */}
        {step === 4 && (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 size={38} />
            </div>

            <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Password Updated
            </h1>

            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
              Your officer account credentials have been updated in the local security registry. You can now authenticate.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
            >
              Sign In to Command Center
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default ForgotPassword;