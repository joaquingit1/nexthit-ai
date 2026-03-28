# NextHit

Plataforma de analisis predictivo para videos cortos de marketing. Sube un video, lo transcribe, lo enriquece con analisis multimodal, simula 100 personas sinteticas y convierte todo eso en retencion, segmentacion y estrategia.

## Estado actual

- [x] Upload directo del navegador a Supabase Storage
- [x] Jobs persistidos y progreso en vivo por SSE
- [x] Transcripcion con timestamps via Groq Whisper
- [x] Analisis multimodal del video con Gemini
- [x] Timeline enriquecido por segmento con voz, visuales y texto en pantalla
- [x] Simulacion de 100 personas en 5 lotes de 20
- [x] Curva de retencion proyectada y diagnostico por segmento
- [x] Recomendaciones creativas, targeting y variantes A/B/C
- [x] Dashboard de resultados en `/resultado`
- [x] Nuevas pantallas de marketing y dashboard UI del branch `dev`
- [x] Prompts cargables desde Supabase con fallback a defaults
- [ ] Exportacion real de PDF / CSV
- [ ] Hardening final del admin de prompts
- [ ] Monitoreo y analytics de uso en produccion

## Flujo del producto

1. El usuario sube un video desde `/app`
2. El frontend pide ticket de subida y sube directo a Supabase
3. El backend descarga el video, calcula duracion y transcribe audio
4. Gemini analiza el video y enriquece el transcript con contexto visual
5. Se calcula el score creativo con peso principal en video
6. Se simulan 100 personas sinteticas en 5 batches
7. Se agregan segmentos, motivos de abandono y audiencias ganadoras
8. Se sintetizan cambios, media targeting, variantes y crossposting
9. El frontend redirige a `/resultado` con el payload final

## Resultado `/resultado`

1. Puntaje y resumen
2. 100 personas sinteticas
3. Drop-off por segmento
4. Grafico de retencion
5. Momentos del video
6. Que cambiar
7. Targeting de medios
8. Versiones A/B/C
9. Posts para redes

## Stack

- Frontend: Next.js 14 + Tailwind CSS
- Backend: FastAPI modular
- Storage/DB: Supabase
- Audio: Groq Whisper
- Video multimodal: Gemini
- Deploy: Vercel

## Estructura

```text
frontend/
  app/
  components/
  lib/

backend/
  api/
  constants/
  models/
  pipeline/
  repository/
  routes/
  schemas/
  services/
  system_prompts.py

supabase/
  migrations/
  seed.sql
```

## Variables importantes

### Backend

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`
- `GROQ_API_KEY`
- `GROQ_TEXT_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_VIDEO_MODEL`
- `GEMINI_TIMEOUT_SECONDS`
- `PUBLIC_BACKEND_URL`
- `ALLOW_MULTIMODAL_FALLBACK`

### Frontend

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`
- `BACKEND_URL`

## Supabase

Migraciones actuales:

- `202603280001_init_analysis.sql`
- `202603280002_multimodal_gemini.sql`
- `202603280003_system_prompts.sql`

Comandos:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref TU_PROJECT_REF
npx supabase@latest db push
```

## Deploy

```bash
cd frontend
npx vercel --prod

cd ../backend
npx vercel --prod
```

## Produccion

- Frontend: https://nexthit.site
- Backend: https://backend-five-gamma-99.vercel.app
- Repo: https://github.com/joaquingit1/axiom-lens
