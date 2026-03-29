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

const processSteps = [
  {
    step: "01",
    title: "Subí tu video",
    description: "Arrastrá y soltá cualquier formato. MP4, MOV, AVI y más.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Analizamos con IA",
    description: "Procesamos audio, video y texto segundo a segundo.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.826.138a47.999 47.999 0 01-15.618 0l-.826-.138c-1.717-.293-2.3-2.379-1.067-3.611L5 14.5" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Simulamos audiencia",
    description: "100 personas sintéticas miran tu video.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    step: "04",
    title: "Obtené insights",
    description: "Curva de retención, momentos clave y acciones.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "Curva de retención predictiva",
    description: "Visualizá segundo a segundo dónde tu audiencia pierde interés. Identificá hooks efectivos y puntos de caída.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    title: "100 personas sintéticas",
    description: "Cada persona tiene edad, intereses y comportamiento único. 12 arquetipos para entender quién conecta.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: "Momentos clave identificados",
    description: "Detectamos automáticamente los puntos de hook, caída y abandono en tu video.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    title: "Recomendaciones accionables",
    description: "No solo data, soluciones específicas. Sabé exactamente qué cambiar y dónde.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    title: "Segmentación por arquetipos",
    description: "Entendé qué tipo de audiencia retiene mejor tu contenido y ajustá tu estrategia.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: "Exportar reportes",
    description: "Descargá informes en PDF y CSV para compartir con tu equipo o clientes.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export default function FeaturesPage() {
  const [heroRef, heroVisible] = useSectionInView<HTMLElement>(0.3);
  const [processRef, processVisible] = useSectionInView<HTMLElement>(0.2);
  const [featuresRef, featuresVisible] = useSectionInView<HTMLElement>(0.15);
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
      <section
        ref={heroRef}
        className={`px-6 pb-16 pt-32 transition-all duration-700 ${
          heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Funcionalidades
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
            Inteligencia predictiva para creadores
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Simulá 100 espectadores antes de publicar. Sabé exactamente dónde perdés atención y qué cambiar para maximizar retención.
          </p>
          <div className="mt-8">
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

      {/* Process */}
      <section
        ref={processRef}
        className={`bg-slate-50 px-6 py-24 transition-all duration-700 ${
          processVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
              Cómo funciona
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              De video a insights en minutos
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <div
                key={step.step}
                className={`rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-500 hover:border-slate-300 hover:shadow-md ${
                  processVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                  {step.icon}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Paso {step.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        ref={featuresRef}
        className={`px-6 py-24 transition-all duration-700 ${
          featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
              Todo incluido
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Lo que obtenés con NextHit
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-500 hover:border-slate-300 hover:shadow-md ${
                  featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
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
                <Link href="/app">User persona</Link>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </main>
  );
}
