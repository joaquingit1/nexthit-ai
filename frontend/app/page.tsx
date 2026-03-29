"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

const HERO_PATH_POINTS = [
  { x: 8, y: 78 },
  { x: 20, y: 72 },
  { x: 34, y: 66 },
  { x: 47, y: 58 },
  { x: 60, y: 46 },
  { x: 74, y: 31 },
  { x: 88, y: 18 },
];

const FINAL_PATTERNS = [
  "dinámicas de atención",
  "contenido short-form de alto rendimiento",
  "estructura narrativa",
  "generación de estrategia de crecimiento",
];

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

const HERO_SCROLL_CAPTURE_THRESHOLD = 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPointAtProgress(progress: number) {
  const clampedProgress = clamp(progress, 0, 1);
  const segments = HERO_PATH_POINTS.length - 1;
  const scaled = clampedProgress * segments;
  const index = Math.min(Math.floor(scaled), segments - 1);
  const segmentProgress = scaled - index;
  const start = HERO_PATH_POINTS[index]!;
  const end = HERO_PATH_POINTS[index + 1]!;

  return {
    x: start.x + (end.x - start.x) * segmentProgress,
    y: start.y + (end.y - start.y) * segmentProgress,
  };
}

function useSectionInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(Boolean(entry?.isIntersecting));
      },
      {
        threshold,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isInView] as const;
}

function useHeroProgress(ref: React.RefObject<HTMLElement>, scrollRootRef: React.RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const node = ref.current;
      if (!node) {
        return;
      }
      const rect = node.getBoundingClientRect();
      const next = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
      setProgress(next);
    };

    const requestUpdate = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    update();
    const scrollRoot = scrollRootRef.current;
    const target = scrollRoot ?? window;
    target.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      target.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [ref, scrollRootRef]);

  return progress;
}

function LandingUploadDemoAnimation() {
  return (
    <div className="upload-demo-shell mx-auto w-full max-w-[360px]" aria-hidden="true">
      <div className="upload-demo-stage">
        <div className="upload-demo-glow upload-demo-glow-one" />
        <div className="upload-demo-glow upload-demo-glow-two" />

        <div className="upload-demo-file">
          <span className="upload-demo-file-pill">MP4</span>
          <span className="upload-demo-file-name">creative-hook-v2.mp4</span>
        </div>

        <div className="upload-demo-cursor">
          <span className="upload-demo-cursor-core" />
        </div>

        <div className="upload-demo-dropzone">
          <div className="upload-demo-dropzone-inner">
            <div className="upload-demo-dots">
              <span />
              <span />
              <span />
            </div>
            <p className="upload-demo-dropzone-title">Soltá el video</p>
            <p className="upload-demo-dropzone-copy">Subilo para simular la retención</p>
          </div>
        </div>

        <div className="upload-demo-loader">
          <div className="upload-demo-loader-ring" />
          <p className="upload-demo-loader-text">Analizando...</p>
        </div>

        <div className="upload-demo-graph">
          <div className="upload-demo-graph-top">
            <span className="upload-demo-graph-label">Retención prevista</span>
            <span className="upload-demo-graph-time">00:18</span>
          </div>
          <svg viewBox="0 0 240 120" className="upload-demo-graph-svg">
            <defs>
              <linearGradient id="landingUploadGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#2f6fda" />
                <stop offset="100%" stopColor="#5fb9ff" />
              </linearGradient>
            </defs>
            <path
              d="M18 18 H220 M18 52 H220 M18 86 H220"
              fill="none"
              stroke="rgba(148,163,184,0.22)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <path
              className="upload-demo-graph-line"
              d="M18 22 C40 24, 56 40, 74 46 S112 66, 132 70 S168 78, 188 88 S210 96, 220 102"
              fill="none"
              stroke="url(#landingUploadGradient)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle className="upload-demo-graph-dot" cx="74" cy="46" r="4.5" fill="#2f6fda" />
            <circle className="upload-demo-graph-dot" cx="132" cy="70" r="4.5" fill="#5fb9ff" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function LandingSection({
  id,
  sectionRef,
  className,
  children,
}: {
  id: string;
  sectionRef?: React.RefObject<HTMLElement>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      ref={sectionRef}
      id={id}
      className={`landing-snap-panel relative flex min-h-screen snap-start items-center ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

function AnimatedMetricNumber({
  value,
  active,
}: {
  value: number;
  active: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setDisplayValue(0);
      return;
    }

    let frame = 0;
    const duration = 1500;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = clamp((now - startedAt) / duration, 0, 1);
      const eased = elapsed * elapsed;
      setDisplayValue(Math.round(value * eased));
      if (elapsed < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, value]);

  return <>{displayValue}</>;
}

function AnimatedCurrencyCountdown({
  startValue,
  endValue,
  active,
}: {
  startValue: number;
  endValue: number;
  active: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(startValue);
  const [color, setColor] = useState("hsl(0 80% 56%)");

  useEffect(() => {
    if (!active) {
      setDisplayValue(startValue);
      setColor("hsl(0 80% 56%)");
      return;
    }

    let frame = 0;
    const duration = 1400;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const nextValue = Math.round(startValue + (endValue - startValue) * eased);
      const hue = 120 * eased;
      setDisplayValue(nextValue);
      setColor(`hsl(${hue} 74% 46%)`);

      if (elapsed < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, endValue, startValue]);

  return (
    <span className="landing-hero-metric-value" style={{ color }}>
      {`$${displayValue.toLocaleString("en-US")}`}
    </span>
  );
}

function ProcessCard({
  title,
  copy,
  active,
  delay,
  children,
}: {
  title: string;
  copy: string;
  active: boolean;
  delay: number;
  children: ReactNode;
}) {
  return (
    <article
      className={`landing-process-card ${active ? "is-visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="landing-process-card-visual">{children}</div>
      <h3 className="landing-process-card-title">{title}</h3>
      <p className="landing-process-card-copy">{copy}</p>
    </article>
  );
}

function LandingBlueGraph({
  lineProgress,
  exitProgress,
}: {
  lineProgress: number;
  exitProgress: number;
}) {
  const point = getPointAtProgress(lineProgress);
  const lineReveal = `${Math.max(lineProgress * 100, 8)} 100`;
  const yShift = exitProgress * -68;
  const opacity = Math.max(0, 1 - exitProgress * 1.35);

  return (
    <div
      className="landing-hero-graph"
      style={{
        opacity,
        transform: `translateY(${yShift}px) scale(${1 + lineProgress * 0.04})`,
      }}
      aria-hidden="true"
    >
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="landingBlueLine" x1="0%" x2="100%" y1="100%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="52%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
          <linearGradient id="landingBlueGrid" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.04)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.16)" />
          </linearGradient>
          <filter id="landingBlueGlow">
            <feGaussianBlur stdDeviation="1.4" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[14, 26, 38, 50, 62, 74, 86, 98].map((y) => (
          <line
            key={`hero-h-${y}`}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="url(#landingBlueGrid)"
            strokeWidth="0.18"
          />
        ))}
        {[10, 22, 34, 46, 58, 70, 82, 94].map((x) => (
          <line
            key={`hero-v-${x}`}
            x1={x}
            y1="0"
            x2={x}
            y2="100"
            stroke="url(#landingBlueGrid)"
            strokeWidth="0.18"
          />
        ))}

        <polyline
          points="8,78 20,72 34,66 47,58 60,46 74,31 88,18"
          fill="none"
          stroke="rgba(15, 23, 42, 0.12)"
          strokeWidth="0.95"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="8,78 20,72 34,66 47,58 60,46 74,31 88,18"
          fill="none"
          pathLength="100"
          stroke="url(#landingBlueLine)"
          strokeDasharray={lineReveal}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#landingBlueGlow)"
        />

        {[20, 34, 47, 60, 74, 88].map((x, index) => (
          <circle
            key={`hero-dot-${x}`}
            cx={x}
            cy={HERO_PATH_POINTS[index + 1]?.y ?? 20}
            r={index % 2 === 0 ? "0.58" : "0.72"}
            fill={index % 2 === 0 ? "#60a5fa" : "#0ea5e9"}
            opacity={0.26 + lineProgress * 0.74}
          />
        ))}

        <g transform={`translate(${point.x} ${point.y})`}>
          <circle r="2.2" fill="rgba(59,130,246,0.18)" />
          <circle r="0.86" fill="#1d4ed8" />
          <path
            d="M-1.8 1.9 L0.1 -2.4 L3.8 -0.2"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}

function ProcessVideoVisual() {
  return (
    <div className="landing-process-media" aria-hidden="true">
      <div className="landing-process-source">
        <div className="landing-process-source-screen">
          <span className="landing-process-play" />
        </div>
        <div className="landing-process-source-label">video original</div>
      </div>

      <div className="landing-process-split-line">
        <span />
        <span />
      </div>

      <div className="landing-process-output landing-process-output-video">
        <div className="landing-process-mini-video">
          <span className="landing-process-mini-play" />
        </div>
        <span className="landing-process-output-label">visual</span>
      </div>

      <div className="landing-process-output landing-process-output-audio">
        <div className="landing-process-audio-note">♪</div>
        <span className="landing-process-output-label">audio</span>
      </div>
    </div>
  );
}

function ProcessAudienceVisual() {
  return (
    <div className="landing-process-audience" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className="landing-process-audience-dot"
          style={{ animationDelay: `${index * 180}ms` }}
        />
      ))}
    </div>
  );
}

function ProcessGraphVisual() {
  return (
    <div className="landing-process-performance" aria-hidden="true">
      <div className="landing-process-guides">
        {Array.from({ length: 7 }, (_, index) => (
          <span
            key={index}
            className="landing-process-guide"
            style={{ animationDelay: `${index * 160}ms` }}
          />
        ))}
      </div>
      <svg viewBox="0 0 220 120" className="landing-process-chart">
        <path
          d="M18 24 H202 M18 58 H202 M18 92 H202"
          fill="none"
          stroke="rgba(148,163,184,0.22)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
        <path
          className="landing-process-chart-secondary"
          d="M20 28 C40 30, 54 42, 72 48 S108 62, 130 70 S168 80, 200 95"
          fill="none"
          stroke="rgba(96,165,250,0.28)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="landing-process-chart-line"
          d="M20 18 C42 20, 60 34, 78 40 S112 56, 130 60 S166 72, 200 92"
          fill="none"
          stroke="url(#processChartGradient)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="processChartGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function LandingFooterAscii() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [frame, setFrame] = useState("");

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const palette = [" ", ".", "·", ":", "+", "*", "#", "o", "@"];
    let frameId = 0;
    let intervalId = 0;

    const buildFrame = (time: number) => {
      const rect = node.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (!width || !height) {
        return;
      }

      const cols = Math.max(42, Math.floor(width / 10));
      const rows = Math.max(18, Math.floor(height / 16));
      const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => " "));

      const points = [
        [0.08, 0.82],
        [0.16, 0.76],
        [0.22, 0.68],
        [0.31, 0.56],
        [0.4, 0.44],
        [0.5, 0.34],
        [0.62, 0.26],
        [0.74, 0.24],
        [0.84, 0.31],
        [0.91, 0.45],
        [0.88, 0.63],
        [0.77, 0.73],
        [0.64, 0.76],
        [0.52, 0.7],
        [0.4, 0.62],
        [0.28, 0.72],
      ].map(([x, y], index) => {
        const drift = Math.sin(time / 900 + index * 0.8) * 0.015;
        const lift = Math.cos(time / 1100 + index * 0.65) * 0.02;
        return {
          x: (x + drift) * cols,
          y: (y + lift) * rows,
        };
      });

      const segments = points.map((point, index) => [point, points[(index + 1) % points.length]] as const);
      for (let index = 0; index < points.length - 4; index += 2) {
        segments.push([points[index], points[index + 4]] as const);
      }

      const reveal = ((Math.sin(time / 1200) + 1) / 2) * cols;

      const distanceToSegment = (
        px: number,
        py: number,
        ax: number,
        ay: number,
        bx: number,
        by: number,
      ) => {
        const abx = bx - ax;
        const aby = by - ay;
        const apx = px - ax;
        const apy = py - ay;
        const ab2 = abx * abx + aby * aby || 1;
        const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
        const cx = ax + abx * t;
        const cy = ay + aby * t;
        return Math.hypot(px - cx, py - cy);
      };

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const x = col + 0.5;
          const y = row + 0.5;

          let nodeScore = 0;
          for (const point of points) {
            const dist = Math.hypot(point.x - x, point.y - y);
            nodeScore = Math.max(nodeScore, 1 - dist / 3.6);
          }

          let edgeScore = 0;
          for (const [start, end] of segments) {
            const dist = distanceToSegment(x, y, start.x, start.y, end.x, end.y);
            edgeScore = Math.max(edgeScore, 1 - dist / 1.25);
          }

          const wave = Math.sin(time / 280 + col * 0.32 + row * 0.18) * 0.08 + 0.08;
          const revealFactor = col < reveal ? 1 : Math.max(0, 1 - (col - reveal) / 8);
          const intensity = Math.max(nodeScore * 1.18, edgeScore * 0.86, wave * 0.22) * revealFactor;

          if (intensity < 0.08) {
            continue;
          }

          const paletteIndex = Math.min(
            palette.length - 1,
            Math.max(0, Math.floor(intensity * (palette.length + 1))),
          );
          grid[row]![col] = palette[paletteIndex]!;
        }
      }

      setFrame(grid.map((line) => line.join("")).join("\n"));
    };

    const render = () => {
      frameId = window.requestAnimationFrame((time) => buildFrame(time));
    };

    render();
    intervalId = window.setInterval(render, 120);

    const observer = new ResizeObserver(render);
    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(intervalId);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="landing-footer-ascii" aria-hidden="true">
      <pre className="landing-footer-ascii-frame">{frame}</pre>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const shellRef = useRef<HTMLElement | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const navigateTimeoutRef = useRef<number | null>(null);
  const navigatingRef = useRef(false);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const processSectionSnapRef = useRef<HTMLElement | null>(null);
  const benefitsSectionSnapRef = useRef<HTMLElement | null>(null);
  const finalSectionSnapRef = useRef<HTMLElement | null>(null);
  const [heroGraphProgress, setHeroGraphProgress] = useState(0);
  const heroGraphProgressRef = useRef(0);
  const heroExitProgress = useHeroProgress(heroSectionRef, shellRef);
  const [processRef, processVisible] = useSectionInView<HTMLElement>(0.35);
  const [benefitsRef, benefitsVisible] = useSectionInView<HTMLElement>(0.32);
  const [finalRef, finalVisible] = useSectionInView<HTMLElement>(0.45);
  const [footerRef, footerVisible] = useSectionInView<HTMLElement>(0.12);
  const [freeScrollFromFinal, setFreeScrollFromFinal] = useState(false);

  useEffect(() => {
    heroGraphProgressRef.current = heroGraphProgress;
  }, [heroGraphProgress]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (window.innerWidth < 768) {
        return;
      }

      if (Math.abs(event.deltaY) < 10) {
        return;
      }

      const sections = [
        heroSectionRef.current,
        processSectionSnapRef.current,
        benefitsSectionSnapRef.current,
        finalSectionSnapRef.current,
      ].filter((section): section is HTMLElement => Boolean(section));

      if (!sections.length) {
        return;
      }

      const currentScroll = shell.scrollTop;
      const currentIndex = sections.reduce((bestIndex, section, index) => {
        const distance = Math.abs(section.offsetTop - currentScroll);
        const bestDistance = Math.abs(sections[bestIndex]!.offsetTop - currentScroll);
        return distance < bestDistance ? index : bestIndex;
      }, 0);

      const heroIsPinned = currentIndex === 0 && currentScroll <= HERO_SCROLL_CAPTURE_THRESHOLD;
      const currentGraphProgress = heroGraphProgressRef.current;
      const graphIsLocked = currentGraphProgress < 0.995;
      if (
        heroIsPinned &&
        ((event.deltaY > 0 && graphIsLocked) ||
          (event.deltaY < 0 && currentGraphProgress > 0.001))
      ) {
        event.preventDefault();
        if (currentScroll > 0) {
          shell.scrollTop = 0;
        }
        setHeroGraphProgress((current) => {
          const next = clamp(current + event.deltaY / 900, 0, 1);
          return next >= 0.995 ? 1 : next;
        });
        return;
      }
    };

    shell.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      shell.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const finalSection = finalSectionSnapRef.current;
      if (!finalSection) {
        return;
      }

      const threshold = Math.max(finalSection.offsetTop - 80, 0);
      setFreeScrollFromFinal(shell.scrollTop >= threshold);
    };

    const requestUpdate = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    update();
    shell.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      shell.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  useEffect(() => {
    router.prefetch("/app");
  }, [router]);

  useEffect(() => {
    const audio = new Audio("/sounds/click.mp3");
    audio.preload = "auto";
    clickAudioRef.current = audio;

    return () => {
      if (navigateTimeoutRef.current !== null) {
        window.clearTimeout(navigateTimeoutRef.current);
      }
      if (clickAudioRef.current) {
        clickAudioRef.current.pause();
        clickAudioRef.current = null;
      }
    };
  }, []);

  const playLandingClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (navigatingRef.current) {
      return;
    }

    navigatingRef.current = true;
    const audio = clickAudioRef.current;

    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
        void audio.play();
      } catch {
        // Ignore audio playback issues.
      }
    }

    navigateTimeoutRef.current = window.setTimeout(() => {
      router.push("/app");
    }, 110);
  };

  const scrollToLandingSection = (event: ReactMouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    const shell = shellRef.current;
    const target = shell?.querySelector<HTMLElement>(sectionId);
    if (!shell || !target) {
      return;
    }

    shell.scrollTo({
      top: target.offsetTop,
      behavior: "smooth",
    });
  };

  const heroScrollLocked = heroGraphProgress < 0.995;

  return (
    <main
      ref={shellRef}
      className={`landing-snap-shell bg-white text-slate-950 ${heroScrollLocked ? "landing-snap-shell--hero-locked" : ""} ${freeScrollFromFinal ? "landing-snap-shell--footer-free" : ""}`}
    >
      <nav className="landing-nav pointer-events-none fixed left-1/2 top-4 z-50 flex w-[calc(100%-1.5rem)] max-w-6xl -translate-x-1/2 items-center justify-between rounded-[1.4rem] border border-slate-200/70 bg-white/78 px-4 py-3 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-6">
        <Link href="/" className="pointer-events-auto flex items-center gap-2">
          <img src="/logo.svg" alt="NextHit" className="h-8 w-auto" />
          <span className="text-lg font-bold text-slate-900">NextHit</span>
        </Link>

        <div className="pointer-events-auto hidden flex-1 items-center gap-6 pl-8 md:flex">
          <Link href="/funcionalidades" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Funcionalidades
          </Link>
          <Link href="/casos-de-uso" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Casos de uso
          </Link>
          <Link href="/precios" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Precios
          </Link>
        </div>

        <Link
          href="/app"
          onClick={playLandingClick}
          className="pointer-events-auto rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Analizar video
        </Link>
      </nav>

      <LandingSection id="landing-hero" sectionRef={heroSectionRef} className="landing-hero-panel" >
        <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 pb-16 pt-32">
          <div className="landing-hero-surface absolute inset-0" aria-hidden="true" />
          <LandingBlueGraph lineProgress={heroGraphProgress} exitProgress={heroExitProgress} />
          <div className="landing-hero-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="landing-hero-content relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
            <span className="landing-hero-pill">
              inteligencia creativa predictiva
            </span>
            <h1 className="landing-hero-title">
              Predecí el rendimiento de tu video antes de publicar
            </h1>
            <p className="landing-hero-copy">
              Simulamos 100 espectadores para analizar retención, detectar puntos de abandono y optimizar tu contenido.
            </p>

            <div className="landing-hero-metrics">
              <div className="landing-hero-metric">
                <strong><AnimatedMetricNumber value={100} active /></strong>
                <span>personas sintéticas</span>
              </div>
              <div className="landing-hero-metric">
                <strong><AnimatedMetricNumber value={1} active /></strong>
                <span>curva predictiva de retención</span>
              </div>
              <div className="landing-hero-metric">
                <strong><AnimatedCurrencyCountdown startValue={4000} endValue={0} active /></strong>
                <span>dólares desperdiciados antes de testear</span>
              </div>
            </div>

            <div className="landing-hero-actions">
              <Link
                href="/app"
                onClick={playLandingClick}
                className="landing-primary-cta"
              >
                Analizar video
              </Link>
            </div>
          </div>

          <div className="landing-scroll-hint">
            <span className="landing-scroll-mouse">
              <span />
            </span>
            <p>Deslizá para recorrer la historia</p>
          </div>
        </section>
      </LandingSection>

      <LandingSection id="landing-process" sectionRef={processSectionSnapRef} className="landing-process-panel">
        <section ref={processRef} className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-24">
          <div className="landing-section-heading">
            <span className="landing-section-kicker">cómo funciona</span>
            <h2 className="landing-section-title">
              Predicción de viralidad con creación de personas sintéticas
            </h2>
            <p className="landing-section-copy">
              No solo analizamos lo que se dice. Leemos cómo se ve, cómo escala y qué tipo de audiencia realmente conecta con ese formato.
            </p>
          </div>

          <div className="landing-process-grid">
            <ProcessCard
              title="Desarmamos tu video"
              copy="Analizamos voz, visuales, ritmo y texto en pantalla segundo por segundo."
              active={processVisible}
              delay={0}
            >
              <ProcessVideoVisual />
            </ProcessCard>

            <ProcessCard
              title="Simulamos una audiencia real"
              copy="100 personas sintéticas con comportamientos e intereses distintos miran tu video."
              active={processVisible}
              delay={120}
            >
              <ProcessAudienceVisual />
            </ProcessCard>

            <ProcessCard
              title="Predecimos performance y crecimiento"
              copy="Vas a ver dónde abandonan, quiénes se quedan y cómo mejorar para escalar."
              active={processVisible}
              delay={240}
            >
              <ProcessGraphVisual />
            </ProcessCard>
          </div>
        </section>
      </LandingSection>

      <LandingSection id="landing-benefits" sectionRef={benefitsSectionSnapRef} className="landing-benefits-panel">
        <section ref={benefitsRef} className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-24">
          <div className={`landing-benefits-shell ${benefitsVisible ? "is-visible" : ""}`}>
            <div className="landing-benefits-copy">
              <span className="landing-section-kicker">resultado</span>
              <h2 className="landing-section-title">Qué vas a obtener</h2>
              <ul className="landing-benefits-list">
                <li>Curva de retención predicha</li>
                <li>Tiempos exactos de abandono con sus motivos</li>
                <li>Segmentos de audiencia que más conectan</li>
                <li>Ajustes creativos accionables</li>
                <li>Estrategia de crecimiento paga adaptada a tu video</li>
              </ul>
            </div>

            <div className="landing-benefits-visual">
              <LandingUploadDemoAnimation />
            </div>
          </div>
        </section>
      </LandingSection>

      <LandingSection id="landing-final" sectionRef={finalSectionSnapRef} className="landing-final-panel">
        <section ref={finalRef} className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-24">
          <div className={`landing-final-shell ${finalVisible ? "is-visible" : ""}`}>
            <div className="landing-final-video" aria-hidden="true">
              <video
                className="landing-final-video-media"
                src="https://maxewvuutnlqdnrrwdol.supabase.co/storage/v1/object/public/Videos/VideoFondo.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              />
              <div className="landing-final-video-overlay" />
            </div>
            <span className="landing-section-kicker">por qué importa</span>
            <h2 className="landing-final-title">
              Saber qué tan bien le va a ir a tu contenido, antes de gastar un centavo.
            </h2>
            <p className="landing-final-copy">
              <span className="landing-final-copy-emphasis">Construido sobre patrones de:</span>
            </p>

            <div className="landing-pattern-slot" aria-hidden="true">
              <div className="landing-pattern-track">
                {[...FINAL_PATTERNS, ...FINAL_PATTERNS].map((pattern, index) => (
                  <div key={`${pattern}-${index}`} className="landing-pattern-item">
                    {pattern}
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/app"
              onClick={playLandingClick}
              className="landing-primary-cta"
            >
              Analizar video
            </Link>
          </div>
        </section>
      </LandingSection>

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

          <LandingFooterAscii />
        </div>
      </footer>
    </main>
  );
}
