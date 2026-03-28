"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface AnalysisResult {
  job_id: string;
  video_id: string;
  title: string | null;
  overall_score: number | null;
  ad_readiness_score: number | null;
  created_at: string;
}

const PAGE_SIZE = 10;

export default function AdminResultadosPage() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    void fetchResults();
  }, [page]);

  const fetchResults = async () => {
    if (!supabase) {
      setError("Supabase no está configurado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { count } = await supabase
        .from("analysis_results")
        .select("*", { count: "exact", head: true });

      setTotalCount(count || 0);

      const { data, error: fetchError } = await supabase
        .from("analysis_results")
        .select("job_id, video_id, title, overall_score, ad_readiness_score, created_at")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) {
        throw fetchError;
      }

      setResults(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los resultados.");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const canGoPrev = page > 0;
  const canGoNext = page < totalPages - 1;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("es-AR", {
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

  const getScoreColor = (score: number | null) => {
    if (score === null) return "bg-slate-100 text-slate-600";
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 60) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  if (loading && !results.length) {
    return <div className="text-slate-500">Cargando resultados...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Resultados de análisis</h1>
        <p className="mt-1 text-slate-600">Historial de todos los análisis completados.</p>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-16">
          <h3 className="text-lg font-semibold text-slate-900">No hay resultados todavía</h3>
          <p className="mt-1 text-slate-500">Analizá tu primer video para ver resultados acá.</p>
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
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Título / Job ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Video ID</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Ad Ready</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((result) => (
                  <tr key={result.job_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{result.title || "Sin título"}</p>
                        <p className="text-xs font-mono text-slate-500">{result.job_id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{result.video_id}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getScoreColor(result.overall_score)}`}>
                        {result.overall_score ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getScoreColor(result.ad_readiness_score)}`}>
                        {result.ad_readiness_score ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(result.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/resultado?id=${result.job_id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        Ver
                      </Link>
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
    </div>
  );
}
