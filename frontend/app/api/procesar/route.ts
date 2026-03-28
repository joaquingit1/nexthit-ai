import { NextResponse } from "next/server";

import { createAnalysisPayload, normalizeAnalysisResponse } from "@/lib/analysis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const texto = String(formData.get("texto") ?? "");
  const archivoEntry = formData.get("archivo");
  const archivo = archivoEntry instanceof File ? archivoEntry : null;
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const fallbackInput = {
    texto,
    fileName: archivo?.name,
    fileType: archivo?.type,
    fileSize: archivo?.size,
  };

  if (backendUrl) {
    try {
      const upstreamBody = new FormData();
      upstreamBody.append("texto", texto);

      if (archivo) {
        upstreamBody.append("archivo", archivo, archivo.name);
      }

      const response = await fetch(new URL("/api/procesar", backendUrl), {
        method: "POST",
        body: upstreamBody,
        cache: "no-store",
      });

      if (response.ok) {
        const payload = await response.json();
        return NextResponse.json(normalizeAnalysisResponse(payload, fallbackInput));
      }

      console.error("Backend returned a non-OK response for /api/procesar.", {
        backendUrl,
        status: response.status,
      });
    } catch (error) {
      console.error("Falling back to local analysis payload.", error);
    }
  }

  return NextResponse.json(createAnalysisPayload(fallbackInput));
}
