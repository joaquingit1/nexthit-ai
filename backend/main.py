import asyncio
import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="Hackathon API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "Backend funcionando correctamente",
        "supabase_configured": bool(os.getenv("SUPABASE_URL")),
    }


@app.post("/api/procesar")
async def process_data(texto: str = Form(...), archivo: UploadFile | None = File(default=None)):
    try:
        # Hook point for storing files, calling an LLM, or running ML inference.
        await asyncio.sleep(1.5)

        filename = archivo.filename if archivo else "Ningun archivo subido"

        if archivo is not None:
            await archivo.read()

        mock_result = (
            "Analisis completado. Hemos procesado tu texto de "
            f"{len(texto)} caracteres y el archivo '{filename}'. "
            "Tu negocio esta listo para escalar."
        )

        return {
            "id": str(uuid.uuid4()),
            "status": "success",
            "resultado": mock_result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
