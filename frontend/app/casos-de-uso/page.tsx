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
];

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

function useSectionInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsInView(true);
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isInView] as const;
}

const useCases = [
  {
    id: "creators",
    title: "Creadores de Contenido",
    subtitle: "YouTube, TikTok, Instagram Reels",
    description: "Optimizá tus videos antes de publicar. Entendé qué tipo de audiencia retiene mejor y ajustá tu contenido para maximizar watch time.",
    benefits: [
      "Predecí la retención antes de publicar",
      "Identificá el mejor hook para tu audiencia",
      "Optimizá la duración ideal del video",
    ],
    stat: { value: "40%", label: "mejora en retención" },
    gradient: "from-rose-500 to-orange-400",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    id: "agencies",
    title: "Agencias de Marketing",
    subtitle: "Performance, Branding, Social Media",
    description: "Validá creativos con clientes usando datos concretos. Presentá reportes profesionales con predicciones de rendimiento.",
    benefits: [
      "Reportes PDF para presentar a clientes",
      "Justificá decisiones creativas con datos",
      "Reducí tiempo de aprobación",
    ],
    stat: { value: "3x", label: "más rápido en aprobar" },
    gradient: "from-blue-500 to-violet-500",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    id: "ecommerce",
    title: "E-commerce y DTC",
    subtitle: "Product videos, UGC, Ads",
    description: "Optimizá videos de producto y UGC para maximizar conversiones. Entendé qué ángulo de venta retiene mejor.",
    benefits: [
      "Testeá ángulos de venta antes de invertir",
      "Optimizá UGC para mejor performance",
      "Identificá el mejor momento para el CTA",
    ],
    stat: { value: "25%", label: "reducción en CPA" },
    gradient: "from-emerald-500 to-cyan-500",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
  },
  {
    id: "startups",
    title: "Startups y SaaS",
    subtitle: "Product demos, Explainers, Onboarding",
    description: "Creá videos de producto que retengan usuarios. Optimizá demos y onboarding para reducir churn.",
    benefits: [
      "Mejorá retención en onboarding",
      "Optimizá demos para mostrar valor rápido",
      "A/B test de narrativas sin gastar en ads",
    ],
    stat: { value: "50%", label: "mejora en completion" },
    gradient: "from-violet-500 to-fuchsia-500",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

export default function UseCasesPage() {
  const [heroRef, heroVisible] = useSectionInView<HTMLElement>(0.3);
  const [casesRef, casesVisible] = useSectionInView<HTMLElement>(0.15);
  const [footerRef, footerVisible] = useSectionInView<HTMLElement>(0.1);

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
          <Link href="/casos-de-uso" className="text-sm font-medium text-slate-900">
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
      <section
        ref={heroRef}
        className={`px-6 pb-16 pt-32 transition-all duration-700 ${
          heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
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

      {/* Use Cases Grid */}
      <section ref={casesRef} className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2">
            {useCases.map((useCase, index) => (
              <div
                key={useCase.id}
                className={`rounded-2xl border border-slate-200 bg-white p-8 transition-all duration-500 hover:border-slate-300 hover:shadow-lg ${
                  casesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                  {useCase.icon}
                </div>

                <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  {useCase.subtitle}
                </span>

                <h3 className="mt-4 text-xl font-semibold text-slate-900">{useCase.title}</h3>
                <p className="mt-2 text-slate-600">{useCase.description}</p>

                <ul className="mt-6 space-y-2">
                  {useCase.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-3xl font-bold text-slate-900">
                    {useCase.stat.value}
                  </span>
                  <span className="text-sm text-slate-600">{useCase.stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              Probar gratis
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
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
                <Link href="/app">AI persona</Link>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </main>
  );
}
