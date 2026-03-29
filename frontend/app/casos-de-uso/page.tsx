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
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isInView] as const;
}

// Visual Components for each use case
function CreatorVisual({ active }: { active: boolean }) {
  const platforms = [
    { name: "TikTok", color: "#000", icon: "♪", x: 20, y: 25 },
    { name: "Reels", color: "#E1306C", icon: "◉", x: 50, y: 15 },
    { name: "Shorts", color: "#FF0000", icon: "▶", x: 80, y: 25 },
  ];

  const metrics = [
    { label: "Views", value: "2.4M", change: "+340%" },
    { label: "Watch Time", value: "45s", change: "+85%" },
    { label: "Engagement", value: "12%", change: "+120%" },
  ];

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400">
      <div className="absolute inset-0 bg-black/10" />

      {/* Floating platform icons */}
      {platforms.map((platform, i) => (
        <div
          key={platform.name}
          className="absolute flex flex-col items-center"
          style={{
            left: `${platform.x}%`,
            top: `${platform.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm transition-all duration-700"
            style={{
              opacity: active ? 1 : 0,
              transform: active ? "scale(1) translateY(0)" : "scale(0.5) translateY(20px)",
              transitionDelay: `${i * 150}ms`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            {platform.icon}
          </div>
          <span
            className="mt-2 text-xs font-semibold text-white/90 transition-all duration-500"
            style={{
              opacity: active ? 1 : 0,
              transitionDelay: `${200 + i * 150}ms`,
            }}
          >
            {platform.name}
          </span>
        </div>
      ))}

      {/* Metrics cards */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
        {metrics.map((metric, i) => (
          <div
            key={metric.label}
            className="rounded-xl bg-white/20 px-4 py-2 text-center backdrop-blur-sm transition-all duration-500"
            style={{
              opacity: active ? 1 : 0,
              transform: active ? "translateY(0)" : "translateY(20px)",
              transitionDelay: `${400 + i * 100}ms`,
            }}
          >
            <p className="text-lg font-bold text-white">{metric.value}</p>
            <p className="text-[10px] text-white/70">{metric.label}</p>
            <p className="text-xs font-semibold text-emerald-300">{metric.change}</p>
          </div>
        ))}
      </div>

      {/* Animated ring */}
      <div
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20"
        style={{
          transform: active ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0)",
          opacity: active ? 0.5 : 0,
          transition: "all 1s ease-out 0.3s",
        }}
      />
    </div>
  );
}

function AgencyVisual({ active }: { active: boolean }) {
  const reportSections = [
    { label: "Retencion", value: 78, color: "#3b82f6" },
    { label: "Engagement", value: 65, color: "#8b5cf6" },
    { label: "Conversion", value: 45, color: "#10b981" },
  ];

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600">
      <div className="absolute inset-0 bg-black/10" />

      {/* PDF Report mockup */}
      <div
        className="absolute left-1/2 top-1/2 w-48 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-4 shadow-2xl transition-all duration-700"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translate(-50%, -50%) rotate(-2deg)" : "translate(-50%, -50%) rotate(-10deg) scale(0.8)",
        }}
      >
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-violet-500" />
          <div>
            <div className="h-2 w-16 rounded bg-slate-200" />
            <div className="mt-1 h-1.5 w-10 rounded bg-slate-100" />
          </div>
        </div>

        {/* Chart bars */}
        <div className="space-y-2">
          {reportSections.map((section, i) => (
            <div key={section.label}>
              <div className="flex justify-between text-[8px]">
                <span className="text-slate-500">{section.label}</span>
                <span className="font-semibold text-slate-700">{section.value}%</span>
              </div>
              <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: active ? `${section.value}%` : "0%",
                    backgroundColor: section.color,
                    transitionDelay: `${300 + i * 200}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mini chart */}
        <div className="mt-3 h-12 w-full rounded bg-slate-50 p-2">
          <svg viewBox="0 0 100 30" className="h-full w-full">
            <path
              d="M0,25 Q20,20 35,15 T60,18 T85,8 T100,12"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                strokeDasharray: 150,
                strokeDashoffset: active ? 0 : 150,
                transition: "stroke-dashoffset 1.5s ease-out 0.5s",
              }}
            />
          </svg>
        </div>
      </div>

      {/* Floating badges */}
      <div
        className="absolute right-6 top-6 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-emerald-900 shadow-lg transition-all duration-500"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translateY(0) rotate(3deg)" : "translateY(-20px)",
          transitionDelay: "0.8s",
        }}
      >
        Cliente aprobó ✓
      </div>

      <div
        className="absolute bottom-6 left-6 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition-all duration-500"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translateY(0)" : "translateY(20px)",
          transitionDelay: "1s",
        }}
      >
        PDF • CSV • Link
      </div>
    </div>
  );
}

function EcommerceVisual({ active }: { active: boolean }) {
  const products = [
    { emoji: "👟", sold: 234 },
    { emoji: "👜", sold: 189 },
    { emoji: "⌚", sold: 156 },
  ];

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500">
      <div className="absolute inset-0 bg-black/10" />

      {/* Product cards floating */}
      <div className="absolute inset-0 flex items-center justify-center">
        {products.map((product, i) => (
          <div
            key={i}
            className="absolute rounded-2xl bg-white p-3 shadow-xl transition-all duration-700"
            style={{
              left: `${25 + i * 25}%`,
              top: `${30 + (i % 2) * 20}%`,
              transform: `translate(-50%, -50%) rotate(${-5 + i * 5}deg)`,
              opacity: active ? 1 : 0,
              transitionDelay: `${i * 150}ms`,
            }}
          >
            <div className="text-3xl">{product.emoji}</div>
            <div className="mt-1 text-center">
              <p className="text-xs font-bold text-slate-700">{product.sold}</p>
              <p className="text-[8px] text-slate-400">ventas</p>
            </div>
          </div>
        ))}
      </div>

      {/* CPA reduction indicator */}
      <div
        className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-white/20 px-5 py-3 backdrop-blur-sm transition-all duration-700"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translate(-50%, 0)" : "translate(-50%, 30px)",
          transitionDelay: "0.5s",
        }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-white">-25%</p>
          <p className="text-[10px] text-white/70">CPA</p>
        </div>
        <div className="h-8 w-px bg-white/30" />
        <div className="text-center">
          <p className="text-2xl font-bold text-white">+40%</p>
          <p className="text-[10px] text-white/70">ROAS</p>
        </div>
        <div className="h-8 w-px bg-white/30" />
        <div className="text-center">
          <p className="text-2xl font-bold text-white">3.2x</p>
          <p className="text-[10px] text-white/70">ROI</p>
        </div>
      </div>

      {/* Animated shopping cart */}
      <div
        className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-lg transition-all duration-500"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "scale(1)" : "scale(0)",
          transitionDelay: "0.7s",
        }}
      >
        🛒
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          3
        </span>
      </div>
    </div>
  );
}

function StartupVisual({ active }: { active: boolean }) {
  const features = ["Onboarding", "Demo", "Features", "Pricing"];

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600">
      <div className="absolute inset-0 bg-black/10" />

      {/* App window mockup */}
      <div
        className="absolute left-1/2 top-1/2 w-56 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-slate-900 shadow-2xl transition-all duration-700"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translate(-50%, -50%)" : "translate(-50%, -50%) scale(0.8)",
        }}
      >
        {/* Window header */}
        <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <div className="ml-2 h-2 flex-1 rounded bg-slate-700" />
        </div>

        {/* Progress steps */}
        <div className="p-3">
          <div className="mb-3 flex justify-between">
            {features.map((feature, i) => (
              <div
                key={feature}
                className="flex flex-col items-center transition-all duration-500"
                style={{
                  opacity: active ? 1 : 0.3,
                  transitionDelay: `${300 + i * 150}ms`,
                }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-500"
                  style={{
                    backgroundColor: active ? (i < 3 ? "#10b981" : "#3b82f6") : "#374151",
                    color: "white",
                    transitionDelay: `${400 + i * 150}ms`,
                  }}
                >
                  {i < 3 ? "✓" : i + 1}
                </div>
                <span className="mt-1 text-[7px] text-slate-400">{feature}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 transition-all duration-1500"
              style={{
                width: active ? "75%" : "0%",
                transitionDelay: "0.5s",
              }}
            />
          </div>

          {/* Completion rate */}
          <div className="mt-3 text-center">
            <p
              className="text-xl font-bold text-white transition-all duration-700"
              style={{
                opacity: active ? 1 : 0,
                transitionDelay: "0.8s",
              }}
            >
              +50% Completion
            </p>
            <p
              className="text-[10px] text-slate-400 transition-all duration-700"
              style={{
                opacity: active ? 1 : 0,
                transitionDelay: "0.9s",
              }}
            >
              vs. version anterior
            </p>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div
        className="absolute left-4 top-4 rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm transition-all duration-500"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translateX(0)" : "translateX(-20px)",
          transitionDelay: "1s",
        }}
      >
        -35% Churn
      </div>

      <div
        className="absolute bottom-4 right-4 rounded-lg bg-emerald-400/80 px-2 py-1 text-xs font-bold text-emerald-900 backdrop-blur-sm transition-all duration-500"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translateX(0)" : "translateX(20px)",
          transitionDelay: "1.1s",
        }}
      >
        Activacion +60%
      </div>
    </div>
  );
}

const useCases = [
  {
    id: "creators",
    title: "Creadores de Contenido",
    subtitle: "YouTube, TikTok, Instagram Reels",
    description: "Optimiza tus videos antes de publicar. Entiende que tipo de audiencia retiene mejor y ajusta tu contenido para maximizar watch time.",
    benefits: [
      "Predeci la retencion antes de publicar",
      "Identifica el mejor hook para tu audiencia",
      "Optimiza la duracion ideal del video",
    ],
    stat: { value: "40%", label: "mejora en retencion" },
    visual: CreatorVisual,
    gradient: "from-rose-500 to-orange-400",
  },
  {
    id: "agencies",
    title: "Agencias de Marketing",
    subtitle: "Performance, Branding, Social Media",
    description: "Valida creativos con clientes usando datos concretos. Presenta reportes profesionales con predicciones de rendimiento.",
    benefits: [
      "Reportes PDF para presentar a clientes",
      "Justifica decisiones creativas con datos",
      "Reduce tiempo de aprobacion",
    ],
    stat: { value: "3x", label: "mas rapido en aprobar" },
    visual: AgencyVisual,
    gradient: "from-blue-500 to-violet-500",
  },
  {
    id: "ecommerce",
    title: "E-commerce y DTC",
    subtitle: "Product videos, UGC, Ads",
    description: "Optimiza videos de producto y UGC para maximizar conversiones. Entiende que angulo de venta retiene mejor.",
    benefits: [
      "Testea angulos de venta antes de invertir",
      "Optimiza UGC para mejor performance",
      "Identifica el mejor momento para el CTA",
    ],
    stat: { value: "25%", label: "reduccion en CPA" },
    visual: EcommerceVisual,
    gradient: "from-emerald-500 to-cyan-500",
  },
  {
    id: "startups",
    title: "Startups y SaaS",
    subtitle: "Product demos, Explainers, Onboarding",
    description: "Crea videos de producto que retengan usuarios. Optimiza demos y onboarding para reducir churn.",
    benefits: [
      "Mejora retencion en onboarding",
      "Optimiza demos para mostrar valor rapido",
      "A/B test de narrativas sin gastar en ads",
    ],
    stat: { value: "50%", label: "mejora en completion" },
    visual: StartupVisual,
    gradient: "from-violet-500 to-fuchsia-500",
  },
];

export default function UseCasesPage() {
  const [heroRef, heroVisible] = useSectionInView<HTMLElement>(0.3);
  const caseRefs = useCases.map(() => useSectionInView<HTMLElement>(0.25));

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
      <section ref={heroRef} className="relative overflow-hidden px-6 pb-20 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/50 via-white to-white" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div
            className="transition-all duration-700"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            }}
          >
            <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
              Casos de Uso
            </span>
          </div>

          <h1
            className="mt-8 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl lg:text-6xl transition-all duration-700 delay-100"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            }}
          >
            NextHit para{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              cada tipo de equipo
            </span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl transition-all duration-700 delay-200"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            }}
          >
            Desde creadores independientes hasta agencias enterprise, NextHit se adapta a tu flujo de trabajo.
          </p>

          {/* Use case pills */}
          <div
            className="mt-10 flex flex-wrap justify-center gap-3 transition-all duration-700 delay-300"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            }}
          >
            {useCases.map((uc, i) => (
              <a
                key={uc.id}
                href={`#${uc.id}`}
                className={`rounded-full bg-gradient-to-r ${uc.gradient} px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105`}
                style={{
                  opacity: heroVisible ? 1 : 0,
                  transitionDelay: `${400 + i * 100}ms`,
                }}
              >
                {uc.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl space-y-32">
          {useCases.map((useCase, index) => {
            const [ref, isVisible] = caseRefs[index];
            const isEven = index % 2 === 0;
            const VisualComponent = useCase.visual;

            return (
              <article
                key={useCase.id}
                id={useCase.id}
                ref={ref}
                className="scroll-mt-24"
              >
                <div className={`grid gap-12 lg:grid-cols-2 lg:items-center ${!isEven ? "lg:grid-flow-dense" : ""}`}>
                  {/* Content */}
                  <div className={!isEven ? "lg:col-start-2" : ""}>
                    <span
                      className={`inline-flex rounded-full bg-gradient-to-r ${useCase.gradient} px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white`}
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out",
                      }}
                    >
                      {useCase.subtitle}
                    </span>

                    <h2
                      className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.1s",
                      }}
                    >
                      {useCase.title}
                    </h2>

                    <p
                      className="mt-4 text-lg text-slate-600"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.2s",
                      }}
                    >
                      {useCase.description}
                    </p>

                    <ul
                      className="mt-6 space-y-3"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.3s",
                      }}
                    >
                      {useCase.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r ${useCase.gradient}`}>
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span className="text-slate-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Stat */}
                    <div
                      className="mt-8 inline-flex items-center gap-4 rounded-2xl bg-slate-50 px-6 py-4"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.4s",
                      }}
                    >
                      <span className={`bg-gradient-to-r ${useCase.gradient} bg-clip-text text-4xl font-bold text-transparent`}>
                        {useCase.stat.value}
                      </span>
                      <span className="text-sm text-slate-600">{useCase.stat.label}</span>
                    </div>
                  </div>

                  {/* Visual */}
                  <div
                    className={!isEven ? "lg:col-start-1 lg:row-start-1" : ""}
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "scale(1) translateY(0)" : "scale(0.95) translateY(20px)",
                      transition: "all 0.8s ease-out 0.2s",
                    }}
                  >
                    <VisualComponent active={isVisible} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer is-visible">
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
                <Link href="/funcionalidades">Funcionalidades</Link>
                <Link href="/casos-de-uso">Casos de uso</Link>
                <Link href="/precios">Precios</Link>
              </div>

              <div className="landing-footer-column">
                <span className="landing-footer-heading">Recursos</span>
                <Link href="/">Landing</Link>
                <Link href="/app">Analizar video</Link>
              </div>
            </div>
          </div>

          <LandingFooterAscii />
        </div>
      </footer>
    </main>
  );
}
