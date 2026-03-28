# Hackathon Template

AXIOM//LENS now uses:
- `Supabase` for direct video uploads, storage, and job persistence
- `Groq` for Whisper transcription and text analysis/persona simulation
- `Next.js on Vercel` for the frontend
- `FastAPI` for the backend orchestration pipeline

## Structure

```text
backend/
frontend/
supabase/
README.md
```

## Local backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

Required backend env vars:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`
- `GROQ_API_KEY`
- `GROQ_BASE_URL`
- `GROQ_TRANSCRIPTION_MODEL`
- `GROQ_TEXT_MODEL`
- `PUBLIC_BACKEND_URL`

Recommended defaults:
- `SUPABASE_BUCKET=videos-raw`
- `GROQ_BASE_URL=https://api.groq.com/openai/v1`
- `GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo`
- `GROQ_TEXT_MODEL=llama-3.1-8b-instant`

## Local frontend

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Required frontend env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`
- `BACKEND_URL`

Use the same backend origin for both backend vars. `NEXT_PUBLIC_BACKEND_URL` is important because the browser now connects directly to the backend SSE stream for long-running job updates.

## Supabase setup

The repo already contains:
- local Supabase config in [supabase/config.toml](c:\Users\jo\Desktop\hackathon%20test\supabase\config.toml)
- schema + storage bucket migration in [supabase/migrations/202603280001_init_analysis.sql](c:\Users\jo\Desktop\hackathon%20test\supabase\migrations\202603280001_init_analysis.sql)

CLI flow:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
```

What this creates:
- `videos`
- `analysis_jobs`
- `analysis_results`
- `persona_results`
- `analysis_events`
- private storage bucket `videos-raw`

## Vercel setup

Frontend production depends on these Vercel environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`
- `BACKEND_URL`

Suggested values:
- `NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain`
- `BACKEND_URL=https://your-backend-domain`

Deploy:

```bash
cd frontend
npx vercel --prod
```

Important:
- deploy the `frontend` to Vercel
- the backend is currently also deployed on Vercel for this demo setup
- because the analysis runs through a long-lived SSE request, keep clips short and expect serverless time limits to still matter

## Live flow

1. User uploads a video in `/app`
2. Browser asks backend for an upload ticket
3. Browser uploads the file directly to Supabase Storage
4. Browser creates an analysis job
5. Backend:
   - downloads the uploaded video
   - extracts duration
   - transcribes with Groq Whisper
   - runs creative analysis
   - runs 5 persona batches of 20
   - aggregates demographics
   - synthesizes the final `AnalysisResponse`
6. Browser listens to SSE events and redirects to `/resultado` once the final payload is ready

## Notes

- The frontend still supports the old `/api/procesar` mock fallback for local/demo resilience.
- The `/resultado` screen can now consume backend-native `transcript`, `personas`, `targetAudience`, `timelineInsights`, and `scoreSummary` fields without breaking the existing UI.
- Groq free-tier limits still apply, so keeping the uploaded creative short and compressing audio helps.
