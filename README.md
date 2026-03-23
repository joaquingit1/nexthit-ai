# Hackathon Template

Starter kit with a FastAPI backend, a Next.js frontend, and a Supabase client stub.

## Structure

```text
backend/
frontend/
README.md
```

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Copy `backend/.env.example` to `backend/.env` if you want to wire Supabase credentials.

## Frontend

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local` if your API is not running at `http://localhost:8000`.

## Included flows

- Landing page at `/`
- Input form at `/app`
- Result screen at `/resultado`
- FastAPI endpoint at `POST /api/procesar`

## Notes

- The frontend sends `multipart/form-data`, so text plus files already works.
- `frontend/lib/supabase.ts` returns `null` until Supabase environment variables are configured.
- The backend currently returns a mock processed message and is ready for real AI or storage logic.
