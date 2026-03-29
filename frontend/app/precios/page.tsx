"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const FOOTER_ASCII_FRAMES = [
  String.raw`
                     ·      ·
              ·           o        ·
         ·        ·   o---+---o
                o---+---o |     \
          ·    /    |     \|      o
              o     o------o---o--+---o
               \   / \      \  |  /   /
                o-+---o------o-+-o---o
                  |      ·      |
                o-+---o      o--+---o
               /  |   / \      / |   \
              o---+--o   o----o--+----o
                   \             /
                    o-----o-----o
  `,
  String.raw`
                     ·      ·            ·
              ·           o        ·   o---o
         ·        ·   o---+---o       /  |  \
                o---+---o |     \    o---+---o
          ·    /    |     \|      o--+---o   |
              o     o------o---o--+--o   \   o
               \   / \      \  |  /   /   o--+
                o-+---o------o-+-o---o   /  /
                  |      ·      |     \ o--o
                o-+---o      o--+---o  \  |
               /  |   / \      / |   \  o-+
              o---+--o   o----o--+----o  \|
               \  | / \  |   / \ |   / \  o
                o-+-o--o-+--o--+-o--o--o-+
                   \      |      /     \ |
                    o-----o-----o---o---o
  `,
  String.raw`
                     o      ·            o
              ·     / \   o        ·   o-+-o
         ·       o-+---+---o       / \ /  |  \
               /  o---+---o |     o---+---o---o
          ·   o---/   |     \|     |  /o   \   |
             / \ o    o------o---o-+-o-+----\\--o
              \  \   / \      \  | /   / \   o-+
               o--+-+---o------o-+-o---o--o-/  /
                  |  \   ·      |     \   o--o
                o-+---o------o--+---o  \ / |  \
               /  |   / \      / |   \  o--+---o
              o---+--o---o----o--+----o  \ |  /|
               \  | / \  |   / \ |   / \  o-+-o
                o-+-o--o-+--o--+-o--o--o--+-+--o
                   \      |      /   \   /  |  /
                    o-----o-----o-----o-----o
  `,
  String.raw`
                     o      o            o
               o----+----o/ \   o    o--+-+-o
         ·    / \  / \  o-+---+---o / \ / |  \
             o---+-+--o/  o---+---o-+---+-o--o
          o--+---/ |  /    |   |    \|  /o  \ |
         / \ |   o  o------o---o---o-+-o-+---\\o
         \  \|  / \ / \      \  |  /  / \ \  o+
          o--+-+---o---o------o-+-o--o--o--o/ /
             |  \  ·    \      |   \   \ o--o
           o-+---o------o---o--+---o\  / |  \
          /  |   / \      / \ / |   \o--+---o
         o---+--o---o----o--+-+-+----o \ | / |
          \  | / \  |   / \ |/ /|   / \o-+-o o
           o-+-o--o-+--o--+-+-o-+--o--o-+-+--o
             \ |   / |   \  | / | / \  / | | /
              o-+--o-+----o-+-o-+-o--o-+-o-+o
                \      |      /   \   /   |/
                 o-----o-----o-----o-----o
  `,
];

const plans = [
  {
    name: "Starter",
    description: "Para probar la plataforma",
    price: 9,
    videos: 5,
    featured: false,
    features: [
      "5 análisis de video",
      "Simulación de 100 personas",
      "Curva de retención predictiva",
      "Momentos clave identificados",
      "Exportar PDF básico",
    ],
  },
  {
    name: "Pro",
    description: "Para creadores activos",
    price: 29,
    videos: 20,
    featured: true,
    features: [
      "20 análisis de video",
      "Simulación de 100 personas",
      "Curva de retención predictiva",
      "Momentos clave identificados",
      "Segmentación por arquetipos",
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
      "60 análisis de video",
      "Simulación de 100 personas",
      "Curva de retención predictiva",
      "Momentos clave identificados",
      "Segmentación por arquetipos",
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
    question: "¿Cómo funciona el sistema de créditos?",
    answer: "Cada plan incluye un número de análisis de video. Un análisis equivale a un video procesado. Los créditos no vencen y podés usarlos cuando quieras.",
  },
  {
    question: "¿Qué pasa si me quedo sin créditos?",
    answer: "Podés comprar más créditos en cualquier momento o actualizar tu plan. No hay límites de tiempo ni vencimiento.",
  },
  {
    question: "¿Puedo probar antes de pagar?",
    answer: "Sí, ofrecemos un análisis gratuito para que pruebes la plataforma sin compromiso. Subí tu video y ve los resultados.",
  },
  {
    question: "¿Qué formatos de video aceptan?",
    answer: "Aceptamos MP4, MOV, AVI y la mayoría de formatos comunes. Videos de hasta 5 minutos y 500MB.",
  },
  {
    question: "¿Puedo cancelar en cualquier momento?",
    answer: "No hay suscripciones. Comprás créditos cuando los necesitás. Sin compromisos ni pagos recurrentes.",
  },
  {
    question: "¿Ofrecen descuentos por volumen?",
    answer: "Sí, para equipos grandes o agencias con necesidades especiales, contactanos para un plan personalizado.",
  },
];

const comparisonFeatures = [
  { name: "Análisis de video", starter: "5", pro: "20", agency: "60" },
  { name: "Personas sintéticas", starter: "100", pro: "100", agency: "100" },
  { name: "Curva de retención", starter: true, pro: true, agency: true },
  { name: "Momentos clave", starter: true, pro: true, agency: true },
  { name: "Segmentación", starter: false, pro: true, agency: true },
  { name: "Recomendaciones", starter: false, pro: true, agency: true },
  { name: "Variantes creativas", starter: false, pro: true, agency: true },
  { name: "Estrategia de medios", starter: false, pro: false, agency: true },
  { name: "Exportar PDF", starter: true, pro: true, agency: true },
  { name: "Exportar CSV", starter: false, pro: true, agency: true },
  { name: "Soporte prioritario", starter: false, pro: false, agency: true },
];

function useSectionInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isInView] as const;
}

function LandingFooterAscii() {
  return (
    <div className="landing-footer-ascii" aria-hidden="true">
      {FOOTER_ASCII_FRAMES.map((frame, index) => (
        <pre
          key={index}
          className="landing-footer-ascii-frame"
          style={{ animationDelay: `${index * 1.6}s` }}
        >
          {frame}
        </pre>
      ))}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function PreciosPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroRef, heroVisible] = useSectionInView<HTMLElement>(0.3);
  const [cardsRef, cardsVisible] = useSectionInView<HTMLDivElement>(0.2);
  const [tableRef, tableVisible] = useSectionInView<HTMLElement>(0.2);
  const [faqRef, faqVisible] = useSectionInView<HTMLElement>(0.2);
  const [guaranteeRef, guaranteeVisible] = useSectionInView<HTMLElement>(0.3);
  const [footerRef, footerVisible] = useSectionInView<HTMLElement>(0.12);

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
      <section
        ref={heroRef}
        className={`px-6 pb-16 pt-32 transition-all duration-700 ${
          heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
            Precios
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
            Simple y transparente
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Pagá solo por lo que usás. Sin suscripciones, sin compromisos.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div ref={cardsRef} className="grid gap-8 md:grid-cols-3">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`pricing-card relative rounded-2xl border-2 bg-white p-8 transition-all duration-500 ${
                  plan.featured
                    ? "border-slate-900 shadow-xl"
                    : "border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md"
                } ${cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
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
                      <CheckIcon className="h-5 w-5 flex-shrink-0 text-emerald-500" />
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
      <section
        ref={tableRef}
        className={`border-t border-slate-200 bg-slate-50 px-6 py-24 transition-all duration-700 ${
          tableVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Compará los planes
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
                  <th className="py-4 text-center text-sm font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      Pro
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Popular
                      </span>
                    </span>
                  </th>
                  <th className="py-4 text-center text-sm font-semibold text-slate-900">Agency</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr
                    key={feature.name}
                    className={`border-b border-slate-100 transition-all duration-300 hover:bg-slate-100/50 ${
                      tableVisible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ transitionDelay: `${200 + index * 50}ms` }}
                  >
                    <td className="py-4 text-sm text-slate-600">{feature.name}</td>
                    <td className="py-4 text-center">
                      {typeof feature.starter === "boolean" ? (
                        feature.starter ? (
                          <CheckIcon className="mx-auto h-5 w-5 text-emerald-500" />
                        ) : (
                          <XIcon className="mx-auto h-5 w-5 text-slate-300" />
                        )
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{feature.starter}</span>
                      )}
                    </td>
                    <td className="py-4 text-center bg-slate-100/30">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? (
                          <CheckIcon className="mx-auto h-5 w-5 text-emerald-500" />
                        ) : (
                          <XIcon className="mx-auto h-5 w-5 text-slate-300" />
                        )
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      {typeof feature.agency === "boolean" ? (
                        feature.agency ? (
                          <CheckIcon className="mx-auto h-5 w-5 text-emerald-500" />
                        ) : (
                          <XIcon className="mx-auto h-5 w-5 text-slate-300" />
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
      <section
        ref={faqRef}
        className={`px-6 py-24 transition-all duration-700 ${
          faqVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Todo lo que necesitás saber sobre NextHit.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className={`rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-slate-300 ${
                  faqVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-300 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === index ? "max-h-48" : "max-h-0"
                  }`}
                >
                  <div className="border-t border-slate-100 px-6 py-5">
                    <p className="text-slate-600">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section
        ref={guaranteeRef}
        className={`border-t border-slate-200 bg-slate-50 px-6 py-16 transition-all duration-700 ${
          guaranteeVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 transition-transform duration-500 ${
            guaranteeVisible ? "scale-100" : "scale-75"
          }`}>
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="mt-6 font-display text-2xl font-semibold text-slate-950">
            Garantía de satisfacción
          </h3>
          <p className="mt-4 text-lg text-slate-600">
            Si no estás satisfecho con tu primer análisis, te devolvemos el dinero. Sin preguntas.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className={`landing-footer ${footerVisible ? "is-visible" : ""}`}>
        <div className="landing-footer-shell">
          <div className="landing-footer-top">
            <div className="landing-footer-brand">
              <Link href="/" className="landing-footer-logo">
                <img src="/logo.svg" alt="NextHit" className="h-9 w-auto" />
                <span>NextHit</span>
              </Link>
              <p className="landing-footer-copy">
                Inteligencia creativa predictiva para videos short-form.
              </p>
              <p className="landing-footer-meta">© 2026 NextHit. Todos los derechos reservados.</p>
            </div>

            <div className="landing-footer-links">
              <div className="landing-footer-column">
                <span className="landing-footer-heading">Producto</span>
                <Link href="/casos-de-uso">Casos de uso</Link>
                <Link href="/funcionalidades">Features</Link>
                <Link href="/precios">Precios</Link>
              </div>

              <div className="landing-footer-column">
                <span className="landing-footer-heading">Legal</span>
                <Link href="/privacidad">Política de privacidad</Link>
                <Link href="/terminos">Términos y condiciones</Link>
              </div>

              <div className="landing-footer-column">
                <span className="landing-footer-heading">Empezar</span>
                <Link href="/app">Análisis</Link>
                <Link href="/app">User persona</Link>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </main>
  );
}
