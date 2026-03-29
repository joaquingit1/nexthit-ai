"use client";

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

import type {
  AnalysisPoint,
  AnalysisResponse,
  TranscriptSegment,
  ViewerSimulation,
} from "@/lib/analysis";

type ViewerMode = "all" | "average";

const GRAPH_WIDTH = 860;
const GRAPH_HEIGHT = 380;
const GRAPH_PADDING = { top: 42, right: 34, bottom: 72, left: 86 };

function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getGraphCoordinates(point: AnalysisPoint, duration: number) {
  const safeDuration = Math.max(duration, 1);
  const usableWidth = GRAPH_WIDTH - GRAPH_PADDING.left - GRAPH_PADDING.right;
  const usableHeight = GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom;

  return {
    x: GRAPH_PADDING.left + (point.second / safeDuration) * usableWidth,
    y: GRAPH_PADDING.top + ((100 - point.retention) / 100) * usableHeight,
  };
}

function buildLinePath(points: AnalysisPoint[]) {
  if (!points.length) {
    return "";
  }

  const duration = points[points.length - 1]?.second || 1;

  return points
    .map((point, index) => {
      const { x, y } = getGraphCoordinates(point, duration);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildSmoothLinePath(points: AnalysisPoint[]) {
  if (points.length < 3) {
    return buildLinePath(points);
  }

  const duration = points[points.length - 1]?.second || 1;
  const coordinates = points.map((point) => getGraphCoordinates(point, duration));
  let path = `M ${coordinates[0]?.x.toFixed(2)} ${coordinates[0]?.y.toFixed(2)}`;

  for (let index = 1; index < coordinates.length - 1; index += 1) {
    const current = coordinates[index];
    const next = coordinates[index + 1];
    const controlX = ((current?.x ?? 0) + (next?.x ?? 0)) / 2;
    const controlY = ((current?.y ?? 0) + (next?.y ?? 0)) / 2;
    path += ` Q ${(current?.x ?? 0).toFixed(2)} ${(current?.y ?? 0).toFixed(2)} ${controlX.toFixed(2)} ${controlY.toFixed(2)}`;
  }

  const last = coordinates[coordinates.length - 1];
  path += ` T ${(last?.x ?? 0).toFixed(2)} ${(last?.y ?? 0).toFixed(2)}`;
  return path;
}

function formatMoment(second: number) {
  return `${Math.max(0, Math.round(second * 10) / 10).toFixed(1)}s`;
}

function formatTimestampLabel(second: number) {
  const safeSecond = Math.max(0, Math.round(second));
  const minutes = Math.floor(safeSecond / 60);
  const seconds = safeSecond % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildXAxisTicks(durationSeconds: number, tickCount = 5) {
  const safeDuration = Math.max(durationSeconds, 1);
  const denominator = Math.max(tickCount - 1, 1);
  const ticks = Array.from({ length: tickCount }, (_, index) =>
    index === tickCount - 1 ? safeDuration : (safeDuration * index) / denominator,
  );

  return ticks.filter((tick, index) => {
    if (index === 0) {
      return true;
    }

    return Math.round(tick) !== Math.round(ticks[index - 1] ?? -1);
  });
}

function findPointAtSecond(points: AnalysisPoint[], second: number) {
  if (!points.length) {
    return { second, retention: 0 } satisfies AnalysisPoint;
  }

  let closestPoint = points[0];
  let closestDistance = Math.abs((points[0]?.second ?? 0) - second);

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const distance = Math.abs((point?.second ?? 0) - second);

    if (distance < closestDistance) {
      closestPoint = point;
      closestDistance = distance;
    }
  }

  return closestPoint ?? { second, retention: 0 };
}

function normalizeTranscriptSegments(segments: TranscriptSegment[] | undefined, duration: number) {
  const safeDuration = Math.max(duration, 1);
  const normalized = (segments ?? [])
    .map((segment) => {
      const start = clampNumber(segment.start ?? 0, 0, safeDuration);
      const end = clampNumber(segment.end ?? start, start, safeDuration);
      return {
        start,
        end: end > start ? end : Math.min(safeDuration, start + 0.2),
        text: segment.text?.trim() ?? "",
        visual_description: segment.visual_description?.trim() ?? "",
        scene_labels: segment.scene_labels ?? [],
        on_screen_text: segment.on_screen_text ?? [],
        visual_confidence: segment.visual_confidence,
        creative_signals: segment.creative_signals ?? [],
        retention_impact: segment.retention_impact,
      } satisfies TranscriptSegment;
    })
    .filter((segment) => segment.text.length > 0)
    .sort((left, right) => left.start - right.start);

  if (normalized.length) {
    return normalized;
  }

  return [
    {
      start: 0,
      end: safeDuration,
      text: "No hubo transcript disponible para este clip.",
      visual_description: "",
      scene_labels: [],
      on_screen_text: [],
    },
  ] satisfies TranscriptSegment[];
}

function getTranscriptSegmentAtSecond(
  segments: TranscriptSegment[],
  second: number,
): TranscriptSegment {
  const safeSecond = clampNumber(second, 0, Math.max(segments[segments.length - 1]?.end ?? 0, 0));
  return (
    segments.find((segment) => safeSecond >= segment.start && safeSecond <= segment.end) ??
    segments.find((segment) => safeSecond < segment.start) ??
    segments[segments.length - 1]
  );
}

function buildAverageLineFromViewers(viewers: ViewerSimulation[]) {
  if (!viewers.length) {
    return [] as AnalysisPoint[];
  }

  const duration = viewers[0].points[viewers[0].points.length - 1]?.second ?? 0;
  const sampleCount = Math.max(duration * 16, 120);
  const rawCurve = Array.from({ length: sampleCount + 1 }, (_, index) => {
    const second = (index / sampleCount) * duration;
    const activeCount = viewers.filter((viewer) => viewer.dropOffSecond > second).length;

    return {
      second: Math.round(second * 100) / 100,
      retention: Math.round((activeCount / viewers.length) * 1000) / 10,
    };
  });

  const smoothedCurve = rawCurve.map((point, index) => {
    const start = Math.max(0, index - 3);
    const end = Math.min(rawCurve.length - 1, index + 3);
    const neighborhood = rawCurve.slice(start, end + 1);
    const averageRetention =
      neighborhood.reduce((sum, current) => sum + current.retention, 0) / neighborhood.length;

    return {
      second: point.second,
      retention: averageRetention,
    };
  });

  return smoothedCurve.map((point, index) => {
    if (index === 0) {
      return { second: point.second, retention: 100 };
    }

    const previous = smoothedCurve[index - 1]?.retention ?? 100;
    return {
      second: point.second,
      retention: Math.max(0, Math.min(previous, Math.round(point.retention * 10) / 10)),
    };
  });
}

export default function RetentionMetricsPanel({
  analysis,
}: {
  analysis: AnalysisResponse["analysis"];
}) {
  const [viewerMode, setViewerMode] = useState<ViewerMode>("all");
  const [simulationElapsed, setSimulationElapsed] = useState(0);
  const [simulationRunId, setSimulationRunId] = useState(0);
  const [hoveredSecond, setHoveredSecond] = useState<number | null>(null);
  const duration = analysis.graph.durationSeconds;
  const batchSize = 10;
  const batchDurationMs = 920;
  const revealPhase = 0.56;
  const batchCount = Math.ceil(analysis.graph.viewers.length / batchSize);
  const rawBatchIndex = Math.min(Math.floor(simulationElapsed / batchDurationMs), batchCount);
  const simulationComplete = rawBatchIndex >= batchCount;
  const batchProgress = simulationComplete ? 1 : (simulationElapsed % batchDurationMs) / batchDurationMs;
  const visibleBatchCount = simulationComplete ? batchCount : Math.min(rawBatchIndex + 1, batchCount);
  const averageBatchCount = simulationComplete
    ? batchCount
    : Math.min(rawBatchIndex + (batchProgress >= revealPhase ? 1 : 0), batchCount);
  const visibleViewersBase = analysis.graph.viewers.slice(
    0,
    Math.min(visibleBatchCount * batchSize, analysis.graph.viewers.length),
  );
  const renderedViewers = viewerMode === "average" ? [] : visibleViewersBase;
  const renderedAverage = useMemo(
    () =>
      buildAverageLineFromViewers(
        analysis.graph.viewers.slice(
          0,
          Math.min(averageBatchCount * batchSize, analysis.graph.viewers.length),
        ),
      ),
    [analysis.graph.viewers, averageBatchCount],
  );
  const averagePath = buildSmoothLinePath(
    renderedAverage.length ? renderedAverage : analysis.graph.averageLine,
  );
  const activeAverageLine =
    renderedAverage.length && !simulationComplete ? renderedAverage : analysis.graph.averageLine;
  const transcriptSegments = useMemo(
    () => normalizeTranscriptSegments(analysis.transcript?.segments, duration),
    [analysis.transcript?.segments, duration],
  );
  const defaultFocusSecond = analysis.graph.markers[0]?.second ?? 0;
  const activeSecond = hoveredSecond ?? defaultFocusSecond;
  const activeTranscriptSegment = getTranscriptSegmentAtSecond(transcriptSegments, activeSecond);
  const activeAveragePoint = findPointAtSecond(activeAverageLine, activeSecond);
  const activeCoordinates = getGraphCoordinates(activeAveragePoint, duration);
  const yAxisTicks = [100, 75, 50, 25, 0];
  const xAxisTicks = buildXAxisTicks(duration);
  const simulatedViewerCount = Math.min(averageBatchCount * batchSize, analysis.graph.viewers.length);

  const handleGraphPointerMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * GRAPH_WIDTH;
    const clampedX = clampNumber(
      relativeX,
      GRAPH_PADDING.left,
      GRAPH_WIDTH - GRAPH_PADDING.right,
    );
    const nextSecond =
      ((clampedX - GRAPH_PADDING.left) /
        (GRAPH_WIDTH - GRAPH_PADDING.left - GRAPH_PADDING.right)) *
      Math.max(duration, 1);
    setHoveredSecond(Math.round(clampNumber(nextSecond, 0, duration) * 10) / 10);
  };

  useEffect(() => {
    setSimulationElapsed(0);
    setHoveredSecond(null);
  }, [analysis.sessionLabel, simulationRunId]);

  useEffect(() => {
    const maxElapsed = batchCount * batchDurationMs;
    const startedAt = performance.now();
    let animationFrame = 0;

    const tick = (now: number) => {
      const nextElapsed = Math.min(now - startedAt, maxElapsed);
      setSimulationElapsed(nextElapsed);

      if (nextElapsed < maxElapsed) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [analysis.sessionLabel, batchCount, simulationRunId]);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Metricas de retencion</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Cada linea es una persona simulada. La curva brillante muestra el promedio de retencion en cada segundo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "Audiencia + promedio" },
            { id: "average", label: "Solo promedio" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setViewerMode(option.id as ViewerMode)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                viewerMode === option.id
                  ? "border-slate-900 bg-slate-950 text-white"
                  : "border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSimulationRunId((current) => current + 1)}
            className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            Repetir simulacion
          </button>
          {!simulationComplete ? (
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">
              <svg className="h-3.5 w-3.5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-medium text-blue-700">
                {simulatedViewerCount}/{analysis.graph.audienceSize}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-4">
        {[
          ["Puntaje general", `${analysis.summary.overallScore}/100`],
          ["Tiempo promedio de visualizacion", analysis.graph.averageWatchTime],
          ["Abandono mas comun", analysis.graph.mostCommonDropOff],
        ].map(([label, value]) => (
          <div key={label} className="border-b border-slate-200/80 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {label}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.3fr,0.9fr]">
        <section className="relative overflow-hidden rounded-[2.3rem] border border-white/60 bg-[linear-gradient(180deg,rgba(247,250,252,0.95),rgba(239,244,248,0.88))] px-4 py-5 md:px-7 md:py-7">
          <div className="analysis-grid absolute inset-0 opacity-40" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Retencion simulada
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  La animacion agrega a las 100 personas en lotes para construir la curva promedio en tiempo real.
                </p>
              </div>
              <div className="hidden rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:block">
                {analysis.graph.audienceSize} personas
              </div>
            </div>
            <svg
              viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
              className="w-full"
              aria-hidden="true"
              onMouseMove={handleGraphPointerMove}
              onMouseLeave={() => setHoveredSecond(null)}
            >
              <defs>
                <linearGradient id="retentionAverageShared" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {yAxisTicks.map((tick) => {
                const point = getGraphCoordinates({ second: 0, retention: tick }, duration);
                return (
                  <g key={`y-${tick}`}>
                    <line
                      x1={GRAPH_PADDING.left}
                      y1={point.y}
                      x2={GRAPH_WIDTH - GRAPH_PADDING.right}
                      y2={point.y}
                      stroke="rgba(148,163,184,0.22)"
                      strokeWidth="1"
                      strokeDasharray="4 8"
                    />
                    <text
                      x={GRAPH_PADDING.left - 18}
                      y={point.y + 4}
                      textAnchor="end"
                      fontSize="11"
                      fill="rgba(71,85,105,0.9)"
                    >
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {xAxisTicks.map((tick) => {
                const point = getGraphCoordinates({ second: tick, retention: 0 }, duration);
                return (
                  <g key={`x-${tick}`}>
                    <line
                      x1={point.x}
                      y1={GRAPH_PADDING.top}
                      x2={point.x}
                      y2={GRAPH_HEIGHT - GRAPH_PADDING.bottom}
                      stroke="rgba(148,163,184,0.14)"
                      strokeWidth="1"
                      strokeDasharray="4 10"
                    />
                    <text
                      x={point.x}
                      y={GRAPH_HEIGHT - GRAPH_PADDING.bottom + 24}
                      textAnchor="middle"
                      fontSize="11"
                      fill="rgba(71,85,105,0.9)"
                    >
                      {formatTimestampLabel(tick)}
                    </text>
                  </g>
                );
              })}

              {renderedViewers.map((viewer) => (
                <path
                  key={viewer.id}
                  d={buildLinePath(viewer.points)}
                  fill="none"
                  stroke={viewer.color}
                  strokeOpacity={0.18}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="result-viewer-line"
                />
              ))}

              <path
                key={`average-${simulationRunId}`}
                d={averagePath}
                fill="none"
                stroke="url(#retentionAverageShared)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="result-draw-line"
              />

              {(simulationComplete ? analysis.graph.markers : []).map((marker) => {
                const { x, y } = getGraphCoordinates(marker, duration);

                return (
                  <g key={`${marker.label}-${marker.second}`}>
                    <line
                      x1={x}
                      y1={GRAPH_PADDING.top}
                      x2={x}
                      y2={GRAPH_HEIGHT - GRAPH_PADDING.bottom}
                      stroke="rgba(15,23,42,0.12)"
                      strokeWidth="0.5"
                      strokeDasharray="2 6"
                    />
                    <circle cx={x} cy={y} r="3.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
                  </g>
                );
              })}

              <line
                x1={activeCoordinates.x}
                y1={GRAPH_PADDING.top}
                x2={activeCoordinates.x}
                y2={GRAPH_HEIGHT - GRAPH_PADDING.bottom}
                stroke="rgba(47,111,218,0.28)"
                strokeWidth="2"
                strokeDasharray="8 10"
              />
              <circle
                cx={activeCoordinates.x}
                cy={activeCoordinates.y}
                r="4"
                fill="#ffffff"
                stroke="#2f6fda"
                strokeWidth="1.5"
              />
              <rect
                x={GRAPH_PADDING.left}
                y={GRAPH_PADDING.top}
                width={GRAPH_WIDTH - GRAPH_PADDING.left - GRAPH_PADDING.right}
                height={GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom}
                fill="transparent"
              />

              <text
                x={(GRAPH_WIDTH - GRAPH_PADDING.right + GRAPH_PADDING.left) / 2}
                y={GRAPH_HEIGHT - 18}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="rgba(71,85,105,0.92)"
                letterSpacing="0.12em"
              >
                TIEMPO DEL VIDEO
              </text>
              <text
                x={26}
                y={GRAPH_HEIGHT / 2}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="rgba(71,85,105,0.92)"
                letterSpacing="0.12em"
                transform={`rotate(-90 26 ${GRAPH_HEIGHT / 2})`}
              >
                RETENCION
              </text>
            </svg>
          </div>
        </section>

        <div className="flex flex-col gap-2 self-start">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Segundo
              </p>
              <p className="mt-1 font-display text-xl font-semibold tracking-[-0.04em] text-slate-950">
                {formatMoment(activeSecond)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Retencion
              </p>
              <p className="mt-1 font-display text-xl font-semibold tracking-[-0.04em] text-slate-950">
                {Math.round(activeAveragePoint.retention)}%
              </p>
            </div>
          </div>
          {(simulationComplete ? analysis.graph.markers : analysis.graph.markers.slice(0, 1)).map((marker) => (
            <div key={marker.label} className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {formatTimestampLabel(marker.second)}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{marker.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600 line-clamp-2">{marker.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Fragmento hablado
        </p>
        <p className="mt-3 text-base leading-8 text-slate-700">
          {activeTranscriptSegment.text}
        </p>
        {activeTranscriptSegment.visual_description ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Lo que se ve
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {activeTranscriptSegment.visual_description}
              </p>
            </div>
            {activeTranscriptSegment.on_screen_text?.length ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Texto en pantalla
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {activeTranscriptSegment.on_screen_text.join(" / ")}
                </p>
              </div>
            ) : null}
          </div>
        ) : activeTranscriptSegment.on_screen_text?.length ? (
          <>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Texto en pantalla
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {activeTranscriptSegment.on_screen_text.join(" / ")}
            </p>
          </>
        ) : null}
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-400">
          Pasa el mouse por el grafico para ver que estan escuchando en cada segundo.
        </p>
      </div>
    </section>
  );
}
