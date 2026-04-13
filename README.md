# NextHit AI

**Predict short-form video performance before you spend a dollar on distribution.**

NextHit simulates 100 AI-powered synthetic viewers against a raw marketing video and produces a pre-launch creative report: projected retention curve, segment-level drop-off diagnostics, creative scoring, and prioritized recommendations for what to change before the campaign goes live.

🌐 [Live Product](https://nexthit.site) · 
📦 [Repository](https://github.com/joaquingit1/nexthit-ai) · 
🏆 Finalist @ HackITBA 2026 (#2 overall out of 48) · ⏱ Built in 36 hours

# Demo:

https://github.com/user-attachments/assets/cb80e92d-51f9-4ede-9ecf-afed453c9a79

---

## Problem

Creative workflows in paid acquisition are reactive. Teams produce content, buy traffic, wait for retention data, then iterate. Budget is spent before validation. Insights arrive after the damage is done.

NextHit introduces a **pre-launch simulation layer** — creative performance is modeled, stress-tested, and iterated before distribution.

## How It Works

```
Upload video → Transcribe → Multimodal enrichment → Simulate audience → Aggregate → Synthesize report
```

**1. Multimodal Video Understanding**
The system extracts audio, transcribes it with timestamps (Groq Whisper), runs frame-level visual analysis and on-screen text detection (Gemini), and temporally aligns all modalities into a unified content timeline.

**2. Synthetic Audience Simulation**
100 LLM-based viewer agents — each with structured personas (demographics, attention patterns, content affinity) — evaluate the video sequentially. Each agent decides independently whether to continue watching, when to drop off, and articulates a semantic reason for disengagement. Simulation runs in 5 batches of 20 to balance throughput, token limits, and persona diversity.

**3. Aggregation & Synthesis**
Drop-off decisions are aggregated into a projected retention curve with segment-level diagnostics. The system then synthesizes creative recommendations, hook variants, A/B/C alternatives, targeting strategy, and ready-to-publish content ideas.

## System Architecture

```
Browser ──► Supabase Storage (direct upload)
               │
Frontend       │   Next.js 14 + Tailwind
  /app         │   Upload orchestration, SSE progress subscription
  /resultado   │   Results dashboard
               │
Backend        ▼   FastAPI (modular pipeline)
  ┌─────────────────────────────────────────┐
  │  Job orchestration                      │
  │  ├─ Duration extraction                 │
  │  ├─ Timestamped transcription (Whisper) │
  │  ├─ Multimodal enrichment (Gemini)      │
  │  ├─ Creative scoring                    │
  │  ├─ Audience simulation (5 × 20)        │
  │  ├─ Aggregation (retention + segments)  │
  │  └─ Synthesis (recommendations + variants)
  └─────────────────────────────────────────┘
               │
Supabase       ▼   Storage, job persistence, prompt config, migrations
```

### Key Engineering Decisions

**Direct-to-storage uploads.** Videos upload from the browser straight to Supabase Storage, bypassing the app server entirely. This eliminates backend bottlenecks for large media and lets the API focus on compute.

**Persistent jobs with SSE streaming.** Each analysis is a long-running job. Progress is persisted to the database and streamed to the client via Server-Sent Events — real-time feedback without polling.

**Prompt-configurable behavior.** All system prompts are loaded from Supabase with fallback defaults. Prompt iteration does not require code changes or redeployment.

**Batched simulation.** Running 100 agents in 5 batches of 20 is a deliberate tradeoff: it fits within model context limits, keeps latency manageable, and preserves diversity across runs.

**Multimodal alignment.** The system does not reason over transcript alone. It enriches content with visual context and on-screen text, then reasons over the combined timeline — critical for short-form video where visuals often carry the message.

## Output

The `/resultado` dashboard is designed around a single principle: **only surface what drives a decision.**

| Section | Purpose |
|---|---|
| Score + executive summary | Immediate quality signal |
| Synthetic personas | See who drops off and why |
| Segment drop-off diagnostics | Identify which audience segments fail |
| Projected retention curve | Visualize predicted engagement over time |
| Key moments | Attention peaks and failure points |
| What to change | Prioritized creative actions |
| Targeting recommendations | Audience strategy guidance |
| A/B/C variants | Alternative creative directions |
| Ready-to-publish posts | Actionable content ideas |

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS |
| Backend | FastAPI (modular) |
| Storage / DB | Supabase |
| Audio transcription | Groq Whisper |
| Multimodal analysis | Gemini |
| Deployment | Vercel |

## Cost Profile

| Component | Cost per video |
|---|---|
| Transcription (Whisper) | ~$0.01–0.02 |
| Multimodal analysis (Gemini) | ~$0.03–0.08 |
| Simulation + synthesis | ~$0.05 |
| **Total** | **~$0.10** |

## Repository Structure

```
frontend/
  app/              # Pages and routing
  components/       # UI components
  lib/              # Client utilities

backend/
  api/              # API layer
  models/           # Data models
  pipeline/         # Processing pipeline stages
  repository/       # Data access
  routes/           # HTTP routes
  schemas/          # Request/response schemas
  services/         # Business logic
  system_prompts.py # Prompt management

supabase/
  migrations/       # DB schema evolution
  seed.sql          # Initial data
```

## Local Setup

```bash
git clone https://github.com/joaquingit1/nexthit-ai.git
cd nexthit-ai
```

Configure environment variables for frontend and backend (see below), then:

```bash
# Database
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_REF
npx supabase@latest db push

# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend
# Install Python dependencies, then run the FastAPI server
```

### Environment Variables

**Backend:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `GROQ_API_KEY`, `GROQ_TEXT_MODEL`, `GEMINI_API_KEY`, `GEMINI_VIDEO_MODEL`, `GEMINI_TIMEOUT_SECONDS`, `PUBLIC_BACKEND_URL`, `ALLOW_MULTIMODAL_FALLBACK`

**Frontend:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BACKEND_URL`, `BACKEND_URL`

## Early Validation

Exploratory tests with real short-form videos from influencer mentors during the hackathon showed predicted drop-off points typically within ~5 seconds of observed retention drops, with strong alignment on weak hooks, pacing issues, and unclear messaging. Two influencers indicated willingness to pay after using the product.

**Caveats:** Very small sample, not statistically rigorous. Results are directional, not proof of predictive accuracy.

## Limitations

- Synthetic viewers are useful proxies, not ground truth
- Output quality depends on model capability and prompt design
- Multimodal alignment degrades with poor audio or rapid-cut visuals
- Predictions are directional, not deterministic
- Niche content can trigger persona mismatch; low-quality transcription propagates errors downstream

## Roadmap

- Ground-truth evaluation against real campaign retention data
- Quantitative metrics (correlation, MAE on retention curves)
- Production-grade PDF/CSV export
- Prompt versioning and auditability
- Failure-mode detection and confidence reporting
- Cost and latency optimization
- Integration with ad platforms (Meta, Google Ads)

## Team

Built during HackITBA 2026 by **Joaquin Castellano**, **Tobias Simoni**, **Santiago Ohoka Jorge**, and **Bruno Ergang**.
