import { NextResponse } from "next/server";

import { buildBackendUrl, getBackendBaseUrl } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  if (!getBackendBaseUrl()) {
    return NextResponse.json(
      { error: "La URL del backend no esta configurada." },
      { status: 503 },
    );
  }

  const response = await fetch(
    buildBackendUrl(`/api/analysis/jobs/${params.jobId}/result`),
    {
      cache: "no-store",
    },
  );
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
