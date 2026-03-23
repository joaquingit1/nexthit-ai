"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type WorkspaceTab =
  | "principal"
  | "resumen"
  | "tiktok"
  | "instagram"
  | "linkedin"
  | "threads"
  | "blog";

type TabMeta = {
  id: WorkspaceTab;
  label: string;
  eyebrow: string;
  mode: "principal" | "resumen" | "pronostico" | "borrador";
};

const tabs: TabMeta[] = [
  { id: "principal", label: "Principal", eyebrow: "Canal recomendado", mode: "principal" },
  { id: "resumen", label: "Resumen", eyebrow: "Vista general", mode: "resumen" },
  { id: "tiktok", label: "TikTok", eyebrow: "Pronostico + IA", mode: "pronostico" },
  { id: "instagram", label: "Instagram", eyebrow: "Pronostico + IA", mode: "pronostico" },
  { id: "linkedin", label: "LinkedIn", eyebrow: "Contenido reutilizado", mode: "borrador" },
  { id: "threads", label: "Threads", eyebrow: "Contenido reutilizado", mode: "borrador" },
  { id: "blog", label: "Blog", eyebrow: "Contenido reutilizado", mode: "borrador" },
];

function Section({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <section className="border-t border-slate-200 pt-8 first:border-t-0 first:pt-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        {kicker}
      </p>
      <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        {title}
      </h3>
      <p className="mt-4 max-w-4xl text-sm leading-8 text-slate-600">{body}</p>
    </section>
  );
}

function ChatSection({ placeholder }: { placeholder: string }) {
  return (
    <section className="border-t border-slate-200 pt-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        IA conversacional
      </p>
      <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        Chat contextual
      </h3>
      <p className="mt-4 max-w-4xl text-sm leading-8 text-slate-600">
        Esta seccion compartira contexto con el resto del tab activo para que el
        usuario pueda pedir aclaraciones, mejoras, variantes y recomendaciones
        puntuales sin salir de la misma vista.
      </p>

      <div className="mt-6 rounded-[1.4rem] bg-slate-950 p-5 text-white">
        <p className="text-sm leading-8 text-slate-200">
          Aqui apareceran los mensajes personalizados del asistente una vez que
          el backend entregue transcript, analisis, documentos de plataforma y
          razonamiento del score.
        </p>
      </div>

      <div className="mt-5 flex gap-3">
        <input
          type="text"
          disabled
          placeholder={placeholder}
          className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
        />
        <button
          type="button"
          disabled
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white opacity-70"
        >
          Enviar
        </button>
      </div>
    </section>
  );
}

function BigWindow({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600">{subtitle}</p>
      </div>

      <div className="max-h-[72vh] overflow-y-auto px-6 py-6">
        <div className="space-y-8">{children}</div>
      </div>
    </section>
  );
}

function PrincipalWorkspace({ plataforma }: { plataforma: string }) {
  return (
    <BigWindow
      eyebrow="Canal recomendado"
      title={`Principal: ${plataforma}`}
      subtitle="Esta es la vista protagonista. Aqui vive la recomendacion principal del sistema junto con el razonamiento, el plan de accion y el chat sobre el mejor destino para este video."
    >
      <Section
        kicker="Recomendacion central"
        title={`${plataforma} es el mejor medio para este contenido`}
        body={`El backend mostrara aqui por que ${plataforma} es la mejor apuesta para este video, como se estima su rendimiento y que senales de la plataforma hacen que esta pieza tenga mas o menos potencial. Este bloque esta pensado para texto largo, explicaciones profundas y recomendaciones reales, no para una tarjeta breve.`}
      />
      <Section
        kicker="Puntuacion"
        title="Nota de rendimiento y explicacion"
        body="Aqui ira la calificacion del 1 al 10 con una explicacion extensa basada en guias actualizadas de la plataforma, lectura del hook, retencion, claridad del mensaje, CTA, longitud y adecuacion al formato."
      />
      <Section
        kicker="Plan de accion"
        title="Que cambiaria antes de publicar"
        body="Este espacio soporta recomendaciones largas: ajustes en los primeros segundos, cambios de ritmo, sugerencias de caption, variaciones del CTA, recorte del inicio, subtitulado, estructura narrativa y cualquier mejora accionable derivada del analisis."
      />
      <ChatSection placeholder={`Preguntale a la IA sobre ${plataforma}...`} />
    </BigWindow>
  );
}

function ResumenWorkspace({ backendMessage }: { backendMessage: string | null }) {
  return (
    <BigWindow
      eyebrow="Vista general"
      title="Resumen"
      subtitle="Esta vista resume el analisis completo y las salidas principales. Todo vive en una sola superficie desplazable para que el usuario pueda leer sin perder contexto."
    >
      <Section
        kicker="Estado"
        title="Estado actual del procesamiento"
        body={backendMessage || "Esperando el payload enriquecido del backend."}
      />
      <Section
        kicker="Analisis del video"
        title="Lectura general de la pieza"
        body="Aqui aparecera el analisis integral del video: hook, estructura, claridad del mensaje, propuesta de valor, ritmo, CTA, observaciones del transcript y cualquier alerta relevante detectada por el backend."
      />
      <Section
        kicker="Rendimiento esperado"
        title="Nota de 1 a 10 con razonamiento"
        body="Este bloque esta preparado para una explicacion larga de la puntuacion estimada, incluyendo que fortalezas empujan el rendimiento hacia arriba y que debilidades lo limitan segun el criterio actualizado por plataforma."
      />
      <Section
        kicker="Publicacion"
        title="Mejor plataforma y caption sugerido"
        body="La recomendacion del mejor canal, el por que, el caption sugerido, variantes alternativas y notas antes de publicar pueden convivir aqui como una salida principal de lectura extensa."
      />
      <Section
        kicker="Contenido reutilizado"
        title="Versiones derivadas del video"
        body="En esta seccion el backend podra incluir una lista amplia de formatos reutilizados como LinkedIn, Threads, blog, newsletter, email o cualquier otro destino textual que se genere a partir del contenido original."
      />
    </BigWindow>
  );
}

function PronosticoWorkspace({ plataforma }: { plataforma: string }) {
  return (
    <BigWindow
      eyebrow="Pronostico + IA"
      title={plataforma}
      subtitle={`Esta vista une el pronostico detallado y la conversacion con IA para ${plataforma}. Todo esta pensado como una sola lectura larga y continua.`}
    >
      <Section
        kicker="Desempeno esperado"
        title={`Como podria rendir en ${plataforma}`}
        body={`Aqui ira una lectura extensa del rendimiento probable en ${plataforma}: score, alcance esperado, compatibilidad con el formato, consistencia con las preferencias del algoritmo y observaciones generales de potencial.`}
      />
      <Section
        kicker="Razonamiento"
        title="Por que podria funcionar o fallar"
        body="Este bloque esta pensado para explicaciones detalladas: calidad del hook, claridad del beneficio, retencion esperada, ritmo, timing del CTA, largo total, uso de texto en pantalla y cualquier otra variable que influya en el ranking."
      />
      <Section
        kicker="Recomendaciones"
        title="Cambios concretos antes de publicar"
        body="Aqui vive una lista larga de mejoras: recortar la intro, reforzar la promesa, cambiar el caption, ajustar el cierre, variar la duracion, probar otra portada o mejorar la estructura visual del contenido."
      />
      <Section
        kicker="Timing"
        title="Cuando conviene publicarlo"
        body={`Este espacio puede incluir horarios sugeridos, ventanas de publicacion, razonamiento temporal y consideraciones propias de ${plataforma} para este tipo de video.`}
      />
      <ChatSection placeholder={`Preguntale a la IA sobre ${plataforma}...`} />
    </BigWindow>
  );
}

function BorradorWorkspace({ plataforma }: { plataforma: string }) {
  return (
    <BigWindow
      eyebrow="Contenido reutilizado"
      title={plataforma}
      subtitle={`Esta vista funciona como un documento largo para el contenido generado para ${plataforma}. No hay tarjetas internas: solo una superficie continua para leer, revisar y conversar con la IA.`}
    >
      <Section
        kicker="Borrador principal"
        title={`Version lista para ${plataforma}`}
        body={`Aqui aparecera la pieza principal generada para ${plataforma}. El backend puede devolver texto largo, con estructura completa, listo para leer dentro de una sola ventana amplia.`}
      />
      <Section
        kicker="Variantes"
        title="Aperturas, CTA y versiones alternativas"
        body="Esta seccion puede incluir otras aperturas, cambios de tono, CTAs, versiones mas cortas, observaciones editoriales y cualquier derivacion util para afinar la salida final."
      />
      <Section
        kicker="Notas"
        title="Sugerencias editoriales"
        body={`Aqui se pueden mostrar recomendaciones especificas para adaptar mejor el texto a ${plataforma}: tono, longitud, estructura, nivel de formalidad, enfoque del cierre y oportunidades para mejorar la claridad.`}
      />
      <ChatSection placeholder={`Pedir cambios para ${plataforma}...`} />
    </BigWindow>
  );
}

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backendMessage = searchParams.get("output");
  const bestPlatformRaw =
    searchParams.get("preferredPlatform") ||
    searchParams.get("bestPlatform") ||
    searchParams.get("platform");
  const featuredPlatform =
    bestPlatformRaw?.toLowerCase() === "instagram" ? "Instagram" : "TikTok";

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("principal");

  const activeTabMeta = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) ?? tabs[0],
    [activeTab],
  );

  return (
    <main className="min-h-screen bg-[#f3f4f6] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-5 flex flex-col gap-4 rounded-[1.6rem] border border-slate-200 bg-white px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Estudio de resultados
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Un espacio limpio para leer analisis largos, revisar salidas y conversar con la IA.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/app")}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Analizar otro video
          </button>
        </section>

        <section className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Navegacion
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Salidas
              </h1>
            </div>

            <div className="mt-4 space-y-2">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                const tabLabel =
                  tab.id === "principal" ? `${tab.label}: ${featuredPlatform}` : tab.label;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-[1.1rem] border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-950 hover:bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
                        isActive ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {tab.eyebrow}
                    </p>
                    <p className="mt-2 text-lg font-semibold">{tabLabel}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section>
            {activeTabMeta.mode === "principal" ? (
              <PrincipalWorkspace plataforma={featuredPlatform} />
            ) : null}

            {activeTabMeta.mode === "resumen" ? (
              <ResumenWorkspace backendMessage={backendMessage} />
            ) : null}

            {activeTabMeta.mode === "pronostico" ? (
              <PronosticoWorkspace plataforma={activeTabMeta.label} />
            ) : null}

            {activeTabMeta.mode === "borrador" ? (
              <BorradorWorkspace plataforma={activeTabMeta.label} />
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={<div className="px-4 py-12 text-slate-500">Cargando resultados...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
