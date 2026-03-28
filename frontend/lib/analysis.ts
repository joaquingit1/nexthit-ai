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
};

export type TranscriptData = {
  text: string;
  language: string;
  segments: TranscriptSegment[];
};

export type PersonaResult = {
  persona_id: string;
  name: string;
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
};

export type SegmentDiagnosis = {
  label: string;
  dropoffSecond: number;
  reasonCode: string;
  reasonLabel: string;
  why: string;
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

export type TimelineInsightItem = {
  id: string;
  label: string;
  second: number;
  detail: string;
  tone: "risk" | "opportunity";
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
    videoAnalysis?: Record<string, unknown> | null;
    scoreSummary?: VideoScoreSummary;
    statusSteps: string[];
    clip: {
      fileName: string;
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
  "Processing transcript",
  "Reading visuals and pacing",
  "Simulating 100 personas",
  "Building the growth plan",
];

const AUDIENCE_SEGMENTS: SegmentMeta[] = [
  {
    name: "Gen Z Scroller",
    color: "#5eead4",
    resilience: 0.86,
    spikeBoost: 0.9,
    angle: "Show the payoff before any explanation",
  },
  {
    name: "Fitness Enthusiast",
    color: "#38bdf8",
    resilience: 0.94,
    spikeBoost: 0.96,
    angle: "Open with visible energy and a concrete benefit in second one",
  },
  {
    name: "Productivity Hacker",
    color: "#f59e0b",
    resilience: 0.91,
    spikeBoost: 1.08,
    angle: "Promise a concrete outcome before explaining the process",
  },
  {
    name: "Impulse Shopper",
    color: "#a78bfa",
    resilience: 0.88,
    spikeBoost: 1.04,
    angle: "Move the reward or CTA much earlier",
  },
  {
    name: "Performance Marketer",
    color: "#22d3ee",
    resilience: 1.03,
    spikeBoost: 1.18,
    angle: "Lead with a measurable result before the details",
  },
  {
    name: "Busy Founder",
    color: "#fb7185",
    resilience: 0.98,
    spikeBoost: 1.05,
    angle: "Trim the opening and land the key insight by second two",
  },
  {
    name: "Product Builder",
    color: "#facc15",
    resilience: 1.06,
    spikeBoost: 1.22,
    angle: "Make the mid-video reveal much clearer",
  },
  {
    name: "B2B Professional",
    color: "#c084fc",
    resilience: 1.1,
    spikeBoost: 1.12,
    angle: "State the value directly and keep the framing crisp",
  },
];

const PLATFORM_NAMES = ["TikTok", "Instagram Reels", "YouTube Shorts", "LinkedIn"] as const;

const PERSONA_COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany"];
const PERSONA_AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64"];
const PERSONA_OCCUPATIONS = [
  "Junior marketer",
  "Growth lead",
  "Founder",
  "Creator",
  "Freelance strategist",
];
const PERSONA_INCOME_BRACKETS = [
  "$25k-$50k",
  "$50k-$90k",
  "$90k-$140k",
  "$140k-$220k",
];
const PERSONA_SOCIAL_STATUS = [
  "Student",
  "Young professional",
  "Established professional",
  "Business owner",
];
const PERSONA_INTEREST_CLUSTERS = [
  ["short-form trends", "creator economy", "social growth"],
  ["fitness content", "habit building", "lifestyle optimization"],
  ["performance marketing", "ad testing", "measurement"],
  ["productivity", "workflow automation", "business content"],
  ["startups", "sales psychology", "brand building"],
];
const PERSONA_HOBBY_CLUSTERS = [
  ["scrolling Reels", "gym", "weekend travel"],
  ["newsletter reading", "podcasts", "cycling"],
  ["content creation", "video editing", "running"],
  ["networking events", "coffee chats", "tennis"],
  ["gaming", "side projects", "photography"],
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
    return "Uploaded clip";
  }

  if (fileType.startsWith("video/")) {
    return "Short-form video";
  }

  if (fileType.startsWith("audio/")) {
    return "Audio-led asset";
  }

  if (fileType.startsWith("image/")) {
    return "Visual asset";
  }

  return "Uploaded asset";
}

function makeHandle(index: number, random: () => number) {
  const prefixes = ["orbit", "vector", "signal", "phase", "metric", "delta", "hook", "frame"];
  const suffixes = ["pilot", "watch", "lab", "flow", "grid", "node", "pulse", "scope"];
  const prefix = prefixes[index % prefixes.length];
  const suffix = suffixes[Math.floor(random() * suffixes.length)];
  const digits = String(100 + Math.floor(random() * 900)).slice(1);
  return `${prefix}_${suffix}${digits}`;
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
    "We analyze the video like a real audience would, predict retention, and turn those signals into creative and growth strategy.";
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

function buildMockPersonas(viewers: ViewerSimulation[], durationSeconds: number): PersonaResult[] {
  return viewers.map((viewer, index) => {
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
      name: viewer.segment,
      age_range: ageRange,
      country,
      occupation,
      income_bracket: incomeBracket,
      social_status: socialStatus,
      interests,
      hobbies,
      life_story: `${viewer.segment} spends a lot of time comparing ideas quickly and decides fast whether a video deserves more attention.`,
      platform_habits: `Mostly watches ${index % 2 === 0 ? "Instagram Reels" : "TikTok"} in short bursts during the day.`,
      motivations: ["learn something useful fast", "find creative inspiration", "avoid wasting time"],
      frustrations: ["slow intros", "unclear value", "generic pacing"],
      segment_label: viewer.segment,
      color: viewer.color,
      batch_index: Math.floor(index / 20),
      dropoff_second: viewer.dropOffSecond,
      retention_percent: retentionPercent,
      why_they_left: leavesEarly
        ? "The value proposition took too long to become concrete for this persona."
        : "They stayed longer because the promise became useful before attention fully dropped.",
      summary_of_interacion: leavesEarly
        ? `Stops around ${round(viewer.dropOffSecond, 1)}s when the setup keeps explaining instead of paying off.`
        : `Watches about ${retentionPercent}% because the creative eventually proves the point clearly enough to hold attention.`,
    };
  });
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
      label: "Hook weak",
      second: Math.max(0.8, Math.min(markers[0]?.second ?? 1.4, 2.6)),
      detail: "The opening takes too long to reveal the payoff, so the first swipe decision happens before the strongest proof.",
      tone: "risk",
    },
    {
      id: "energy",
      label: "Energy drop",
      second: Math.max(2.4, Math.min(markers[1]?.second ?? durationSeconds * 0.42, durationSeconds - 6)),
      detail: "Momentum softens when the edit explains instead of showing something visually new.",
      tone: "risk",
    },
    {
      id: "overload",
      label: "Cognitive overload",
      second: Math.max(4, Math.min(durationSeconds * 0.72, durationSeconds - 3)),
      detail: "Too much interpretation is required in this stretch, so the audience has to work harder than it wants to.",
      tone: "risk",
    },
    {
      id: "loop",
      label: "Loop potential",
      second: Math.max(1, durationSeconds - 1.5),
      detail: "The closing beat can become a stronger replay moment if it visually echoes the first frame.",
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
      secondary?.name ?? "High-intent secondary audience",
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
  const personas = buildMockPersonas(viewers, durationSeconds);
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
      productName: "AXIOM//LENS",
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
        mediaType: fileTypeLabel(input.fileType),
        sizeLabel: formatBytes(input.fileSize),
        durationLabel: formatDuration(durationSeconds),
        label: "Clip analizado",
      },
      summary: {
        overallScore,
        overallLabel,
        narrative: summaryNarrative,
        videoSummary: `${summaryNarrative} The video works best when its proof arrives early, the hook gets tighter, and the strongest audience cluster is used as the first paid testing segment.`,
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
