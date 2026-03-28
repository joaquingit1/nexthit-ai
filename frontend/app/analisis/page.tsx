"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ANALYSIS_STORAGE_PREFIX, type AnalysisResponse } from "@/lib/analysis";

export default function AnalisisPage() {
  const [analisis, setAnalisis] = useState<AnalysisResponse[]>([]);

  useEffect(() => {
    const items: AnalysisResponse[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(ANALYSIS_STORAGE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "");
          if (data && data.id && data.analysis) {
            items.push(data as AnalysisResponse);
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    }

    // Sort by generatedAt descending (newest first)
    items.sort((a, b) => {
      const dateA = new Date(a.analysis.generatedAt || 0).getTime();
      const dateB = new Date(b.analysis.generatedAt || 0).getTime();
      return dateB - dateA;
    });

    setAnalisis(items);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50";
    if (score >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Analisis</h1>
          <p className="mt-1 text-slate-600">Todos los analisis generados</p>
        </div>
        <Link
          href="/app"
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Subir nuevo video
        </Link>
      </div>

      {analisis.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-16">
          <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No hay analisis todavia</h3>
          <p className="mt-1 text-slate-500">Subi tu primer video para comenzar</p>
          <Link
            href="/app"
            className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Subir video
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {analisis.map((item) => (
            <Link
              key={item.id}
              href={`/resultado?id=${encodeURIComponent(item.id)}`}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex h-32 items-center justify-center rounded-xl bg-slate-100">
                <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div className="mt-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600">
                    {item.analysis.clip.fileName}
                  </h3>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-sm font-bold ${getScoreColor(item.analysis.summary.overallScore)}`}>
                    {item.analysis.summary.overallScore}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item.analysis.clip.durationLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(item.analysis.generatedAt)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                  {item.analysis.summary.narrative}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
