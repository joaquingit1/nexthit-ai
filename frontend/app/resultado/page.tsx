"use client";

import {
  Suspense,
  startTransition,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ANALYSIS_STORAGE_KEY,
  ANALYSIS_STORAGE_PREFIX,
  createAnalysisPayload,
  type AnalysisPoint,
  type AnalysisResponse,
  type ChangePlan,
  type MediaTargetingRecommendation,
  type PersonaResult,
  type PersonaSegment,
  type SegmentDiagnosis,
  type TimelineInsightItem,
  type TranscriptSegment,
  type VersionStrategy,
  type ViewerSimulation,
} from "@/lib/analysis";

type ViewerMode = "all" | "average";
type ScreenMode = "story" | "analysis";

type PersonaInsight = {
  name: string;
  color: string;
  retentionPercent: number;
  dropOffSecond: number;
  dropOffLabel: string;
  verdict: string;
  angle: string;
  tag: string;
};

type TimelineInsight = {
  id: string;
  label: string;
  second: number;
  detail: string;
  tone: "risk" | "opportunity";
};

type FeaturedSegment = {
  label: string;
  archetype: string;
  demographicCluster: string;
  averageRetention: number;
  medianDropoffSecond: number;
  dominantReasonLabel: string;
  support: number;
};

type SocialPost = {
  platform: string;
  angle: string;
  post: string;
};

const ANALYSIS_STEPS = [
  {
    id: "score",
    title: "Puntaje y Resumen",
    eyebrow: "Paso 1",
    description: "Abrimos con el puntaje total y un resumen ejecutivo completo del video.",
  },
  {
    id: "raw-personas",
    title: "100 Personas Sinteticas",
    eyebrow: "Paso 2",
    description: "Mostramos primero la materia prima: nombres, atributos, momento de abandono y motivo de salida.",
  },
  {
    id: "segment-dropoff",
    title: "Drop-Off por Segmento",
    eyebrow: "Paso 3",
    description: "Agrupamos arquetipos y demografias para ver quien se queda mas, quien se cae y por que.",
  },
  {
    id: "retention",
    title: "Grafico de Retencion",
    eyebrow: "Paso 4",
    description: "La curva final se apoya en las 100 personas sinteticas y en el tiempo real del video.",
  },
  {
    id: "timeline",
    title: "Momentos del Video",
    eyebrow: "Paso 5",
    description: "Marcamos los momentos exactos del edit que empujan o frenan la retencion.",
  },
  {
    id: "changes",
    title: "Que Cambiar",
    eyebrow: "Paso 6",
    description: "Traducimos transcript, curva y razones de abandono en cambios concretos al video.",
  },
  {
    id: "targeting",
    title: "Targeting de Medios",
    eyebrow: "Paso 7",
    description: "Conectamos las debilidades creativas con una recomendacion de compra de medios.",
  },
  {
    id: "versions",
    title: "Versiones A/B/C",
    eyebrow: "Paso 8",
    description: "Proponemos tres versiones claramente distintas para iterar el creativo.",
  },
  {
    id: "crosspost",
    title: "Posts para Redes",
    eyebrow: "Paso 9",
    description: "Generamos posts de texto listos a partir del transcript y del analisis.",
  },
] as const;

const GRAPH_WIDTH = 1100;
const GRAPH_HEIGHT = 460;
const GRAPH_PADDING = { top: 34, right: 26, bottom: 48, left: 70 };
const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "your",
  "into",
  "about",
  "have",
  "will",
  "just",
  "they",
  "them",
  "their",
  "then",
  "than",
  "what",
  "when",
  "where",
  "while",
  "because",
  "before",
  "after",
  "video",
  "videos",
  "short",
  "form",
  "marketing",
  "creative",
  "creatives",
  "audience",
  "system",
  "para",
  "esto",
  "esta",
  "este",
  "como",
  "desde",
  "sobre",
  "porque",
  "cuando",
  "donde",
  "pero",
]);

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

function cleanPersonaName(name: string) {
  return name.replace(/\s+\d+\s*$/, "").trim();
}

function hasPlaceholderSummary(text: string | undefined) {
  const normalized = (text ?? "").toLowerCase();
  return (
    !normalized.trim() ||
    normalized.includes("speech transcription was unavailable") ||
    normalized.includes("limited transcript context") ||
    normalized.includes("demo mode is active") ||
    normalized.includes("sample keeps the full result experience") ||
    normalized.includes("placeholder")
  );
}

function buildSummaryFromTranscript(analysis: AnalysisResponse["analysis"]) {
  const transcriptText =
    analysis.transcript?.segments
      ?.slice(0, 3)
      .map((segment) => segment.text?.trim())
      .filter(Boolean)
      .join(" ") ||
    analysis.transcript?.text ||
    analysis.transcriptText ||
    analysis.summary.narrative;
  return transcriptText?.trim() || analysis.summary.narrative;
}

function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
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

function inferDropOffSecond(points: AnalysisPoint[], durationSeconds: number) {
  const thresholdPoint = points.find((point) => point.second > 0 && point.retention <= 38);
  return thresholdPoint?.second ?? durationSeconds;
}

function normalizeViewerSimulation(
  viewer: ViewerSimulation,
  durationSeconds: number,
): ViewerSimulation {
  const dropOffSecond = Math.max(
    0.7,
    Math.min(
      viewer.dropOffSecond ?? inferDropOffSecond(viewer.points, durationSeconds),
      durationSeconds,
    ),
  );

  return {
    ...viewer,
    dropOffSecond,
    points: [
      { second: 0, retention: 100 },
      { second: dropOffSecond, retention: 100 },
      { second: dropOffSecond, retention: 0 },
      { second: durationSeconds, retention: 0 },
    ],
  };
}

function normalizeAnalysisPayload(payload: AnalysisResponse): AnalysisResponse {
  const durationSeconds = payload.analysis.graph.durationSeconds;
  const viewers = payload.analysis.graph.viewers.map((viewer) =>
    normalizeViewerSimulation(viewer, durationSeconds),
  );

  return {
    ...payload,
    analysis: {
      ...payload.analysis,
      transcriptText: payload.analysis.transcriptText ?? "",
      graph: {
        ...payload.analysis.graph,
        viewers,
        averageLine: buildAverageLineFromViewers(viewers),
      },
    },
  };
}

function parseStoredAnalysis(id: string | null) {
  const exactKey = id ? `${ANALYSIS_STORAGE_PREFIX}${id}` : null;

  try {
    const exactMatch = exactKey ? window.localStorage.getItem(exactKey) : null;

    if (exactMatch) {
      return JSON.parse(exactMatch) as AnalysisResponse;
    }

    const latest = window.localStorage.getItem(ANALYSIS_STORAGE_KEY);
    return latest ? (JSON.parse(latest) as AnalysisResponse) : null;
  } catch {
    return null;
  }
}

function createDemoAnalysis() {
  return createAnalysisPayload({
    texto:
      "Este video muestra como un equipo creativo puede predecir la retencion antes de lanzar medios pagos. El sistema desarma el clip en voz, ritmo, visuales y texto en pantalla, simula 100 personas espectadoras y convierte esas senales en estrategia de plataforma y crecimiento pago.",
    fileName: "axiom-lens-demo.mp4",
    fileType: "video/mp4",
    fileSize: 8_400_000,
    backendMessage:
      "Demo mode is active. This sample keeps the full result experience live even without a backend connection.",
    preferredPlatform: "Instagram",
  });
}

function extractKeywords(text: string) {
  const counts = new Map<string, number>();
  const normalizedWords = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  for (const word of normalizedWords) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function getSentenceSeed(text: string) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length) {
    return sentences.slice(0, 2).join(" ");
  }

  return "This creative is strongest when the payoff lands immediately and the audience understands the value in the first seconds.";
}

function derivePersonaInsights(
  viewers: ViewerSimulation[],
  durationSeconds: number,
  strongestAngle: string,
) {
  const segments = new Map<
    string,
    { color: string; totalDropOff: number; count: number }
  >();

  for (const viewer of viewers) {
    const current = segments.get(viewer.segment) ?? {
      color: viewer.color,
      totalDropOff: 0,
      count: 0,
    };

    current.totalDropOff += viewer.dropOffSecond;
    current.count += 1;
    segments.set(viewer.segment, current);
  }

  return [...segments.entries()]
    .map(([name, value]) => {
      const averageDrop = value.totalDropOff / Math.max(value.count, 1);
      const retentionPercent = Math.max(
        4,
        Math.min(100, Math.round((averageDrop / Math.max(durationSeconds, 1)) * 100)),
      );
      const verdict =
        retentionPercent >= 78
          ? `se queda ${retentionPercent}%`
          : `abandona en ${formatMoment(averageDrop)}`;

      return {
        name,
        color: value.color,
        retentionPercent,
        dropOffSecond: Math.round(averageDrop * 10) / 10,
        dropOffLabel: formatMoment(averageDrop),
        verdict,
        angle: retentionPercent >= 70 ? strongestAngle : "Necesita mostrar el valor mas rapido",
        tag: "Senal de audiencia",
      } satisfies PersonaInsight;
    })
    .sort((left, right) => right.retentionPercent - left.retentionPercent)
    .slice(0, 8)
    .map((persona, index) => ({
      ...persona,
      tag: index === 0 ? "Fit principal" : index === 1 ? "Fit secundario" : "Senal de audiencia",
    }));
}

function derivePersonaInsightsFromBackend(
  personas: PersonaResult[],
  strongestAngle: string,
) {
  return [...personas]
    .sort((left, right) => right.retention_percent - left.retention_percent)
    .slice(0, 8)
    .map((persona, index) => ({
      name: cleanPersonaName(persona.name),
      color: persona.color,
      retentionPercent: persona.retention_percent,
      dropOffSecond: persona.dropoff_second,
      dropOffLabel: formatMoment(persona.dropoff_second),
      verdict:
        persona.retention_percent >= 78
          ? `se queda ${persona.retention_percent}%`
          : `abandona en ${formatMoment(persona.dropoff_second)}`,
      angle: strongestAngle,
      tag: index === 0 ? "Fit principal" : index === 1 ? "Fit secundario" : "Senal de audiencia",
    } satisfies PersonaInsight));
}

function findMajorDropSecond(points: AnalysisPoint[]) {
  let strongestSecond = 0;
  let strongestDelta = 0;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const delta = (previous?.retention ?? 0) - (current?.retention ?? 0);

    if (delta > strongestDelta) {
      strongestDelta = delta;
      strongestSecond = current?.second ?? 0;
    }
  }

  return strongestSecond;
}

function deriveTimelineInsights(
  analysis: AnalysisResponse["analysis"],
  personas: PersonaInsight[],
) {
  const duration = analysis.graph.durationSeconds;
  const dropMoment = findMajorDropSecond(analysis.graph.averageLine);
  const midMoment = Math.min(Math.max(dropMoment + 1.4, duration * 0.42), duration - 4);
  const loopMoment = Math.max(duration - 2.3, 1);
  const topPersona = personas[0]?.name ?? analysis.graph.topAudienceSegment;

  return [
    {
      id: "hook",
      label: "Hook débil",
      second: Math.max(0.8, Math.min(dropMoment || 1.2, 2.4)),
      detail:
        "La primera decisión de seguir o abandonar ocurre antes de que aparezca la prueba más fuerte. Mostrá el resultado antes que la explicación.",
      tone: "risk",
    },
    {
      id: "energy",
      label: "Caída de energía",
      second: Math.max(2.5, Math.min(dropMoment || 3.4, duration - 6)),
      detail:
        "El impulso cae cuando el video explica en vez de mostrar. Este es el momento para sumar movimiento, prueba o un quiebre de patron.",
      tone: "risk",
    },
    {
      id: "overload",
      label: "Sobrecarga cognitiva",
      second: Math.round(midMoment * 10) / 10,
      detail: `La mitad del video exige demasiada interpretacion de golpe. ${topPersona} retiene mejor cuando el mensaje se mantiene mas filoso y simple.`,
      tone: "risk",
    },
    {
      id: "loop",
      label: "Potencial de loop",
      second: Math.round(loopMoment * 10) / 10,
      detail:
        "El cierre puede transformarse en un momento de replay. Termina con movimiento, resultado o una pregunta que haga loop con el primer frame.",
      tone: "opportunity",
    },
  ] satisfies TimelineInsight[];
}

function mapTimelineInsights(items: TimelineInsightItem[]) {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    second: item.second,
    detail: item.detail,
    tone: item.tone,
  })) satisfies TimelineInsight[];
}

function layoutTimelineInsights(timeline: TimelineInsight[], duration: number) {
  const laneLastPosition = [-100, -100, -100];
  const minimumGap = 16;

  return [...timeline]
    .sort((left, right) => left.second - right.second)
    .map((item) => {
      const leftPercent = Math.max(4, Math.min(96, (item.second / Math.max(duration, 1)) * 100));
      let lane = laneLastPosition.findIndex((lastPosition) => leftPercent - lastPosition >= minimumGap);

      if (lane === -1) {
        const smallestLaneValue = Math.min(...laneLastPosition);
        lane = laneLastPosition.indexOf(smallestLaneValue);
      }

      laneLastPosition[lane] = leftPercent;

      return {
        ...item,
        lane,
        leftPercent,
      };
    });
}

function bestPlatformLabel(analysis: AnalysisResponse["analysis"]) {
  return [...analysis.crossPost.platforms]
    .sort((left, right) => right.fit - left.fit)[0]?.platform ?? "Instagram Reels";
}

function buildPersonaSegmentsFromRaw(personas: PersonaResult[]): PersonaSegment[] {
  const grouped = new Map<string, PersonaResult[]>();

  for (const persona of personas) {
    const key = persona.segment_label || `${persona.demographic_cluster ?? "Audiencia"} ${persona.archetype ?? "Persona"}`;
    const current = grouped.get(key) ?? [];
    current.push(persona);
    grouped.set(key, current);
  }

  return [...grouped.entries()]
    .map(([label, items]) => {
      const averageRetention =
        items.reduce((sum, item) => sum + item.retention_percent, 0) / Math.max(items.length, 1);
      const orderedDropoffs = [...items]
        .map((item) => item.dropoff_second)
        .sort((left, right) => left - right);
      const midpoint = Math.floor(orderedDropoffs.length / 2);
      const medianDropoff =
        orderedDropoffs.length % 2 === 1
          ? orderedDropoffs[midpoint]
          : (orderedDropoffs[midpoint - 1] + orderedDropoffs[midpoint]) / 2;
      const reasons = new Map<string, { count: number; label: string }>();

      for (const item of items) {
        const code = item.reason_code ?? "unclear_value";
        const current = reasons.get(code) ?? {
          count: 0,
          label: item.reason_label ?? code,
        };
        current.count += 1;
        reasons.set(code, current);
      }

      const dominantReason =
        [...reasons.entries()].sort((left, right) => right[1].count - left[1].count)[0] ??
        ["unclear_value", { count: 0, label: "Valor poco claro" }];

      return {
        label,
        archetype: items[0]?.archetype,
        demographicCluster: items[0]?.demographic_cluster,
        support: items.length,
        averageRetention: Math.round(averageRetention * 10) / 10,
        medianDropoffSecond: Math.round(medianDropoff * 10) / 10,
        dominantReasonCode: dominantReason[0],
        dominantReasonLabel: dominantReason[1].label,
        samplePersonas: items.slice(0, 2).map((item) => cleanPersonaName(item.name)),
        sampleEvidence: items.slice(0, 2).map((item) => ({
          name: cleanPersonaName(item.name),
          dropoffSecond: item.dropoff_second,
          reasonLabel: item.reason_label,
          evidenceExcerpt: item.evidence_excerpt,
        })),
      } satisfies PersonaSegment;
    })
    .sort((left, right) => right.averageRetention - left.averageRetention);
}

function buildSegmentDiagnosesFromRaw(personas: PersonaResult[]): SegmentDiagnosis[] {
  return buildPersonaSegmentsFromRaw(personas).map((segment) => {
    const items = personas.filter((persona) => persona.segment_label === segment.label);
    const why =
      items.sort(
        (left, right) =>
          (right.retention_percent ?? 0) - (left.retention_percent ?? 0),
      )[0]?.why_they_left ?? "El segmento pierde interes cuando el valor tarda en llegar.";

    return {
      label: segment.label,
      dropoffSecond: segment.medianDropoffSecond,
      reasonCode: segment.dominantReasonCode,
      reasonLabel: segment.dominantReasonLabel,
      why,
      examples: items.slice(0, 2).map((item) => ({
        name: cleanPersonaName(item.name),
        dropoffSecond: item.dropoff_second,
        reasonLabel: item.reason_label,
        evidenceExcerpt: item.evidence_excerpt,
      })),
    } satisfies SegmentDiagnosis;
  });
}

function buildChangePlanFallback(analysis: AnalysisResponse["analysis"]): ChangePlan {
  const biggestDropSecond = findMajorDropSecond(analysis.graph.averageLine);
  const firstSpeechTime = analysis.transcript?.segments?.[0]?.start ?? 0;
  const silentIntroCutSeconds = firstSpeechTime > 0.3 ? Math.round(firstSpeechTime * 10) / 10 : null;
  const actions = [
    silentIntroCutSeconds
      ? {
          title: "Cortar intro silenciosa",
          timestamp: silentIntroCutSeconds,
          reason: "La primera voz aparece tarde para un entorno de scroll rapido.",
          fix: `Cortar los primeros ${silentIntroCutSeconds}s y abrir con el beneficio.`,
        }
      : null,
    {
      title: "Resolver la mayor caida",
      timestamp: Math.round(biggestDropSecond * 10) / 10,
      reason: "La curva tiene su quiebre mas fuerte en ese tramo.",
      fix: "Sumar prueba, demostracion o un quiebre de patron en ese segundo.",
    },
  ].filter(Boolean) as ChangePlan["actions"];

  return {
    summary: "Plan de cambios derivado de transcript, curva de retencion y personas sinteticas.",
    firstSpeechTime,
    silentIntroCutSeconds,
    biggestDropSecond,
    actions,
    topLeaveReasons: [],
    reasonFixes: [],
  };
}

function buildMediaTargetingFallback(
  analysis: AnalysisResponse["analysis"],
  plan: ChangePlan,
): MediaTargetingRecommendation[] {
  const primary = analysis.targetAudience?.primaryAudience ?? analysis.graph.bestFitAudience;
  const secondary = analysis.targetAudience?.secondaryAudience ?? "Audiencia secundaria";
  const firstReason = plan.topLeaveReasons[0]?.reasonLabel ?? "intro demasiado lenta";
  const secondReason = plan.topLeaveReasons[1]?.reasonLabel ?? "falta de prueba";
  const thirdReason = plan.topLeaveReasons[2]?.reasonLabel ?? "llamada a la accion demasiado tardia";
  const platform = bestPlatformLabel(analysis);

  return [
    {
      recommendation: "Prospeccion fria",
      implementation: `Apuntar a ${primary} con una version que abra con el resultado en ${platform} y ataque ${firstReason.toLowerCase()} desde el primer segundo.`,
    },
    {
      recommendation: "Retargeting de medio embudo",
      implementation: `Servir una version liderada por prueba a usuarios que vieron 50%+, corrigiendo ${secondReason.toLowerCase()} antes del segundo 4.`,
    },
    {
      recommendation: "Conversion de alta intencion",
      implementation: `Empujar una version mas directa sobre ${secondary}, adelantando la llamada a la accion y resolviendo ${thirdReason.toLowerCase()} antes de la mayor caida.`,
    },
  ];
}

function buildVersionStrategiesFallback(
  analysis: AnalysisResponse["analysis"],
  plan: ChangePlan,
): VersionStrategy[] {
  const primary = analysis.targetAudience?.primaryAudience ?? analysis.graph.bestFitAudience;
  const secondary = analysis.targetAudience?.secondaryAudience ?? "Audiencia secundaria";
  const thirdAudience =
    analysis.targetAudience?.hobbies?.[0]?.label ?? "Audiencias orientadas a storytelling";
  const keyFix = plan.actions[0]?.fix ?? "Abrir con resultado inmediato.";

  return [
    {
      id: "A",
      name: "Versión A",
      targetAudience: primary,
      direction: "Apertura de cortes rapidos para capturar atencion desde el primer frame.",
      structuralChanges: ["Abrir con el resultado", keyFix, "Meter un quiebre de patron antes del segundo 3"],
      whyItShouldResonate: "Esta version maximiza velocidad de comprension para quienes deciden quedarse o irse en muy pocos frames.",
    },
    {
      id: "B",
      name: "Versión B",
      targetAudience: secondary,
      direction: "Proof-heavy edit para perfiles mas racionales o escepticos.",
      structuralChanges: ["Mostrar evidencia temprano", "Reducir claims abstractos", "Mover la llamada a la accion junto al punto de prueba"],
      whyItShouldResonate: "Esta direccion funciona mejor cuando la audiencia necesita prueba visible para seguir mirando.",
    },
    {
      id: "C",
      name: "Versión C",
      targetAudience: thirdAudience,
      direction: "Aspiration-led edit con construccion narrativa mas emocional.",
      structuralChanges: ["Reordenar el relato", "Sostener tension en mitad del video", "Cerrar con payoff memorable"],
      whyItShouldResonate: "Busca capturar audiencias que retienen mas cuando el video construye contexto y deseo, no solo informacion.",
    },
  ];
}

function deriveSocialPosts(transcriptText: string, analysis: AnalysisResponse["analysis"]) {
  const primaryAudience =
    analysis.targetAudience?.primaryAudience ?? analysis.graph.bestFitAudience;
  const secondaryAudience =
    analysis.targetAudience?.secondaryAudience ?? "Audiencia secundaria";
  const bestPlatform = bestPlatformLabel(analysis);
  const firstFix =
    analysis.changePlan?.actions?.[0]?.fix ??
    "Abrir con el beneficio antes que con la explicacion.";
  const summarySeed = getSentenceSeed(transcriptText);
  const keywords = extractKeywords(transcriptText);
  const keywordLine =
    keywords.length > 0 ? `Temas clave: ${keywords.join(", ")}.` : "Temas clave: retencion, prueba y crecimiento.";

  return [
    {
      platform: "LinkedIn",
      angle: "Profesional, orientado a hallazgos",
      post: `${summarySeed}

Analizamos este video corto con 100 personas sinteticas antes de invertir en medios.

Hallazgos principales:
- Audiencia primaria: ${primaryAudience}
- Audiencia secundaria: ${secondaryAudience}
- Mejor plataforma inicial: ${bestPlatform}
- Cambio prioritario: ${firstFix}

${keywordLine}

Asi deberia sentirse el testing creativo antes de escalar presupuesto.`,
    },
    {
      platform: "Facebook",
      angle: "Claro y conversacional",
      post: `${summarySeed}

Antes de poner pauta, probamos como reaccionarian 100 personas sinteticas a este video.

Resultado:
Audiencia primaria: ${primaryAudience}
Audiencia secundaria: ${secondaryAudience}
Mejor plataforma: ${bestPlatform}

Siguiente mejora: ${firstFix}

Mejor creatividad significa menos desperdicio en medios.`,
    },
    {
      platform: "X",
      angle: "Rapido y directo",
      post: `Analizamos este video antes de invertir.

100 personas sinteticas.
Abandono exacto.
Curva de retencion prevista.

Audiencia principal: ${primaryAudience}
Mejor ajuste: ${firstFix}
Mejor canal: ${bestPlatform}`,
    },
    {
      platform: "Threads",
      angle: "Narrativo y amigable para creadores",
      post: `${summarySeed}

En vez de adivinar si el edit funciona, simulamos 100 personas y vimos donde se rompe la atencion.

La audiencia mas fuerte fue ${primaryAudience}, el problema principal estuvo en la apertura y el fix mas claro fue este: ${firstFix.toLowerCase()}

Asi deberia sentirse el testing creativo antes de gastar un dolar.`,
    },
  ] satisfies SocialPost[];
}

function EmptyState() {
  const router = useRouter();

  return (
    <main className="result-shell min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="result-panel rounded-[2rem] px-8 py-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Falta el análisis
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-slate-950">
            Todavía no hay un resultado listo para mostrar.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Subí un video primero. El flujo normal de resultados ahora solo muestra datos reales generados por el backend.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/app")}
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Analizar un video
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function FlowNode({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="min-w-[210px] flex-1 rounded-[1.8rem] border border-white/60 bg-white/70 px-5 py-5 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{step}</p>
      <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
    </div>
  );
}

function StoryBackdrop() {
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.35 });

  const spheres = [
    { id: "one", size: 220, left: 10, top: 12, color: "rgba(47,111,218,0.22)", driftX: -36, driftY: -28 },
    { id: "two", size: 180, left: 72, top: 16, color: "rgba(109,151,255,0.2)", driftX: 32, driftY: -18 },
    { id: "three", size: 210, left: 22, top: 62, color: "rgba(114,191,255,0.16)", driftX: -22, driftY: 30 },
    { id: "four", size: 160, left: 80, top: 68, color: "rgba(83,122,255,0.18)", driftX: 26, driftY: 24 },
  ];

  return (
    <div
      className="story-backdrop absolute inset-0 overflow-hidden rounded-[2.4rem]"
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
        const y = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
        setPointer({ x, y });
      }}
      onMouseLeave={() => setPointer({ x: 0.5, y: 0.35 })}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(245,248,255,0.76)_38%,rgba(238,244,255,0.88)_100%)]" />
      {spheres.map((sphere, index) => {
        const offsetX = (sphere.left / 100 - pointer.x) * sphere.driftX;
        const offsetY = (sphere.top / 100 - pointer.y) * sphere.driftY;

        return (
          <span
            key={sphere.id}
            className="absolute"
            style={{
              width: `${sphere.size}px`,
              height: `${sphere.size}px`,
              left: `${sphere.left}%`,
              top: `${sphere.top}%`,
              transform: `translate(${offsetX}px, ${offsetY}px)`,
            }}
          >
            <span
              className="story-sphere block h-full w-full rounded-full blur-2xl"
              style={{
                background: sphere.color,
                animationDelay: `${index * 1.1}s`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}

function UploadDemoAnimation() {
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
            <p className="upload-demo-dropzone-title">Solta el video</p>
            <p className="upload-demo-dropzone-copy">Subilo para simular la retencion</p>
          </div>
        </div>

        <div className="upload-demo-loader">
          <div className="upload-demo-loader-ring" />
          <p className="upload-demo-loader-text">Analizando...</p>
        </div>

        <div className="upload-demo-graph">
          <div className="upload-demo-graph-top">
            <span className="upload-demo-graph-label">Retencion prevista</span>
            <span className="upload-demo-graph-time">00:18</span>
          </div>
          <svg viewBox="0 0 240 120" className="upload-demo-graph-svg">
            <defs>
              <linearGradient id="uploadDemoGradient" x1="0%" x2="100%" y1="0%" y2="0%">
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
              stroke="url(#uploadDemoGradient)"
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

function StoryScreen({
  analysis,
  onProceed,
}: {
  analysis: AnalysisResponse["analysis"];
  onProceed: () => void;
}) {
  return (
    <section className="space-y-8">
      <section className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.4rem] px-6 py-12 text-center md:px-10 md:py-14">
        <StoryBackdrop />
        <div className="relative">
        <h1 className="mx-auto max-w-4xl font-display text-4xl font-semibold tracking-[-0.06em] text-slate-950 [text-shadow:0_10px_28px_rgba(255,255,255,0.62)] md:text-6xl">
          Mira quién deja de ver
          <span className="text-[#2f6fda]"> antes de gastar un dólar</span>
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-700 md:text-xl">
          Analizamos tu video como lo haría una audiencia real: predecimos retención, puntos de abandono y con qué perfiles resuena tu contenido.
        </p>
        </div>
      </section>

      <section className="result-panel mx-auto max-w-5xl rounded-[2.2rem] px-6 py-8 md:px-10 md:py-10">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Desarmamos tu video",
              body: "Analizamos voz, visuales, ritmo y texto en pantalla, segundo por segundo.",
              icon: (
                <div className="relative mx-auto h-20 w-28 rounded-[1.4rem] bg-[linear-gradient(135deg,#2f6fda,#94b9ff)] shadow-[0_14px_35px_rgba(47,111,218,0.2)]">
                  <div className="absolute inset-x-3 top-3 h-1 rounded-full bg-white/40" />
                  <div className="absolute left-4 top-7 border-y-[12px] border-l-[20px] border-y-transparent border-l-white/95" />
                  <div className="absolute bottom-3 right-3 h-5 w-5 rounded-full border-2 border-white/70" />
                </div>
              ),
            },
            {
              title: "Simulamos una audiencia real",
              body: "100 personas sintéticas con comportamientos e intereses distintos miran tu video.",
              icon: (
                <div className="mx-auto grid w-28 grid-cols-4 gap-1.5 rounded-[1.4rem] bg-[#dbe7ff] p-3 shadow-[0_14px_35px_rgba(47,111,218,0.12)]">
                  {["#f2b28b", "#7a5c4d", "#d7a174", "#5f4637", "#c79a74", "#2f6fda", "#9c6b51", "#f0c49c", "#6f4f3f", "#f5cfaa", "#496aa8", "#c88b62"].map((color, index) => (
                    <span
                      key={`${color}-${index}`}
                      className="block h-5 w-5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              ),
            },
            {
              title: "Predecimos performance y crecimiento",
              body: "Vas a ver dónde abandonan, quiénes se quedan y cómo mejorar para escalar.",
              icon: (
                <div className="relative mx-auto h-20 w-28 rounded-[1.4rem] border border-[#cfe0ff] bg-[linear-gradient(180deg,#f8fbff,#eef4ff)] shadow-[0_14px_35px_rgba(47,111,218,0.1)]">
                  <div className="absolute inset-2 bg-[linear-gradient(rgba(47,111,218,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(47,111,218,0.08)_1px,transparent_1px)] bg-[length:16px_16px]" />
                  <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full p-3">
                    <path d="M5 8 L28 12 L48 22 L70 40 L92 46" fill="none" stroke="#2f6fda" strokeWidth="3" strokeLinecap="round" />
                    <path d="M88 44 L92 46 L90 40" fill="none" stroke="#2f6fda" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              ),
            },
          ].map((item, index) => (
            <div key={item.title} className="relative text-center">
              {index < 2 ? (
                <div className="absolute right-[-14px] top-9 hidden text-2xl text-slate-300 md:block">
                  ...
                </div>
              ) : null}
              {item.icon}
              <h3 className="mx-auto mt-5 max-w-[12rem] font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {item.title}
              </h3>
              <p className="mx-auto mt-3 max-w-[15rem] text-sm leading-7 text-slate-500">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-dashed border-slate-200 pt-8">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Qué vas a obtener
          </h2>
          <div className="mt-5 grid gap-8 text-left md:grid-cols-[minmax(0,1fr),340px] md:items-center">
            <div className="grid gap-x-8 gap-y-3">
            {[
              "Curva de retención predicha",
              "Tiempos exactos de abandono con sus motivos",
              "Segmentos de audiencia que más conectan",
              "Ajustes creativos accionables",
              "Estrategia de crecimiento paga adaptada a tu video",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-[17px] leading-7 text-slate-800">
                <span className="mt-1 text-[#2f6fda]">✓</span>
                <span>{item}</span>
              </div>
            ))}
            </div>
            <UploadDemoAnimation />
          </div>
        </div>

        <div className="mt-8 border-t border-dashed border-slate-200 pt-8">
          <p className="text-lg text-slate-500">No es intuición: está construido sobre patrones de:</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "dinámicas de atención",
              "contenido short-form de alto rendimiento",
              "estructura narrativa",
              "generación de estrategia de crecimiento",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-base leading-7 text-slate-700">
                <span className="mt-1 text-[#2f6fda]">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-[1.4rem] border border-[#d9e5ff] bg-[linear-gradient(180deg,#f8fbff,#f1f6ff)] px-5 py-5 text-center">
          <div className="flex items-center justify-center gap-3 text-[#2f6fda]">
            <div className="flex gap-1">
              {Array.from({ length: 8 }).map((_, index) => (
                <span
                  key={index}
                  className="block h-2.5 w-2.5 rounded-full bg-[#2f6fda] animate-pulse"
                  style={{ animationDelay: `${index * 120}ms` }}
                />
              ))}
            </div>
            <p className="text-base font-medium text-slate-700">
              Tu informe de inteligencia creativa se está generando...
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
            {[
              "Detectando ganchos debiles...",
              "Simulando el comportamiento de la audiencia...",
              "Mapeando la estrategia de retención...",
              "Generando la estrategia de crecimiento...",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <span className="text-[#c4d7ff]">✓</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="text-center">
        <button
          type="button"
          onClick={onProceed}
          className="rounded-full bg-slate-950 px-8 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Ir al análisis
        </button>
      </div>
    </section>
  );
}

function AnalysisStepper({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <section className="sticky top-4 z-20 rounded-[1.8rem] border border-white/70 bg-white/80 p-4 shadow-[0_20px_50px_rgba(148,163,184,0.14)] backdrop-blur-xl">
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#06b6d4)] transition-all duration-500"
          style={{ width: `${((currentStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
        />
      </div>
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-9">
        {ANALYSIS_STEPS.map((step, index) => {
          const active = index === currentStep;
          const complete = index < currentStep;

          return (
            <div
              key={step.id}
              className={`rounded-[1.2rem] border px-3 py-3 text-left transition ${
                active
                  ? "border-slate-900 bg-slate-950 text-white"
                  : complete
                    ? "border-cyan-200 bg-cyan-50/85 text-cyan-950"
                    : "border-slate-200/80 bg-white/60 text-slate-600"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-70">
                {step.eyebrow}
              </p>
              <p className="mt-2 font-semibold">{step.title}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StepIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
        Analysis
      </p>
      <h2 className="font-display text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-5xl">
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-[15px]">
        {description}
      </p>
    </div>
  );
}

function getScoreColor(score: number) {
  const hue = (Math.max(0, Math.min(score, 100)) / 100) * 120;
  return `hsl(${hue} 72% 46%)`;
}

function ScoreSummaryStep({
  analysis,
}: {
  analysis: AnalysisResponse["analysis"];
}) {
  const targetScore = analysis.summary.overallScore;
  const [displayScore, setDisplayScore] = useState(0);
  const scoreColor = getScoreColor(targetScore);
  const displaySummary = hasPlaceholderSummary(analysis.summary.videoSummary)
    ? buildSummaryFromTranscript(analysis)
    : analysis.summary.videoSummary ?? analysis.summary.narrative;
  const circleRadius = 90;
  const circumference = 2 * Math.PI * circleRadius;
  const progress = Math.max(0, Math.min(displayScore, 100)) / 100;
  const dashOffset = circumference * (1 - progress);

  useEffect(() => {
    const durationMs = 1200;
    const startedAt = performance.now();
    let animationFrame = 0;

    const tick = (now: number) => {
      const elapsed = Math.min(now - startedAt, durationMs);
      const eased = 1 - (1 - elapsed / durationMs) ** 3;
      setDisplayScore(Math.round(targetScore * eased));

      if (elapsed < durationMs) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    setDisplayScore(0);
    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [analysis.sessionLabel, targetScore]);

  return (
    <section className="space-y-8">
      <StepIntro
        title="Puntaje total y resumen ejecutivo."
        description="Antes de entrar a la curva, esta pantalla responde dos preguntas: que tan fuerte es el creativo y que esta pasando realmente en el video."
      />

      <section className="grid gap-5 xl:grid-cols-[0.76fr_1.24fr]">
        <article className="result-panel rounded-[2.2rem] px-6 py-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Puntaje creativo total
          </p>
          <div className="mt-6 flex items-center justify-center">
            <div className="relative h-[280px] w-[280px]">
              <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90">
                <defs>
                  <linearGradient id="scoreGlowGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor={scoreColor} />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>
                <circle
                  cx="120"
                  cy="120"
                  r={circleRadius}
                  fill="none"
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth="16"
                />
                <circle
                  cx="120"
                  cy="120"
                  r={circleRadius}
                  fill="none"
                  stroke="url(#scoreGlowGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Puntaje
                </p>
                <p
                  className="mt-2 font-display text-6xl font-semibold tracking-[-0.08em] md:text-7xl"
                  style={{ color: scoreColor }}
                >
                  {displayScore}
                </p>
                <p className="mt-3 max-w-[11rem] text-[13px] font-medium leading-6 text-slate-600 md:text-sm">
                  {analysis.summary.overallLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {analysis.summary.pillars.map((pillar) => (
              <div
                key={pillar.label}
                className="rounded-[1.4rem] border border-slate-200/80 bg-white/80 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {pillar.label}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  {pillar.score}
                </p>
                <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-600">{pillar.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="result-panel rounded-[2.2rem] px-6 py-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Resumen del video
          </p>
          <h3 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-[-0.06em] text-slate-950 md:text-4xl">
            {analysis.summary.overallLabel}
          </h3>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 md:text-lg md:leading-9">
            {displaySummary}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              ["Duración del clip", analysis.clip.durationLabel],
              ["Mejor encaje de plataforma", analysis.crossPost.platforms[0]?.platform ?? "Instagram Reels"],
              ["Audiencia principal", analysis.graph.bestFitAudience],
              ["Abandono más común", analysis.graph.mostCommonDropOff],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.4rem] border border-slate-200/80 bg-white/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}

function GraphStep({
  analysis,
  viewerMode,
  onViewerModeChange,
}: {
  analysis: AnalysisResponse["analysis"];
  viewerMode: ViewerMode;
  onViewerModeChange: (mode: ViewerMode) => void;
}) {
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
        <StepIntro
          title="Primero, mirá la historia de retención."
          description="Esta es la prueba central. Las personas aparecen por tandas, igual que en el demo original: cada línea fina es una persona simulada y la curva brillante se actualiza a medida que se procesan más perfiles."
        />

        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Audiencia + promedio" },
            { id: "average", label: "Solo promedio" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onViewerModeChange(option.id as ViewerMode)}
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
            Repetir simulación
          </button>
        </div>
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-4">
        {[
          ["Puntaje general", `${analysis.summary.overallScore}/100`],
          ["Tiempo promedio de visualización", analysis.graph.averageWatchTime],
          ["Abandono más común", analysis.graph.mostCommonDropOff],
          ["Audiencia con mejor encaje", analysis.graph.bestFitAudience],
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

      <section className="result-panel rounded-[1.7rem] px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Estado de la simulación
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              {simulationComplete
                ? `Simulación completa. Ya procesamos las ${analysis.graph.audienceSize} personas.`
                : `Simulando el comportamiento de la audiencia: ${simulatedViewerCount} de ${analysis.graph.audienceSize} personas cargadas.`}
            </p>
          </div>
          <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            {Math.round((simulatedViewerCount / analysis.graph.audienceSize) * 100)}%
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#2f6fda,#0f172a)] transition-all duration-500"
            style={{ width: `${(simulatedViewerCount / analysis.graph.audienceSize) * 100}%` }}
          />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2.3rem] border border-white/60 bg-[linear-gradient(180deg,rgba(247,250,252,0.95),rgba(239,244,248,0.88))] px-3 py-4 md:px-6 md:py-6">
        <div className="analysis-grid absolute inset-0 opacity-40" />
        <div className="relative">
          <svg
            viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
            className="w-full"
            aria-hidden="true"
            onMouseMove={handleGraphPointerMove}
            onMouseLeave={() => setHoveredSecond(null)}
          >
            <defs>
              <linearGradient id="retentionAverage" x1="0%" x2="100%" y1="0%" y2="0%">
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
                    fontSize="12"
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
                    fontSize="12"
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
              stroke="url(#retentionAverage)"
              strokeWidth="5"
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
                    stroke="rgba(15,23,42,0.18)"
                    strokeWidth="1"
                    strokeDasharray="2 8"
                  />
                  <circle cx={x} cy={y} r="7" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
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
              r="8"
              fill="#ffffff"
              stroke="#2f6fda"
              strokeWidth="3"
            />
            <rect
              x={GRAPH_PADDING.left}
              y={GRAPH_PADDING.top}
              width={GRAPH_WIDTH - GRAPH_PADDING.left - GRAPH_PADDING.right}
              height={GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom}
              fill="transparent"
            />
          </svg>
        </div>
        <div className="mt-5 grid gap-3 border-t border-slate-200/80 pt-4 lg:grid-cols-[minmax(0,180px),minmax(0,1fr),minmax(0,140px)] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Transcript en
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {formatMoment(activeSecond)}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
              {formatTimestampLabel(activeTranscriptSegment.start)} -{" "}
              {formatTimestampLabel(activeTranscriptSegment.end)}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/70 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Fragmento hablado
            </p>
            <p className="mt-3 text-base leading-8 text-slate-700">
              {activeTranscriptSegment.text}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
              Pasá por la línea de tiempo del gráfico para ver qué están escuchando las personas en cada segundo.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/70 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Retención predicha
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {Math.round(activeAveragePoint.retention)}%
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Esto conecta el transcript con el segundo exacto dentro de la línea de tiempo real del video.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {(simulationComplete ? analysis.graph.markers : analysis.graph.markers.slice(0, 1)).map((marker) => (
          <div key={marker.label} className="border-b border-slate-200/80 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {formatTimestampLabel(marker.second)}
            </p>
            <p className="mt-2 font-semibold text-slate-950">{marker.label}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{marker.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type PersonaFilter = "top" | "early" | "diverse" | "all";

function pickInitialPersonaSelection(personas: PersonaResult[]) {
  const selected = new Map<string, PersonaResult>();
  const byRetention = [...personas].sort((left, right) => right.retention_percent - left.retention_percent);
  const byDropoff = [...personas].sort((left, right) => left.dropoff_second - right.dropoff_second);
  const byMiddle = [...personas]
    .sort((left, right) => left.dropoff_second - right.dropoff_second)
    .slice(Math.floor(personas.length * 0.25), Math.max(Math.floor(personas.length * 0.75), 10));

  for (const persona of byRetention.slice(0, 4)) {
    selected.set(persona.persona_id, persona);
  }

  for (const persona of byDropoff.slice(0, 3)) {
    selected.set(persona.persona_id, persona);
  }

  const seenReasons = new Set<string>();
  for (const persona of byMiddle) {
    const reason = persona.reason_code ?? "unclear_value";
    if (seenReasons.has(reason)) {
      continue;
    }
    seenReasons.add(reason);
    selected.set(persona.persona_id, persona);
    if (seenReasons.size >= 3) {
      break;
    }
  }

  return [...selected.values()].slice(0, 10);
}

function RawPersonasStep({
  personas,
}: {
  personas: PersonaResult[];
}) {
  const [filter, setFilter] = useState<PersonaFilter>("diverse");
  const visible = useMemo(() => {
    if (filter === "all") {
      return personas;
    }
    if (filter === "early") {
      return [...personas].sort((left, right) => left.dropoff_second - right.dropoff_second).slice(0, 10);
    }
    if (filter === "top") {
      return [...personas].sort((left, right) => right.retention_percent - left.retention_percent).slice(0, 10);
    }
    return pickInitialPersonaSelection(personas);
  }, [filter, personas]);

  return (
    <section className="space-y-8">
      <StepIntro
        title="Las 100 personas sinteticas, sin caja negra."
        description="Este es el USP central del producto. Antes de resumir nada, mostramos la data cruda: a quien simulamos, que atributo representa, cuando abandona, que tramo del video evalua y por que toma esa decision."
      />

      <section className="result-panel rounded-[2.2rem] px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Dataset de audiencia sintetica
            </p>
            <h3 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-slate-950">
              100 personas simuladas con nombre, arquetipo y evidencia.
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["top", "Top retencion"],
              ["early", "Abandono temprano"],
              ["diverse", "Razones distintas"],
              ["all", "Ver las 100"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id as PersonaFilter)}
                className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                  filter === id
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="mt-6 rounded-[1.6rem] border border-slate-200/80 bg-white/85 px-5 py-6 text-sm leading-7 text-slate-600">
            Este resultado no trae todavia la tabla completa de personas. Volve a correr el analisis con el backend actualizado para ver las 100 personas sinteticas completas.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {visible.map((persona) => (
            <article key={persona.persona_id} className="rounded-[1.6rem] border border-slate-200/80 bg-white/85 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                      style={{ backgroundColor: `${persona.color}22`, color: persona.color }}
                    >
                      {persona.archetype ?? "Persona"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {persona.demographic_profile_label ?? persona.demographic_cluster ?? persona.age_range}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {persona.decision_stage ?? "etapa"}
                    </span>
                  </div>
                  <h4 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {cleanPersonaName(persona.name)}
                  </h4>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {[persona.age_range, persona.country, persona.income_bracket, persona.social_status].filter(Boolean).join(" / ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Abandono
                  </p>
                  <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                    {formatMoment(persona.dropoff_second)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{persona.retention_percent}% retencion</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Motivo principal
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {persona.reason_label ?? "Sin clasificar"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{persona.why_they_left}</p>
                </div>
                <div className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Resumen de interaccion
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{persona.summary_of_interacion}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <div className="rounded-[1.2rem] border border-emerald-100 bg-emerald-50/70 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Que le gusto
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {persona.liked_moment ?? "Conecta cuando la promesa se vuelve mas concreta."}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-rose-100 bg-rose-50/70 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                    Que la hizo irse
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {persona.disliked_moment ?? persona.why_they_left}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Evidencia del video
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {persona.evidence_start_second !== undefined
                      ? `${formatMoment(persona.evidence_start_second)} - ${formatMoment(persona.evidence_end_second ?? persona.evidence_start_second)}`
                      : formatMoment(persona.dropoff_second)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {persona.evidence_excerpt ?? "Todavia no hay extracto puntual de evidencia para esta persona."}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function SegmentDropoffStep({
  segments,
  diagnoses,
}: {
  segments: PersonaSegment[];
  diagnoses: SegmentDiagnosis[];
}) {
  const best = segments[0];
  const second = segments[1];
  const worst = segments[segments.length - 1];

  return (
    <section className="space-y-8">
      <StepIntro
        title="Que segmentos se quedan y cuales se van."
        description="Aca la simulacion se vuelve estrategica: encontramos el mejor encaje, el segundo mejor y el peor, y explicamos exactamente por que cada grupo abandona."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[best, second, worst].map((segment, index) => {
          if (!segment) {
            return null;
          }

          const title =
            index === 0 ? "Audiencia con mejor encaje" : index === 1 ? "Segundo mejor encaje" : "Peor encaje";

          return (
            <article key={`${title}-${segment.label}`} className="result-panel rounded-[1.8rem] px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {title}
              </p>
              <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {segment.label}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {segment.support} personas · {segment.averageRetention}% de retencion media · abandono mediano en {formatMoment(segment.medianDropoffSecond)}
              </p>
              <p className="mt-4 rounded-[1.2rem] border border-slate-200/80 bg-white/80 px-4 py-4 text-sm leading-7 text-slate-700">
                Principal fuga: {segment.dominantReasonLabel}
              </p>
              {segment.sampleEvidence?.length ? (
                <div className="mt-4 space-y-2 rounded-[1.2rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                  {segment.sampleEvidence.map((sample) => (
                    <p key={`${segment.label}-${sample.name}`} className="text-sm leading-7 text-slate-600">
                      {sample.name}: {sample.reasonLabel} en {formatMoment(sample.dropoffSecond)}. {sample.evidenceExcerpt}
                    </p>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <section className="result-panel rounded-[2.2rem] px-6 py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Diagnostico de abandono por segmento
        </p>
        <div className="mt-6 space-y-4">
          {diagnoses.map((item) => (
            <article key={item.label} className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 px-5 py-5">
              <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {item.label}
              </p>
              <p className="mt-3 text-base font-semibold text-slate-900">
                Abandona en {formatMoment(item.dropoffSecond)}: {item.reasonLabel}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.why}</p>
              {item.examples?.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {item.examples.map((example) => (
                    <div
                      key={`${item.label}-${example.name}`}
                      className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {example.name} · {formatMoment(example.dropoffSecond)}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {example.reasonLabel}. {example.evidenceExcerpt}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function TimelineStep({
  analysis,
  timeline,
}: {
  analysis: AnalysisResponse["analysis"];
  timeline: TimelineInsight[];
}) {
  const duration = Math.max(analysis.graph.durationSeconds, 1);
  const laidOutTimeline = useMemo(() => layoutTimelineInsights(timeline, duration), [timeline, duration]);
  const laneOffsets = [8, 50, 92];
  const lineTop = 166;

  return (
    <section className="space-y-8">
      <StepIntro
        title="Make the video timeline actionable."
        description="This is where the product stops being a dashboard and starts behaving like a strategist. Every annotation is tied to a moment in the edit so the next creative decision is obvious."
      />

      <section className="result-panel overflow-hidden rounded-[2.2rem] px-6 py-8">
        <div className="md:hidden">
          <div className="space-y-3">
            {laidOutTimeline.map((item) => (
              <div key={item.id} className="rounded-[1.2rem] border border-slate-200 bg-white/80 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {formatMoment(item.second)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-4 hidden h-[220px] md:block">
          <div
            className="absolute left-0 right-0 h-[2px] bg-slate-200"
            style={{ top: `${lineTop}px` }}
          />

          {laidOutTimeline.map((item) => {
            const left = `${item.leftPercent}%`;
            const top = laneOffsets[item.lane] ?? laneOffsets[laneOffsets.length - 1];
            const connectorHeight = Math.max(lineTop - top - 70, 22);
            const dotClasses =
              item.tone === "opportunity"
                ? "border-emerald-200 bg-emerald-500"
                : "border-slate-900 bg-slate-950";

            return (
              <div
                key={item.id}
                className="absolute w-40 -translate-x-1/2"
                style={{ left, top: `${top}px` }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-[1.1rem] border border-slate-200 bg-white/92 px-3 py-3 shadow-[0_10px_24px_rgba(148,163,184,0.14)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {formatMoment(item.second)}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{item.label}</p>
                  </div>
                  <div className="w-px bg-slate-300" style={{ height: `${connectorHeight}px` }} />
                  <span className={`block h-4 w-4 rounded-full border-4 ${dotClasses}`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {timeline.map((item) => (
            <article
              key={item.id}
              className={`rounded-[1.6rem] border px-5 py-5 ${
                item.tone === "opportunity"
                  ? "border-emerald-200 bg-emerald-50/80"
                  : "border-slate-200 bg-white/80"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {item.label}
                </p>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {formatTimestampLabel(item.second)}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ChangePlanStep({
  plan,
}: {
  plan: ChangePlan;
}) {
  return (
    <section className="space-y-8">
      <StepIntro
        title="Que cambiar en el video."
        description="Cada accion nace del transcript, la curva de retencion, la llamada a la accion y las razones de abandono. No es copy generico: son cambios ubicados en el tiempo del video."
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="result-panel rounded-[2rem] px-6 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Plan de cambios
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">{plan.summary}</p>
          <div className="mt-6 space-y-4">
            {plan.actions.map((action) => (
              <article key={`${action.title}-${action.timestamp ?? "none"}`} className="rounded-[1.4rem] border border-slate-200/80 bg-white/85 px-5 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {action.title}
                  </h3>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {action.timestamp == null ? "Sin timestamp" : formatMoment(action.timestamp)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{action.reason}</p>
                <p className="mt-3 rounded-[1.1rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-800">
                  {action.fix}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="result-panel rounded-[2rem] px-6 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Top leaving reasons
          </p>
          <div className="mt-5 space-y-4">
            {plan.topLeaveReasons.map((item) => (
              <article key={item.reasonCode} className="rounded-[1.4rem] border border-slate-200/80 bg-white/85 px-4 py-4">
                <p className="font-semibold text-slate-950">{item.reasonLabel}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {item.count} personas · abandono medio {formatMoment(item.averageDropoffSecond)}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.example}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {plan.reasonFixes.map((item) => (
              <div key={`${item.reasonCode}-fix`} className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-700">
                <span className="font-semibold text-slate-900">{item.reasonLabel}:</span> {item.action}
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function MediaTargetingStep({
  recommendations,
}: {
  recommendations: MediaTargetingRecommendation[];
}) {
  return (
    <section className="space-y-8">
      <StepIntro
        title="Recomendacion de medios."
        description="Esta es la salida mas valiosa para una agencia: como transformar lo creativo en estructura de compra de medios y secuencias de pauta."
      />

      <section className="result-panel rounded-[2rem] px-6 py-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {recommendations.map((item) => (
            <article key={item.recommendation} className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Recomendación
              </p>
              <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {item.recommendation}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.implementation}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function VersionStrategiesStep({
  versions,
}: {
  versions: VersionStrategy[];
}) {
  return (
    <section className="space-y-8">
      <StepIntro
        title="Tres versiones para iterar el creativo."
        description="No mostramos solo analitica: proponemos tres direcciones creativas distintas para que el equipo sepa que variantes producir."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {versions.map((version) => (
          <article key={version.id} className="result-panel rounded-[1.8rem] px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Variante {version.id}
            </p>
            <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              {version.name}
            </h3>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Audiencia objetivo: {version.targetAudience}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{version.direction}</p>
            <div className="mt-5 space-y-2">
              {version.structuralChanges.map((item) => (
                <div key={item} className="rounded-[1.1rem] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm leading-7 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600">{version.whyItShouldResonate}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CrosspostStep({
  posts,
  selectedPlatform,
  onSelectPlatform,
  onCopy,
  copiedPlatform,
}: {
  posts: SocialPost[];
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  onCopy: (platform: string, text: string) => void;
  copiedPlatform: string | null;
}) {
  const activePost = posts.find((post) => post.platform === selectedPlatform) ?? posts[0];

  return (
    <section className="space-y-8">
      <StepIntro
        title="Genera posts para redes desde el transcript."
        description="El paso final convierte la lectura del video en texto listo para usar en plataformas sociales, para que el analisis termine en distribucion y no solo en diagnostico."
      />

      <section className="result-panel rounded-[2.2rem] px-6 py-8">
        <div className="flex flex-wrap gap-2">
          {posts.map((post) => (
            <button
              key={post.platform}
              type="button"
              onClick={() => onSelectPlatform(post.platform)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selectedPlatform === post.platform
                  ? "border-slate-900 bg-slate-950 text-white"
                  : "border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300"
              }`}
            >
              {post.platform}
            </button>
          ))}
        </div>

        {activePost ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.32fr_0.68fr]">
            <div className="space-y-4">
              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/80 px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Tono
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{activePost.angle}</p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/80 px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Uso recomendado
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Armado desde el transcript y la audiencia con mejor retencion, despues adaptado para formatos donde manda el texto.
                </p>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-slate-200/80 bg-white/85 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Post generado
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{activePost.platform}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(activePost.platform, activePost.post)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  {copiedPlatform === activePost.platform ? "Copiado" : "Copiar texto"}
                </button>
              </div>

              <pre className="mt-5 whitespace-pre-wrap rounded-[1.4rem] bg-slate-950 px-5 py-5 text-sm leading-7 text-slate-100">
                {activePost.post}
              </pre>
            </div>
          </div>
        ) : null}
      </section>
    </section>
  );
}

function StepFooter({
  currentStep,
  onBack,
  onNext,
  onReturnToStory,
}: {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  onReturnToStory: () => void;
}) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === ANALYSIS_STEPS.length - 1;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onReturnToStory}
        className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        Volver a la explicación
      </button>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Paso anterior
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isLast}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLast ? "Completado" : "Siguiente paso"}
        </button>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("id");
  const demoMode = searchParams.get("demo");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [ready, setReady] = useState(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>("story");
  const [currentStep, setCurrentStep] = useState(0);
  const [viewerMode, setViewerMode] = useState<ViewerMode>("all");
  const [selectedPlatform, setSelectedPlatform] = useState("LinkedIn");
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const allowDevDemo =
      process.env.NODE_ENV === "development" && demoMode === "1";
    const demoAnalysis = allowDevDemo ? createDemoAnalysis() : null;
    const stored = demoAnalysis ? null : parseStoredAnalysis(analysisId);
    const resolvedAnalysis = demoAnalysis || stored;

    startTransition(() => {
      setAnalysis(resolvedAnalysis ? normalizeAnalysisPayload(resolvedAnalysis) : null);
      setReady(true);
    });
  }, [analysisId, demoMode]);

  const featuredPersonas = useMemo(() => {
    if (!analysis) {
      return [] as PersonaInsight[];
    }

    if (analysis.analysis.personas?.length) {
      return derivePersonaInsightsFromBackend(
        analysis.analysis.personas,
        analysis.analysis.graph.strongestAdAngle,
      );
    }

    return derivePersonaInsights(
      analysis.analysis.graph.viewers,
      analysis.analysis.graph.durationSeconds,
      analysis.analysis.graph.strongestAdAngle,
    );
  }, [analysis]);

  const rawPersonas = useMemo(
    () => analysis?.analysis.personas ?? [],
    [analysis],
  );

  const personaSegments = useMemo(() => {
    if (!analysis) {
      return [] as PersonaSegment[];
    }

    return (
      analysis.analysis.personaSegments ??
      analysis.analysis.targetAudience?.personaSegments ??
      buildPersonaSegmentsFromRaw(rawPersonas)
    );
  }, [analysis, rawPersonas]);

  const segmentDiagnoses = useMemo(() => {
    if (!analysis) {
      return [] as SegmentDiagnosis[];
    }

    return analysis.analysis.segmentDiagnoses ?? buildSegmentDiagnosesFromRaw(rawPersonas);
  }, [analysis, rawPersonas]);

  const timeline = useMemo(() => {
    if (!analysis) {
      return [] as TimelineInsight[];
    }

    if (analysis.analysis.timelineInsights?.length) {
      return mapTimelineInsights(analysis.analysis.timelineInsights);
    }

    return deriveTimelineInsights(analysis.analysis, featuredPersonas);
  }, [analysis, featuredPersonas]);

  const changePlan = useMemo(() => {
    if (!analysis) {
      return null;
    }

    return analysis.analysis.changePlan ?? buildChangePlanFallback(analysis.analysis);
  }, [analysis]);

  const mediaTargeting = useMemo(() => {
    if (!analysis || !changePlan) {
      return [] as MediaTargetingRecommendation[];
    }

    return analysis.analysis.mediaTargeting ?? buildMediaTargetingFallback(analysis.analysis, changePlan);
  }, [analysis, changePlan]);

  const versionStrategies = useMemo(() => {
    if (!analysis || !changePlan) {
      return [] as VersionStrategy[];
    }

    return analysis.analysis.versionStrategies ?? buildVersionStrategiesFallback(analysis.analysis, changePlan);
  }, [analysis, changePlan]);

  const socialPosts = useMemo(() => {
    if (!analysis) {
      return [] as SocialPost[];
    }

    return deriveSocialPosts(
      analysis.analysis.transcript?.text ||
        analysis.analysis.transcriptText ||
        analysis.analysis.summary.narrative,
      analysis.analysis,
    );
  }, [analysis]);

  useEffect(() => {
    if (!socialPosts.length) {
      return;
    }

    setSelectedPlatform(socialPosts[0].platform);
  }, [socialPosts]);

  if (!ready) {
    return (
      <main className="result-shell min-h-screen px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="placeholder-wave h-24 rounded-[2rem]" />
          <div className="placeholder-wave h-64 rounded-[2rem]" />
          <div className="placeholder-wave h-[460px] rounded-[2rem]" />
        </div>
      </main>
    );
  }

  if (!analysis || !changePlan) {
    return <EmptyState />;
  }

  const step = ANALYSIS_STEPS[currentStep];

  const handleCopy = async (platform: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlatform(platform);
      window.setTimeout(() => {
        setCopiedPlatform((current) => (current === platform ? null : current));
      }, 1800);
    } catch {
      setCopiedPlatform(null);
    }
  };

  return (
    <main className="result-shell min-h-screen overflow-x-hidden px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {screenMode === "story" ? (
          <StoryScreen analysis={analysis.analysis} onProceed={() => setScreenMode("analysis")} />
        ) : (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {analysis.analysis.productName}
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {analysis.analysis.clip.fileName}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/app")}
                  className="rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  Analizar otro video
                </button>
                <button
                  type="button"
                  onClick={() => setScreenMode("story")}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Volver a la explicación
                </button>
              </div>
            </div>

            <AnalysisStepper currentStep={currentStep} />

            <section key={step.id} className="result-stage-enter space-y-8 rounded-[2.4rem] px-1 py-2">
              {step.id === "score" ? <ScoreSummaryStep analysis={analysis.analysis} /> : null}

              {step.id === "raw-personas" ? (
                <RawPersonasStep personas={rawPersonas} />
              ) : null}

              {step.id === "segment-dropoff" ? (
                <SegmentDropoffStep
                  segments={personaSegments}
                  diagnoses={segmentDiagnoses}
                />
              ) : null}

              {step.id === "retention" ? (
                <GraphStep
                  analysis={analysis.analysis}
                  viewerMode={viewerMode}
                  onViewerModeChange={setViewerMode}
                />
              ) : null}

              {step.id === "timeline" ? (
                <TimelineStep analysis={analysis.analysis} timeline={timeline} />
              ) : null}

              {step.id === "changes" ? <ChangePlanStep plan={changePlan} /> : null}

              {step.id === "targeting" ? (
                <MediaTargetingStep recommendations={mediaTargeting} />
              ) : null}

              {step.id === "versions" ? (
                <VersionStrategiesStep versions={versionStrategies} />
              ) : null}

              {step.id === "crosspost" ? (
                <CrosspostStep
                  posts={socialPosts}
                  selectedPlatform={selectedPlatform}
                  onSelectPlatform={setSelectedPlatform}
                  onCopy={handleCopy}
                  copiedPlatform={copiedPlatform}
                />
              ) : null}

              <StepFooter
                currentStep={currentStep}
                onBack={() => setCurrentStep((current) => Math.max(current - 1, 0))}
                onNext={() =>
                  setCurrentStep((current) =>
                    Math.min(current + 1, ANALYSIS_STEPS.length - 1),
                  )
                }
                onReturnToStory={() => setScreenMode("story")}
              />
            </section>
          </section>
        )}
      </div>
    </main>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={<div className="px-4 py-12 text-slate-500">Cargando resultado...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
