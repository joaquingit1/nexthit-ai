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
  type AudienceDistributionItem,
  type ChangePlan,
  type MediaTargetingRecommendation,
  type PersonaResult,
  type PersonaSegment,
  type SavingsROI,
  type SegmentDiagnosis,
  type TargetAudience,
  type TimelineInsightItem,
  type TranscriptSegment,
  type VersionStrategy,
  type ViewerSimulation,
} from "@/lib/analysis";
import { buildBrowserBackendUrl } from "@/lib/backend";

type ViewerMode = "all" | "average";

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
    description: "Puntaje general del video con metricas clave de rendimiento y resumen ejecutivo.",
  },
  {
    id: "raw-personas",
    title: "100 Personas Sinteticas",
    eyebrow: "Paso 2",
    description: "Dataset completo de audiencia simulada: perfil demografico, momento de abandono y motivo.",
  },
  {
    id: "audience",
    title: "Insights de Audiencia",
    eyebrow: "Paso 3",
    description: "Distribucion de genero, edad, paises, hobbies y nichos con mejor respuesta esperada.",
  },
  {
    id: "retention",
    title: "Curva de Retencion",
    eyebrow: "Paso 4",
    description: "Visualizacion de la retencion proyectada basada en simulacion de 100 personas.",
  },
  {
    id: "timeline",
    title: "Momentos Clave",
    eyebrow: "Paso 5",
    description: "Mapa temporal de momentos criticos que impactan la retencion del video.",
  },
  {
    id: "changes",
    title: "Acciones",
    eyebrow: "Paso 6",
    description: "Lista de tareas concretas para mejorar el rendimiento del video.",
  },
  {
    id: "targeting",
    title: "Estrategia de Medios",
    eyebrow: "Paso 7",
    description: "Configuracion de segmentacion para campanas publicitarias basada en el analisis.",
  },
  {
    id: "versions",
    title: "Variantes Creativas",
    eyebrow: "Paso 8",
    description: "Tres propuestas de iteracion del video optimizadas para diferentes objetivos.",
  },
  {
    id: "savings",
    title: "Ahorro Estimado",
    eyebrow: "Paso 9",
    description: "Calculo del ahorro monetario y de tiempo al aplicar los cambios sugeridos vs re-grabar el video.",
  },
] as const;

const GRAPH_WIDTH = 550;
const GRAPH_HEIGHT = 200;
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

function hashPersonaSeed(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createPersonaRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let temp = Math.imul(state ^ (state >>> 15), 1 | state);
    temp ^= temp + Math.imul(temp ^ (temp >>> 7), 61 | temp);
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeHandleToken(token: string) {
  return token
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function buildPersonaIdentity(name: string, personaId: string) {
  const cleanName = cleanPersonaName(name);
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const first = normalizeHandleToken(parts[0] ?? "user");
  const last = normalizeHandleToken(parts[parts.length - 1] ?? "viewer");
  const f = first.slice(0, 1) || "u";
  const l = last.slice(0, 1) || "v";
  const random = createPersonaRandom(hashPersonaSeed(`${cleanName}:${personaId}`));
  const random4 = String(1000 + Math.floor(random() * 9000));
  const random2to4 = String(10 + Math.floor(random() * 9990));
  const words = ["nova", "pixel", "loop", "signal", "tempo", "glow", "orbit", "frame", "spark", "wave", "scope", "story"];
  const randomWord = words[Math.floor(random() * words.length)] ?? "signal";
  const patterns = [
    `@${first}_${last}`,
    `@${f}${last}`,
    `@${f}${last}${random4}`,
    `@${first}${random2to4}`,
    `@${randomWord}_${first}_${random4}`,
    `@${first}.${last}`,
    `@${first}${l}${random4}`,
    `@${randomWord}.${first}`,
  ];

  return {
    handle: patterns[Math.floor(random() * patterns.length)] ?? `@${first}_${last}`,
    initials: `${(parts[0]?.[0] ?? "U").toUpperCase()}${(parts[parts.length - 1]?.[0] ?? "P").toUpperCase()}`,
  };
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
  if (analysis.videoAnalysis?.summary?.trim()) {
    return analysis.videoAnalysis.summary.trim();
  }
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

async function fetchAnalysisByJobId(jobId: string) {
  const response = await fetch(buildBrowserBackendUrl(`/api/analysis/jobs/${jobId}/result`), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No se pudo recuperar el resultado del backend.");
  }

  return (await response.json()) as AnalysisResponse;
}

function createDemoAnalysis() {
  return createAnalysisPayload({
    texto:
      "Este video muestra como un equipo creativo puede predecir la retencion antes de lanzar medios pagos. El sistema desarma el clip en voz, ritmo, visuales y texto en pantalla, simula 100 personas espectadoras y convierte esas senales en estrategia de plataforma y crecimiento pago.",
    fileName: "nexthit-demo.mp4",
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
      label: "Hook dÃ©bil",
      second: Math.max(0.8, Math.min(dropMoment || 1.2, 2.4)),
      detail:
        "La primera decisiÃ³n de seguir o abandonar ocurre antes de que aparezca la prueba mÃ¡s fuerte. MostrÃ¡ el resultado antes que la explicaciÃ³n.",
      tone: "risk",
    },
    {
      id: "energy",
      label: "CaÃ­da de energÃ­a",
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

function roundNumber(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
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

function buildAudienceBreakdownFromScalar(
  personas: PersonaResult[],
  key: "gender" | "country" | "age_range",
  limit?: number,
): AudienceDistributionItem[] {
  const totals = new Map<string, { score: number; retention: number; support: number }>();
  let overall = 0;

  for (const persona of personas) {
    const label = String(persona[key] ?? "").trim();
    if (!label) continue;
    const weight =
      typeof persona.weighted_retention_score === "number"
        ? persona.weighted_retention_score
        : persona.retention_percent * (persona.language_affinity_multiplier ?? 1);
    const current = totals.get(label) ?? { score: 0, retention: 0, support: 0 };
    current.score += weight;
    current.retention += persona.retention_percent;
    current.support += 1;
    totals.set(label, current);
    overall += weight;
  }

  const rows = [...totals.entries()]
    .map(([label, stats]) => ({
      label,
      percentage: roundNumber((stats.score / Math.max(overall, 1)) * 100, 1),
      averageRetention: roundNumber(stats.retention / Math.max(stats.support, 1), 1),
      support: stats.support,
    }))
    .sort((left, right) => right.percentage - left.percentage);

  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

function buildAudienceBreakdownFromList(
  personas: PersonaResult[],
  key: "hobbies" | "niche_tags",
  limit = 6,
  minSupport = 5,
): AudienceDistributionItem[] {
  const totals = new Map<string, { score: number; retention: number; support: number }>();
  let overall = 0;

  for (const persona of personas) {
    const labels = (persona[key] ?? []).map((label) => String(label).trim()).filter(Boolean);
    for (const label of labels) {
      const weight =
        typeof persona.weighted_retention_score === "number"
          ? persona.weighted_retention_score
          : persona.retention_percent * (persona.language_affinity_multiplier ?? 1);
      const current = totals.get(label) ?? { score: 0, retention: 0, support: 0 };
      current.score += weight;
      current.retention += persona.retention_percent;
      current.support += 1;
      totals.set(label, current);
      overall += weight;
    }
  }

  return [...totals.entries()]
    .map(([label, stats]) => ({
      label,
      percentage: roundNumber((stats.score / Math.max(overall, 1)) * 100, 1),
      averageRetention: roundNumber(stats.retention / Math.max(stats.support, 1), 1),
      support: stats.support,
    }))
    .filter((item) => (item.support ?? 0) >= minSupport)
    .sort((left, right) => right.percentage - left.percentage)
    .slice(0, limit);
}

function buildAudienceInsightsFallback(personas: PersonaResult[]): TargetAudience {
  const genderBreakdown = buildAudienceBreakdownFromScalar(personas, "gender", 3);
  const countryBreakdown = buildAudienceBreakdownFromScalar(personas, "country", 6);
  const ageBreakdown = buildAudienceBreakdownFromScalar(personas, "age_range", 7);
  const topHobbies = buildAudienceBreakdownFromList(personas, "hobbies", 6, 5);
  const topNiches = buildAudienceBreakdownFromList(personas, "niche_tags", 6, 5);
  const primaryAudience =
    `${genderBreakdown[0]?.label ?? "Audiencia"} de ${ageBreakdown[0]?.label ?? "25-34"} en ${countryBreakdown[0]?.label ?? "mercados compatibles"}`;
  const secondaryAudience =
    `${genderBreakdown[1]?.label ?? genderBreakdown[0]?.label ?? "Audiencia"} de ${ageBreakdown[1]?.label ?? ageBreakdown[0]?.label ?? "18-24"} en ${countryBreakdown[1]?.label ?? countryBreakdown[0]?.label ?? "mercados compatibles"}`;
  const audienceSummary = `La mejor respuesta aparece en ${primaryAudience.toLowerCase()}.`;

  return {
    primaryAudience,
    secondaryAudience,
    audienceSummary,
    genderBreakdown,
    countryBreakdown,
    ageBreakdown,
    topHobbies,
    topNiches,
    countries: countryBreakdown,
    ageRanges: ageBreakdown,
    interests: topNiches,
    hobbies: topHobbies,
    socialStatus: [],
    incomeBrackets: [],
    personaSegments: [],
  };
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
      name: "VersiÃ³n A",
      targetAudience: primary,
      direction: "Apertura de cortes rapidos para capturar atencion desde el primer frame.",
      structuralChanges: ["Abrir con el resultado", keyFix, "Meter un quiebre de patron antes del segundo 3"],
      whyItShouldResonate: "Esta version maximiza velocidad de comprension para quienes deciden quedarse o irse en muy pocos frames.",
    },
    {
      id: "B",
      name: "VersiÃ³n B",
      targetAudience: secondary,
      direction: "Proof-heavy edit para perfiles mas racionales o escepticos.",
      structuralChanges: ["Mostrar evidencia temprano", "Reducir claims abstractos", "Mover la llamada a la accion junto al punto de prueba"],
      whyItShouldResonate: "Esta direccion funciona mejor cuando la audiencia necesita prueba visible para seguir mirando.",
    },
    {
      id: "C",
      name: "VersiÃ³n C",
      targetAudience: thirdAudience,
      direction: "Aspiration-led edit con construccion narrativa mas emocional.",
      structuralChanges: ["Reordenar el relato", "Sostener tension en mitad del video", "Cerrar con payoff memorable"],
      whyItShouldResonate: "Busca capturar audiencias que retienen mas cuando el video construye contexto y deseo, no solo informacion.",
    },
  ];
}

function buildSavingsRoiFallback(
  analysis: AnalysisResponse["analysis"],
  plan: ChangePlan,
): SavingsROI {
  const duration = Math.max(analysis.graph.durationSeconds || 15, 1);
  const changeCount = Math.max(plan.actions.length, 1);
  const complexityLevel: SavingsROI["complexity_level"] =
    changeCount >= 6 ? "high" : changeCount >= 4 ? "medium" : "low";

  // Multiplicador base: por cada $1 en edicion, ahorrarias $X vs regrabar
  // Basado en la complejidad y duracion del video
  const baseMultiplier = complexityLevel === "high" ? 2.2 : complexityLevel === "medium" ? 2.8 : 3.5;
  const durationFactor = Math.min(1 + (duration / 60) * 0.3, 1.5);
  const savingsMultiplier = Math.round(baseMultiplier * durationFactor * 10) / 10;

  const estimatedReshootCost = Math.round(duration * 18 + changeCount * 45 + 180);
  const estimatedEditCost = Math.round(duration * 6 + changeCount * 20 + 60);
  const savingsAmount = Math.max(estimatedReshootCost - estimatedEditCost, 0);
  const savingsPercent = estimatedReshootCost
    ? Math.round((savingsAmount / estimatedReshootCost) * 100)
    : 0;
  const timeSavedHours = Math.max(2, Math.round((duration / 12 + changeCount * 0.8) * 10) / 10);

  return {
    estimated_reshoot_cost: estimatedReshootCost,
    estimated_edit_cost: estimatedEditCost,
    savings_amount: savingsAmount,
    savings_percent: savingsPercent,
    savings_multiplier: savingsMultiplier,
    time_saved_hours: timeSavedHours,
    complexity_level: complexityLevel,
    recommendation:
      complexityLevel === "high"
        ? "El volumen de cambios es alto, pero sigue siendo mas eficiente que regrabar."
        : "Aplica los cambios sobre la edicion actual antes de considerar regrabar.",
  };
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
            Falta el anÃ¡lisis
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-slate-950">
            TodavÃ­a no hay un resultado listo para mostrar.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            SubÃ­ un video primero. El flujo normal de resultados ahora solo muestra datos reales generados por el backend.
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
          Mira quiÃ©n deja de ver
          <span className="text-[#2f6fda]"> antes de gastar un dÃ³lar</span>
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-700 md:text-xl">
          Analizamos tu video como lo harÃ­a una audiencia real: predecimos retenciÃ³n, puntos de abandono y con quÃ© perfiles resuena tu contenido.
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
              body: "100 personas sintÃ©ticas con comportamientos e intereses distintos miran tu video.",
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
              body: "Vas a ver dÃ³nde abandonan, quiÃ©nes se quedan y cÃ³mo mejorar para escalar.",
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
            QuÃ© vas a obtener
          </h2>
          <div className="mt-5 grid gap-8 text-left md:grid-cols-[minmax(0,1fr),340px] md:items-center">
            <div className="grid gap-x-8 gap-y-3">
            {[
              "Curva de retenciÃ³n predicha",
              "Tiempos exactos de abandono con sus motivos",
              "Segmentos de audiencia que mÃ¡s conectan",
              "Ajustes creativos accionables",
              "Estrategia de crecimiento paga adaptada a tu video",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-[17px] leading-7 text-slate-800">
                <svg className="mt-1.5 h-4 w-4 flex-shrink-0 text-[#2f6fda]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{item}</span>
              </div>
            ))}
            </div>
            <UploadDemoAnimation />
          </div>
        </div>

        <div className="mt-8 border-t border-dashed border-slate-200 pt-8">
          <p className="text-lg text-slate-500">No es intuiciÃ³n: estÃ¡ construido sobre patrones de:</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "dinÃ¡micas de atenciÃ³n",
              "contenido short-form de alto rendimiento",
              "estructura narrativa",
              "generaciÃ³n de estrategia de crecimiento",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-base leading-7 text-slate-700">
                <svg className="mt-1.5 h-4 w-4 flex-shrink-0 text-[#2f6fda]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
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
              Tu informe de inteligencia creativa se estÃ¡ generando...
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
            {[
              "Detectando ganchos debiles...",
              "Simulando el comportamiento de la audiencia...",
              "Mapeando la estrategia de retenciÃ³n...",
              "Generando la estrategia de crecimiento...",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <svg className="h-3.5 w-3.5 text-[#c4d7ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
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
          Ir al anÃ¡lisis
        </button>
      </div>
    </section>
  );
}

function AnalysisStepper({
  currentStep,
  maxReachedStep,
  onStepClick,
}: {
  currentStep: number;
  maxReachedStep: number;
  onStepClick: (step: number) => void;
}) {
  const shortTitles: Record<string, string> = {
    "Puntaje y Resumen": "Puntaje",
    "100 Personas Sinteticas": "Personas",
    "Analisis por Segmento": "Segmentos",
    "Curva de Retencion": "Retencion",
    "Momentos Clave": "Momentos",
    "Acciones": "Acciones",
    "Estrategia de Medios": "Medios",
    "Variantes Creativas": "Variantes",
    "Ahorro Estimado": "Ahorro",
  };

  const stepIcons: Record<string, React.ReactNode> = {
    score: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />,
    "raw-personas": <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
    audience: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6h9m-9 6h9m-9 6h5.25M5.25 3.75h13.5A1.5 1.5 0 0120.25 5.25v13.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z" />,
    retention: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />,
    timeline: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    changes: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    targeting: <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />,
    versions: <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />,
    savings: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />,
  };

  return (
    <section className="sticky top-4 z-20">
      <div className="flex rounded-full border border-slate-200/80 bg-white/90 p-1 shadow-sm backdrop-blur-xl">
        {ANALYSIS_STEPS.map((step, index) => {
          const active = index === currentStep;
          const reachable = index <= maxReachedStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => reachable && onStepClick(index)}
              disabled={!reachable}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : reachable
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    : "cursor-not-allowed text-slate-300"
              }`}
            >
              <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                {stepIcons[step.id]}
              </svg>
              {shortTitles[step.title] || step.title}
            </button>
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
  // Blue (220) to Cyan (185) based on score
  const hue = 220 - (Math.max(0, Math.min(score, 100)) / 100) * 35;
  return `hsl(${hue} 72% 52%)`;
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
        title="Puntaje y resumen"
        description="Que tan fuerte es el video y que esta pasando en cada momento."
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
                <p className="mt-2 max-w-[9rem] text-[11px] font-medium leading-4 text-slate-500">
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
              ["DuraciÃ³n del clip", analysis.clip.durationLabel],
              ["Mejor encaje de plataforma", analysis.crossPost.platforms[0]?.platform ?? "Instagram Reels"],
              ["Audiencia principal", analysis.graph.bestFitAudience],
              ["Abandono mÃ¡s comÃºn", analysis.graph.mostCommonDropOff],
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
          title="Curva de retencion"
          description="Cada linea es una persona simulada. La curva brillante muestra el promedio de retencion en cada segundo."
        />

        <div className="flex flex-wrap items-center gap-2">
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
            Repetir simulaciÃ³n
          </button>
          {!simulationComplete && (
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">
              <svg className="h-3.5 w-3.5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-medium text-blue-700">
                {simulatedViewerCount}/{analysis.graph.audienceSize}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-4">
        {[
          ["Puntaje general", `${analysis.summary.overallScore}/100`],
          ["Tiempo promedio de visualizaciÃ³n", analysis.graph.averageWatchTime],
          ["Abandono mÃ¡s comÃºn", analysis.graph.mostCommonDropOff],
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

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* Chart */}
        <section className="relative overflow-hidden rounded-[2.3rem] border border-white/60 bg-[linear-gradient(180deg,rgba(247,250,252,0.95),rgba(239,244,248,0.88))] px-3 py-4 md:px-6 md:py-6 max-h-[340px]">
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
            </svg>
          </div>
        </section>

        {/* Sidebar derecho - mÃ©tricas compactas */}
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
                RetenciÃ³n
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

      {/* Fragmento hablado - abajo */}
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
          PasÃ¡ el mouse por el grÃ¡fico para ver quÃ© estÃ¡n escuchando en cada segundo.
        </p>
      </div>
    </section>
  );
}

const PERSONAS_PER_PAGE = 6;
type RawPersonaFilter = "retention" | "early" | "reasons" | "all";

function sortPersonasForDisplay(personas: PersonaResult[]) {
  return [...personas].sort((left, right) => {
    const leftOrder = left.presentation_order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.presentation_order ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    if (right.retention_percent !== left.retention_percent) {
      return right.retention_percent - left.retention_percent;
    }
    return left.dropoff_second - right.dropoff_second;
  });
}

function buildDistinctReasonPersonas(personas: PersonaResult[]) {
  const remaining = [...sortPersonasForDisplay(personas)];
  const selected: PersonaResult[] = [];
  const usedReasons = new Set<string>();
  const usedCountries = new Set<string>();
  const usedGenders = new Set<string>();

  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    remaining.forEach((persona, index) => {
      let score = persona.retention_percent * 2.6;
      if (persona.reason_code && !usedReasons.has(persona.reason_code)) {
        score += 18;
      }
      if (persona.country && !usedCountries.has(persona.country)) {
        score += 10;
      }
      if (persona.gender && !usedGenders.has(persona.gender)) {
        score += 8;
      }
      if (selected.length) {
        const previous = selected[selected.length - 1];
        if (previous.reason_code && previous.reason_code === persona.reason_code) {
          score -= 8;
        }
        if (previous.country && previous.country === persona.country) {
          score -= 5;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const [chosen] = remaining.splice(bestIndex, 1);
    selected.push(chosen);
    if (chosen.reason_code) {
      usedReasons.add(chosen.reason_code);
    }
    if (chosen.country) {
      usedCountries.add(chosen.country);
    }
    if (chosen.gender) {
      usedGenders.add(chosen.gender);
    }
  }

  return selected;
}

function RawPersonasStep({
  personas,
}: {
  personas: PersonaResult[];
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<RawPersonaFilter>("retention");
  const [selectedPersona, setSelectedPersona] = useState<PersonaResult | null>(null);
  const orderedPersonas = useMemo(() => sortPersonasForDisplay(personas), [personas]);
  const filteredPersonas = useMemo(() => {
    const byRetention = [...orderedPersonas].sort(
      (left, right) =>
        right.retention_percent - left.retention_percent ||
        right.dropoff_second - left.dropoff_second,
    );
    const byEarly = [...orderedPersonas].sort(
      (left, right) =>
        left.dropoff_second - right.dropoff_second ||
        left.retention_percent - right.retention_percent,
    );
    const byReasons = buildDistinctReasonPersonas(orderedPersonas);

    return {
      retention: byRetention,
      early: byEarly,
      reasons: byReasons,
      all: orderedPersonas,
    } satisfies Record<RawPersonaFilter, PersonaResult[]>;
  }, [orderedPersonas]);

  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilter, personas]);

  const activePersonas = filteredPersonas[activeFilter];
  const totalPages = Math.ceil(activePersonas.length / PERSONAS_PER_PAGE);
  const startIndex = currentPage * PERSONAS_PER_PAGE;
  const visible = activePersonas.slice(startIndex, startIndex + PERSONAS_PER_PAGE);
  const selectedPersonaIdentity = selectedPersona
    ? buildPersonaIdentity(selectedPersona.name, selectedPersona.persona_id)
    : null;

  return (
    <section className="space-y-8">
      <StepIntro
        title="100 personas sinteticas"
        description="Perfiles simulados con datos demograficos, momento de abandono y motivo de salida."
      />

      <section className="result-panel rounded-[2.2rem] px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Dataset de audiencia sintetica
            </p>
            <h3 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-slate-950">
              {personas.length} personas simuladas
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Mostrando {activePersonas.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + PERSONAS_PER_PAGE, activePersonas.length)} de {activePersonas.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              disabled={currentPage === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="min-w-[80px] text-center text-sm font-semibold text-slate-700">
              {totalPages === 0 ? 0 : currentPage + 1} / {Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
              disabled={currentPage >= totalPages - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { id: "retention", label: "Top retencion" },
            { id: "early", label: "Abandono temprano" },
            { id: "reasons", label: "Razones distintas" },
            { id: "all", label: "Ver las 100" },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id as RawPersonaFilter)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeFilter === filter.id
                  ? "border-slate-900 bg-slate-950 text-white"
                  : "border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="mt-6 rounded-[1.6rem] border border-slate-200/80 bg-white/85 px-5 py-6 text-sm leading-7 text-slate-600">
            Este resultado no trae todavia la tabla completa de personas. Volve a correr el analisis con el backend actualizado para ver las 100 personas sinteticas completas.
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          {visible.map((persona) => {
            const identity = buildPersonaIdentity(persona.name, persona.persona_id);

            return (
            <article
              key={persona.persona_id}
              onClick={() => setSelectedPersona(persona)}
              className="cursor-pointer rounded-xl border border-slate-200/80 bg-white/85 px-5 py-4 transition-all hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${persona.color}, rgba(15, 23, 42, 0.92))`,
                  }}
                >
                  {identity.initials}
                </div>
                <div
                  className="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: persona.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-950">
                        {cleanPersonaName(persona.name)}
                      </h4>
                      <p className="mt-0.5 text-sm font-medium text-slate-400">
                        {identity.handle}
                      </p>
                    </div>
                    <span className="text-sm text-slate-500">
                      {[persona.gender, persona.age_range, persona.country, persona.native_language?.toUpperCase()].filter(Boolean).join(" · ")}
                    </span>
                    <span className="ml-auto text-sm font-medium text-slate-700">
                      Abandono: {formatMoment(persona.dropoff_second)} ({persona.retention_percent}%)
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">{persona.reason_label ?? "Sin clasificar"}:</span>{" "}
                    {persona.why_they_left}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div>
                      <span className="text-emerald-600">+</span>{" "}
                      <span className="text-slate-600">{persona.liked_moment ?? "Conecta con la promesa"}</span>
                    </div>
                    <div>
                      <span className="text-rose-500">âˆ’</span>{" "}
                      <span className="text-slate-600">{persona.disliked_moment ?? persona.why_they_left}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
            );
          })}
        </div>

        {/* Modal */}
        {selectedPersona && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
            onClick={() => setSelectedPersona(null)}
          >
            <div
              className="relative mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPersona(null)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${selectedPersona.color}, rgba(15, 23, 42, 0.92))`,
                  }}
                >
                  {selectedPersonaIdentity?.initials}
                </div>
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: selectedPersona.color }}
                />
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: `${selectedPersona.color}22`, color: selectedPersona.color }}
                >
                  {selectedPersona.gender ?? "Audiencia"}
                </span>
              </div>

              <h3 className="mt-3 text-2xl font-bold text-slate-900">
                {cleanPersonaName(selectedPersona.name)}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-400">
                {selectedPersonaIdentity?.handle}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {[selectedPersona.age_range, selectedPersona.country, selectedPersona.income_bracket, selectedPersona.social_status].filter(Boolean).join(" Â· ")}
              </p>

              <div className="mt-4 flex items-center gap-4 rounded-xl bg-slate-100 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{formatMoment(selectedPersona.dropoff_second)}</p>
                  <p className="text-xs text-slate-500">Abandono</p>
                </div>
                <div className="h-8 w-px bg-slate-300" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{selectedPersona.retention_percent}%</p>
                  <p className="text-xs text-slate-500">Retencion</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Motivo de abandono</p>
                <p className="mt-1 font-medium text-slate-800">{selectedPersona.reason_label ?? "Sin clasificar"}</p>
                <p className="mt-1 text-sm text-slate-600">{selectedPersona.why_they_left}</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Que le gusto</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {selectedPersona.liked_moment ?? "Conecta cuando la promesa se vuelve mas concreta."}
                  </p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Que la hizo irse</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {selectedPersona.disliked_moment ?? selectedPersona.why_they_left}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Evidencia del video</p>
                <p className="mt-1 font-medium text-slate-800">
                  {selectedPersona.evidence_start_second !== undefined
                    ? `${formatMoment(selectedPersona.evidence_start_second)} - ${formatMoment(selectedPersona.evidence_end_second ?? selectedPersona.evidence_start_second)}`
                    : formatMoment(selectedPersona.dropoff_second)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedPersona.evidence_excerpt ?? "Sin extracto de evidencia disponible."}
                </p>
              </div>

              {selectedPersona.summary_of_interacion && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Resumen de interaccion</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedPersona.summary_of_interacion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-6 flex justify-center gap-1">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentPage(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentPage ? "w-6 bg-slate-900" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        ) : null}
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
  const [currentPage, setCurrentPage] = useState(0);
  const diagnosesPerPage = 6;
  const totalPages = Math.ceil(diagnoses.length / diagnosesPerPage);
  const startIndex = currentPage * diagnosesPerPage;
  const visibleDiagnoses = diagnoses.slice(startIndex, startIndex + diagnosesPerPage);
  const best = segments[0];
  const second = segments[1];
  const worst = segments[segments.length - 1];
  const maxRetention = Math.max(...segments.map((segment) => segment.averageRetention), 1);

  return (
    <section className="space-y-8">
      <StepIntro
        title="Segmentos de audiencia"
        description="Grupos de audiencia con tasas de retencion y causas de abandono."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[best, second, worst].map((segment, index) => {
          if (!segment) {
            return null;
          }

          const title = index === 0 ? "Mejor encaje" : index === 1 ? "Segundo mejor" : "Menor encaje";
          const borderColor =
            index === 0 ? "border-emerald-200" : index === 1 ? "border-amber-200" : "border-rose-200";
          const bgColor =
            index === 0 ? "bg-emerald-50/50" : index === 1 ? "bg-amber-50/50" : "bg-rose-50/50";
          const progressColor =
            segment.averageRetention >= 70 ? "bg-emerald-500" : segment.averageRetention >= 50 ? "bg-amber-500" : "bg-rose-500";

          return (
            <article key={`${title}-${segment.label}`} className={`result-panel rounded-[1.8rem] border-2 ${borderColor} ${bgColor} px-5 py-5`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {title}
              </p>
              <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {segment.label}
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Retencion</span>
                  <span className="font-semibold text-slate-900">{segment.averageRetention}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor}`}
                    style={{ width: `${(segment.averageRetention / maxRetention) * 100}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/80 px-3 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Personas</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{segment.support}</p>
                </div>
                <div className="rounded-xl bg-white/80 px-3 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Abandono</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{formatMoment(segment.medianDropoffSecond)}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200/80 bg-white/60 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Causa principal</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{segment.dominantReasonLabel}</p>
              </div>
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Diagnostico detallado por segmento
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Mostrando {startIndex + 1}-{Math.min(startIndex + diagnosesPerPage, diagnoses.length)} de {diagnoses.length}
            </p>
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                disabled={currentPage === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="min-w-[80px] text-center text-sm font-semibold text-slate-700">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                disabled={currentPage >= totalPages - 1}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {visibleDiagnoses.map((item, index) => (
            <article key={item.label} className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {item.label}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {formatMoment(item.dropoffSecond)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
                      {item.reasonLabel}
                    </span>
                  </div>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                  {startIndex + index + 1}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.why}</p>
              {item.examples?.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {item.examples.map((example) => (
                    <div
                      key={`${item.label}-${example.name}`}
                      className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {example.name} Â· {formatMoment(example.dropoffSecond)}
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
        {totalPages > 1 ? (
          <div className="mt-6 flex justify-center gap-1">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentPage(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentPage ? "w-6 bg-slate-900" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}

function AudienceInsightsStep({
  audience,
}: {
  audience: TargetAudience;
}) {
  const genderBreakdown = audience.genderBreakdown ?? [];
  const ageBreakdown = audience.ageBreakdown ?? audience.ageRanges;
  const countryBreakdown = audience.countryBreakdown ?? audience.countries;
  const topHobbies = audience.topHobbies ?? audience.hobbies;
  const topNiches = audience.topNiches ?? audience.interests;
  const palette = ["#2563eb", "#38bdf8", "#93c5fd"];

  let start = 0;
  const pieGradient = genderBreakdown.length
    ? genderBreakdown
        .map((item, index) => {
          const end = start + item.percentage;
          const segment = `${palette[index % palette.length]} ${start}% ${end}%`;
          start = end;
          return segment;
        })
        .join(", ")
    : "#cbd5e1 0 100%";

  const renderBars = (rows: AudienceDistributionItem[], tone: "blue" | "slate" = "blue") => (
    <div className="space-y-3">
      {rows.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{item.percentage}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${tone === "blue" ? "bg-gradient-to-r from-blue-600 to-cyan-400" : "bg-slate-900"}`}
              style={{ width: `${Math.max(item.percentage, 4)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Retencion media {item.averageRetention ?? 0}%{item.support ? ` Â· soporte ${item.support}` : ""}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <section className="space-y-8">
      <StepIntro
        title="Insights de audiencia"
        description="Lectura tipo plataforma social sobre quienes mejor responden al video: genero, edad, paises, hobbies y nichos."
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="result-panel rounded-[2.2rem] px-6 py-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-slate-50">
              <div className="h-36 w-36 rounded-full" style={{ background: `conic-gradient(${pieGradient})` }} />
              <div className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-white text-center shadow-sm">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Genero</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{genderBreakdown[0]?.label ?? "-"}</p>
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Resumen de audiencia</p>
              <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {audience.primaryAudience}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {audience.audienceSummary ?? "Esta lectura resume quien sostiene mejor la retencion ajustada por idioma y performance esperada."}
              </p>
              {genderBreakdown.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {genderBreakdown.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{item.percentage}%</p>
                      <p className="mt-1 text-xs text-slate-500">Retencion media {item.averageRetention ?? 0}%</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="result-panel rounded-[2.2rem] px-6 py-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Edades con mejor respuesta</p>
          <div className="mt-5">{renderBars(ageBreakdown.slice(0, 7))}</div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="result-panel rounded-[2.2rem] px-6 py-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Paises con mejor performance esperada</p>
          <div className="mt-5">{renderBars(countryBreakdown.slice(0, 6))}</div>
        </section>

        <section className="result-panel rounded-[2.2rem] px-6 py-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Contextos destacados</p>
          <div className="mt-5 grid gap-3">
            {[
              { title: "Primario", value: audience.primaryAudience },
              { title: "Secundario", value: audience.secondaryAudience },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.title}</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {topHobbies.length ? (
          <section className="result-panel rounded-[2.2rem] px-6 py-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Top hobbies a targetear</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {topHobbies.map((item) => (
                <div key={item.label} className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  {item.label} Â· {item.percentage}%
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {topNiches.length ? (
          <section className="result-panel rounded-[2.2rem] px-6 py-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Top nichos con mejor ajuste</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {topNiches.map((item) => (
                <div key={item.label} className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  {item.label} Â· {item.percentage}%
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
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
  const [selectedId, setSelectedId] = useState<string | null>(laidOutTimeline[0]?.id ?? null);
  const selectedItem = timeline.find((t) => t.id === selectedId) ?? timeline[0];
  const laneOffsets = [8, 50, 92];
  const lineTop = 166;

  return (
    <section className="space-y-8">
      <StepIntro
        title="Momentos clave"
        description="Puntos importantes del video con recomendaciones para cada uno."
      />

      <section className="result-panel overflow-hidden rounded-[2.2rem] px-6 py-8">
        <div className="md:hidden">
          <div className="space-y-3">
            {laidOutTimeline.map((item) => {
              const isSelected = item.id === selectedId;
              const fullItem = timeline.find((t) => t.id === item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-[1.2rem] border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {formatMoment(item.second)}
                    </span>
                  </div>
                  {isSelected && fullItem && (
                    <p className="mt-3 text-sm leading-7 text-slate-600">{fullItem.detail}</p>
                  )}
                </button>
              );
            })}
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
            const isSelected = item.id === selectedId;
            const dotClasses =
              item.tone === "opportunity"
                ? isSelected
                  ? "border-emerald-400 bg-emerald-500 ring-4 ring-emerald-100"
                  : "border-emerald-200 bg-emerald-500"
                : isSelected
                  ? "border-slate-700 bg-slate-950 ring-4 ring-slate-200"
                  : "border-slate-900 bg-slate-950";

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className="absolute w-40 -translate-x-1/2 cursor-pointer"
                style={{ left, top: `${top}px` }}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`rounded-[1.1rem] border bg-white/92 px-3 py-3 transition ${
                      isSelected
                        ? "border-slate-400 shadow-[0_10px_28px_rgba(15,23,42,0.18)]"
                        : "border-slate-200 shadow-[0_10px_24px_rgba(148,163,184,0.14)] hover:border-slate-300"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {formatMoment(item.second)}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{item.label}</p>
                  </div>
                  <div className="w-px bg-slate-300" style={{ height: `${connectorHeight}px` }} />
                  <span className={`block h-4 w-4 rounded-full border-4 transition ${dotClasses}`} />
                </div>
              </button>
            );
          })}
        </div>

        {selectedItem && (
          <div
            className={`mt-8 hidden rounded-[1.4rem] border px-5 py-5 md:block ${
              selectedItem.tone === "opportunity"
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-slate-200 bg-slate-50/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  selectedItem.tone === "opportunity" ? "bg-emerald-500" : "bg-slate-900"
                }`}
              />
              <p className="font-display text-lg font-semibold tracking-[-0.03em] text-slate-950">
                {selectedItem.label}
              </p>
              <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {formatMoment(selectedItem.second)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{selectedItem.detail}</p>
          </div>
        )}
      </section>
    </section>
  );
}

function ChangePlanStep({
  plan,
}: {
  plan: ChangePlan;
}) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [completedFixes, setCompletedFixes] = useState<Set<string>>(new Set());

  const toggleAction = (key: string) => {
    setCompletedActions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleFix = (key: string) => {
    setCompletedFixes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalTasks = plan.actions.length + plan.reasonFixes.length;
  const completedCount = completedActions.size + completedFixes.size;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <section className="space-y-8">
      <StepIntro
        title="Acciones"
        description="Lista de cambios para mejorar el video. Marca cada uno como completado."
      />

      <section className="result-panel rounded-[2.2rem] px-6 py-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Progreso
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {completedCount} de {totalTasks} completadas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-600">{progressPercent}%</span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600">{plan.summary}</p>

        <div className="mt-8 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Cambios en el video
          </p>
          {plan.actions.map((action) => {
            const key = `${action.title}-${action.timestamp ?? "none"}`;
            const isComplete = completedActions.has(key);

            return (
              <button
                type="button"
                key={key}
                onClick={() => toggleAction(key)}
                className={`group w-full rounded-[1.2rem] border px-5 py-4 text-left transition ${
                  isComplete
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-200/80 bg-white/85 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${
                      isComplete
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                    }`}
                  >
                    {isComplete && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`font-semibold transition ${
                          isComplete ? "text-slate-400 line-through" : "text-slate-900"
                        }`}
                      >
                        {action.title}
                      </h3>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {action.timestamp == null ? "General" : formatMoment(action.timestamp)}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-sm leading-6 transition ${
                        isComplete ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {action.fix}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Resolver razones de abandono
          </p>
          {plan.reasonFixes.map((item) => {
            const key = `${item.reasonCode}-fix`;
            const isComplete = completedFixes.has(key);

            return (
              <button
                type="button"
                key={key}
                onClick={() => toggleFix(key)}
                className={`group w-full rounded-[1.2rem] border px-5 py-4 text-left transition ${
                  isComplete
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-200/80 bg-white/85 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${
                      isComplete
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                    }`}
                  >
                    {isComplete && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-semibold transition ${
                        isComplete ? "text-slate-400 line-through" : "text-slate-900"
                      }`}
                    >
                      {item.reasonLabel}
                    </p>
                    <p
                      className={`mt-1 text-sm leading-6 transition ${
                        isComplete ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {item.action}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
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
        title="Estrategia de medios"
        description="Recomendaciones para campanas publicitarias."
      />

      <section className="result-panel rounded-[2.2rem] px-6 py-7">
        <div className="space-y-4">
          {recommendations.map((item, index) => (
            <article
              key={item.recommendation}
              className="rounded-[1.4rem] border border-slate-200/80 bg-white/85 px-5 py-5"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    {item.recommendation}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.implementation}
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

function VersionStrategiesStep({
  versions,
}: {
  versions: VersionStrategy[];
}) {
  const versionColors = [
    { bg: "bg-emerald-50", border: "border-emerald-200", accent: "bg-emerald-500", label: "text-emerald-600" },
    { bg: "bg-blue-50", border: "border-blue-200", accent: "bg-blue-500", label: "text-blue-600" },
    { bg: "bg-violet-50", border: "border-violet-200", accent: "bg-violet-500", label: "text-violet-600" },
  ];

  return (
    <section className="space-y-8">
      <StepIntro
        title="Variantes creativas"
        description="Tres versiones alternativas del video para testear."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {versions.map((version, index) => {
          const colors = versionColors[index % 3];
          return (
            <article key={version.id} className={`result-panel rounded-[1.8rem] border-2 ${colors.border} ${colors.bg} px-5 py-5`}>
              <div className="flex items-center justify-between">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${colors.accent} text-sm font-bold text-white`}>
                  {version.id}
                </span>
                <svg className={`h-5 w-5 ${colors.label}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                {version.name}
              </h3>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1">
                <span className="text-xs font-semibold text-slate-600">{version.targetAudience}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{version.direction}</p>
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cambios estructurales</p>
                <div className="mt-2 space-y-2">
                  {version.structuralChanges.map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-xl bg-white/60 px-3 py-2">
                      <svg className={`mt-0.5 h-4 w-4 flex-shrink-0 ${colors.label}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      </svg>
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-white/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Por que funciona</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{version.whyItShouldResonate}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SavingsROIStep({
  savingsRoi,
}: {
  savingsRoi: SavingsROI | undefined;
}) {
  const [budget, setBudget] = useState(1000);
  const rawMultiplier = savingsRoi?.savings_multiplier ?? 3;
  const multiplier = Math.round(rawMultiplier * 10) / 10;
  const savingsMultiple = Math.round((multiplier - 1) * 10) / 10;
  const savingsFromBudget = Math.round(budget * (multiplier - 1));
  const editCost = Math.round(budget);
  const reshootCost = Math.round(budget * multiplier);

  const complexityLabels = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
  };

  const complexityColors = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <section className="space-y-8">
      <StepIntro
        title="Ahorro estimado"
        description="Calcula cuanto ahorrarias aplicando cambios en vez de regrabar."
      />

      <section className="result-panel rounded-[2.2rem] px-6 py-7">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
              {multiplier}x
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-slate-950">Multiplo de ahorro</p>
              <p className="text-sm font-medium text-slate-900">Por cada $1 en edicion, ahorrarias ${savingsMultiple}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tiempo ahorrado</p>
              <p className="font-display text-xl font-semibold text-slate-900">{savingsRoi?.time_saved_hours ?? 2}h</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ahorro</p>
              <p className="font-display text-xl font-semibold text-slate-900">{Math.round(((multiplier - 1) / multiplier) * 100)}%</p>
            </div>
          </div>
        </div>

        <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Presupuesto</span>
          <span className="text-sm font-semibold text-slate-400">$</span>
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="h-1.5 w-40 cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
          />
          <input
            type="number"
            min={100}
            max={50000}
            value={budget}
            onChange={(e) => setBudget(Math.max(100, Number(e.target.value) || 100))}
            className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-right text-sm font-semibold text-slate-900 focus:border-slate-400 focus:outline-none"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Costo de edicion
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-slate-900">
              ${editCost.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Costo de regrabar
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-red-500">
              ${reshootCost.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Tu ahorro
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-emerald-500">
              ${savingsFromBudget.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm text-slate-600">{savingsRoi?.recommendation ?? "Aplica los cambios sobre la edicion actual."}</p>
          <span className={`ml-4 flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${complexityColors[savingsRoi?.complexity_level ?? "low"]}`}>
            {complexityLabels[savingsRoi?.complexity_level ?? "low"]}
          </span>
        </div>
      </section>
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
        title="Posts para redes"
        description="Texto listo para publicar en redes sociales."
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
}: {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === ANALYSIS_STEPS.length - 1;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div />

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
  const [currentStep, setCurrentStep] = useState(0);
  const [maxReachedStep, setMaxReachedStep] = useState(ANALYSIS_STEPS.length - 1);
  const [viewerMode, setViewerMode] = useState<ViewerMode>("all");
  const [selectedPlatform, setSelectedPlatform] = useState("LinkedIn");
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (typeof window === "undefined") {
      return;
    }

    setReady(false);

    const loadAnalysis = async () => {
      const allowDevDemo =
        process.env.NODE_ENV === "development" && demoMode === "1";
      const demoAnalysis = allowDevDemo ? createDemoAnalysis() : null;

      try {
        let resolvedAnalysis = demoAnalysis;

        if (!resolvedAnalysis) {
          resolvedAnalysis = parseStoredAnalysis(analysisId);
        }

        if (!resolvedAnalysis && analysisId) {
          resolvedAnalysis = await fetchAnalysisByJobId(analysisId);
        }

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setAnalysis(resolvedAnalysis ? normalizeAnalysisPayload(resolvedAnalysis) : null);
          setReady(true);
        });
      } catch (error) {
        console.error("No se pudo cargar el resultado:", error);

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setAnalysis(null);
          setReady(true);
        });
      }
    };

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
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

  const audienceInsights = useMemo(() => {
    if (!analysis) {
      return null as TargetAudience | null;
    }

    const targetAudience = analysis.analysis.targetAudience;
    if (
      targetAudience?.genderBreakdown?.length ||
      targetAudience?.countryBreakdown?.length ||
      targetAudience?.ageBreakdown?.length
    ) {
      return targetAudience;
    }

    return rawPersonas.length ? buildAudienceInsightsFallback(rawPersonas) : targetAudience ?? null;
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

  const savingsRoi = useMemo(() => {
    if (!analysis || !changePlan) {
      return undefined;
    }
    return analysis.analysis.savingsRoi ?? buildSavingsRoiFallback(analysis.analysis, changePlan);
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
        <div className="space-y-5">
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

  const handleExportPDF = async () => {
    try {
      const response = await fetch(buildBrowserBackendUrl("/api/export/pdf"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis: analysis.analysis,
          job_id: analysis.job_id || analysis.id,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo generar el PDF.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analisis-${analysis.job_id || analysis.id || "nexthit"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      window.alert(error instanceof Error ? error.message : "No se pudo generar el PDF.");
    }
  };

  return (
    <main className="result-shell min-h-screen overflow-x-hidden px-4 py-5 md:px-6 md:py-6">
      <div className="space-y-6">
        <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/analisis")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-700"
                  title="Volver"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-black md:text-3xl">
                  {analysis.analysis.clip.generatedTitle || analysis.analysis.clip.fileName}
                </h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleExportPDF()}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar PDF
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/app")}
                  className="rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  Analizar otro video
                </button>
              </div>
            </div>

            <AnalysisStepper
              currentStep={currentStep}
              maxReachedStep={maxReachedStep}
              onStepClick={setCurrentStep}
            />

            <section key={step.id} className="result-stage-enter space-y-8 rounded-[2.4rem] px-1 py-2">
              {step.id === "score" ? <ScoreSummaryStep analysis={analysis.analysis} /> : null}

              {step.id === "raw-personas" ? (
                <RawPersonasStep personas={rawPersonas} />
              ) : null}

              {step.id === "audience" && audienceInsights ? (
                <AudienceInsightsStep audience={audienceInsights} />
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

              {step.id === "savings" ? (
                <SavingsROIStep savingsRoi={savingsRoi} />
              ) : null}

              <StepFooter
                currentStep={currentStep}
                onBack={() => setCurrentStep((current) => Math.max(current - 1, 0))}
                onNext={() => {
                  const nextStep = Math.min(currentStep + 1, ANALYSIS_STEPS.length - 1);
                  setCurrentStep(nextStep);
                  setMaxReachedStep((current) => Math.max(current, nextStep));
                }}
              />
            </section>
        </section>
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


