"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ANALYSIS_STORAGE_KEY,
  ANALYSIS_STORAGE_PREFIX,
  type AnalysisJobEnvelope,
  type AnalysisResponse,
  type AnalysisStreamEvent,
  type UploadInitResponse,
} from "@/lib/analysis";
import { buildBrowserBackendUrl, getPublicBackendBaseUrl } from "@/lib/backend";
import { supabase } from "@/lib/supabase";
import UserPersonaFilters, { defaultFilters, type PersonaFilters } from "@/components/UserPersonaFilters";

function storeAnalysisResult(router: ReturnType<typeof useRouter>, data: AnalysisResponse) {
  const serialized = JSON.stringify(data);
  window.localStorage.setItem(ANALYSIS_STORAGE_KEY, serialized);
  window.localStorage.setItem(`${ANALYSIS_STORAGE_PREFIX}${data.id}`, serialized);
  router.push(`/resultado?id=${encodeURIComponent(data.id)}&new=1`);
}

export default function AppMain() {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState("Listo para analizar");
  const [streamNote, setStreamNote] = useState("Subi un video para comenzar el analisis.");
  const [showPersonaFilters, setShowPersonaFilters] = useState(false);
  const [personaFilters, setPersonaFilters] = useState<PersonaFilters>(defaultFilters);

  const getActiveFiltersCount = () => {
    return Object.values(personaFilters).reduce((acc, arr) => acc + arr.length, 0);
  };

  const buildPersonaPromptFromFilters = (filters: PersonaFilters): string | null => {
    const parts: string[] = [];

    if (filters.ageRanges.length > 0) {
      parts.push(`Rango de edad: ${filters.ageRanges.join(", ")}`);
    }
    if (filters.genders.length > 0) {
      parts.push(`Genero: ${filters.genders.join(", ")}`);
    }
    if (filters.incomeBrackets.length > 0) {
      parts.push(`Nivel de ingresos: ${filters.incomeBrackets.join(", ")}`);
    }
    if (filters.purchaseIntents.length > 0) {
      parts.push(`Intencion de compra: ${filters.purchaseIntents.join(", ")}`);
    }
    if (filters.socialStatuses.length > 0) {
      parts.push(`Perfil social: ${filters.socialStatuses.join(", ")}`);
    }
    if (filters.interests.length > 0) {
      parts.push(`Intereses: ${filters.interests.join(", ")}`);
    }
    if (filters.platforms.length > 0) {
      parts.push(`Plataformas principales: ${filters.platforms.join(", ")}`);
    }

    if (parts.length === 0) return null;

    return `Genera personas sinteticas con las siguientes caracteristicas:\n${parts.join("\n")}`;
  };

  const waitForStreamedResult = async (job: AnalysisJobEnvelope) =>
    new Promise<AnalysisResponse>((resolve, reject) => {
      let settled = false;
      const source = new EventSource(buildBrowserBackendUrl(`/api/analysis/jobs/${job.job_id}/events`));

      const finish = async () => {
        if (settled) {
          return;
        }

        settled = true;
        source.close();

        const resultResponse = await fetch(buildBrowserBackendUrl(`/api/analysis/jobs/${job.job_id}/result`), {
          cache: "no-store",
        });

        if (!resultResponse.ok) {
          reject(new Error("El analisis termino, pero no se pudo recuperar el payload final."));
          return;
        }

        resolve((await resultResponse.json()) as AnalysisResponse);
      };

      const stageLabels: Record<string, string> = {
        "job.created": "Iniciando analisis...",
        "upload.validated": "Video recibido",
        "transcription.completed": "Audio transcrito",
        "video.uploaded_to_gemini": "Subiendo video a Gemini...",
        "multimodal_timeline.completed": "Leyendo visuales y texto en pantalla...",
        "video_analysis.completed": "Puntuando el video...",
        "creative_context.completed": "Evaluando contenido",
        "persona.batch.completed": "Simulando audiencia",
        "demographics.completed": "Procesando segmentos",
        "analysis.completed": "Analisis completado",
      };

      const handleStreamEvent = (rawEvent: MessageEvent<string>) => {
        const event = JSON.parse(rawEvent.data) as AnalysisStreamEvent;
        setProgressPercent(event.progress_percent ?? 0);
        setStatusText(stageLabels[event.stage ?? ""] || "Procesando...");

        if (event.type === "persona.batch.completed") {
          const batchIndex =
            typeof event.payload === "object" &&
            event.payload &&
            "batch_index" in event.payload
              ? Number((event.payload as { batch_index: number }).batch_index) + 1
              : null;
          setStreamNote(
            batchIndex
              ? `Simulando grupo ${batchIndex} de 5...`
              : "Simulando audiencia...",
          );
        }

        if (event.type === "analysis.completed") {
          void finish();
        }

        if (event.type === "job.failed") {
          source.close();
          settled = true;
          reject(
            new Error(
              typeof event.payload === "object" &&
                event.payload &&
                "error" in event.payload
                ? String((event.payload as { error: string }).error)
                : "Fallo el job del backend.",
            ),
          );
        }
      };

      source.addEventListener("job.created", handleStreamEvent as EventListener);
      source.addEventListener("upload.validated", handleStreamEvent as EventListener);
      source.addEventListener("transcription.completed", handleStreamEvent as EventListener);
      source.addEventListener("video.uploaded_to_gemini", handleStreamEvent as EventListener);
      source.addEventListener("multimodal_timeline.completed", handleStreamEvent as EventListener);
      source.addEventListener("video_analysis.completed", handleStreamEvent as EventListener);
      source.addEventListener("creative_context.completed", handleStreamEvent as EventListener);
      source.addEventListener("persona.batch.completed", handleStreamEvent as EventListener);
      source.addEventListener("demographics.completed", handleStreamEvent as EventListener);
      source.addEventListener("analysis.completed", handleStreamEvent as EventListener);
      source.addEventListener("job.failed", handleStreamEvent as EventListener);
      source.onerror = () => {
        if (!settled) {
          setStreamNote("Reconectando...");
        }
      };
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!archivo) {
      window.alert("Primero subi un archivo de video.");
      return;
    }

    setLoading(true);
    setProgressPercent(3);
    setStatusText("Preparando...");
    setStreamNote("Iniciando proceso de analisis.");

    try {
      if (!supabase) {
        throw new Error("Supabase no esta configurado en el entorno del frontend.");
      }

      const uploadInitUrl = getPublicBackendBaseUrl()
        ? buildBrowserBackendUrl("/api/uploads/init")
        : "/api/uploads/init";
      const createJobUrl = getPublicBackendBaseUrl()
        ? buildBrowserBackendUrl("/api/analysis/jobs")
        : "/api/analysis/jobs";

      const uploadInitResponse = await fetch(uploadInitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: archivo.name,
          content_type: archivo.type,
          size_bytes: archivo.size,
        }),
      });

      if (!uploadInitResponse.ok) {
        throw new Error("No se pudo crear el ticket de subida.");
      }

      const uploadTicket = (await uploadInitResponse.json()) as UploadInitResponse;
      setProgressPercent(10);
      setStatusText("Subiendo video...");

      const { error: uploadError } = await supabase.storage
        .from(uploadTicket.bucket)
        .upload(uploadTicket.object_path, archivo, {
          contentType: archivo.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setProgressPercent(18);
      setStatusText("Iniciando analisis...");
      setStreamNote("Procesando tu video.");

      const personaPrompt = buildPersonaPromptFromFilters(personaFilters);
      const jobResponse = await fetch(createJobUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: uploadTicket.video_id,
          storage_path: uploadTicket.object_path,
          persona_filters: getActiveFiltersCount() > 0 ? personaFilters : undefined,
          persona_prompt: personaPrompt,
        }),
      });

      if (!jobResponse.ok) {
        throw new Error("No se pudo crear el job de analisis.");
      }

      const job = (await jobResponse.json()) as AnalysisJobEnvelope;
      setProgressPercent(job.progress_percent);
      setStatusText("Analizando contenido...");
      setStreamNote("Esto puede tomar unos segundos.");

      const finalAnalysis = await waitForStreamedResult(job);
      storeAnalysisResult(router, finalAnalysis);
    } catch (error) {
      console.error("Error al procesar el pipeline de subida:", error);
      window.alert(error instanceof Error ? error.message : "Hubo un error al procesar el video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-3rem)] gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
      <section className="space-y-6">
            <span className="inline-flex rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-950">
              NextHit
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Predeci el rendimiento de tu video antes de publicar.
            </h1>
            <p className="max-w-xl text-lg text-slate-600">
              Subi tu video y obtene un analisis multimodal completo con prediccion de retencion, segmentacion de audiencia y recomendaciones accionables.
            </p>
            <div className="grid gap-4">
              {[
                { icon: "🎯", text: "Simulacion de 100 personas con diferentes perfiles" },
                { icon: "🎬", text: "Gemini analiza lo que se ve y lo que se dice en el video" },
                { icon: "📊", text: "Curva de retencion proyectada segundo a segundo" },
                { icon: "💡", text: "Recomendaciones concretas para mejorar tu contenido" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-slate-700">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card-surface rounded-[2rem] border border-white/70 p-8 shadow-soft">
            <h2 className="font-display text-3xl font-bold text-ink">Analiza tu video</h2>
            <p className="mt-2 text-slate-500">
              Subi tu video y recibiras un informe detallado con metricas de rendimiento y recomendaciones.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Archivo de video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:font-semibold file:text-sky-800 hover:file:bg-sky-100"
                  onChange={(event) => setArchivo(event.target.files?.[0] || null)}
                />
              </div>

              {/* User Persona Config */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Audiencia objetivo
                </label>
                <button
                  type="button"
                  onClick={() => setShowPersonaFilters(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {getActiveFiltersCount() > 0
                          ? `${getActiveFiltersCount()} filtros configurados`
                          : "Audiencia general"
                        }
                      </p>
                      <p className="text-sm text-slate-500">
                        {getActiveFiltersCount() > 0
                          ? "Click para modificar"
                          : "Click para personalizar la simulacion"
                        }
                      </p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{statusText}</p>
                  <span className="text-sm font-semibold text-slate-500">
                    {progressPercent}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-950 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-500">{streamNote}</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-ink px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Analizando..." : "Analizar video"}
              </button>
            </form>
      </section>

      {/* User Persona Filters Popup */}
      <UserPersonaFilters
        isOpen={showPersonaFilters}
        onClose={() => setShowPersonaFilters(false)}
        filters={personaFilters}
        onFiltersChange={setPersonaFilters}
      />
    </div>
  );
}
