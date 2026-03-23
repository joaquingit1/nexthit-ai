"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PATH_POINTS = [
  { x: 10, y: 76 },
  { x: 24, y: 69 },
  { x: 38, y: 62 },
  { x: 53, y: 55 },
  { x: 68, y: 41 },
  { x: 84, y: 22 },
];

function getPointAtProgress(progress: number) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const segments = PATH_POINTS.length - 1;
  const scaled = clampedProgress * segments;
  const index = Math.min(Math.floor(scaled), segments - 1);
  const segmentProgress = scaled - index;
  const start = PATH_POINTS[index];
  const end = PATH_POINTS[index + 1];

  return {
    x: start.x + (end.x - start.x) * segmentProgress,
    y: start.y + (end.y - start.y) * segmentProgress,
  };
}

export default function LandingPage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const scrollRange = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const nextProgress = Math.min(window.scrollY / scrollRange, 1);
      setProgress(nextProgress);
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const arrowPoint = getPointAtProgress(progress);
  const graphShift = progress * -70;
  const glowShift = progress * -120;
  const contentShift = progress * -24;
  const hasReachedEnd = progress >= 0.99;

  return (
    <main className="relative h-[230vh] bg-white text-slate-950">
      <section className="landing-stage sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,247,250,0.98))]" />

        <div
          className="absolute inset-0 opacity-100"
          style={{ transform: `translateY(${graphShift}px)` }}
        >
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="gridFade" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(15,23,42,0.05)" />
                <stop offset="100%" stopColor="rgba(15,23,42,0.12)" />
              </linearGradient>
              <linearGradient id="arrowStroke" x1="0%" x2="100%" y1="100%" y2="0%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {[15, 28, 41, 54, 67, 80, 93].map((y) => (
              <line
                key={`h-${y}`}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="url(#gridFade)"
                strokeWidth="0.18"
              />
            ))}
            {[9, 21, 33, 45, 57, 69, 81, 93].map((x) => (
              <line
                key={`v-${x}`}
                x1={x}
                y1="0"
                x2={x}
                y2="100"
                stroke="url(#gridFade)"
                strokeWidth="0.18"
              />
            ))}

            <g style={{ transform: `translateY(${glowShift * 0.12}px)` }}>
              <polyline
                points="10,76 24,69 38,62 53,55 68,41 84,22"
                fill="none"
                pathLength="100"
                stroke="rgba(15, 23, 42, 0.14)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="10,76 24,69 38,62 53,55 68,41 84,22"
                fill="none"
                pathLength="100"
                stroke="url(#arrowStroke)"
                strokeDasharray={`${Math.max(progress * 100, 4)} 100`}
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#softGlow)"
              />
            </g>

            <g transform={`translate(${arrowPoint.x} ${arrowPoint.y})`}>
              <circle r="1.9" fill="rgba(52, 211, 153, 0.18)" />
              <circle r="0.75" fill="#16a34a" />
              <path
                d="M-1.6 1.9 L0.2 -2.2 L3.5 -0.2"
                fill="none"
                stroke="#15803d"
                strokeWidth="0.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent,rgba(255,255,255,0.16)_42%,rgba(255,255,255,0.72)_100%)]" />

        <div
          className="relative z-10 flex h-full items-center justify-center px-6 text-center"
          style={{ transform: `translateY(${contentShift}px)` }}
        >
          <div className="max-w-4xl space-y-6">
            <span className="inline-flex rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 shadow-[0_10px_30px_rgba(22,163,74,0.08)] backdrop-blur">
              Crecimiento inteligente
            </span>

            <h1 className="font-display text-5xl font-semibold tracking-[-0.04em] text-slate-950 md:text-7xl">
              Lleva tu empresa al siguiente nivel
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600 md:text-2xl md:leading-10">
              Prueba de pagina para la hackathon
            </p>

            <div
              className={`pt-4 transition-all duration-500 ${
                hasReachedEnd
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-4 opacity-0"
              }`}
            >
              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-9 py-4 text-lg font-semibold text-white shadow-[0_18px_45px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[#1d4ed8]"
              >
                Continuar
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center text-sm text-slate-500">
          <p>{hasReachedEnd ? "Listo para continuar" : "Desliza para impulsar la grafica"}</p>
        </div>
      </section>
    </main>
  );
}
