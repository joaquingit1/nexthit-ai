from routes.health import router as health_router
from routes.jobs import router as jobs_router
from routes.uploads import router as uploads_router

__all__ = ["health_router", "jobs_router", "uploads_router"]
