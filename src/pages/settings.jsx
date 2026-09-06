import React, { useEffect, useState } from "react";

import {
  User,
  Bell,
  Shield,
  Save,
  CheckCircle2
} from "lucide-react";

function Settings() {
  const [name, setName] = useState("Inspection Officer");

  const [email, setEmail] = useState(
    "admin@PackSureAI.com"
  );

  const [notifications, setNotifications] =
    useState(true);

  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load saved settings
  // --------------------------------------------------

  useEffect(() => {
    try {
      const savedName = localStorage.getItem(
        "packsureOfficerName"
      );

      const savedEmail = localStorage.getItem(
        "packsureOfficerEmail"
      );

      const savedNotifications =
        localStorage.getItem(
          "packsureNotifications"
        );

      if (savedName) {
        setName(savedName);
      }

      if (savedEmail) {
        setEmail(savedEmail);
      }

      if (savedNotifications !== null) {
        setNotifications(
          savedNotifications === "true"
        );
      }
    } catch (error) {
      console.error(
        "Error loading settings:",
        error
      );
    }
  }, []);

  // --------------------------------------------------
  // Save settings
  // --------------------------------------------------

  const save = () => {
    setError("");
    setSaved(false);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Validation
    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    // Basic email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    try {
      // Save profile
      localStorage.setItem(
        "packsureOfficerName",
        trimmedName
      );

      localStorage.setItem(
        "packsureOfficerEmail",
        trimmedEmail
      );

      // Save notification preference
      localStorage.setItem(
        "packsureNotifications",
        String(notifications)
      );

      // Update state with cleaned values
      setName(trimmedName);
      setEmail(trimmedEmail);

      // Show success state
      setSaved(true);

      // Hide success message after 2 seconds
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Error saving settings:",
        error
      );

      setError(
        "Unable to save settings. Please try again."
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl pb-10">

      {/* ------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------ */}

      <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
        Configuration
      </p>

      <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
        Settings
      </h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Manage your PackSure AI preferences.
      </p>


      <div className="mt-7 space-y-5">

        {/* ------------------------------------------------ */}
        {/* Officer Profile */}
        {/* ------------------------------------------------ */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-blue-600
                dark:bg-blue-500/10
                dark:text-blue-400
              "
            >
              <User size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Officer Profile
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your officer information.
              </p>
            </div>

          </div>


          <div
            className="
              mt-6
              grid
              gap-4
              md:grid-cols-2
            "
          >

            {/* Name */}

            <div>

              <label
                htmlFor="officer-name"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  dark:text-slate-300
                "
              >
                Name
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
                placeholder="Enter officer name"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/10
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                "
              />

            </div>


            {/* Email */}

            <div>

              <label
                htmlFor="officer-email"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  dark:text-slate-300
                "
              >
                Email
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
                placeholder="Enter email address"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/10
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                "
              />

            </div>

          </div>

        </div>


        {/* ------------------------------------------------ */}
        {/* Notifications */}
        {/* ------------------------------------------------ */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-blue-600
                dark:bg-blue-500/10
                dark:text-blue-400
              "
            >
              <Bell size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Notifications
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control inspection notifications.
              </p>
            </div>

          </div>


          <div
            className="
              mt-5
              flex
              items-center
              justify-between
              gap-4
              rounded-xl
              border
              border-slate-100
              bg-slate-50
              p-4
              dark:border-slate-800
              dark:bg-slate-950
            "
          >

            <div>

              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Inspection alerts
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Receive notifications for important
                inspection events.
              </p>

            </div>


            {/* Toggle */}

            <button
              type="button"
              onClick={() => {
                setNotifications(
                  !notifications
                );

                setSaved(false);
              }}
              aria-label="Toggle inspection alerts"
              aria-pressed={notifications}
              className={`
                relative
                h-6
                w-11
                shrink-0
                rounded-full
                transition-all
                duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500/30
                ${
                  notifications
                    ? "bg-blue-600"
                    : "bg-slate-300 dark:bg-slate-700"
                }
              `}
            >

              <span
                className={`
                  absolute
                  top-1
                  h-4
                  w-4
                  rounded-full
                  bg-white
                  shadow-sm
                  transition-all
                  duration-200
                  ${
                    notifications
                      ? "left-6"
                      : "left-1"
                  }
                `}
              />

            </button>

          </div>

        </div>


        {/* ------------------------------------------------ */}
        {/* Security */}
        {/* ------------------------------------------------ */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
                dark:bg-emerald-500/10
                dark:text-emerald-400
              "
            >
              <Shield size={20} />
            </div>

            <div>

              <h2 className="font-bold text-slate-900 dark:text-white">
                Security
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Application security information.
              </p>

            </div>

          </div>


          <p
            className="
              mt-4
              rounded-xl
              bg-slate-50
              p-4
              text-sm
              leading-6
              text-slate-600
              dark:bg-slate-950
              dark:text-slate-400
            "
          >
            Authentication is currently implemented
            as a frontend demo. Production deployment
            should use secure backend authentication,
            encrypted credentials and role-based
            access control.
          </p>

        </div>


        {/* ------------------------------------------------ */}
        {/* Error Message */}
        {/* ------------------------------------------------ */}

        {error && (

          <div
            className="
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              font-medium
              text-red-600
              dark:border-red-500/20
              dark:bg-red-500/10
              dark:text-red-400
            "
          >
            {error}
          </div>

        )}


        {/* ------------------------------------------------ */}
        {/* Save Button */}
        {/* ------------------------------------------------ */}

        <div className="flex justify-end">

          <button
            type="button"
            onClick={save}
            className={`
              flex
              items-center
              gap-2
              rounded-xl
              px-6
              py-3
              text-sm
              font-bold
              text-white
              shadow-sm
              transition-all
              active:scale-[0.98]
              ${
                saved
                  ? "bg-emerald-600"
                  : "bg-blue-600 hover:bg-blue-500"
              }
            `}
          >

            {saved ? (
              <>
                <CheckCircle2 size={17} />
                Saved Successfully
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}

          </button>

        </div>

      </div>

    </div>
  );
}

export default Settings;