"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AppMain() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("texto", texto);

    if (archivo) {
      formData.append("archivo", archivo);
    }

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      const response = await fetch(`${backendUrl}/api/procesar`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("La respuesta del backend no fue valida.");
      }

      const data = await response.json();

      if (data.status === "success") {
        router.push(`/resultado?output=${encodeURIComponent(data.resultado)}`);
        return;
      }

      throw new Error("No se pudo completar el analisis.");
    } catch (error) {
      console.error("Error procesando:", error);
      window.alert("Hubo un error al procesar los datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="space-y-6">
            <span className="inline-flex rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-sm font-semibold text-teal-900">
              Panel de control
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Sube contexto, lanza el analisis y prepara una demo convincente.
            </h1>
            <p className="max-w-xl text-lg text-slate-600">
              Este formulario envia texto y un archivo opcional al backend en formato multipart/form-data.
            </p>
            <div className="grid gap-4">
              {[
                "Ideal para PDFs, imagenes, audio o cualquier input mixto.",
                "Listo para conectar modelos de IA o pipelines de datos.",
                "Pantalla de resultados simple para demos en vivo.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
                  <p className="text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card-surface rounded-[2rem] border border-white/70 p-8 shadow-soft">
            <h2 className="font-display text-3xl font-bold text-ink">Ingresa tus datos</h2>
            <p className="mt-2 text-slate-500">
              Describe lo que quieres procesar y adjunta un archivo si hace falta.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Informacion de tu negocio
                </label>
                <textarea
                  required
                  rows={6}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  placeholder="Describe lo que necesitas procesar..."
                  value={texto}
                  onChange={(event) => setTexto(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Documento adjunto (opcional)
                </label>
                <input
                  type="file"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:font-semibold file:text-sky-800 hover:file:bg-sky-100"
                  onChange={(event) => setArchivo(event.target.files?.[0] || null)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-ink px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Procesando magia..." : "Procesar"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
