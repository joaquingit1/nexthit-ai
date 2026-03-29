"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { AudienceDistributionItem, TargetAudience } from "@/lib/analysis";

interface AnalysisRecord {
  job_id: string;
  title: string;
  created_at: string;
  result: {
    analysis: {
      targetAudience?: TargetAudience;
      graph: {
        durationSeconds: number;
        averageWatchTime: string;
        mostCommonDropOff: string;
        bestFitAudience: string;
        audienceSize: number;
        averageLine: { second: number; retention: number }[];
        viewers: { segment: string; color: string; points: { second: number; retention: number }[] }[];
      };
      summary: {
        overallScore: number;
      };
    };
  };
}

const ANALYTICS_TABS = [
  { id: "insights", title: "Insights" },
  { id: "retention", title: "Retención" },
] as const;

const GRAPH_WIDTH = 550;
const GRAPH_HEIGHT = 200;
const GRAPH_PADDING = { top: 34, right: 26, bottom: 48, left: 70 };

function getGraphCoordinates(point: { second: number; retention: number }, duration: number) {
  const usableWidth = GRAPH_WIDTH - GRAPH_PADDING.left - GRAPH_PADDING.right;
  const usableHeight = GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom;
  return {
    x: GRAPH_PADDING.left + (point.second / Math.max(duration, 1)) * usableWidth,
    y: GRAPH_PADDING.top + ((100 - point.retention) / 100) * usableHeight,
  };
}

function buildSmoothLinePath(points: { second: number; retention: number }[], duration: number) {
  if (!points.length) return "";
  const coords = points.map((p) => getGraphCoordinates(p, duration));
  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpX = (prev.x + curr.x) / 2;
    path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return path;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"insights" | "retention">("insights");
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalyses() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("analysis_results")
        .select("job_id, title, created_at, result")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data?.length) {
        setAnalyses(data as AnalysisRecord[]);
        setSelectedAnalysis(data[0] as AnalysisRecord);
      }
      setLoading(false);
    }

    void loadAnalyses();
  }, []);

  const audience = selectedAnalysis?.result?.analysis?.targetAudience;
  const graph = selectedAnalysis?.result?.analysis?.graph;
  const duration = graph?.durationSeconds ?? 0;

  const averagePath = useMemo(() => {
    if (!graph?.averageLine) return "";
    return buildSmoothLinePath(graph.averageLine, duration);
  }, [graph?.averageLine, duration]);

  const yAxisTicks = [100, 75, 50, 25, 0];
  const xAxisTicks = useMemo(() => {
    if (!duration) return [];
    const count = 5;
    return Array.from({ length: count }, (_, i) => Math.round((duration / (count - 1)) * i));
  }, [duration]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Cargando analytics...</p>
      </div>
    );
  }

  if (!analyses.length) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="mt-1 text-slate-600">Insights de audiencia y curvas de retención.</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-16">
          <h3 className="text-lg font-semibold text-slate-900">No hay análisis todavía</h3>
          <p className="mt-1 text-slate-500">Analiza un video para ver los analytics.</p>
          <Link href="/app" className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Analizar video
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="mt-1 text-slate-600">Insights de audiencia y curvas de retención.</p>
        </div>
        <select
          value={selectedAnalysis?.job_id ?? ""}
          onChange={(e) => {
            const found = analyses.find((a) => a.job_id === e.target.value);
            if (found) setSelectedAnalysis(found);
          }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          {analyses.map((a) => (
            <option key={a.job_id} value={a.job_id}>
              {a.title || a.job_id.slice(0, 12)}
            </option>
          ))}
        </select>
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

      {/* Insights Tab */}
      {activeTab === "insights" && audience && (
        <div className="space-y-6">
          <div className="grid gap-5 xl:grid-cols-2">
            {/* Gender Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Distribución por género</p>
              <div className="mt-4 space-y-3">
                {(audience.genderBreakdown ?? []).map((item: AudienceDistributionItem) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="text-slate-500">{item.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">Retención media {item.averageRetention ?? 0}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Age Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Edades con mejor respuesta</p>
              <div className="mt-4 space-y-3">
                {(audience.ageBreakdown ?? audience.ageRanges ?? []).slice(0, 5).map((item: AudienceDistributionItem) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="text-slate-500">{item.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Countries */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Países con mejor performance</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(audience.countryBreakdown ?? audience.countries ?? []).slice(0, 6).map((item: AudienceDistributionItem) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-500">{item.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Retention Tab */}
      {activeTab === "retention" && graph && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid gap-4 text-sm md:grid-cols-4">
            {[
              ["Puntaje general", `${selectedAnalysis?.result?.analysis?.summary?.overallScore ?? 0}/100`],
              ["Tiempo promedio", graph.averageWatchTime],
              ["Abandono común", graph.mostCommonDropOff],
              ["Mejor audiencia", graph.bestFitAudience],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Curva de retención</p>
            <svg viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`} className="w-full max-w-3xl">
              {/* Y axis */}
              {yAxisTicks.map((tick) => {
                const point = getGraphCoordinates({ second: 0, retention: tick }, duration);
                return (
                  <g key={`y-${tick}`}>
                    <line
                      x1={GRAPH_PADDING.left}
                      y1={point.y}
                      x2={GRAPH_WIDTH - GRAPH_PADDING.right}
                      y2={point.y}
                      stroke="rgba(148,163,184,0.22)"
                      strokeWidth="1"
                      strokeDasharray="4 8"
                    />
                    <text x={GRAPH_PADDING.left - 10} y={point.y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {/* X axis */}
              {xAxisTicks.map((tick) => {
                const point = getGraphCoordinates({ second: tick, retention: 0 }, duration);
                return (
                  <text key={`x-${tick}`} x={point.x} y={GRAPH_HEIGHT - 12} textAnchor="middle" fontSize="11" fill="#64748b">
                    {tick}s
                  </text>
                );
              })}

              {/* Average line */}
              <path d={averagePath} fill="none" stroke="url(#retentionGradient)" strokeWidth="3" strokeLinecap="round" />

              <defs>
                <linearGradient id="retentionGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}

      {/* No data fallback */}
      {activeTab === "insights" && !audience && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Este análisis no tiene datos de audiencia disponibles.</p>
        </div>
      )}

      {activeTab === "retention" && !graph && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Este análisis no tiene datos de retención disponibles.</p>
        </div>
      )}
    </div>
  );
}
