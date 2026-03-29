"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    description: "Para probar la plataforma",
    price: 9,
    videos: 5,
    featured: false,
    features: [
      "5 analisis de video",
      "Simulacion de 100 personas",
      "Curva de retencion predictiva",
      "Momentos clave identificados",
      "Exportar PDF basico",
    ],
  },
  {
    name: "Pro",
    description: "Para creadores activos",
    price: 29,
    videos: 20,
    featured: true,
    features: [
      "20 analisis de video",
      "Simulacion de 100 personas",
      "Curva de retencion predictiva",
      "Momentos clave identificados",
      "Segmentacion por arquetipos",
      "Recomendaciones accionables",
      "Variantes creativas",
      "Exportar PDF y CSV",
    ],
  },
  {
    name: "Agency",
    description: "Para equipos y agencias",
    price: 79,
    videos: 60,
    featured: false,
    features: [
      "60 analisis de video",
      "Simulacion de 100 personas",
      "Curva de retencion predictiva",
      "Momentos clave identificados",
      "Segmentacion por arquetipos",
      "Recomendaciones accionables",
      "Variantes creativas",
      "Estrategia de medios",
      "Exportar PDF y CSV",
      "Soporte prioritario",
    ],
  },
];

const faqs = [
  {
    question: "Como funciona el sistema de creditos?",
    answer: "Cada plan incluye un numero de analisis de video. Un analisis equivale a un video procesado. Los creditos no vencen y podes usarlos cuando quieras.",
  },
  {
    question: "Que pasa si me quedo sin creditos?",
    answer: "Podes comprar mas creditos en cualquier momento o actualizar tu plan. No hay limites de tiempo ni vencimiento.",
  },
  {
    question: "Puedo probar antes de pagar?",
    answer: "Si, ofrecemos un analisis gratuito para que pruebes la plataforma sin compromiso. Subi tu video y ve los resultados.",
  },
  {
    question: "Que formatos de video aceptan?",
    answer: "Aceptamos MP4, MOV, AVI y la mayoria de formatos comunes. Videos de hasta 5 minutos y 500MB.",
  },
  {
    question: "Puedo cancelar en cualquier momento?",
    answer: "No hay suscripciones. Compras creditos cuando los necesitas. Sin compromisos ni pagos recurrentes.",
  },
  {
    question: "Ofrecen descuentos por volumen?",
    answer: "Si, para equipos grandes o agencias con necesidades especiales, contactanos para un plan personalizado.",
  },
];

const comparisonFeatures = [
  { name: "Analisis de video", starter: "5", pro: "20", agency: "60" },
  { name: "Personas sinteticas", starter: "100", pro: "100", agency: "100" },
  { name: "Curva de retencion", starter: true, pro: true, agency: true },
  { name: "Momentos clave", starter: true, pro: true, agency: true },
  { name: "Segmentacion", starter: false, pro: true, agency: true },
  { name: "Recomendaciones", starter: false, pro: true, agency: true },
  { name: "Variantes creativas", starter: false, pro: true, agency: true },
  { name: "Estrategia de medios", starter: false, pro: false, agency: true },
  { name: "Exportar PDF", starter: true, pro: true, agency: true },
  { name: "Exportar CSV", starter: false, pro: true, agency: true },
  { name: "Soporte prioritario", starter: false, pro: false, agency: true },
];

export default function PreciosPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 items-center justify-between rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="NextHit" className="h-8 w-auto" />
          <span className="text-lg font-bold text-slate-900">NextHit</span>
        </Link>

        <div className="hidden flex-1 items-center gap-6 pl-8 md:flex">
          <Link href="/funcionalidades" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Funcionalidades
          </Link>
          <Link href="/casos-de-uso" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Casos de Uso
          </Link>
          <Link href="/precios" className="text-sm font-medium text-slate-900">
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
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Precios
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
            Simple y transparente
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Paga solo por lo que usas. Sin suscripciones, sin compromisos.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 bg-white p-8 ${
                  plan.featured
                    ? "border-slate-900 shadow-xl"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold text-white">
                    Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-slate-900">${plan.price}</span>
                  <span className="text-slate-500"> / {plan.videos} videos</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  ${(plan.price / plan.videos).toFixed(2)} por video
                </p>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-slate-600">
                      <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/app"
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                    plan.featured
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Empezar ahora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="border-t border-slate-200 bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Compara los planes
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Todas las funcionalidades detalladas lado a lado.
            </p>
          </div>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 text-left text-sm font-semibold text-slate-900">Funcionalidad</th>
                  <th className="py-4 text-center text-sm font-semibold text-slate-900">Starter</th>
                  <th className="py-4 text-center text-sm font-semibold text-slate-900">Pro</th>
                  <th className="py-4 text-center text-sm font-semibold text-slate-900">Agency</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name} className="border-b border-slate-100">
                    <td className="py-4 text-sm text-slate-600">{feature.name}</td>
                    <td className="py-4 text-center">
                      {typeof feature.starter === "boolean" ? (
                        feature.starter ? (
                          <svg className="mx-auto h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="mx-auto h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{feature.starter}</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? (
                          <svg className="mx-auto h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="mx-auto h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      {typeof feature.agency === "boolean" ? (
                        feature.agency ? (
                          <svg className="mx-auto h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="mx-auto h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{feature.agency}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Todo lo que necesitas saber sobre NextHit.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 text-slate-400 transition ${openFaq === index ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="border-t border-slate-100 px-6 py-5">
                    <p className="text-slate-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="border-t border-slate-200 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="mt-6 font-display text-2xl font-semibold text-slate-950">
            Garantia de satisfaccion
          </h3>
          <p className="mt-4 text-lg text-slate-600">
            Si no estas satisfecho con tu primer analisis, te devolvemos el dinero. Sin preguntas.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-white">
            Empieza a optimizar tus videos hoy
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Primer analisis gratis. Sin tarjeta de credito.
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
