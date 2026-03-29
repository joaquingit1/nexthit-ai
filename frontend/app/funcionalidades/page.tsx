"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function useSectionInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isInView] as const;
}

function AnimatedCounter({ value, suffix = "", active }: { value: number; suffix?: string; active: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setDisplayValue(0);
      return;
    }

    let frame = 0;
    const duration = 1200;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setDisplayValue(Math.round(value * eased));
      if (elapsed < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, value]);

  return <>{displayValue}{suffix}</>;
}

function RetentionCurveAnimation({ active }: { active: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }

    let frame = 0;
    const duration = 2000;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = clamp((now - startedAt) / duration, 0, 1);
      setProgress(elapsed);
      if (elapsed < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  const lineReveal = `${progress * 100} 100`;

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="absolute inset-0 opacity-20">
        {[20, 40, 60, 80].map((y) => (
          <div key={y} className="absolute left-0 right-0 border-t border-white/10" style={{ top: `${y}%` }} />
        ))}
        {[20, 40, 60, 80].map((x) => (
          <div key={x} className="absolute top-0 bottom-0 border-l border-white/10" style={{ left: `${x}%` }} />
        ))}
      </div>
      <svg className="relative h-full w-full" viewBox="0 0 100 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="curveGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M0,10 C10,12 20,15 30,22 S50,35 60,40 S80,48 100,52"
          fill="none"
          stroke="url(#curveGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={lineReveal}
          filter="url(#glow)"
        />
        {[
          { x: 30, y: 22, label: "Hook" },
          { x: 60, y: 40, label: "Caida" },
          { x: 85, y: 50, label: "CTA" },
        ].map((point, i) => (
          <g key={i} style={{ opacity: progress > (point.x / 100) ? 1 : 0, transition: "opacity 0.3s" }}>
            <circle cx={point.x} cy={point.y} r="3" fill="#fff" />
            <circle cx={point.x} cy={point.y} r="6" fill="none" stroke="#fff" strokeWidth="1" opacity="0.5" />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-4 left-6 right-6 flex justify-between text-xs text-white/60">
        <span>0:00</span>
        <span>0:15</span>
        <span>0:30</span>
      </div>
    </div>
  );
}

function AudienceDotsAnimation({ active }: { active: boolean }) {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-6">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: 100 }, (_, i) => {
            const delay = (i % 10) * 50 + Math.floor(i / 10) * 30;
            const hue = 200 + Math.random() * 60;
            return (
              <div
                key={i}
                className="h-3 w-3 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: `hsl(${hue}, 70%, 70%)`,
                  opacity: active ? 0.8 : 0.2,
                  transform: active ? "scale(1)" : "scale(0.5)",
                  transitionDelay: `${delay}ms`,
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-4 left-6 text-white">
        <p className="text-2xl font-bold">100</p>
        <p className="text-sm opacity-80">personas simuladas</p>
      </div>
    </div>
  );
}

function InsightsAnimation({ active }: { active: boolean }) {
  const insights = [
    { icon: "⚡", text: "Hook debil en primeros 3s", color: "text-amber-400" },
    { icon: "📉", text: "Caida del 40% en segundo 12", color: "text-rose-400" },
    { icon: "✨", text: "Oportunidad: agregar CTA", color: "text-emerald-400" },
  ];

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6">
      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur transition-all duration-500"
            style={{
              opacity: active ? 1 : 0,
              transform: active ? "translateX(0)" : "translateX(-20px)",
              transitionDelay: `${i * 200}ms`,
            }}
          >
            <span className="text-2xl">{insight.icon}</span>
            <span className={`font-medium ${insight.color}`}>{insight.text}</span>
          </div>
        ))}
      </div>
      <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl" />
    </div>
  );
}

const mainFeatures = [
  {
    id: "personas",
    title: "100 Personas Sinteticas",
    subtitle: "Audiencia simulada con IA",
    description: "Cada persona tiene edad, ocupacion, intereses y patron de consumo unico. Simulamos diversidad real para predecir comportamiento.",
    visual: AudienceDotsAnimation,
    stats: [
      { value: "100", label: "Perfiles unicos" },
      { value: "12", label: "Arquetipos" },
      { value: "∞", label: "Combinaciones" },
    ],
  },
  {
    id: "retencion",
    title: "Curva de Retencion Predictiva",
    subtitle: "Segundo a segundo",
    description: "Visualiza exactamente donde tu audiencia pierde interes. Identifica hooks efectivos, puntos de caida y oportunidades de mejora.",
    visual: RetentionCurveAnimation,
    stats: [
      { value: "1s", label: "Precision" },
      { value: "3", label: "Momentos clave" },
      { value: "95%", label: "Accuracy" },
    ],
  },
  {
    id: "insights",
    title: "Insights Accionables",
    subtitle: "No solo data, soluciones",
    description: "Recibis recomendaciones especificas para mejorar cada segundo de tu video. Cambios concretos que impactan en retencion.",
    visual: InsightsAnimation,
    stats: [
      { value: "5+", label: "Acciones" },
      { value: "40%", label: "Mejora avg" },
      { value: "✓", label: "Priorizadas" },
    ],
  },
];

const additionalFeatures = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    title: "Segmentacion por Arquetipos",
    description: "Agrupa tu audiencia en 12 perfiles distintos y entiende cual conecta mejor con tu contenido.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Momentos Clave",
    description: "Mapa temporal con los puntos criticos: donde enganchas, donde perdes y donde podes mejorar.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: "Variantes Creativas",
    description: "3 versiones alternativas de tu video optimizadas para diferentes audiencias y objetivos.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Estrategia de Medios",
    description: "Configuracion de targeting para Meta Ads basada en los segmentos que mejor retienen.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Calculo de Ahorro",
    description: "Estima cuanto dinero ahorrarias al optimizar antes de invertir en pauta publicitaria.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: "Exportar PDF y CSV",
    description: "Descarga tu analisis completo para presentaciones o integraciones con otras herramientas.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Subi tu video",
    description: "Arrastra y solta tu video. Soportamos MP4, MOV, AVI y mas formatos.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Procesamos con IA",
    description: "Analizamos audio, video y texto para entender cada segundo de tu contenido.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Simulamos audiencia",
    description: "100 personas sinteticas miran tu video y registramos su comportamiento.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    step: "04",
    title: "Obtene insights",
    description: "Recibis la curva de retencion, momentos clave y acciones para mejorar.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function FeaturesPage() {
  const [heroRef, heroVisible] = useSectionInView<HTMLElement>(0.3);
  const [processRef, processVisible] = useSectionInView<HTMLElement>(0.25);
  const featureRefs = mainFeatures.map(() => useSectionInView<HTMLElement>(0.35));

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
      <section ref={heroRef} className="relative overflow-hidden px-6 pb-24 pt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white" />
        <div className="absolute left-1/2 top-32 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-100/40 via-violet-100/40 to-pink-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <span
            className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 transition-all duration-700"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            Funcionalidades
          </span>
          <h1
            className="mt-6 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl lg:text-6xl transition-all duration-700 delay-100"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            Inteligencia predictiva para{" "}
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              creadores de video
            </span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl transition-all duration-700 delay-200"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            Simulamos una audiencia real antes de que publiques. Sabe exactamente donde perdes atencion y como mejorar tu contenido.
          </p>

          {/* Animated Stats */}
          <div
            className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-16 transition-all duration-700 delay-300"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            {[
              { value: 100, suffix: "", label: "Personas simuladas" },
              { value: 95, suffix: "%", label: "Precision predictiva" },
              { value: 40, suffix: "%", label: "Mejora en retencion" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-4xl font-bold text-slate-900 md:text-5xl">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} active={heroVisible} />
                </p>
                <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center transition-all duration-700 delay-400"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              Probar gratis
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/precios"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver precios
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features - Full Width Sections */}
      {mainFeatures.map((feature, index) => {
        const [ref, isVisible] = featureRefs[index];
        const isEven = index % 2 === 0;
        const VisualComponent = feature.visual;

        return (
          <section
            key={feature.id}
            ref={ref}
            className={`px-6 py-24 ${isEven ? "bg-white" : "bg-slate-50"}`}
          >
            <div className="mx-auto max-w-6xl">
              <div className={`grid gap-12 lg:grid-cols-2 lg:items-center ${!isEven ? "lg:grid-flow-dense" : ""}`}>
                {/* Content */}
                <div className={!isEven ? "lg:col-start-2" : ""}>
                  <span
                    className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "translateY(0)" : "translateY(20px)",
                      transition: "all 0.6s ease-out",
                    }}
                  >
                    {feature.subtitle}
                  </span>
                  <h2
                    className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "translateY(0)" : "translateY(20px)",
                      transition: "all 0.6s ease-out 0.1s",
                    }}
                  >
                    {feature.title}
                  </h2>
                  <p
                    className="mt-4 text-lg text-slate-600"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "translateY(0)" : "translateY(20px)",
                      transition: "all 0.6s ease-out 0.2s",
                    }}
                  >
                    {feature.description}
                  </p>

                  {/* Feature Stats */}
                  <div
                    className="mt-8 flex gap-8"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "translateY(0)" : "translateY(20px)",
                      transition: "all 0.6s ease-out 0.3s",
                    }}
                  >
                    {feature.stats.map((stat, i) => (
                      <div key={i}>
                        <p className="font-display text-2xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual */}
                <div
                  className={!isEven ? "lg:col-start-1 lg:row-start-1" : ""}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "scale(1)" : "scale(0.95)",
                    transition: "all 0.8s ease-out 0.2s",
                  }}
                >
                  <VisualComponent active={isVisible} />
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* How It Works */}
      <section ref={processRef} className="bg-slate-900 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span
              className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80"
              style={{
                opacity: processVisible ? 1 : 0,
                transform: processVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease-out",
              }}
            >
              Como funciona
            </span>
            <h2
              className="mt-6 font-display text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl"
              style={{
                opacity: processVisible ? 1 : 0,
                transform: processVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease-out 0.1s",
              }}
            >
              De video a insights en minutos
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, i) => (
              <div
                key={step.step}
                className="relative"
                style={{
                  opacity: processVisible ? 1 : 0,
                  transform: processVisible ? "translateY(0)" : "translateY(30px)",
                  transition: `all 0.6s ease-out ${i * 0.1}s`,
                }}
              >
                {i < processSteps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-white/20 to-transparent lg:block" />
                )}
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white">
                    {step.icon}
                  </div>
                  <div className="mt-4 text-xs font-bold uppercase tracking-wider text-white/40">
                    Paso {step.step}
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/60">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl">
              Y mucho mas
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Cada herramienta disenada para maximizar el rendimiento de tu contenido.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature, i) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="border-t border-slate-200 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Optimizado para las plataformas que usas
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {[
              { name: "TikTok", icon: "📱" },
              { name: "Instagram Reels", icon: "📸" },
              { name: "YouTube Shorts", icon: "▶️" },
              { name: "LinkedIn", icon: "💼" },
              { name: "Meta Ads", icon: "📢" },
            ].map((platform) => (
              <div key={platform.name} className="flex items-center gap-2 text-slate-600">
                <span className="text-2xl">{platform.icon}</span>
                <span className="font-semibold">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
            Empieza a predecir el rendimiento de tus videos
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Subi tu primer video y obtene un analisis completo. Sin tarjeta de credito.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/app"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Analizar video gratis
            </Link>
            <Link
              href="/precios"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
