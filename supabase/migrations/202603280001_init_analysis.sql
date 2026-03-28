create extension if not exists "pgcrypto";

create table if not exists public.videos (
  id text primary key,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text,
  size_bytes bigint,
  duration_seconds integer,
  transcript_text text,
  transcript_language text,
  transcript_segments jsonb,
  status text not null default 'pending_upload',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analysis_jobs (
  id text primary key,
  video_id text not null references public.videos(id) on delete cascade,
  status text not null default 'queued',
  stage text not null default 'job.created',
  progress_percent integer not null default 0,
  error_message text,
  user_context text,
  preferred_platform text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analysis_results (
  job_id text primary key references public.analysis_jobs(id) on delete cascade,
  video_id text not null references public.videos(id) on delete cascade,
  payload jsonb not null,
  overall_score integer,
  ad_readiness_score integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.persona_results (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.analysis_jobs(id) on delete cascade,
  video_id text not null references public.videos(id) on delete cascade,
  persona_id text not null,
  name text not null,
  age_range text not null,
  country text not null,
  occupation text not null,
  income_bracket text not null,
  social_status text not null,
  interests jsonb not null,
  hobbies jsonb not null,
  life_story text not null,
  platform_habits text not null,
  motivations jsonb not null,
  frustrations jsonb not null,
  segment_label text not null,
  color text not null,
  batch_index integer not null,
  dropoff_second numeric not null,
  retention_percent integer not null,
  why_they_left text not null,
  summary_of_interacion text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analysis_events (
  sequence bigint generated always as identity primary key,
  job_id text not null references public.analysis_jobs(id) on delete cascade,
  video_id text not null references public.videos(id) on delete cascade,
  event_type text not null,
  status text not null,
  stage text not null,
  progress_percent integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists analysis_events_job_id_sequence_idx
  on public.analysis_events (job_id, sequence);

insert into storage.buckets (id, name, public)
values ('videos-raw', 'videos-raw', false)
on conflict (id) do nothing;

create policy "Anon can upload raw videos"
on storage.objects
for insert
to anon
with check (bucket_id = 'videos-raw');

create policy "Anon can read raw videos"
on storage.objects
for select
to anon
using (bucket_id = 'videos-raw');

create policy "Service role can manage raw videos"
on storage.objects
for all
to service_role
using (bucket_id = 'videos-raw')
with check (bucket_id = 'videos-raw');

alter table public.videos enable row level security;
alter table public.analysis_jobs enable row level security;
alter table public.analysis_results enable row level security;
alter table public.persona_results enable row level security;
alter table public.analysis_events enable row level security;

create policy "Service role full access videos"
on public.videos
for all
to service_role
using (true)
with check (true);

create policy "Service role full access jobs"
on public.analysis_jobs
for all
to service_role
using (true)
with check (true);

create policy "Service role full access results"
on public.analysis_results
for all
to service_role
using (true)
with check (true);

create policy "Service role full access personas"
on public.persona_results
for all
to service_role
using (true)
with check (true);

create policy "Service role full access events"
on public.analysis_events
for all
to service_role
using (true)
with check (true);
