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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

// Process Step Visuals - Like the landing page
function UploadVisual({ active }: { active: boolean }) {
  return (
    <div className="process-visual-shell">
      <div className={`process-upload ${active ? "is-active" : ""}`}>
        <div className="process-upload-file">
          <div className="process-upload-file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7l-5-5z" />
              <path d="M14 2v6h6M10 12l4 4m0-4l-4 4" />
            </svg>
          </div>
          <div className="process-upload-file-info">
            <span className="process-upload-file-name">video-hook.mp4</span>
            <span className="process-upload-file-size">12.4 MB</span>
          </div>
        </div>
        <div className="process-upload-progress">
          <div className="process-upload-progress-bar" />
        </div>
        <div className="process-upload-dropzone">
          <div className="process-upload-dropzone-ring" />
          <div className="process-upload-dropzone-ring" />
          <svg className="process-upload-dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
      </div>
      <style jsx>{`
        .process-visual-shell {
          width: 100%;
          height: 180px;
          position: relative;
          overflow: hidden;
        }
        .process-upload {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .process-upload-dropzone {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          transition: opacity 0.5s ease;
        }
        .process-upload.is-active .process-upload-dropzone {
          opacity: 0;
        }
        .process-upload-dropzone-ring {
          position: absolute;
          width: 100px;
          height: 100px;
          border: 2px dashed rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          animation: pulse-ring 2s ease-out infinite;
        }
        .process-upload-dropzone-ring:nth-child(2) {
          animation-delay: 1s;
        }
        .process-upload-dropzone-icon {
          width: 32px;
          height: 32px;
          color: #3b82f6;
          opacity: 0.6;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .process-upload-file {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease 0.3s;
        }
        .process-upload.is-active .process-upload-file {
          opacity: 1;
          transform: translateY(0);
        }
        .process-upload-file-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .process-upload-file-icon svg {
          width: 20px;
          height: 20px;
          color: white;
        }
        .process-upload-file-info {
          display: flex;
          flex-direction: column;
        }
        .process-upload-file-name {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }
        .process-upload-file-size {
          font-size: 11px;
          color: #64748b;
        }
        .process-upload-progress {
          width: 180px;
          height: 4px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 2px;
          overflow: hidden;
          opacity: 0;
          transition: opacity 0.3s ease 0.6s;
        }
        .process-upload.is-active .process-upload-progress {
          opacity: 1;
        }
        .process-upload-progress-bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          border-radius: 2px;
          animation: progress-fill 1.5s ease 0.8s forwards;
        }
        .process-upload.is-active .process-upload-progress-bar {
          animation: progress-fill 1.5s ease 0.8s forwards;
        }
        @keyframes progress-fill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}

function AnalyzeVisual({ active }: { active: boolean }) {
  return (
    <div className="process-visual-shell">
      <div className={`process-analyze ${active ? "is-active" : ""}`}>
        <div className="process-analyze-video">
          <div className="process-analyze-frame">
            <div className="process-analyze-scanline" />
          </div>
          <div className="process-analyze-waveform">
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} className="process-analyze-bar" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>
        <div className="process-analyze-tags">
          {["audio", "visual", "texto", "ritmo"].map((tag, i) => (
            <span key={tag} className="process-analyze-tag" style={{ animationDelay: `${0.5 + i * 0.15}s` }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <style jsx>{`
        .process-visual-shell {
          width: 100%;
          height: 180px;
          position: relative;
          overflow: hidden;
        }
        .process-analyze {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .process-analyze-video {
          width: 160px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .process-analyze-frame {
          width: 100%;
          height: 90px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }
        .process-analyze-scanline {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent);
          opacity: 0;
          top: 0;
        }
        .process-analyze.is-active .process-analyze-scanline {
          opacity: 1;
          animation: scanline 1.5s ease-in-out infinite;
        }
        @keyframes scanline {
          0% { top: 0; }
          50% { top: 100%; }
          50.1% { top: 0; }
          100% { top: 100%; }
        }
        .process-analyze-waveform {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          height: 24px;
        }
        .process-analyze-bar {
          width: 3px;
          height: 4px;
          background: linear-gradient(to top, #3b82f6, #8b5cf6);
          border-radius: 1px;
          opacity: 0.3;
        }
        .process-analyze.is-active .process-analyze-bar {
          animation: waveform 0.8s ease-in-out infinite alternate;
        }
        @keyframes waveform {
          0% { height: 4px; opacity: 0.3; }
          100% { height: 20px; opacity: 1; }
        }
        .process-analyze-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .process-analyze-tag {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          border-radius: 20px;
          opacity: 0;
          transform: scale(0.8);
        }
        .process-analyze.is-active .process-analyze-tag {
          animation: tag-pop 0.4s ease forwards;
        }
        @keyframes tag-pop {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function SimulateVisual({ active }: { active: boolean }) {
  return (
    <div className="process-visual-shell">
      <div className={`process-simulate ${active ? "is-active" : ""}`}>
        <div className="process-simulate-grid">
          {Array.from({ length: 100 }, (_, i) => {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const delay = (row + col) * 30;
            const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];
            const color = colors[Math.floor(Math.random() * colors.length)];
            return (
              <span
                key={i}
                className="process-simulate-dot"
                style={{
                  animationDelay: `${delay}ms`,
                  backgroundColor: color,
                }}
              />
            );
          })}
        </div>
        <div className="process-simulate-counter">
          <span className="process-simulate-number">100</span>
          <span className="process-simulate-label">personas</span>
        </div>
      </div>
      <style jsx>{`
        .process-visual-shell {
          width: 100%;
          height: 180px;
          position: relative;
          overflow: hidden;
        }
        .process-simulate {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .process-simulate-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 4px;
          padding: 8px;
        }
        .process-simulate-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          opacity: 0.2;
          transform: scale(0.5);
          transition: all 0.3s ease;
        }
        .process-simulate.is-active .process-simulate-dot {
          opacity: 0.9;
          transform: scale(1);
          animation: dot-pulse 2s ease infinite;
        }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.85); }
        }
        .process-simulate-counter {
          position: absolute;
          bottom: 12px;
          right: 12px;
          display: flex;
          align-items: baseline;
          gap: 4px;
          background: rgba(15, 23, 42, 0.8);
          padding: 6px 12px;
          border-radius: 20px;
          opacity: 0;
          transform: translateY(10px);
        }
        .process-simulate.is-active .process-simulate-counter {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.4s ease 0.8s;
        }
        .process-simulate-number {
          font-size: 18px;
          font-weight: 700;
          color: white;
        }
        .process-simulate-label {
          font-size: 11px;
          color: rgba(255,255,255,0.7);
        }
      `}</style>
    </div>
  );
}

function InsightsVisual({ active }: { active: boolean }) {
  return (
    <div className="process-visual-shell">
      <div className={`process-insights ${active ? "is-active" : ""}`}>
        <svg className="process-insights-chart" viewBox="0 0 200 100">
          <defs>
            <linearGradient id="chartGrad" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="chartFill" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            className="process-insights-area"
            d="M0,80 C20,75 40,60 60,55 S100,40 120,45 S160,55 180,50 L180,100 L0,100 Z"
            fill="url(#chartFill)"
          />
          <path
            className="process-insights-line"
            d="M0,80 C20,75 40,60 60,55 S100,40 120,45 S160,55 180,50"
            fill="none"
            stroke="url(#chartGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle className="process-insights-dot" cx="60" cy="55" r="4" fill="#3b82f6" />
          <circle className="process-insights-dot" cx="120" cy="45" r="4" fill="#8b5cf6" />
          <circle className="process-insights-dot" cx="180" cy="50" r="4" fill="#ec4899" />
        </svg>
        <div className="process-insights-badges">
          <span className="process-insights-badge process-insights-badge--good">+40% retencion</span>
          <span className="process-insights-badge process-insights-badge--action">3 acciones</span>
        </div>
      </div>
      <style jsx>{`
        .process-visual-shell {
          width: 100%;
          height: 180px;
          position: relative;
          overflow: hidden;
        }
        .process-insights {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .process-insights-chart {
          width: 100%;
          max-width: 200px;
          height: auto;
        }
        .process-insights-line {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
        }
        .process-insights.is-active .process-insights-line {
          animation: draw-line 1.5s ease forwards;
        }
        .process-insights-area {
          opacity: 0;
        }
        .process-insights.is-active .process-insights-area {
          animation: fade-in 0.5s ease 1s forwards;
        }
        .process-insights-dot {
          opacity: 0;
          transform-origin: center;
        }
        .process-insights.is-active .process-insights-dot:nth-child(4) {
          animation: dot-appear 0.3s ease 0.6s forwards;
        }
        .process-insights.is-active .process-insights-dot:nth-child(5) {
          animation: dot-appear 0.3s ease 0.9s forwards;
        }
        .process-insights.is-active .process-insights-dot:nth-child(6) {
          animation: dot-appear 0.3s ease 1.2s forwards;
        }
        @keyframes draw-line {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fade-in {
          to { opacity: 1; }
        }
        @keyframes dot-appear {
          0% { opacity: 0; transform: scale(0); }
          100% { opacity: 1; transform: scale(1); }
        }
        .process-insights-badges {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        .process-insights-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 20px;
          opacity: 0;
          transform: translateY(10px);
        }
        .process-insights.is-active .process-insights-badge {
          animation: badge-up 0.4s ease forwards;
        }
        .process-insights.is-active .process-insights-badge:nth-child(1) {
          animation-delay: 1.4s;
        }
        .process-insights.is-active .process-insights-badge:nth-child(2) {
          animation-delay: 1.6s;
        }
        @keyframes badge-up {
          to { opacity: 1; transform: translateY(0); }
        }
        .process-insights-badge--good {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        .process-insights-badge--action {
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
        }
      `}</style>
    </div>
  );
}

function ProcessCard({
  title,
  description,
  step,
  active,
  delay,
  children,
}: {
  title: string;
  description: string;
  step: string;
  active: boolean;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`process-card ${active ? "is-visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="process-card-visual">{children}</div>
      <div className="process-card-step">{step}</div>
      <h3 className="process-card-title">{title}</h3>
      <p className="process-card-description">{description}</p>
      <style jsx>{`
        .process-card {
          background: white;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .process-card.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .process-card-visual {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .process-card-step {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #3b82f6;
          margin-bottom: 8px;
        }
        .process-card-title {
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .process-card-description {
          font-size: 14px;
          line-height: 1.6;
          color: #64748b;
        }
      `}</style>
    </article>
  );
}

// Feature Section Visual Components
function RetentionCurveVisual({ active }: { active: boolean }) {
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

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Grid */}
      <div className="absolute inset-8 grid grid-cols-6 grid-rows-4">
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="border-b border-r border-white/5" />
        ))}
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-3 top-8 bottom-8 flex flex-col justify-between text-[10px] text-white/40">
        <span>100%</span>
        <span>50%</span>
        <span>0%</span>
      </div>

      {/* Curve */}
      <svg className="absolute inset-8" viewBox="0 0 100 50" preserveAspectRatio="none">
        <defs>
          <linearGradient id="retentionGrad" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="40%" stopColor="#3b82f6" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="retentionFill" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,5 C8,5 15,8 25,12 S40,20 50,25 S65,32 75,38 S90,44 100,46"
          fill="none"
          stroke="url(#retentionGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - progress * 100}
        />
        {progress > 0.3 && (
          <g style={{ opacity: progress > 0.4 ? 1 : 0 }} className="transition-opacity duration-300">
            <circle cx="25" cy="12" r="2.5" fill="#22c55e" />
            <circle cx="25" cy="12" r="5" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.5" />
          </g>
        )}
        {progress > 0.6 && (
          <g style={{ opacity: progress > 0.7 ? 1 : 0 }} className="transition-opacity duration-300">
            <circle cx="50" cy="25" r="2.5" fill="#f59e0b" />
            <circle cx="50" cy="25" r="5" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.5" />
          </g>
        )}
        {progress > 0.9 && (
          <g style={{ opacity: 1 }} className="transition-opacity duration-300">
            <circle cx="75" cy="38" r="2.5" fill="#ef4444" />
            <circle cx="75" cy="38" r="5" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.5" />
          </g>
        )}
      </svg>

      {/* Time labels */}
      <div className="absolute bottom-2 left-8 right-8 flex justify-between text-[10px] text-white/40">
        <span>0:00</span>
        <span>0:10</span>
        <span>0:20</span>
        <span>0:30</span>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-4 flex items-center gap-4 text-[10px]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Hook</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Caida</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Abandono</span>
      </div>
    </div>
  );
}

function AudienceGridVisual({ active }: { active: boolean }) {
  const archetypes = [
    { name: "Gen Z", color: "#ec4899", count: 18 },
    { name: "Millennials", color: "#8b5cf6", count: 25 },
    { name: "Profesionales", color: "#3b82f6", count: 22 },
    { name: "Padres", color: "#10b981", count: 15 },
    { name: "Estudiantes", color: "#f59e0b", count: 12 },
    { name: "Otros", color: "#64748b", count: 8 },
  ];

  let dotIndex = 0;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6">
      <div className="absolute inset-0 bg-black/20" />

      {/* Dots grid */}
      <div className="relative flex h-full items-center justify-center">
        <div className="grid grid-cols-10 gap-2">
          {archetypes.flatMap((arch) =>
            Array.from({ length: arch.count }, (_, i) => {
              const idx = dotIndex++;
              const row = Math.floor(idx / 10);
              const col = idx % 10;
              const delay = (row + col) * 25;
              return (
                <div
                  key={`${arch.name}-${i}`}
                  className="h-4 w-4 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: arch.color,
                    opacity: active ? 0.9 : 0.2,
                    transform: active ? "scale(1)" : "scale(0.3)",
                    transitionDelay: `${delay}ms`,
                    boxShadow: active ? `0 0 10px ${arch.color}50` : "none",
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap justify-center gap-3">
        {archetypes.map((arch) => (
          <span
            key={arch.name}
            className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-sm transition-all duration-500"
            style={{
              opacity: active ? 1 : 0,
              transform: active ? "translateY(0)" : "translateY(10px)",
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: arch.color }} />
            {arch.name} ({arch.count})
          </span>
        ))}
      </div>
    </div>
  );
}

function InsightsListVisual({ active }: { active: boolean }) {
  const actions = [
    { id: 1, time: "0:02", label: "Mejorar hook", impact: "+25%", color: "#f59e0b", x: 8 },
    { id: 2, time: "0:08", label: "Agregar CTA", impact: "+18%", color: "#10b981", x: 30 },
    { id: 3, time: "0:12", label: "Cortar escena", impact: "+12%", color: "#ef4444", x: 45 },
    { id: 4, time: "0:18", label: "Reforzar valor", impact: "+15%", color: "#3b82f6", x: 68 },
    { id: 5, time: "0:25", label: "CTA final", impact: "+20%", color: "#8b5cf6", x: 92 },
  ];

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6">
      <div className="absolute inset-0 bg-black/20" />

      {/* Video timeline mockup */}
      <div className="relative flex h-full flex-col">
        {/* Mini video preview */}
        <div className="relative mx-auto mb-4 h-24 w-44 overflow-hidden rounded-lg bg-black/40 backdrop-blur">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-all duration-500"
              style={{
                transform: active ? "scale(1)" : "scale(0)",
                opacity: active ? 1 : 0,
              }}
            >
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* Scanning line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/80"
            style={{
              left: active ? "85%" : "0%",
              transition: "left 3s ease-out",
              boxShadow: "0 0 10px rgba(255,255,255,0.8)",
            }}
          />
        </div>

        {/* Timeline bar */}
        <div className="relative mx-4 flex-1">
          {/* Background track */}
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-black/30">
            {/* Progress fill */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-white/60 to-white/20"
              style={{
                width: active ? "100%" : "0%",
                transition: "width 2.5s ease-out",
              }}
            />
          </div>

          {/* Action points */}
          {actions.map((action, i) => (
            <div
              key={action.id}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${action.x}%` }}
            >
              {/* Pulse ring */}
              <div
                className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  backgroundColor: action.color,
                  opacity: active ? 0.3 : 0,
                  transform: active ? "scale(1.5)" : "scale(0)",
                  transition: `all 0.5s ease-out ${0.3 + i * 0.15}s`,
                  animation: active ? "pulse 2s ease-in-out infinite" : "none",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
              {/* Main dot */}
              <div
                className="relative h-5 w-5 rounded-full border-2 border-white"
                style={{
                  backgroundColor: action.color,
                  transform: active ? "scale(1)" : "scale(0)",
                  opacity: active ? 1 : 0,
                  transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.2 + i * 0.15}s`,
                  boxShadow: `0 0 15px ${action.color}`,
                }}
              />
              {/* Label card */}
              <div
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm"
                style={{
                  top: i % 2 === 0 ? "-45px" : "30px",
                  opacity: active ? 1 : 0,
                  transform: active
                    ? "translateX(-50%) translateY(0)"
                    : `translateX(-50%) translateY(${i % 2 === 0 ? "10px" : "-10px"})`,
                  transition: `all 0.4s ease-out ${0.4 + i * 0.15}s`,
                }}
              >
                <p className="text-[10px] font-bold text-white">{action.label}</p>
                <p className="text-center text-[9px] font-semibold" style={{ color: action.color }}>
                  {action.impact} retencion
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats */}
        <div className="mt-4 flex justify-center gap-6">
          {[
            { label: "Acciones", value: "5", color: "#fff" },
            { label: "Impacto total", value: "+90%", color: "#10b981" },
            { label: "Prioridad", value: "Alta", color: "#f59e0b" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-full bg-black/30 px-3 py-1 text-center backdrop-blur-sm transition-all duration-500"
              style={{
                opacity: active ? 1 : 0,
                transform: active ? "translateY(0)" : "translateY(15px)",
                transitionDelay: `${0.8 + i * 0.1}s`,
              }}
            >
              <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[9px] text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(2); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}

const mainFeatures = [
  {
    id: "retencion",
    kicker: "Curva predictiva",
    title: "Visualiza la retencion segundo a segundo",
    description: "Ve exactamente donde tu audiencia pierde interes. Identifica hooks efectivos, puntos de caida y el momento ideal para tu CTA.",
    visual: RetentionCurveVisual,
    bullets: [
      "Precision de 1 segundo",
      "Deteccion de momentos criticos",
      "Comparativa con benchmarks",
    ],
  },
  {
    id: "audiencia",
    kicker: "100 personas sinteticas",
    title: "Simulamos una audiencia real y diversa",
    description: "Cada persona tiene edad, ocupacion, intereses y comportamiento unico. 12 arquetipos distintos para entender quien conecta con tu contenido.",
    visual: AudienceGridVisual,
    bullets: [
      "12 arquetipos de audiencia",
      "Perfiles demograficos reales",
      "Comportamiento individualizado",
    ],
  },
  {
    id: "insights",
    kicker: "Acciones concretas",
    title: "No solo data, soluciones que podes aplicar",
    description: "Cada insight viene con una accion especifica. Sabe exactamente que cambiar y donde para mejorar tu retencion.",
    visual: InsightsListVisual,
    bullets: [
      "Recomendaciones priorizadas",
      "Cambios especificos por segundo",
      "Impacto estimado por accion",
    ],
  },
];

export default function FeaturesPage() {
  const [heroRef, heroVisible] = useSectionInView<HTMLElement>(0.3);
  const [processRef, processVisible] = useSectionInView<HTMLElement>(0.2);
  const featureRefs = mainFeatures.map(() => useSectionInView<HTMLElement>(0.3));

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
      <section ref={heroRef} className="relative overflow-hidden px-6 pb-20 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-white to-white" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div
            className="transition-all duration-700"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            }}
          >
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Funcionalidades
            </span>
          </div>

          <h1
            className="mt-8 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl lg:text-6xl transition-all duration-700 delay-100"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            }}
          >
            Inteligencia predictiva
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              para creadores de video
            </span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl transition-all duration-700 delay-200"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            }}
          >
            Simula 100 espectadores antes de publicar. Sabe exactamente donde perdes atencion y que cambiar para maximizar retencion.
          </p>

          {/* Stats */}
          <div
            className="mt-12 flex flex-wrap justify-center gap-12 transition-all duration-700 delay-300"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            }}
          >
            {[
              { value: 100, suffix: "", label: "Personas simuladas" },
              { value: 95, suffix: "%", label: "Precision" },
              { value: 40, suffix: "%", label: "Mejora promedio" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-5xl font-bold text-slate-900">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} active={heroVisible} />
                </p>
                <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center transition-all duration-700 delay-400"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            }}
          >
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
            >
              Probar gratis
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section ref={processRef} className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <span
              className="inline-flex rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 transition-all duration-600"
              style={{
                opacity: processVisible ? 1 : 0,
                transform: processVisible ? "translateY(0)" : "translateY(20px)",
              }}
            >
              Como funciona
            </span>
            <h2
              className="mt-6 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl transition-all duration-600 delay-100"
              style={{
                opacity: processVisible ? 1 : 0,
                transform: processVisible ? "translateY(0)" : "translateY(20px)",
              }}
            >
              De video a insights en minutos
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ProcessCard
              step="Paso 01"
              title="Subi tu video"
              description="Arrastra y solta cualquier formato. MP4, MOV, AVI y mas."
              active={processVisible}
              delay={0}
            >
              <UploadVisual active={processVisible} />
            </ProcessCard>

            <ProcessCard
              step="Paso 02"
              title="Analizamos con IA"
              description="Procesamos audio, video y texto segundo a segundo."
              active={processVisible}
              delay={100}
            >
              <AnalyzeVisual active={processVisible} />
            </ProcessCard>

            <ProcessCard
              step="Paso 03"
              title="Simulamos audiencia"
              description="100 personas sinteticas miran tu video."
              active={processVisible}
              delay={200}
            >
              <SimulateVisual active={processVisible} />
            </ProcessCard>

            <ProcessCard
              step="Paso 04"
              title="Obtene insights"
              description="Curva de retencion, momentos clave y acciones."
              active={processVisible}
              delay={300}
            >
              <InsightsVisual active={processVisible} />
            </ProcessCard>
          </div>
        </div>
      </section>

      {/* Main Features */}
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
                <div className={!isEven ? "lg:col-start-2" : ""}>
                  <span
                    className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "translateY(0)" : "translateY(20px)",
                      transition: "all 0.6s ease-out",
                    }}
                  >
                    {feature.kicker}
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
                  <ul
                    className="mt-6 space-y-3"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "translateY(0)" : "translateY(20px)",
                      transition: "all 0.6s ease-out 0.3s",
                    }}
                  >
                    {feature.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="text-slate-700">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

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
            </div>
          </section>
        );
      })}

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
