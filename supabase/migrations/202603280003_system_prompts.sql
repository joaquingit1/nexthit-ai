-- System Prompts table
create table if not exists public.system_prompts (
  id uuid primary key default gen_random_uuid(),
  user_persona_batch_prompt text,
  score_prompt text,
  summary_video_prompt text,
  strategic_output_prompt text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Generation tracking tables
create table if not exists public.generation_user_persona_batch (
  id uuid primary key default gen_random_uuid(),
  job_id text references public.analysis_jobs(id) on delete cascade,
  response text,
  tokens_used integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generation_score (
  id uuid primary key default gen_random_uuid(),
  job_id text references public.analysis_jobs(id) on delete cascade,
  response text,
  tokens_used integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generation_summary_video (
  id uuid primary key default gen_random_uuid(),
  job_id text references public.analysis_jobs(id) on delete cascade,
  response text,
  tokens_used integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generation_strategic_output (
  id uuid primary key default gen_random_uuid(),
  job_id text references public.analysis_jobs(id) on delete cascade,
  response text,
  tokens_used integer,
  created_at timestamptz not null default timezone('utc', now())
);

-- RLS policies
alter table public.system_prompts enable row level security;
alter table public.generation_user_persona_batch enable row level security;
alter table public.generation_score enable row level security;
alter table public.generation_summary_video enable row level security;
alter table public.generation_strategic_output enable row level security;

-- Service role full access
create policy "Service role full access system_prompts"
on public.system_prompts for all to service_role
using (true) with check (true);

create policy "Service role full access generation_user_persona_batch"
on public.generation_user_persona_batch for all to service_role
using (true) with check (true);

create policy "Service role full access generation_score"
on public.generation_score for all to service_role
using (true) with check (true);

create policy "Service role full access generation_summary_video"
on public.generation_summary_video for all to service_role
using (true) with check (true);

create policy "Service role full access generation_strategic_output"
on public.generation_strategic_output for all to service_role
using (true) with check (true);

-- Anon read access for frontend
create policy "Anon can read system_prompts"
on public.system_prompts for select to anon
using (true);

create policy "Anon can read generation_user_persona_batch"
on public.generation_user_persona_batch for select to anon
using (true);

create policy "Anon can read generation_score"
on public.generation_score for select to anon
using (true);

create policy "Anon can read generation_summary_video"
on public.generation_summary_video for select to anon
using (true);

create policy "Anon can read generation_strategic_output"
on public.generation_strategic_output for select to anon
using (true);

-- Anon can update system_prompts (for admin page)
create policy "Anon can update system_prompts"
on public.system_prompts for update to anon
using (true) with check (true);
