import { NextResponse } from "next/server";

import { buildBackendUrl, getBackendBaseUrl } from "@/lib/backend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!getBackendBaseUrl()) {
    return NextResponse.json(
      { error: "Backend URL is not configured." },
      { status: 503 },
    );
  }

  const payload = await request.json();
  const response = await fetch(buildBackendUrl("/api/analysis/jobs"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
