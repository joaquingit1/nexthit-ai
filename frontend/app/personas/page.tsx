"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface PersonaResult {
  id: string;
  job_id: string;
  video_id: string;
  persona_id: string;
  name: string;
  age_range: string;
  country: string;
  occupation: string;
  income_bracket: string;
  social_status: string;
  interests: string[];
  segment_label: string;
  color: string;
  dropoff_second: number;
  retention_percent: number;
  why_they_left: string;
}

const PAGE_SIZE = 20;

export default function PersonasPage() {
  const [personas, setPersonas] = useState<PersonaResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState<PersonaResult | null>(null);
  const [analysisTitles, setAnalysisTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetchPersonas();
  }, [page]);

  const fetchPersonas = async () => {
    if (!supabase) {
      setError("Supabase no está configurado.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { count } = await supabase.from("persona_results").select("*", { count: "exact", head: true });
      setTotalCount(count || 0);

      const { data, error: fetchError } = await supabase
        .from("persona_results")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) {
        throw fetchError;
      }

      setPersonas((data as PersonaResult[]) || []);

      if (data?.length) {
        const jobIds = [...new Set(data.map((persona) => persona.job_id))];
        const { data: analysisData } = await supabase
          .from("analysis_results")
          .select("job_id, title")
          .in("job_id", jobIds);

        if (analysisData) {
          const titles: Record<string, string> = {};
          analysisData.forEach((item) => {
            titles[item.job_id] = item.title || "Sin título";
          });
          setAnalysisTitles(titles);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las personas.");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const canGoPrev = page > 0;
  const canGoNext = page < totalPages - 1;

  const getSegmentColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
      purple: "bg-purple-100 text-purple-700",
      orange: "bg-orange-100 text-orange-700",
      pink: "bg-pink-100 text-pink-700",
      cyan: "bg-cyan-100 text-cyan-700",
      yellow: "bg-yellow-100 text-yellow-700",
      red: "bg-red-100 text-red-700",
    };

    return colors[color] || "bg-slate-100 text-slate-700";
  };

  const getRetentionColor = (percent: number) => {
    if (percent >= 80) return "text-emerald-600";
    if (percent >= 50) return "text-amber-600";
    return "text-red-600";
  };

  if (loading && !personas.length) {
    return <div className="text-slate-500">Cargando personas...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Personas</h1>
        <p className="mt-1 text-slate-600">
          Personas sintéticas generadas para simular audiencias. Total: {totalCount.toLocaleString()}
        </p>
      </div>

      {personas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-16">
          <h3 className="text-lg font-semibold text-slate-900">No hay personas todavía</h3>
          <p className="mt-1 text-slate-500">Las personas aparecen cuando terminás un análisis.</p>
          <Link href="/app" className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Analizar video
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Persona</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Segmento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">País</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Retención</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Drop-off</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Análisis</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personas.map((persona) => (
                  <tr key={persona.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{persona.name}</p>
                        <p className="text-xs text-slate-500">{persona.age_range} · {persona.occupation}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getSegmentColor(persona.color)}`}>
                        {persona.segment_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{persona.country}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${getRetentionColor(persona.retention_percent)}`}>{persona.retention_percent}%</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{persona.dropoff_second}s</td>
                    <td className="px-4 py-3">
                      <Link href={`/resultado?id=${persona.job_id}`} className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                        {analysisTitles[persona.job_id] || persona.job_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPersona(persona)}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => current - 1)}
                disabled={!canGoPrev || loading}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-3 text-sm text-slate-600">
                Página {page + 1} de {totalPages || 1}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!canGoNext || loading}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

      {selectedPersona ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedPersona.name}</h2>
                <p className="text-sm text-slate-500">
                  {selectedPersona.age_range} · {selectedPersona.occupation} · {selectedPersona.country}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPersona(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Segmento</p>
                <p className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-sm font-semibold ${getSegmentColor(selectedPersona.color)}`}>
                  {selectedPersona.segment_label}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Ingresos</p>
                <p className="mt-1 font-medium text-slate-900">{selectedPersona.income_bracket}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Status social</p>
                <p className="mt-1 font-medium text-slate-900">{selectedPersona.social_status}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Retención</p>
                <p className={`mt-1 font-bold ${getRetentionColor(selectedPersona.retention_percent)}`}>
                  {selectedPersona.retention_percent}% (abandona en {selectedPersona.dropoff_second}s)
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Intereses</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(selectedPersona.interests || []).map((interest, index) => (
                  <span key={index} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase text-amber-600">Por qué abandona</p>
              <p className="mt-1 text-sm text-amber-900">{selectedPersona.why_they_left}</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Link href={`/resultado?id=${selectedPersona.job_id}`} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Ver análisis completo
              </Link>
              <button
                type="button"
                onClick={() => setSelectedPersona(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
