"use client";

import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "100 Personas Sinteticas",
    description: "Simulamos una audiencia diversa con perfiles demograficos realistas. Cada persona tiene edad, ocupacion, intereses y comportamiento de consumo unico.",
    color: "blue",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Curva de Retencion Predictiva",
    description: "Visualiza segundo a segundo donde tu audiencia pierde interes. Identifica los momentos exactos de abandono antes de publicar.",
    color: "emerald",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Recomendaciones Accionables",
    description: "No solo diagnosticamos problemas, te damos soluciones concretas. Cambios especificos en hook, estructura y cierre para mejorar retencion.",
    color: "amber",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    title: "Segmentacion por Arquetipos",
    description: "Agrupa tu audiencia en segmentos significativos. Entiende que perfil retiene mejor y cual abandona primero.",
    color: "violet",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Momentos Clave",
    description: "Mapa temporal de los momentos criticos de tu video. Hooks efectivos, puntos de caida y oportunidades de mejora.",
    color: "rose",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: "Variantes Creativas",
    description: "Generamos 3 versiones alternativas de tu video optimizadas para diferentes segmentos y objetivos de campana.",
    color: "cyan",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Estrategia de Medios",
    description: "Configuracion de targeting para Meta Ads basada en los segmentos que mejor retienen. Exporta directo a tu ad manager.",
    color: "indigo",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: "Exportar PDF y CSV",
    description: "Descarga tu analisis completo. PDF para presentaciones ejecutivas, CSV para integraciones y analisis en profundidad.",
    color: "slate",
  },
];

const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
  blue: { bg: "bg-blue-50", icon: "bg-blue-500", border: "border-blue-200" },
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-500", border: "border-emerald-200" },
  amber: { bg: "bg-amber-50", icon: "bg-amber-500", border: "border-amber-200" },
  violet: { bg: "bg-violet-50", icon: "bg-violet-500", border: "border-violet-200" },
  rose: { bg: "bg-rose-50", icon: "bg-rose-500", border: "border-rose-200" },
  cyan: { bg: "bg-cyan-50", icon: "bg-cyan-500", border: "border-cyan-200" },
  indigo: { bg: "bg-indigo-50", icon: "bg-indigo-500", border: "border-indigo-200" },
  slate: { bg: "bg-slate-100", icon: "bg-slate-500", border: "border-slate-200" },
};

const processSteps = [
  {
    step: "01",
    title: "Subi tu video",
    description: "Arrastra y solta tu video en cualquier formato. Procesamos MP4, MOV, AVI y mas.",
  },
  {
    step: "02",
    title: "Analizamos con IA",
    description: "Nuestro modelo procesa audio, video y texto para entender cada segundo.",
  },
  {
    step: "03",
    title: "Simulamos audiencia",
    description: "100 personas sinteticas miran tu video y nos dicen donde abandonan.",
  },
  {
    step: "04",
    title: "Obtene insights",
    description: "Recibis curva de retencion, momentos clave y recomendaciones accionables.",
  },
];

const metrics = [
  { value: "100", label: "Personas simuladas por video" },
  { value: "<2min", label: "Tiempo de analisis" },
  { value: "8", label: "Metricas de rendimiento" },
  { value: "3", label: "Variantes creativas" },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 items-center justify-between rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="NextHit" className="h-8 w-auto" />
          <span className="text-lg font-bold text-slate-900">NextHit</span>
        </Link>

        <div className="hidden flex-1 items-center gap-6 pl-8 md:flex">
          <Link href="/funcionalidades" className="text-sm font-medium text-slate-900">
            Funcionalidades
          </Link>
          <Link href="/casos-de-uso" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Casos de Uso
          </Link>
          <Link href="/precios" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Precios
          </Link>
        </div>

        <Link
          href="/app"
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Analizar video
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-16 pt-32">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
            Funcionalidades
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
            Todo lo que necesitas para optimizar tus videos
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Analisis predictivo impulsado por IA que simula audiencias reales para darte insights accionables antes de publicar.
          </p>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-y border-slate-200 bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="font-display text-4xl font-bold text-slate-900">{metric.value}</p>
                <p className="mt-2 text-sm text-slate-600">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Funcionalidades principales
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Cada herramienta disenada para maximizar el rendimiento de tu contenido.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const colors = colorClasses[feature.color];
              return (
                <article
                  key={feature.title}
                  className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 transition hover:shadow-lg`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.icon} text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-200 bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Como funciona
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              De video a insights en 4 pasos simples.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={step.step} className="relative">
                {index < processSteps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-slate-200 lg:block" />
                )}
                <div className="relative rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
                    {step.step}
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Dive Feature */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Destacado
              </span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                Curva de retencion predictiva
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Nuestra tecnologia analiza tu video segundo a segundo y simula como reaccionaria una audiencia real.
                Ve exactamente donde pierdes atencion y por que.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Visualizacion segundo a segundo",
                  "Identificacion de puntos de abandono",
                  "Comparativa con benchmarks de la industria",
                  "Recomendaciones para cada momento critico",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Probar ahora
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xl">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="mt-4 text-sm text-slate-400">Vista previa de la curva</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="border-t border-slate-200 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Optimizado para las plataformas que usas
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-slate-400">
            {["TikTok", "Instagram Reels", "YouTube Shorts", "LinkedIn", "Meta Ads"].map((platform) => (
              <span key={platform} className="text-lg font-semibold">{platform}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-white">
            Empieza a optimizar tus videos hoy
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Subi tu primer video y obtene un analisis completo en minutos.
          </p>
          <Link
            href="/app"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Analizar video gratis
          </Link>
        </div>
      </section>
    </main>
  );
}
