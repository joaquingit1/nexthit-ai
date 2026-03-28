"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SystemPrompts {
  id: string;
  user_persona_batch_prompt: string | null;
  score_prompt: string | null;
  summary_video_prompt: string | null;
  strategic_output_prompt: string | null;
  created_at: string;
}

const promptFields = [
  {
    key: "user_persona_batch_prompt" as const,
    label: "User Persona Batch Prompt",
    description: "Prompt para generar el batch de 100 personas sinteticas con sus perfiles demograficos.",
  },
  {
    key: "score_prompt" as const,
    label: "Score Prompt",
    description: "Prompt para calcular el puntaje general del video y metricas de rendimiento.",
  },
  {
    key: "summary_video_prompt" as const,
    label: "Summary Video Prompt",
    description: "Prompt para generar el resumen narrativo y analisis del contenido del video.",
  },
  {
    key: "strategic_output_prompt" as const,
    label: "Strategic Output Prompt",
    description: "Prompt para generar recomendaciones estrategicas y plan de cambios.",
  },
];

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<SystemPrompts | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    if (!supabase) {
      setError("Supabase no esta configurado");
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("system_prompts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        // If no rows exist, create an empty one
        if (fetchError.code === "PGRST116") {
          const { data: newData, error: insertError } = await supabase
            .from("system_prompts")
            .insert({})
            .select()
            .single();

          if (insertError) throw insertError;
          setPrompts(newData);
        } else {
          throw fetchError;
        }
      } else {
        setPrompts(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar prompts");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (field: string, currentValue: string | null) => {
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const savePrompt = async (field: string) => {
    if (!supabase || !prompts) return;

    setSaving(field);
    try {
      const { error: updateError } = await supabase
        .from("system_prompts")
        .update({ [field]: editValue })
        .eq("id", prompts.id);

      if (updateError) throw updateError;

      setPrompts({ ...prompts, [field]: editValue });
      setEditingField(null);
      setEditValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-4 text-slate-500">Cargando prompts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchPrompts();
          }}
          className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">System Prompts</h1>
        <p className="mt-1 text-slate-600">Administra los prompts del sistema para la generacion de analisis.</p>
      </div>

      <div className="space-y-6">
        {promptFields.map((field) => {
          const isEditing = editingField === field.key;
          const currentValue = prompts?.[field.key] || "";
          const isSaving = saving === field.key;

          return (
            <div
              key={field.key}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{field.label}</h3>
                  <p className="mt-1 text-sm text-slate-500">{field.description}</p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startEditing(field.key, currentValue)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-4">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={12}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Ingresa el prompt..."
                  />
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => savePrompt(field.key)}
                      disabled={isSaving}
                      className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  {currentValue ? (
                    <pre className="max-h-48 overflow-auto rounded-xl bg-slate-50 p-4 font-mono text-sm text-slate-700">
                      {currentValue}
                    </pre>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-sm text-slate-400">No hay prompt configurado</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {prompts && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            <span className="font-medium">ID:</span> {prompts.id} &bull;{" "}
            <span className="font-medium">Creado:</span>{" "}
            {new Date(prompts.created_at).toLocaleString("es-AR")}
          </p>
        </div>
      )}
    </div>
  );
}
