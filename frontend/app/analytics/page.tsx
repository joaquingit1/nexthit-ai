"use client";

import { useState } from "react";

const ANALYTICS_TABS = [
  { id: "insights", title: "Insights" },
  { id: "retention", title: "Retención" },
] as const;

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"insights" | "retention">("insights");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-slate-600">
          Insights de audiencia y curvas de retención de tus análisis.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-full border border-slate-200/80 bg-white/90 p-1 shadow-sm backdrop-blur-xl w-fit mb-8">
        {ANALYTICS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "insights" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Insights de Audiencia</h3>
            <p className="mt-2 max-w-md text-slate-500">
              Analiza un video para ver la distribución demográfica, intereses y comportamiento de tu audiencia simulada.
            </p>
          </div>
        </div>
      )}

      {activeTab === "retention" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Curvas de Retención</h3>
            <p className="mt-2 max-w-md text-slate-500">
              Visualiza cómo evoluciona la atención de tu audiencia a lo largo del video y detecta puntos de abandono.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
