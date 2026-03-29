export type AnalysisPoint = {
  second: number;
  retention: number;
};

export type ScoreCard = {
  label: string;
  score: number;
  note: string;
};

export type ViewerSimulation = {
  id: string;
  handle: string;
  segment: string;
  color: string;
  wave: number;
  points: AnalysisPoint[];
  dropOffSecond: number;
};

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
  visual_description?: string;
  scene_labels?: string[];
  on_screen_text?: string[];
  visual_confidence?: number;
  creative_signals?: string[];
  retention_impact?: "positive" | "neutral" | "negative" | string;
};

export type TranscriptData = {
  text: string;
  language: string;
  segments: TranscriptSegment[];
};

export type PersonaResult = {
  persona_id: string;
  name: string;
  presentation_order?: number;
  archetype?: string;
  demographic_profile_id?: string;
  demographic_profile_label?: string;
  demographic_cluster?: string;
  age_range: string;
  country: string;
  occupation: string;
  income_bracket: string;
  social_status: string;
  interests: string[];
  hobbies: string[];
  life_story: string;
  platform_habits: string;
  motivations: string[];
  frustrations: string[];
  segment_label: string;
  color: string;
  batch_index: number;
  dropoff_second: number;
  retention_percent: number;
  reason_code?: string;
  reason_label?: string;
  why_they_left: string;
  summary_of_interacion: string;
  liked_moment?: string;
  disliked_moment?: string;
  evidence_start_second?: number;
  evidence_end_second?: number;
  evidence_excerpt?: string;
  decision_stage?: "hook" | "desarrollo" | "prueba" | "cta" | "cierre";
};

export type AudienceDistributionItem = {
  label: string;
  percentage: number;
  averageRetention?: number;
  note?: string;
};

export type TargetAudience = {
  primaryAudience: string;
  secondaryAudience: string;
  countries: AudienceDistributionItem[];
  ageRanges: AudienceDistributionItem[];
  interests: AudienceDistributionItem[];
  hobbies: AudienceDistributionItem[];
  socialStatus: AudienceDistributionItem[];
  incomeBrackets: AudienceDistributionItem[];
  personaSegments?: PersonaSegment[];
};

export type PersonaSegment = {
  label: string;
  archetype?: string;
  demographicCluster?: string;
  support: number;
  averageRetention: number;
  medianDropoffSecond: number;
  dominantReasonCode: string;
  dominantReasonLabel: string;
  samplePersonas: string[];
  sampleEvidence?: {
    name: string;
    dropoffSecond: number;
    reasonLabel?: string;
    evidenceExcerpt?: string;
  }[];
};

export type SegmentDiagnosis = {
  label: string;
  dropoffSecond: number;
  reasonCode: string;
  reasonLabel: string;
  why: string;
  examples?: {
    name: string;
    dropoffSecond: number;
    reasonLabel?: string;
    evidenceExcerpt?: string;
  }[];
};

export type ChangeAction = {
  title: string;
  timestamp: number | null;
  reason: string;
  fix: string;
};

export type ChangeReasonFix = {
  reasonCode: string;
  reasonLabel: string;
  action: string;
};

export type ChangePlan = {
  summary?: string;
  firstSpeechTime?: number;
  silentIntroCutSeconds?: number | null;
  biggestDropSecond?: number;
  cta?: {
    ctaPresent: boolean;
    ctaTimestamp: number | null;
    ctaText: string;
    recommendedNewTimestamp: number | null;
  };
  actions: ChangeAction[];
  topLeaveReasons: {
    reasonCode: string;
    reasonLabel: string;
    count: number;
    averageDropoffSecond: number;
    example: string;
  }[];
  reasonFixes: ChangeReasonFix[];
};

export type MediaTargetingRecommendation = {
  recommendation: string;
  implementation: string;
};

export type VersionStrategy = {
  id: string;
  name: string;
  targetAudience: string;
  direction: string;
  structuralChanges: string[];
  whyItShouldResonate: string;
};

export type SavingsROI = {
  estimated_reshoot_cost: number;
  estimated_edit_cost: number;
  savings_amount: number;
  savings_percent: number;
  savings_multiplier: number;
  recommendation: string;
  time_saved_hours: number;
  complexity_level: "low" | "medium" | "high";
};

export type TimelineInsightItem = {
  id: string;
  label: string;
  second: number;
  detail: string;
  tone: "risk" | "opportunity";
};

export type VideoAnalysisResult = {
  summary: string;
  hook: string;
  visual_style: string;
  pacing_notes: string;
  on_screen_text_notes: string;
  cta_notes: string;
  strongest_points?: string[];
  weaknesses?: string[];
  creative_fixes?: string[];
  best_platform?: string;
  primary_angle?: string;
  key_moments?: TimelineInsightItem[];
  timeline_insights?: TimelineInsightItem[];
  source_model?: string;
  scores?: {
    overall_score: number;
    hook_score: number;
    clarity_score: number;
    pacing_score: number;
    audio_score: number;
    visual_score: number;
    novelty_score: number;
    cta_score: number;
    platform_fit_score: number;
    viral_score: number;
    conversion_score: number;
    ad_readiness_score: number;
  };
};

export type VideoScoreSummary = {
  id: string;
  video_id: string;
  overall_score: number;
  hook_score: number;
  clarity_score: number;
  pacing_score: number;
  audio_score: number;
  visual_score: number;
  novelty_score: number;
  cta_score: number;
  platform_fit_score: number;
  viral_score: number;
  conversion_score: number;
  ad_readiness_score: number;
};

export type UploadInitResponse = {
  video_id: string;
  bucket: string;
  object_path: string;
};

export type AnalysisJobEnvelope = {
  job_id: string;
  video_id: string;
  status: string;
  stage: string;
  progress_percent: number;
  events_url: string;
  result_url: string;
  error_message?: string | null;
};

export type AnalysisStreamEvent = {
  type: string;
  job_id: string;
  video_id: string;
  status?: string;
  stage?: string;
  progress_percent?: number;
  sequence?: number;
  payload?: unknown;
  timestamp?: string;
};

export type InsightMarker = {
  second: number;
  retention: number;
  label: string;
  detail: string;
};

export type MetricBreakdown = {
  name: string;
  score: number;
  explanation: string;
};

export type RecommendationCard = {
  title: string;
  issue: string;
  action: string;
  example: string;
};

export type PlatformStrategy = {
  platform: string;
  fit: number;
  tag: string;
  verdict: string;
  adaptations: string[];
};

export type AnalysisResponse = {
  id: string;
  status: "success";
  video_id?: string;
  job_id?: string;
  analysis: {
    productName: string;
    sessionLabel: string;
    generatedAt: string;
    transcriptText?: string;
    transcript?: TranscriptData;
    personas?: PersonaResult[];
    targetAudience?: TargetAudience;
    personaSegments?: PersonaSegment[];
    segmentDiagnoses?: SegmentDiagnosis[];
    timelineInsights?: TimelineInsightItem[];
    changePlan?: ChangePlan;
    mediaTargeting?: MediaTargetingRecommendation[];
    versionStrategies?: VersionStrategy[];
    savingsRoi?: SavingsROI;
    videoAnalysis?: VideoAnalysisResult | null;
    scoreSummary?: VideoScoreSummary;
    statusSteps: string[];
    clip: {
      fileName: string;
      generatedTitle?: string;
      mediaType: string;
      sizeLabel: string;
      durationLabel: string;
      label: string;
    };
    summary: {
      overallScore: number;
      overallLabel: string;
      narrative: string;
      videoSummary?: string;
      pillars: ScoreCard[];
    };
    graph: {
      title: string;
      subtitle: string;
      durationSeconds: number;
      audienceSize: number;
      averageWatchTime: string;
      mostCommonDropOff: string;
      bestFitAudience: string;
      strongestAdAngle: string;
      topAudienceSegment: string;
      markers: InsightMarker[];
      viewers: ViewerSimulation[];
      averageLine: AnalysisPoint[];
    };
    findings: {
      strengths: string[];
      weaknesses: string[];
      metrics: MetricBreakdown[];
    };
    recommendations: RecommendationCard[];
    adStrategy: {
      campaignGoal: string;
      why: string;
      focus: string;
      bestAudience: string;
      audienceWhy: string;
      messageAngle: string;
      creativeVariants: string[];
      audienceHypotheses: string[];
      testingApproach: string;
    };
    crossPost: {
      summary: string;
      platforms: PlatformStrategy[];
    };
  };
};

export type CreateAnalysisInput = {
  texto: string;
  id?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  backendMessage?: string | null;
  preferredPlatform?: string | null;
};

type SegmentMeta = {
  name: string;
  color: string;
  resilience: number;
  spikeBoost: number;
  angle: string;
};

const STATUS_STEPS = [
  "Procesando transcript",
  "Leyendo visuales y ritmo",
  "Simulating 100 personas",
  "Armando el plan de crecimiento",
];

const AUDIENCE_SEGMENTS: SegmentMeta[] = [
  {
    name: "Scroller Gen Z",
    color: "#5eead4",
    resilience: 0.86,
    spikeBoost: 0.9,
    angle: "Mostrá el resultado antes de cualquier explicación",
  },
  {
    name: "Fan del fitness",
    color: "#38bdf8",
    resilience: 0.94,
    spikeBoost: 0.96,
    angle: "Abrí con energía visible y un beneficio concreto en el segundo uno",
  },
  {
    name: "Obsesivo de la productividad",
    color: "#f59e0b",
    resilience: 0.91,
    spikeBoost: 1.08,
    angle: "Prometé un resultado concreto antes de explicar el proceso",
  },
  {
    name: "Comprador impulsivo",
    color: "#a78bfa",
    resilience: 0.88,
    spikeBoost: 1.04,
    angle: "Mové el beneficio o la llamada a la acción mucho antes",
  },
  {
    name: "Marketer de performance",
    color: "#22d3ee",
    resilience: 1.03,
    spikeBoost: 1.18,
    angle: "Empezá con un resultado medible antes de los detalles",
  },
  {
    name: "Founder sin tiempo",
    color: "#fb7185",
    resilience: 0.98,
    spikeBoost: 1.05,
    angle: "Recortá la apertura y hacé caer la idea clave antes del segundo dos",
  },
  {
    name: "Constructor de producto",
    color: "#facc15",
    resilience: 1.06,
    spikeBoost: 1.22,
    angle: "Hacé mucho más clara la revelación de mitad de video",
  },
  {
    name: "Profesional B2B",
    color: "#c084fc",
    resilience: 1.1,
    spikeBoost: 1.12,
    angle: "Decí el valor de forma directa y mantené el encuadre bien claro",
  },
];

const PLATFORM_NAMES = ["TikTok", "Instagram Reels", "YouTube Shorts", "LinkedIn"] as const;

const PERSONA_COUNTRIES = ["Estados Unidos", "Reino Unido", "Canadá", "Australia", "Alemania"];
const PERSONA_AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64"];
const PERSONA_OCCUPATIONS = [
  "Marketer junior",
  "Lider de crecimiento",
  "Founder",
  "Creador",
  "Estratega freelance",
];
const PERSONA_INCOME_BRACKETS = [
  "$25k-$50k",
  "$50k-$90k",
  "$90k-$140k",
  "$140k-$220k",
];
const PERSONA_SOCIAL_STATUS = [
  "Estudiante",
  "Profesional joven",
  "Profesional consolidado",
  "Dueño de negocio",
];
const PERSONA_INTEREST_CLUSTERS = [
  ["tendencias short-form", "economía creadora", "crecimiento en redes"],
  ["contenido fitness", "construcción de hábitos", "optimización del estilo de vida"],
  ["marketing de performance", "testing de anuncios", "medición"],
  ["productividad", "automatización de flujos", "contenido de negocios"],
  ["startups", "psicología de ventas", "construcción de marca"],
];
const PERSONA_HOBBY_CLUSTERS = [
  ["scrollear Reels", "gym", "viajes de fin de semana"],
  ["leer newsletters", "podcasts", "ciclismo"],
  ["creación de contenido", "edición de video", "running"],
  ["eventos de networking", "cafés de networking", "tenis"],
  ["gaming", "proyectos paralelos", "fotografía"],
];

const PERSONA_FIRST_NAMES = [
  "Mia", "Jordan", "Sofia", "Liam", "Ava", "Noah", "Zoe", "Lucas", "Emma", "Leo",
  "Grace", "Mateo", "Olivia", "Ethan", "Nina", "Theo", "Isla", "Julian", "Aria", "Mason",
  "Elena", "Bruno", "Camila", "Dylan", "Valentina", "Gael", "Lucia", "Hugo", "Alma", "Samuel",
  "Clara", "Thiago", "Aurora", "Max", "Renata", "Brisa", "Elisa", "Adrian", "Vera", "Tomas",
  "Iris", "Benicio", "Julia", "Santiago", "Lola", "Nicolas", "Paula", "Daniel", "Ines", "Marco",
  "Sara", "Federico", "Malena", "Andres", "Carmen", "Facundo", "Pilar", "Gonzalo", "Ambar", "Joaquin",
];
const PERSONA_LAST_NAMES = [
  "Cruz", "Reyes", "Vega", "Santos", "Navarro", "Costa", "Silva", "Molina", "Castro", "Prieto",
  "Suarez", "Ortega", "Rojas", "Medina", "Herrera", "Campos", "Ibarra", "Benitez", "Aguilar", "Salazar",
  "Fuentes", "Paredes", "Valdez", "Romero", "Mendez", "Lopez", "Acosta", "Arias", "Pena", "Delgado",
  "Peralta", "Correa", "Nieves", "Cabrera", "Bustos", "Miranda", "Luna", "Aguirre", "Soria", "Montero",
];

export const ANALYSIS_STORAGE_KEY = "hackathon.analysis.latest";
export const ANALYSIS_STORAGE_PREFIX = "hackathon.analysis.";

function hashString(value: string) {
  let hash = 1779033703;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return (hash >>> 0) || 1;
}

function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let temp = Math.imul(state ^ (state >>> 15), 1 | state);
    temp ^= temp + Math.imul(temp ^ (temp >>> 7), 61 | temp);
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatTimestamp(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  return `0:${String(safeSeconds).padStart(2, "0")}`;
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) {
    return "Metadata pendiente";
  }

  if (bytes < 1024 * 1024) {
    return `${round(bytes / 1024, 1)} KB`;
  }

  return `${round(bytes / (1024 * 1024), 1)} MB`;
}

function fileTypeLabel(fileType?: string | null) {
  if (!fileType) {
    return "Clip subido";
  }

  if (fileType.startsWith("video/")) {
    return "Video short-form";
  }

  if (fileType.startsWith("audio/")) {
    return "Pieza guiada por audio";
  }

  if (fileType.startsWith("image/")) {
    return "Pieza visual";
  }

  return "Pieza subida";
}

function makeHandle(index: number, random: () => number) {
  const prefixes = ["orbit", "vector", "signal", "phase", "metric", "delta", "hook", "frame"];
  const suffixes = ["pilot", "watch", "lab", "flow", "grid", "node", "pulse", "scope"];
  const prefix = prefixes[index % prefixes.length];
  const suffix = suffixes[Math.floor(random() * suffixes.length)];
  const digits = String(100 + Math.floor(random() * 900)).slice(1);
  return `${prefix}_${suffix}${digits}`;
}

function buildSeededPersonaNames(count: number, seed: number) {
  const random = createRandom(seed ^ 0x51f15d33);
  const pool = PERSONA_FIRST_NAMES.flatMap((firstName) =>
    PERSONA_LAST_NAMES.map((lastName) => `${firstName} ${lastName}`),
  );
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = pool[index];
    pool[index] = pool[swapIndex]!;
    pool[swapIndex] = current!;
  }
  const names: string[] = [];
  const recentFirstNames: string[] = [];
  const recentLastNames: string[] = [];

  while (names.length < count && pool.length) {
    let chosenIndex = -1;
    let fallbackIndex = -1;

    for (let index = 0; index < pool.length; index += 1) {
      const [firstName, lastName] = pool[index]?.split(" ") ?? ["", ""];
      const firstNameRecent = recentFirstNames.slice(-4).includes(firstName);
      const lastNameRecent = recentLastNames.slice(-2).includes(lastName);
      if (!firstNameRecent && !lastNameRecent) {
        chosenIndex = index;
        break;
      }
      if (fallbackIndex === -1 && !lastNameRecent) {
        fallbackIndex = index;
      }
    }

    if (chosenIndex === -1) {
      chosenIndex = fallbackIndex !== -1 ? fallbackIndex : Math.floor(random() * pool.length);
    }

    const [selectedName] = pool.splice(chosenIndex, 1);
    const [firstName, lastName] = selectedName?.split(" ") ?? ["", ""];
    names.push(selectedName);
    recentFirstNames.push(firstName);
    recentLastNames.push(lastName);
  }

  return names.slice(0, count);
}

function orderFallbackPersonas(personas: PersonaResult[]) {
  const remaining = [...personas];
  const ordered: PersonaResult[] = [];
  const usedSegments = new Set<string>();
  const usedReasons = new Set<string>();

  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    remaining.forEach((persona, index) => {
      let score = persona.retention_percent * 3 + persona.dropoff_second * 0.4;
      if (!usedSegments.has(persona.segment_label)) {
        score += 15;
      }
      if (persona.reason_code && !usedReasons.has(persona.reason_code)) {
        score += 14;
      }
      if (ordered.length) {
        const previous = ordered[ordered.length - 1];
        if (previous.reason_code && previous.reason_code === persona.reason_code) {
          score -= 6;
        }
        if (previous.segment_label === persona.segment_label) {
          score -= 8;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const [selected] = remaining.splice(bestIndex, 1);
    ordered.push({
      ...selected,
      presentation_order: ordered.length,
    });
    usedSegments.add(selected.segment_label);
    if (selected.reason_code) {
      usedReasons.add(selected.reason_code);
    }
  }

  return ordered;
}

function buildBaseRetention(second: number, durationSeconds: number) {
  const progress = second / durationSeconds;
  let retention = 100 - progress * 32;

  if (second <= 3) {
    retention -= second * 18;
  }

  if (second >= 4) {
    retention -= 20 + (second - 4) * 1.55;
  }

  if (second >= 8 && second <= 10) {
    retention += 5 - Math.abs(second - 9) * 2.2;
  }

  if (second >= durationSeconds - 5) {
    retention -= (second - (durationSeconds - 5)) * 2.1;
  }

  return clamp(retention, 6, 100);
}

function sampleDropOffSecond(
  random: () => number,
  durationSeconds: number,
  segment: SegmentMeta,
) {
  const chance = random();
  let dropOffSecond = 0;

  if (chance < 0.16) {
    dropOffSecond = 0.7 + random() * 1.1;
  } else if (chance < 0.72) {
    dropOffSecond = 2 + random() * 2;
  } else if (chance < 0.9) {
    dropOffSecond = 4 + random() * 2.4;
  } else if (chance < 0.97) {
    dropOffSecond = 6.4 + random() * 3.6;
  } else {
    dropOffSecond = 10 + random() * Math.max(durationSeconds - 10, 1);
  }

  const resilienceShift = (segment.resilience - 1) * 3.2;
  const spikeShift = (segment.spikeBoost - 1) * 1.4;
  const noisyDropOff = dropOffSecond + resilienceShift + spikeShift + (random() - 0.5) * 0.7;

  return round(clamp(noisyDropOff, 0.6, durationSeconds), 2);
}

function pickOverallLabel(hookStrength: number, pacing: number, adReadiness: number) {
  if (hookStrength >= 80 && pacing < 73) {
    return "Hook fuerte, mitad debil";
  }

  if (adReadiness >= 80) {
    return "Buen potencial para anuncios";
  }

  if (hookStrength < 70) {
    return "Necesita una apertura mas rapida";
  }

  return "Valor claro, mejor con una edicion mas ajustada";
}

function computePlatformScores(
  metrics: Record<string, number>,
  preferredPlatform?: string | null,
) {
  const platformScores: Record<(typeof PLATFORM_NAMES)[number], number> = {
    TikTok: round(
      metrics.hookStrength * 0.28 +
        metrics.pacing * 0.24 +
        metrics.novelty * 0.2 +
        metrics.ctaStrength * 0.08 +
        metrics.visualReadability * 0.2,
    ),
    "Instagram Reels": round(
      metrics.visualReadability * 0.28 +
        metrics.messageClarity * 0.22 +
        metrics.hookStrength * 0.22 +
        metrics.pacing * 0.14 +
        metrics.audioDelivery * 0.14,
    ),
    "YouTube Shorts": round(
      metrics.hookStrength * 0.24 +
        metrics.messageClarity * 0.18 +
        metrics.pacing * 0.22 +
        metrics.audioDelivery * 0.18 +
        metrics.ctaStrength * 0.18,
    ),
    LinkedIn: round(
      metrics.messageClarity * 0.32 +
        metrics.audioDelivery * 0.22 +
        metrics.ctaStrength * 0.16 +
        metrics.visualReadability * 0.1 +
        metrics.novelty * 0.2,
    ),
  };

  if (preferredPlatform) {
    const canonical =
      preferredPlatform.toLowerCase() === "instagram"
        ? "Instagram Reels"
        : preferredPlatform.toLowerCase() === "youtube"
          ? "YouTube Shorts"
          : preferredPlatform.toLowerCase() === "linkedin"
            ? "LinkedIn"
            : "TikTok";

    platformScores[canonical] = clamp(platformScores[canonical] + 5, 0, 99);
  }

  return platformScores;
}

function findSteepestDrop(points: AnalysisPoint[]) {
  let biggestDrop = { second: 0, delta: 0 };

  for (let index = 1; index < points.length; index += 1) {
    const delta = points[index - 1].retention - points[index].retention;

    if (delta > biggestDrop.delta) {
      biggestDrop = { second: points[index].second, delta };
    }
  }

  return biggestDrop.second;
}

function buildViewerLines(seed: number, durationSeconds: number) {
  const random = createRandom(seed);
  const viewers: ViewerSimulation[] = [];
  const segmentStats = new Map<string, { totalDropOff: number; count: number }>();

  for (const segment of AUDIENCE_SEGMENTS) {
    segmentStats.set(segment.name, { totalDropOff: 0, count: 0 });
  }

  for (let index = 0; index < 100; index += 1) {
    const segment = AUDIENCE_SEGMENTS[index % AUDIENCE_SEGMENTS.length];
    const dropOffSecond = sampleDropOffSecond(random, durationSeconds, segment);

    const segmentSummary = segmentStats.get(segment.name);

    if (segmentSummary) {
      segmentSummary.totalDropOff += dropOffSecond;
      segmentSummary.count += 1;
    }

    const points: AnalysisPoint[] = [
      { second: 0, retention: 100 },
      { second: Math.max(dropOffSecond, 1), retention: 100 },
      { second: Math.max(dropOffSecond, 1), retention: 0 },
      { second: durationSeconds, retention: 0 },
    ];

    viewers.push({
      id: `viewer-${index + 1}`,
      handle: makeHandle(index, random),
      segment: segment.name,
      color: segment.color,
      wave: Math.floor(index / 12),
      points,
      dropOffSecond,
    });
  }

  const averageLine = Array.from({ length: durationSeconds + 1 }, (_, second) => ({
    second,
    retention: round(
      (viewers.filter((viewer) => viewer.dropOffSecond > second).length / viewers.length) * 100,
      1,
    ),
  }));

  const topAudienceSegment =
    [...segmentStats.entries()]
      .sort((left, right) => {
        const leftAverage = left[1].totalDropOff / Math.max(left[1].count, 1);
        const rightAverage = right[1].totalDropOff / Math.max(right[1].count, 1);
        return rightAverage - leftAverage;
      })[0]?.[0] ?? AUDIENCE_SEGMENTS[0].name;

  return { viewers, averageLine, topAudienceSegment };
}

function buildMetrics(seed: number, textLength: number) {
  const random = createRandom(seed);
  const wordCountBoost = clamp(textLength / 240, 0, 1) * 6;

  return {
    hookStrength: clamp(round(72 + wordCountBoost + random() * 14 - 4), 54, 94),
    messageClarity: clamp(round(74 + wordCountBoost + random() * 10 - 3), 55, 95),
    pacing: clamp(round(68 + random() * 18 - 2), 48, 92),
    audioDelivery: clamp(round(71 + random() * 14 - 3), 52, 92),
    visualReadability: clamp(round(76 + random() * 12 - 2), 55, 96),
    novelty: clamp(round(66 + random() * 18 - 2), 45, 90),
    ctaStrength: clamp(round(63 + random() * 20 - 4), 42, 88),
  };
}

function buildTranscriptSegments(text: string, durationSeconds: number): TranscriptSegment[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  const source =
    normalized ||
    "Analizamos el video como lo haria una audiencia real, predecimos la retencion y convertimos esas senales en estrategia creativa y de crecimiento.";
  const sentences = source
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const segmentCount = Math.max(1, Math.min(sentences.length, 6));
  const sliceDuration = durationSeconds / segmentCount;

  return Array.from({ length: segmentCount }, (_, index) => {
    const sentence = sentences[index] ?? sentences[sentences.length - 1] ?? source;
    const start = round(index * sliceDuration, 2);
    const end = round(Math.min(durationSeconds, (index + 1) * sliceDuration), 2);
    return {
      start,
      end,
      text: sentence,
    };
  });
}

function buildMockPersonas(viewers: ViewerSimulation[], durationSeconds: number, seed: number): PersonaResult[] {
  const names = buildSeededPersonaNames(viewers.length, seed);
  const personas = viewers.map((viewer, index) => {
    const country = PERSONA_COUNTRIES[index % PERSONA_COUNTRIES.length];
    const ageRange = PERSONA_AGE_RANGES[index % PERSONA_AGE_RANGES.length];
    const occupation = PERSONA_OCCUPATIONS[index % PERSONA_OCCUPATIONS.length];
    const incomeBracket = PERSONA_INCOME_BRACKETS[index % PERSONA_INCOME_BRACKETS.length];
    const socialStatus = PERSONA_SOCIAL_STATUS[index % PERSONA_SOCIAL_STATUS.length];
    const interests = PERSONA_INTEREST_CLUSTERS[index % PERSONA_INTEREST_CLUSTERS.length];
    const hobbies = PERSONA_HOBBY_CLUSTERS[index % PERSONA_HOBBY_CLUSTERS.length];
    const retentionPercent = clamp(round((viewer.dropOffSecond / Math.max(durationSeconds, 1)) * 100), 0, 100);
    const leavesEarly = retentionPercent < 55;

    return {
      persona_id: `persona-${index + 1}`,
      name: names[index] ?? `Persona ${index + 1}`,
      presentation_order: index,
      age_range: ageRange,
      country,
      occupation,
      income_bracket: incomeBracket,
      social_status: socialStatus,
      interests,
      hobbies,
      life_story: `${viewer.segment} compara ideas a velocidad de scroll y decide rapido si un video merece mas atencion.`,
      platform_habits: `Consume ${index % 2 === 0 ? "Instagram Reels" : "TikTok"} en pausas cortas del dia.`,
      motivations: ["aprender algo util rapido", "encontrar inspiracion creativa", "evitar perder tiempo"],
      frustrations: ["intros lentas", "valor poco claro", "ritmo generico"],
      segment_label: viewer.segment,
      color: viewer.color,
      batch_index: Math.floor(index / 20),
      dropoff_second: viewer.dropOffSecond,
      retention_percent: retentionPercent,
      reason_code: leavesEarly ? "intro_too_slow" : "claim_lacks_proof",
      reason_label: leavesEarly ? "Intro demasiado lenta" : "Prueba insuficiente",
      why_they_left: leavesEarly
        ? "La propuesta de valor tardó demasiado en volverse concreta para esta persona."
        : "Se quedó más tiempo porque la promesa se volvió útil antes de que la atención cayera del todo.",
      summary_of_interacion: leavesEarly
        ? `Se va cerca de ${round(viewer.dropOffSecond, 1)}s cuando la introducción sigue explicando en vez de entregar el resultado.`
        : `Mira cerca del ${retentionPercent}% porque el creativo termina demostrando el punto con suficiente claridad como para sostener la atención.`,
    };
  });

  return orderFallbackPersonas(personas);
}

function buildAudienceDistribution(
  personas: PersonaResult[],
  key: "country" | "age_range" | "social_status" | "income_bracket",
): AudienceDistributionItem[] {
  const totals = new Map<string, { count: number; retention: number }>();

  for (const persona of personas) {
    const label = persona[key];
    const current = totals.get(label) ?? { count: 0, retention: 0 };
    current.count += 1;
    current.retention += persona.retention_percent;
    totals.set(label, current);
  }

  return [...totals.entries()]
    .map(([label, stats]) => ({
      label,
      percentage: round((stats.count / Math.max(personas.length, 1)) * 100, 1),
      averageRetention: round(stats.retention / Math.max(stats.count, 1), 1),
    }))
    .sort((left, right) => right.percentage - left.percentage);
}

function buildAudienceDistributionFromList(
  personas: PersonaResult[],
  key: "interests" | "hobbies",
): AudienceDistributionItem[] {
  const totals = new Map<string, { count: number; retention: number }>();

  for (const persona of personas) {
    for (const label of persona[key]) {
      const current = totals.get(label) ?? { count: 0, retention: 0 };
      current.count += 1;
      current.retention += persona.retention_percent;
      totals.set(label, current);
    }
  }

  return [...totals.entries()]
    .map(([label, stats]) => ({
      label,
      percentage: round((stats.count / Math.max(personas.length, 1)) * 100, 1),
      averageRetention: round(stats.retention / Math.max(stats.count, 1), 1),
    }))
    .sort((left, right) => right.averageRetention - left.averageRetention)
    .slice(0, 8);
}

function buildTimelineInsights(
  markers: InsightMarker[],
  durationSeconds: number,
): TimelineInsightItem[] {
  const items: TimelineInsightItem[] = [
    {
      id: "hook",
      label: "Hook débil",
      second: Math.max(0.8, Math.min(markers[0]?.second ?? 1.4, 2.6)),
      detail: "La apertura tarda demasiado en mostrar el payoff, así que la primera decisión de swipe llega antes de la prueba más fuerte.",
      tone: "risk",
    },
    {
      id: "energy",
      label: "Caída de energía",
      second: Math.max(2.4, Math.min(markers[1]?.second ?? durationSeconds * 0.42, durationSeconds - 6)),
      detail: "El impulso cae cuando la edición explica en vez de mostrar algo visualmente nuevo.",
      tone: "risk",
    },
    {
      id: "overload",
      label: "Sobrecarga cognitiva",
      second: Math.max(4, Math.min(durationSeconds * 0.72, durationSeconds - 3)),
      detail: "En este tramo hace falta interpretar demasiado, así que la audiencia tiene que esforzarse más de lo que quiere.",
      tone: "risk",
    },
    {
      id: "loop",
      label: "Potencial de loop",
      second: Math.max(1, durationSeconds - 1.5),
      detail: "El beat final puede transformarse en un mejor momento de replay si espeja visualmente el primer frame.",
      tone: "opportunity",
    },
  ];

  return items.map((item) => ({ ...item, second: round(item.second, 1) }));
}

function buildTargetAudience(
  personas: PersonaResult[],
  topAudienceSegment: string,
): TargetAudience {
  const sorted = [...personas].sort((left, right) => right.retention_percent - left.retention_percent);
  const primary = sorted[0];
  const secondary = sorted.find((persona) => persona.name !== primary?.name) ?? sorted[1];

  return {
    primaryAudience:
      primary?.name ?? topAudienceSegment,
    secondaryAudience:
      secondary?.name ?? "Audiencia secundaria de alta intención",
    countries: buildAudienceDistribution(personas, "country"),
    ageRanges: buildAudienceDistribution(personas, "age_range"),
    interests: buildAudienceDistributionFromList(personas, "interests"),
    hobbies: buildAudienceDistributionFromList(personas, "hobbies"),
    socialStatus: buildAudienceDistribution(personas, "social_status"),
    incomeBrackets: buildAudienceDistribution(personas, "income_bracket"),
  };
}

function isAnalysisResponse(payload: unknown): payload is AnalysisResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const record = payload as Record<string, unknown>;
  return (
    record.status === "success" &&
    typeof record.id === "string" &&
    !!record.analysis &&
    typeof record.analysis === "object"
  );
}

function generateVideoTitle(text: string, overallLabel: string, fileName: string): string {
  // Try to extract a meaningful title from the text
  if (text && text.length > 10) {
    const firstSentence = text.split(".")[0].trim();
    if (firstSentence.length > 60) {
      const words = firstSentence.slice(0, 60).split(" ").slice(0, -1).join(" ");
      return words + "...";
    }
    if (firstSentence.length > 15) {
      return firstSentence;
    }
  }
  // Fallback to overall label
  if (overallLabel && overallLabel.length > 5) {
    return overallLabel;
  }
  // Final fallback: clean the filename
  const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
}

export function createAnalysisPayload(input: CreateAnalysisInput): AnalysisResponse {
  const text = input.texto.trim();
  const seed = hashString(
    `${text}::${input.fileName ?? "clip"}::${input.preferredPlatform ?? "none"}`,
  );
  const random = createRandom(seed);
  const durationSeconds = 18 + Math.floor(random() * 9);
  const generatedId = input.id ?? `analysis-${seed.toString(16).slice(0, 8)}`;
  const metrics = buildMetrics(seed ^ 0x9e3779b1, text.length || 120);
  const platformScores = computePlatformScores(metrics, input.preferredPlatform);
  const bestPlatform =
    [...Object.entries(platformScores)].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "Instagram Reels";
  const { viewers, averageLine, topAudienceSegment } = buildViewerLines(seed, durationSeconds);
  const adReadiness = round(
    metrics.hookStrength * 0.25 +
      metrics.visualReadability * 0.18 +
      metrics.messageClarity * 0.18 +
      metrics.ctaStrength * 0.19 +
      metrics.pacing * 0.2,
  );
  const retentionPotential = round(
    metrics.hookStrength * 0.34 +
      metrics.pacing * 0.3 +
      metrics.visualReadability * 0.16 +
      metrics.novelty * 0.2,
  );
  const crossPlatformFit = round(
    platformScores["Instagram Reels"] * 0.36 +
      platformScores.TikTok * 0.24 +
      platformScores["YouTube Shorts"] * 0.24 +
      platformScores.LinkedIn * 0.16,
  );
  const overallScore = round(
    (retentionPotential + adReadiness + crossPlatformFit + metrics.messageClarity) / 4,
  );
  const steepestDropSecond = findSteepestDrop(averageLine);
  const averageWatchTimeSeconds = round(
    viewers.reduce((sum, viewer) => sum + viewer.dropOffSecond, 0) / viewers.length + 2,
  );
  const segmentMeta =
    AUDIENCE_SEGMENTS.find((segment) => segment.name === topAudienceSegment) ??
    AUDIENCE_SEGMENTS[0];
  const overallLabel = pickOverallLabel(metrics.hookStrength, metrics.pacing, adReadiness);
  const summaryNarrative = [
    "La promesa inicial se entiende rapido y el valor esta claro,",
    `pero la atencion empieza a caer cerca de ${formatTimestamp(steepestDropSecond)}.`,
    `Mejor encaje actual: ${bestPlatform}.`,
    input.backendMessage ? input.backendMessage : "",
  ]
    .filter(Boolean)
    .join(" ");

  const markers: InsightMarker[] = [
    {
      second: Math.max(1, steepestDropSecond),
      retention:
        averageLine.find((point) => point.second === Math.max(1, steepestDropSecond))
          ?.retention ?? 62,
      label: `La gran caida empieza en ${formatTimestamp(steepestDropSecond)}`,
      detail: "La promesa del hook llega despues de la ventana critica del primer swipe.",
    },
    {
      second: Math.min(durationSeconds - 7, 9),
      retention:
        averageLine.find((point) => point.second === Math.min(durationSeconds - 7, 9))
          ?.retention ?? 67,
      label: "El interes sube en el reveal del flujo",
      detail: "El payoff concreto supera a una explicacion demasiado larga.",
    },
    {
      second: Math.max(durationSeconds - 4, 1),
      retention:
        averageLine.find((point) => point.second === Math.max(durationSeconds - 4, 1))
          ?.retention ?? 34,
      label: "El CTA aparece despues de la caida",
      detail: "Conviene mover la llamada a la accion antes, cuando la curva todavia esta alta.",
    },
  ];

  const metricBreakdown: MetricBreakdown[] = [
    {
      name: "Fuerza del hook",
      score: metrics.hookStrength,
      explanation: "El concepto se entiende rapido, pero el payoff podria llegar antes.",
    },
    {
      name: "Claridad del mensaje",
      score: metrics.messageClarity,
      explanation: "El beneficio central se entiende bien una vez que aparece la propuesta de valor.",
    },
    {
      name: "Ritmo",
      score: metrics.pacing,
      explanation: "La seccion media pierde ritmo despues del setup inicial.",
    },
    {
      name: "Audio / Entrega",
      score: metrics.audioDelivery,
      explanation: "El tono es seguro, pero las palabras clave deberian pegar mas fuerte al principio.",
    },
    {
      name: "Lectura visual",
      score: metrics.visualReadability,
      explanation: "Los frames se entienden bien a velocidad de consumo mobile.",
    },
    {
      name: "Novedad",
      score: metrics.novelty,
      explanation: "La idea es buena, pero el reveal podria sentirse mas sorprendente.",
    },
    {
      name: "Fuerza del CTA",
      score: metrics.ctaStrength,
      explanation: "El pedido existe, pero llega despues de que cae el impulso.",
    },
    {
      name: "Encaje con plataforma",
      score: round(platformScores[bestPlatform as keyof typeof platformScores]),
      explanation: `${bestPlatform} es la plataforma que mejor calza con esta estructura y este ritmo.`,
    },
  ];

  const platforms: PlatformStrategy[] = [
    {
      platform: "TikTok",
      fit: platformScores.TikTok,
      tag: platformScores.TikTok >= 80 ? "Alto encaje" : "Necesita un hook mas corto",
      verdict:
        platformScores.TikTok >= 80
          ? "El corte actual puede funcionar si el payoff cae dentro del primer segundo."
          : "Necesita una promesa mas rapida en el primer frame para ganar el swipe.",
      adaptations: [
        "Acorta la intro 1-2 segundos.",
        "Agrega un texto inicial mas agresivo.",
        "Corta directo de promesa a prueba.",
      ],
    },
    {
      platform: "Instagram Reels",
      fit: platformScores["Instagram Reels"],
      tag:
        platformScores["Instagram Reels"] >= 80 ? "Mejor encaje actual" : "Buen encaje secundario",
      verdict:
        platformScores["Instagram Reels"] >= 80
          ? "Esta edicion ya se alinea bien con el ritmo y la lectura de Reels."
          : "Funciona mejor si se ajusta la seccion media.",
      adaptations: [
        "Usa captions mas limpios para el payoff principal.",
        "Mantiene el frame inicial mas minimalista.",
        "Cierra con un movimiento que favorezca el loop.",
      ],
    },
    {
      platform: "YouTube Shorts",
      fit: platformScores["YouTube Shorts"],
      tag: platformScores["YouTube Shorts"] >= 78 ? "Buen encaje" : "Encaje medio",
      verdict:
        platformScores["YouTube Shorts"] >= 78
          ? "La estructura puede sostenerse en Shorts con un cierre mas claro."
          : "Una promesa hablada mas fuerte ayudara a la retencion en Shorts.",
      adaptations: [
        "Haz explicito antes el payoff narrativo.",
        "Refuerza la utilidad con captions tipo subtitulo.",
        "Recorta cualquier frase explicativa repetida.",
      ],
    },
    {
      platform: "LinkedIn",
      fit: platformScores.LinkedIn,
      tag: platformScores.LinkedIn >= 74 ? "Encaje inesperado" : "Encaje bajo inmediato",
      verdict:
        platformScores.LinkedIn >= 74
          ? "El enfoque educativo puede funcionar si el takeaway de negocio queda mas claro."
          : "Necesita un framing mas centrado en insight para sentirse nativo.",
      adaptations: [
        "Reformula la apertura como aprendizaje de negocio.",
        "Agrega mas contexto en la primera linea del caption.",
        "Cambia el CTA por un takeaway mas profesional.",
      ],
    },
  ];

  const previewName = input.fileName?.trim() || "uploaded-video.mp4";
  const transcriptSegments = buildTranscriptSegments(text, durationSeconds);
  const personas = buildMockPersonas(viewers, durationSeconds, seed);
  const targetAudience = buildTargetAudience(personas, topAudienceSegment);
  const timelineInsights = buildTimelineInsights(markers, durationSeconds);
  const scoreSummary: VideoScoreSummary = {
    id: generatedId,
    video_id: generatedId,
    overall_score: overallScore,
    hook_score: metrics.hookStrength,
    clarity_score: metrics.messageClarity,
    pacing_score: metrics.pacing,
    audio_score: metrics.audioDelivery,
    visual_score: metrics.visualReadability,
    novelty_score: metrics.novelty,
    cta_score: metrics.ctaStrength,
    platform_fit_score: round(platformScores[bestPlatform as keyof typeof platformScores]),
    viral_score: retentionPotential,
    conversion_score: round((metrics.ctaStrength * 0.55 + metrics.messageClarity * 0.45)),
    ad_readiness_score: adReadiness,
  };

  return {
    id: generatedId,
    status: "success",
    video_id: generatedId,
    job_id: generatedId,
    analysis: {
      productName: "NextHit",
      sessionLabel: `Sesion ${generatedId.replace("analysis-", "").toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      transcriptText: text,
      transcript: {
        text,
        language: "en",
        segments: transcriptSegments,
      },
      personas,
      targetAudience,
      timelineInsights,
      videoAnalysis: null,
      scoreSummary,
      statusSteps: STATUS_STEPS,
      clip: {
        fileName: previewName,
        generatedTitle: generateVideoTitle(text, overallLabel, previewName),
        mediaType: fileTypeLabel(input.fileType),
        sizeLabel: formatBytes(input.fileSize),
        durationLabel: formatDuration(durationSeconds),
        label: "Clip analizado",
      },
      summary: {
        overallScore,
        overallLabel,
        narrative: summaryNarrative,
        videoSummary: `${summaryNarrative} El video funciona mejor cuando la prueba aparece antes, el hook se vuelve mas preciso y el primer segmento pago se construye sobre la audiencia sintetica que mas retiene.`,
        pillars: [
          {
            label: "Potencial de retencion",
            score: retentionPotential,
            note: `${averageWatchTimeSeconds}s de tiempo promedio de visualizacion`,
          },
          {
            label: "Preparacion para ads",
            score: adReadiness,
            note: segmentMeta.angle,
          },
          {
            label: "Encaje multiplataforma",
            score: crossPlatformFit,
            note: `Mejor encaje actual: ${bestPlatform}`,
          },
        ],
      },
      graph: {
        title: "Simulacion De Retencion",
        subtitle:
          "100 espectadores simulados, visualizacion persona por persona y una curva final construida segun cuantos siguen mirando en cada segundo.",
        durationSeconds,
        audienceSize: viewers.length,
        averageWatchTime: `${averageWatchTimeSeconds}s`,
        mostCommonDropOff: formatTimestamp(steepestDropSecond),
        bestFitAudience: topAudienceSegment,
        strongestAdAngle: segmentMeta.angle,
        topAudienceSegment,
        markers,
        viewers,
        averageLine,
      },
      findings: {
        strengths: [
          "La apertura deja clara la categoria del contenido.",
          "El ritmo visual se lee bien en pantallas chicas.",
          `La audiencia ideal responde mejor cuando ${segmentMeta.angle.toLowerCase()}.`,
          `La plataforma mas alineada es ${bestPlatform}.`,
        ],
        weaknesses: [
          `El payoff de apertura llega demasiado tarde para la decision de swipe en ${formatTimestamp(
            steepestDropSecond,
          )}.`,
          "La seccion media se vuelve mas densa verbalmente de lo que el ritmo visual sostiene.",
          "El CTA llega despues de que la curva ya perdio impulso.",
          "La prueba mas fuerte deberia aparecer un beat antes.",
        ],
        metrics: metricBreakdown,
      },
      recommendations: [
        {
          title: "Arreglar el hook",
          issue: "El primer segundo explica antes de demostrar.",
          action: "Abre con el resultado o con la prueba visual y despues agrega contexto.",
          example: 'Abrir con el payoff: "Este cambio de flujo recorta el tiempo de edicion."',
        },
        {
          title: "Mejorar retencion",
          issue: `La atencion cae con mas fuerza cerca de ${formatTimestamp(steepestDropSecond)}.`,
          action: "Comprime el setup e introduce una ruptura de patron en la mitad.",
          example: "Corta una frase explicativa y reemplazala por una transicion visual mas fuerte.",
        },
        {
          title: "Fortalecer el CTA",
          issue: "El pedido actual llega tarde y es facil de perder.",
          action: "Mueve el CTA antes de la caida final y atanlo al beneficio mas fuerte.",
          example: 'Probar: "Guardalo antes de tu proxima campaña."',
        },
        {
          title: "Mejor cambio rapido",
          issue: "Hay un cambio que mueve la curva mas que el resto.",
          action: "Reordena los primeros dos beats para que el beneficio aparezca antes que la explicacion.",
          example: "Haz que la prueba sea la apertura y luego usa la narracion para justificarla.",
        },
      ],
      adStrategy: {
        campaignGoal: "Mejor para reconocimiento",
        why: "El concepto tiene una promesa fuerte de top of funnel y una prueba facil de recordar.",
        focus:
          "Usalo primero como pieza de atencion y despues prueba una version mas cerrada para audiencias orientadas al click.",
        bestAudience: topAudienceSegment,
        audienceWhy:
          "Este segmento se queda mas tiempo porque el payoff del flujo se siente util enseguida.",
        messageAngle: segmentMeta.angle,
        creativeVariants: [
          "Hook con beneficio primero",
          "Hook con problema primero",
          "Version mas rapida con prueba al inicio",
        ],
        audienceHypotheses: [
          "Audiencia amplia interesada en creacion",
          "Marketers de performance con alta intencion",
          "Retarget de usuarios ya interesados",
        ],
        testingApproach:
          "Prueba dos variantes de hook contra un mismo cluster de audiencia y luego abre el testeo de angulo de mensaje despues de la primera lectura de retencion.",
      },
      crossPost: {
        summary: `Mejor encaje actual: ${bestPlatform}. TikTok pide una promesa mas rapida y LinkedIn un framing de negocio mas claro.`,
        platforms,
      },
    },
  };
}

export function normalizeAnalysisResponse(
  payload: unknown,
  fallbackInput: CreateAnalysisInput,
): AnalysisResponse {
  if (isAnalysisResponse(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    return createAnalysisPayload({
      ...fallbackInput,
      id: typeof record.id === "string" ? record.id : fallbackInput.id,
      backendMessage:
        typeof record.resultado === "string" ? record.resultado : fallbackInput.backendMessage,
      preferredPlatform:
        typeof record.preferredPlatform === "string"
          ? record.preferredPlatform
          : typeof record.bestPlatform === "string"
            ? record.bestPlatform
            : typeof record.platform === "string"
              ? record.platform
              : fallbackInput.preferredPlatform,
    });
  }

  return createAnalysisPayload(fallbackInput);
}
