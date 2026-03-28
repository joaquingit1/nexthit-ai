# AXIOM//LENS

Plataforma de analisis predictivo para videos cortos de marketing. Simula audiencias sinteticas para predecir retencion y optimizar creativos antes de invertir en pauta.

## Que hace

1. **Sube un video** desde `/app` directo a Supabase Storage
2. **Transcribe** el audio con Groq Whisper
3. **Analiza** el creativo (hook, claridad, ritmo, audio, visual, CTA)
4. **Simula 100 personas** sinteticas con perfiles demograficos y comportamientos distintos
5. **Predice abandono** por segmento con motivos especificos
6. **Genera recomendaciones** accionables para mejorar el video
7. **Entrega un informe** interactivo en 8 pasos en `/resultado`

## Informe de analisis (8 pasos)

| Paso | Nombre | Descripcion |
|------|--------|-------------|
| 1 | Puntaje y Resumen | Score general con metricas clave de rendimiento |
| 2 | 100 Personas Sinteticas | Dataset de audiencia simulada con paginacion |
| 3 | Analisis por Segmento | Retencion por arquetipo con diagnostico de abandono |
| 4 | Curva de Retencion | Grafico interactivo de retencion proyectada |
| 5 | Momentos Clave | Mapa temporal de puntos criticos del video |
| 6 | Plan de Cambios | Acciones especificas con timestamps |
| 7 | Estrategia de Medios | Configuracion de segmentacion para campanas |
| 8 | Variantes Creativas | Tres propuestas de iteracion para testing |

## Stack

- **Frontend**: Next.js 14 + Tailwind CSS (Vercel)
- **Backend**: FastAPI con arquitectura modular (Vercel)
- **Storage**: Supabase (videos + base de datos)
- **AI**: Groq (Whisper para transcripcion, LLaMA para analisis)

## Estructura del proyecto

```
axiom-lens/
├── frontend/                 # Next.js app
│   ├── app/
│   │   ├── page.tsx         # Landing
│   │   ├── app/page.tsx     # Upload de video
│   │   └── resultado/       # Dashboard de resultados
│   └── lib/                 # Utilidades y tipos
│
├── backend/                  # FastAPI (arquitectura modular)
│   ├── main.py              # App init + routers
│   ├── config.py            # Variables de entorno
│   ├── system_prompts.py    # Prompts centralizados
│   ├── routes/              # Endpoints (health, uploads, jobs)
│   ├── services/            # Logica de negocio
│   │   ├── transcription.py
│   │   ├── creative_analysis.py
│   │   ├── persona_simulation.py
│   │   ├── audience.py
│   │   ├── retention.py
│   │   ├── change_plan.py
│   │   └── strategy.py
│   ├── repository/          # Acceso a Supabase
│   ├── pipeline/            # Procesador de jobs
│   ├── models/              # Request/Response Pydantic
│   ├── schemas/             # JSON schemas para Groq
│   ├── constants/           # Constantes y labels
│   └── utils/               # Helpers
│
└── supabase/                # Config y migraciones
```

## Setup local

### Backend

```bash
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

**Variables requeridas:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET` (default: `videos-raw`)
- `GROQ_API_KEY`
- `GROQ_TEXT_MODEL` (default: `llama-3.1-8b-instant`)

### Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

**Variables requeridas:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`
- `BACKEND_URL`

### Supabase

```bash
npx supabase@latest login
npx supabase@latest link --project-ref TU_PROJECT_REF
npx supabase@latest db push
```

Crea las tablas: `videos`, `analysis_jobs`, `analysis_results`, `persona_results`, `analysis_events`

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/api/uploads/init` | Crear ticket de subida |
| POST | `/api/analysis/jobs` | Crear job de analisis |
| GET | `/api/analysis/jobs/{id}` | Estado del job |
| GET | `/api/analysis/jobs/{id}/events` | Stream SSE de progreso |
| GET | `/api/analysis/jobs/{id}/result` | Resultado final |

## Flujo de procesamiento

```
Usuario sube video → Ticket de subida → Upload a Supabase
                                              ↓
                                        Crear job
                                              ↓
                    ┌─────────────────────────┴─────────────────────────┐
                    ↓                                                   ↓
              Descargar video                                    SSE al frontend
                    ↓
              Calcular duracion
                    ↓
              Transcribir (Whisper)
                    ↓
              Analisis creativo
                    ↓
              Simular 100 personas (5 lotes x 20)
                    ↓
              Agregar segmentos y audiencia
                    ↓
              Sintetizar recomendaciones
                    ↓
              Guardar resultado → Redirect a /resultado
```

## Deploy

El proyecto esta configurado para deploy en Vercel (frontend y backend).

```bash
cd frontend && npx vercel --prod
cd backend && npx vercel --prod
```

## URLs de produccion

- Frontend: https://frontend-sooty-kappa-40.vercel.app
- Backend: https://backend-five-gamma-99.vercel.app
- Repo: https://github.com/joaquingit1/axiom-lens

## Pendientes

- [ ] Analisis visual real del video (frames)
- [ ] OCR de texto en pantalla
- [ ] Analisis multimodal completo (video + audio + texto)
- [ ] Soporte para videos mas largos

## Notas

- Los videos se eliminan de Storage al terminar el procesamiento
- El modo demo esta disponible en `/resultado?demo=1`
- Los prompts estan centralizados en `backend/system_prompts.py`
