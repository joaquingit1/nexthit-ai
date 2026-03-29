alter table public.persona_results
  add column if not exists gender text,
  add column if not exists native_language text,
  add column if not exists niche_tags jsonb not null default '[]'::jsonb,
  add column if not exists audience_context_label text,
  add column if not exists language_affinity_multiplier numeric,
  add column if not exists weighted_retention_score numeric;
