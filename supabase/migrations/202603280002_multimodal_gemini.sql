alter table public.videos
  add column if not exists multimodal_timeline jsonb,
  add column if not exists video_analysis jsonb,
  add column if not exists video_analysis_model text;

alter table public.persona_results
  add column if not exists archetype text,
  add column if not exists demographic_profile_id text,
  add column if not exists demographic_profile_label text,
  add column if not exists reason_code text,
  add column if not exists reason_label text,
  add column if not exists liked_moment text,
  add column if not exists disliked_moment text,
  add column if not exists evidence_start_second numeric,
  add column if not exists evidence_end_second numeric,
  add column if not exists evidence_excerpt text,
  add column if not exists decision_stage text;
