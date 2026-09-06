import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation
} from "react-router-dom";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Chatbot from "./components/Chatbot";

// Pages (Standardized PascalCase for cross-platform file system compatibility)
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import NewInspection from "./pages/NewInspection";
import InspectionReport from "./pages/InspectionReport";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import ReportPreview from "./pages/ReportPreview";
import Settings from "./pages/settings";
import Help from "./pages/Help";

// --------------------------------------------------
// Scroll To Top on Route Transition
// --------------------------------------------------
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

// --------------------------------------------------
// Reactive Protected Layout Guard
// --------------------------------------------------
function ProtectedLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    };

    // Live auth updates from Login / Navbar signout
    window.addEventListener("packsure-auth-updated", syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("packsure-auth-updated", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      {/* Navigation Header */}
      <Navbar />

      <div className="flex">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area: Responsive margins matching w-64 sidebar without horizontal overflow */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:ml-64 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Regulatory Copilot */}
      <Chatbot />
    </div>
  );
}

// --------------------------------------------------
// Main Router Architecture
// --------------------------------------------------
function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Authenticated Protected Shell */}
        <Route element={<ProtectedLayout />}>
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Core Dashboards & Analytics */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />

          {/* Inspection Workflows (Supporting both canonical /inspection and legacy /inspection/new) */}
          <Route path="/inspection" element={<NewInspection />} />
          <Route path="/inspection/new" element={<NewInspection />} />

          {/* Inspection Reports (Supporting dynamic param /inspection/:id and query state /inspection/report) */}
          <Route path="/inspection/:id" element={<InspectionReport />} />
          <Route path="/inspection/report" element={<InspectionReport />} />

          {/* Audit History */}
          <Route path="/history" element={<History />} />

          {/* Compliance Reports & Previews */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/view/:id" element={<ReportPreview />} />

          {/* Governance & Support */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
        </Route>

        {/* 404 Catch-All Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;