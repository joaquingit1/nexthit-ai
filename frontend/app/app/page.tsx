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

function storeAnalysisResult(router: ReturnType<typeof useRouter>, data: AnalysisResponse) {
  try {
    window.localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    window.localStorage.removeItem(`${ANALYSIS_STORAGE_PREFIX}${data.id}`);
    if (data.job_id) {
      window.localStorage.removeItem(`${ANALYSIS_STORAGE_PREFIX}${data.job_id}`);
    }
  } catch {
    // Ignora errores de storage: el resultado se recupera desde el backend.
  }

  const resultId = data.job_id || data.id;
  const analysisIdQuery = data.id && data.id !== resultId ? `&analysis=${encodeURIComponent(data.id)}` : "";
  router.push(`/resultado?id=${encodeURIComponent(resultId)}${analysisIdQuery}&new=1`);
}

export default function AppMain() {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState("Listo para analizar");
  const [streamNote, setStreamNote] = useState("Subi un video para comenzar el analisis.");

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

      const jobResponse = await fetch(createJobUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: uploadTicket.video_id,
          storage_path: uploadTicket.object_path,
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
            {
              icon: (
                <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              ),
              text: "Simulacion de 100 personas con diferentes perfiles",
            },
            {
              icon: (
                <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ),
              text: "Gemini analiza lo que se ve y lo que se dice en el video",
            },
            {
              icon: (
                <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              text: "Curva de retencion proyectada segundo a segundo",
            },
            {
              icon: (
                <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
              text: "Recomendaciones concretas para mejorar tu contenido",
            },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm"
            >
              <span className="flex-shrink-0">{item.icon}</span>
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
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith("video/")) {
                  setArchivo(file);
                }
              }}
              className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : archivo
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
              }`}
            >
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => setArchivo(event.target.files?.[0] || null)}
              />
              {archivo ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">{archivo.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {(archivo.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setArchivo(null);
                    }}
                    className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    Cambiar archivo
                  </button>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                    <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Arrastra tu video aqui
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    o hace click para seleccionar
                  </p>
                </>
              )}
            </label>
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
    </div>
  );
}
