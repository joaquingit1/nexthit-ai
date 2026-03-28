# AXIOM//LENS

Webapp de inteligencia creativa multimodal para videos cortos de marketing.

El sistema hoy hace esto:
- recibe un video desde `/app`
- lo sube directo a Supabase Storage
- extrae duracion y audio
- transcribe con Groq Whisper con timestamps
- analiza el creativo
- simula 100 personas sinteticas en 5 lotes
- agrega segmentos, motivos de abandono y audiencia objetivo
- devuelve un informe completo en `/resultado`

## Stack

- `frontend/`: Next.js desplegado en Vercel
- `backend/`: FastAPI desplegado en Vercel
- `supabase/`: storage, tablas y migraciones
- `groq`: transcripcion y generacion de texto

## Estado actual

Checklist de avance:
- [x] Subida directa del video desde el navegador a Supabase
- [x] Pipeline asincronico de analisis con jobs persistidos
- [x] Transcripcion con timestamps
- [x] Extraccion forzada de audio antes de transcribir
- [x] Simulacion de 100 personas en 5 lotes
- [x] SSE para progreso en vivo
- [x] Resultado persistido y compatible con `/resultado`
- [x] Paso de score y resumen
- [x] Paso de 100 personas sinteticas
- [x] Paso de drop-off por segmento
- [x] Paso de grafico de retencion con transcript por hover
- [x] Paso de timeline
- [x] Paso de que cambiar
- [x] Paso de media targeting
- [x] Paso de versiones A/B/C
- [x] Paso de posts para redes
- [x] Repo GitHub sincronizado
- [x] Frontend y backend desplegados

Pendientes importantes:
- [ ] Analisis visual real del video
- [ ] OCR real de texto en pantalla
- [ ] Analisis multimodal completo con video, no solo transcript
- [ ] Hardening del backend serverless para clips mas largos

## Estructura

```text
backend/
frontend/
supabase/
README.md
```

## Levantar backend local

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

Variables requeridas del backend:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`
- `GROQ_API_KEY`
- `GROQ_BASE_URL`
- `GROQ_TRANSCRIPTION_MODEL`
- `GROQ_TEXT_MODEL`
- `PUBLIC_BACKEND_URL`

Defaults recomendados:
- `SUPABASE_BUCKET=videos-raw`
- `GROQ_BASE_URL=https://api.groq.com/openai/v1`
- `GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo`
- `GROQ_TEXT_MODEL=llama-3.1-8b-instant`

## Levantar frontend local

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Variables requeridas del frontend:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`
- `BACKEND_URL`

Usar el mismo origen del backend para ambas variables de backend. `NEXT_PUBLIC_BACKEND_URL` es importante porque el navegador se conecta directo al stream SSE.

## Supabase

Este repo ya incluye:
- configuracion local en [supabase/config.toml](c:\Users\jo\Desktop\hackathon test\supabase\config.toml)
- migracion de esquema y bucket en [supabase/migrations/202603280001_init_analysis.sql](c:\Users\jo\Desktop\hackathon test\supabase\migrations\202603280001_init_analysis.sql)

Flujo CLI:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref TU_PROJECT_REF
npx supabase@latest db push
```

Esto crea:
- `videos`
- `analysis_jobs`
- `analysis_results`
- `persona_results`
- `analysis_events`
- bucket privado `videos-raw`

## Vercel

Variables de entorno de produccion necesarias:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`
- `BACKEND_URL`

Valores sugeridos:
- `NEXT_PUBLIC_BACKEND_URL=https://tu-backend`
- `BACKEND_URL=https://tu-backend`

Deploy:

```bash
cd frontend
npx vercel --prod
```

Nota:
- el frontend esta desplegado en Vercel
- el backend tambien esta desplegado en Vercel para esta demo
- como el analisis corre por un request largo con SSE, conviene mantener clips cortos

## Flujo en vivo

1. El usuario sube un video en `/app`
2. El navegador pide un ticket de subida al backend
3. El navegador sube el archivo directo a Supabase Storage
4. El navegador crea un job de analisis
5. El backend:
   - descarga el video
   - calcula la duracion
   - transcribe con Groq Whisper
   - corre analisis creativo
   - ejecuta 5 lotes de 20 personas
   - agrega segmentos y audiencia
   - sintetiza el `AnalysisResponse` final
6. El navegador escucha eventos SSE y redirige a `/resultado`

## URLs actuales

- Frontend: `https://frontend-sooty-kappa-40.vercel.app`
- Backend: `https://backend-five-gamma-99.vercel.app`
- GitHub: `https://github.com/joaquingit1/axiom-lens`

## Notas

- Los videos crudos se borran de Supabase Storage cuando termina el procesamiento.
- El flujo normal ya no deberia mezclar demo placeholders con resultados reales.
- Si un resultado viejo aparece raro en `/resultado`, volver a correr el video para regenerar el payload con la version nueva.
