import { buildBackendUrl, getBackendBaseUrl } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  if (!getBackendBaseUrl()) {
    return new Response("La URL del backend no esta configurada.", { status: 503 });
  }

  const upstream = await fetch(
    buildBackendUrl(`/api/analysis/jobs/${params.jobId}/events`),
    {
      headers: {
        Accept: "text/event-stream",
      },
      cache: "no-store",
    },
  );

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
