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
  const serialized = JSON.stringify(data);
  window.localStorage.setItem(ANALYSIS_STORAGE_KEY, serialized);
  window.localStorage.setItem(`${ANALYSIS_STORAGE_PREFIX}${data.id}`, serialized);
  router.push(`/resultado?id=${encodeURIComponent(data.id)}`);
}

export default function AppMain() {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState("Ready to upload your video.");
  const [streamNote, setStreamNote] = useState("No job started yet.");

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
          reject(new Error("The analysis finished but the final payload could not be retrieved."));
          return;
        }

        resolve((await resultResponse.json()) as AnalysisResponse);
      };

      const handleStreamEvent = (rawEvent: MessageEvent<string>) => {
        const event = JSON.parse(rawEvent.data) as AnalysisStreamEvent;
        setProgressPercent(event.progress_percent ?? 0);
        setStatusText(event.stage?.replace(/\./g, " ") || "Processing analysis");

        if (event.type === "persona.batch.completed") {
          const batchIndex =
            typeof event.payload === "object" &&
            event.payload &&
            "batch_index" in event.payload
              ? Number((event.payload as { batch_index: number }).batch_index) + 1
              : null;
          setStreamNote(
            batchIndex
              ? `Persona batch ${batchIndex}/5 completed and streamed.`
              : "A persona batch just completed.",
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
                : "The backend job failed.",
            ),
          );
        }
      };

      source.addEventListener("job.created", handleStreamEvent as EventListener);
      source.addEventListener("upload.validated", handleStreamEvent as EventListener);
      source.addEventListener("transcription.completed", handleStreamEvent as EventListener);
      source.addEventListener("creative_context.completed", handleStreamEvent as EventListener);
      source.addEventListener("persona.batch.completed", handleStreamEvent as EventListener);
      source.addEventListener("demographics.completed", handleStreamEvent as EventListener);
      source.addEventListener("analysis.completed", handleStreamEvent as EventListener);
      source.addEventListener("job.failed", handleStreamEvent as EventListener);
      source.onerror = () => {
        if (!settled) {
          setStreamNote("Waiting for the backend stream to reconnect...");
        }
      };
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!archivo) {
      window.alert("Please upload a video file first.");
      return;
    }

    setLoading(true);
    setProgressPercent(3);
    setStatusText("Preparing upload ticket...");
    setStreamNote("The browser will upload the file directly to Supabase.");

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured in the frontend environment.");
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
        throw new Error("Could not create the upload ticket.");
      }

      const uploadTicket = (await uploadInitResponse.json()) as UploadInitResponse;
      setProgressPercent(10);
      setStatusText("Uploading video directly to Supabase...");

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
      setStatusText("Creating backend analysis job...");
      setStreamNote("The backend will transcribe, score, simulate 100 personas, and stream progress.");

      const jobResponse = await fetch(createJobUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: uploadTicket.video_id,
          storage_path: uploadTicket.object_path,
        }),
      });

      if (!jobResponse.ok) {
        throw new Error("Could not create the analysis job.");
      }

      const job = (await jobResponse.json()) as AnalysisJobEnvelope;
      setProgressPercent(job.progress_percent);
      setStatusText(job.stage);
      setStreamNote("Listening for live persona batches...");

      const finalAnalysis = await waitForStreamedResult(job);
      storeAnalysisResult(router, finalAnalysis);
    } catch (error) {
      console.error("Error processing the upload pipeline:", error);
      window.alert(error instanceof Error ? error.message : "Hubo un error al procesar el video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="space-y-6">
            <span className="inline-flex rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-950">
              AXIOM//LENS intake
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Upload the video, stream the analysis, and land on a report the frontend can use end to end.
            </h1>
            <p className="max-w-xl text-lg text-slate-600">
              The browser now uploads directly to Supabase, the backend uses Groq Whisper for timestamped transcription, simulates 100 personas in batches, and streams progress until the final report is ready.
            </p>
            <div className="grid gap-4">
              {[
                "Direct-to-storage upload avoids Vercel body limits.",
                "Persona batches stream as they complete instead of waiting for 100 separate requests.",
                "The final payload still matches the current /resultado experience, with richer transcript and audience data added on top.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm"
                >
                  <p className="text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card-surface rounded-[2rem] border border-white/70 p-8 shadow-soft">
            <h2 className="font-display text-3xl font-bold text-ink">Upload the creative</h2>
            <p className="mt-2 text-slate-500">
              Add the video and we will transcribe it, simulate the audience, and build the report.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Video file
                </label>
                <input
                  type="file"
                  accept="video/*"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:font-semibold file:text-sky-800 hover:file:bg-sky-100"
                  onChange={(event) => setArchivo(event.target.files?.[0] || null)}
                />
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
                {loading ? "Running the pipeline..." : "Analyze video"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
