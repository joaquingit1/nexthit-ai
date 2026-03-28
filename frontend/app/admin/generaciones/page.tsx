"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Generation {
  id: string;
  response: string | null;
  tokens_used: number | null;
  created_at: string;
}

const generationTables = [
  {
    key: "generation_user_persona_batch",
    label: "User Persona Batch",
    description: "Generaciones de batches de personas sinteticas",
    color: "blue",
  },
  {
    key: "generation_score",
    label: "Score",
    description: "Generaciones de puntajes y metricas",
    color: "emerald",
  },
  {
    key: "generation_summary_video",
    label: "Summary Video",
    description: "Generaciones de resumenes de video",
    color: "violet",
  },
  {
    key: "generation_strategic_output",
    label: "Strategic Output",
    description: "Generaciones de outputs estrategicos",
    color: "amber",
  },
];

const colorClasses: Record<string, { bg: string; border: string; badge: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
  violet: { bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-100 text-violet-700" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
};

export default function GeneracionesPage() {
  const [activeTable, setActiveTable] = useState(generationTables[0].key);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchGenerations(activeTable);
  }, [activeTable]);

  const fetchGenerations = async (table: string) => {
    if (!supabase) {
      setError("Supabase no esta configurado");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setGenerations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar generaciones");
      setGenerations([]);
    } finally {
      setLoading(false);
    }
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

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const activeTableInfo = generationTables.find((t) => t.key === activeTable);
  const colors = activeTableInfo ? colorClasses[activeTableInfo.color] : colorClasses.blue;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Generaciones</h1>
        <p className="mt-1 text-slate-600">Historial de respuestas generadas por el sistema.</p>
      </div>

      {/* Table Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {generationTables.map((table) => {
          const isActive = activeTable === table.key;
          const tableColors = colorClasses[table.color];
          return (
            <button
              key={table.key}
              type="button"
              onClick={() => setActiveTable(table.key)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? `${tableColors.bg} ${tableColors.border} border-2 text-slate-900`
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {table.label}
            </button>
          );
        })}
      </div>

      {/* Active Table Info */}
      {activeTableInfo && (
        <div className={`mb-6 rounded-xl ${colors.bg} ${colors.border} border p-4`}>
          <p className="text-sm text-slate-600">{activeTableInfo.description}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-4 text-slate-500">Cargando generaciones...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      ) : generations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-16">
          <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No hay generaciones</h3>
          <p className="mt-1 text-slate-500">Todavia no se generaron registros en esta tabla.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {generations.map((gen) => {
            const isExpanded = expandedId === gen.id;
            return (
              <div
                key={gen.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
              >
                <div
                  className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedId(isExpanded ? null : gen.id)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors.badge}`}>
                        {gen.tokens_used?.toLocaleString() || 0} tokens
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 truncate">
                      {gen.response ? truncateText(gen.response, 100) : "Sin respuesta"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs text-slate-400">{formatDate(gen.created_at)}</span>
                    <svg
                      className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-4 bg-slate-50">
                    <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
                      <span><strong>ID:</strong> {gen.id}</span>
                      <span><strong>Tokens:</strong> {gen.tokens_used?.toLocaleString() || 0}</span>
                    </div>
                    <pre className="max-h-96 overflow-auto rounded-xl bg-white border border-slate-200 p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap">
                      {gen.response || "Sin respuesta"}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
