import React, { useState } from "react";
import {
  ScanLine,
  FileText,
  Bot,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Help() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);

  const steps = [
    {
      step: "01",
      title: "Scan & Capture",
      desc: "Upload or photograph clear captures of front, back, and nutritional / declaration panels.",
      icon: ScanLine,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
    },
    {
      step: "02",
      title: "Neural Extraction",
      desc: "FastAPI vision models perform OCR text extraction and categorize commodity parameters.",
      icon: FileText,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
    },
    {
      step: "03",
      title: "Statutory Audit",
      desc: "Deterministic rule engines audit extracted declarations against Legal Metrology rules.",
      icon: ShieldCheck,
      color: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
    }
  ];

  const mandatoryDeclarations = [
    { name: "Name & Address of Manufacturer / Packer / Importer", rule: "PCR Rule 6(1)(a)" },
    { name: "Generic or Common Name of Commodity", rule: "PCR Rule 6(1)(b)" },
    { name: "Net Quantity in Standard Weight / Volume", rule: "PCR Rule 6(1)(c)" },
    { name: "Month & Year of Manufacture / Packaging", rule: "PCR Rule 6(1)(d)" },
    { name: "Maximum Retail Price (MRP inclusive of all taxes)", rule: "PCR Rule 6(1)(e)" },
    { name: "Consumer Care Contact Details (Phone / Email)", rule: "PCR Rule 6(1)(f)" }
  ];

  const faqs = [
    {
      q: "How do I initiate an automated label inspection?",
      a: "Navigate to 'New Inspection' from the sidebar or dashboard. Upload or capture package label images. You can leave category on 'Auto Detect' or select a target classification. Click 'Scan & Check Compliance' to trigger the OCR and statutory rule validation engine."
    },
    {
      q: "What image formats and file constraints apply?",
      a: "PackSure AI natively processes JPG, JPEG, PNG, and modern WEBP image streams. For optimal OCR character recognition, ensure labels are well-lit, non-reflective, and unskewed."
    },
    {
      q: "Can field officers capture images live on mobile devices?",
      a: "Yes. The 'Take Photo' control automatically engages native device camera viewports on smartphones, tablets, and field handhelds via HTML5 media capture."
    },
    {
      q: "How does the system calculate the compliance score?",
      a: "The score is computed through deterministic regulatory verification. AI models handle high-fidelity OCR extraction, while rule algorithms verify each extracted declaration against statutory standards (e.g. Legal Metrology PCR 2011). Each passed mandatory clause contributes to the overall compliance percentage."
    },
    {
      q: "How are compliance reports saved and exported?",
      a: "All inspections are cryptographically indexed into local storage and can be compiled into formal statutory reports under the 'Reports' section. You can preview, print, or download certified HTML/PDF summary sheets at any time."
    }
  ];

  const openChatbot = () => {
    window.dispatchEvent(new Event("open-chatbot"));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-14">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          <HelpCircle size={14} />
          <span>Documentation & Advisory</span>
        </div>

        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
          Help & Inspection Guidelines
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Master the PackSure AI compliance pipeline, mandatory declaration clauses, and field audit tools.
        </p>
      </div>

      {/* 3-STEP PIPELINE CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}>
                  <Icon size={20} />
                </div>
                <span className="font-mono text-xs font-black text-slate-300 dark:text-slate-700">
                  {item.step}
                </span>
              </div>

              <h3 className="mt-5 text-base font-bold text-slate-900 dark:text-white">
                {item.title}
              </h3>

              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* STATUTORY COMPLIANCE QUICK REFERENCE */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Legal Metrology (PCR 2011) Mandatory Clauses
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Six statutory declaration requirements enforced by the automated rule engine.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {mandatoryDeclarations.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800/80 dark:bg-slate-950/60"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.name}
                </p>
                <p className="mt-0.5 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {item.rule}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COPILOT ASSISTANT PROMO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl dark:border dark:border-slate-800 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">
              <Sparkles size={12} />
              <span>Real-Time Regulatory Copilot</span>
            </div>

            <h3 className="mt-3 text-lg font-black tracking-tight sm:text-xl">
              Have questions regarding inspection clauses?
            </h3>

            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Ask PackSure AI to clarify legal requirements, calculate unit sale price rules, or evaluate violations.
            </p>
          </div>

          <button
            type="button"
            onClick={openChatbot}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-slate-950 transition hover:bg-slate-100 active:scale-[0.98] sm:text-sm"
          >
            <Bot size={16} className="text-blue-600" />
            <span>Launch AI Copilot</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* FAQS ACCORDION CONTAINER */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Frequently Asked Operational Questions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Field officer tips for camera capture, scoring criteria, and audit compliance.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div key={index}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40 sm:p-6"
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                    {faq.q}
                  </span>

                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500 ${
                      isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:px-6 sm:text-sm">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Help;