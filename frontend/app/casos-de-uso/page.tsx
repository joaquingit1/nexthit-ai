"use client";

import Link from "next/link";

const useCases = [
  {
    id: "creators",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: "Creadores de Contenido",
    subtitle: "YouTube, TikTok, Instagram Reels",
    description: "Optimiza tus videos antes de publicar. Entiende que tipo de audiencia retiene mejor y ajusta tu contenido para maximizar watch time y engagement.",
    benefits: [
      "Predeci la retencion antes de publicar",
      "Identifica el mejor hook para tu audiencia",
      "Optimiza la duracion ideal del video",
      "Entiende por que tu audiencia abandona",
    ],
    stats: { metric: "40%", label: "mejora promedio en retencion" },
    color: "rose",
  },
  {
    id: "agencies",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Agencias de Marketing",
    subtitle: "Performance, Branding, Social Media",
    description: "Valida creativos con clientes usando datos concretos. Presenta reportes profesionales con predicciones de rendimiento y recomendaciones estrategicas.",
    benefits: [
      "Reportes PDF para presentar a clientes",
      "Justifica decisiones creativas con datos",
      "Reduce iteraciones y tiempo de aprobacion",
      "Diferencia tu propuesta con IA predictiva",
    ],
    stats: { metric: "3x", label: "mas rapido en aprobar creativos" },
    color: "blue",
  },
  {
    id: "ecommerce",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    title: "E-commerce y DTC",
    subtitle: "Product videos, UGC, Ads",
    description: "Optimiza videos de producto y UGC para maximizar conversiones. Entiende que angulo de venta retiene mejor y cual genera mas interes de compra.",
    benefits: [
      "Testea angulos de venta antes de invertir",
      "Optimiza UGC para mejor performance",
      "Identifica el mejor momento para el CTA",
      "Segmenta audiencia por intencion de compra",
    ],
    stats: { metric: "25%", label: "reduccion en CPA promedio" },
    color: "emerald",
  },
  {
    id: "startups",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Startups y SaaS",
    subtitle: "Product demos, Explainers, Onboarding",
    description: "Crea videos de producto que retengan usuarios. Optimiza demos y onboarding para reducir churn y aumentar activacion.",
    benefits: [
      "Mejora retencion en videos de onboarding",
      "Optimiza demos para mostrar valor rapido",
      "Identifica donde usuarios pierden interes",
      "A/B test de narrativas sin gastar en ads",
    ],
    stats: { metric: "50%", label: "mejora en completion rate" },
    color: "violet",
  },
];

const colorClasses: Record<string, { bg: string; icon: string; border: string; stat: string }> = {
  rose: { bg: "bg-rose-50", icon: "bg-rose-500", border: "border-rose-200", stat: "text-rose-600" },
  blue: { bg: "bg-blue-50", icon: "bg-blue-500", border: "border-blue-200", stat: "text-blue-600" },
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-500", border: "border-emerald-200", stat: "text-emerald-600" },
  violet: { bg: "bg-violet-50", icon: "bg-violet-500", border: "border-violet-200", stat: "text-violet-600" },
};

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 items-center justify-between rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="NextHit" className="h-8 w-auto" />
          <span className="text-lg font-bold text-slate-900">NextHit</span>
        </Link>

        <div className="flex flex-1 items-center gap-6 pl-8">
          <Link
            href="/funcionalidades"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Funcionalidades
          </Link>
          <Link
            href="/casos-de-uso"
            className="text-sm font-medium text-slate-900"
          >
            Casos de Uso
          </Link>
          <Link
            href="/precios"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
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
          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">
            Casos de Uso
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
            NextHit para cada tipo de equipo
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Desde creadores independientes hasta agencias enterprise, NextHit se adapta a tu flujo de trabajo.
          </p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl space-y-8">
          {useCases.map((useCase, index) => {
            const colors = colorClasses[useCase.color];
            const isEven = index % 2 === 0;
            return (
              <article
                key={useCase.id}
                className={`overflow-hidden rounded-3xl border ${colors.border} ${colors.bg}`}
              >
                <div className={`grid gap-8 p-8 lg:grid-cols-2 ${!isEven ? "lg:grid-flow-dense" : ""}`}>
                  {/* Content */}
                  <div className={`space-y-6 ${!isEven ? "lg:col-start-2" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.icon} text-white`}>
                        {useCase.icon}
                      </div>
                      <div>
                        <h2 className="font-display text-2xl font-semibold text-slate-900">
                          {useCase.title}
                        </h2>
                        <p className="text-sm text-slate-500">{useCase.subtitle}</p>
                      </div>
                    </div>

                    <p className="text-lg leading-relaxed text-slate-600">
                      {useCase.description}
                    </p>

                    <ul className="space-y-3">
                      {useCase.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-3">
                          <svg className={`mt-0.5 h-5 w-5 flex-shrink-0 ${colors.stat}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-slate-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stats Card */}
                  <div className={`flex items-center justify-center ${!isEven ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                    <div className="w-full max-w-xs rounded-2xl border border-white/60 bg-white/80 p-8 text-center shadow-lg backdrop-blur">
                      <p className={`font-display text-6xl font-bold ${colors.stat}`}>
                        {useCase.stats.metric}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        {useCase.stats.label}
                      </p>
                      <Link
                        href="/app"
                        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Probar ahora
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section className="border-t border-slate-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Usado por equipos de alto rendimiento
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Creadores y marcas que optimizan su contenido con NextHit.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "Maria G.", role: "Content Creator", quote: "Ahora se exactamente donde mi audiencia pierde interes. Mi watch time subio 35% en un mes." },
              { name: "Lucas R.", role: "Performance Manager", quote: "Presentamos creativos con datos de prediccion. Los clientes aprueban mas rapido y con mas confianza." },
              { name: "Sofia M.", role: "E-commerce Owner", quote: "Optimizamos nuestros videos de producto y bajamos el CPA en casi 30%. ROI inmediato." },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <p className="text-slate-600">"{testimonial.quote}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold text-white">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-white">
            Empieza a predecir el rendimiento de tus videos
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
