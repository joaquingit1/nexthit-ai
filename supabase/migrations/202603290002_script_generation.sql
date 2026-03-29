-- 202603290002_script_generation.sql

-- Agregar columna para prompt de generación de guiones
ALTER TABLE public.system_prompts
ADD COLUMN IF NOT EXISTS script_generation_prompt text;

-- Tabla de tracking de generaciones de guiones
CREATE TABLE IF NOT EXISTS public.generation_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  response text,
  tokens_used integer,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.generation_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access generation_scripts"
ON public.generation_scripts FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Anon can read generation_scripts"
ON public.generation_scripts FOR SELECT TO anon
USING (true);
