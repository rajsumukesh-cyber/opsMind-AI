"""
OpsMind AI - Main FastAPI Application
"An AI Incident Response Agent That Remembers, Learns, and Gets Better."
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("opsmind.app")

from backend.routes.incidents_routes import router as incidents_router
from backend.routes.memory_routes import router as memory_router
from backend.routes.learning_routes import router as learning_router
from backend.routes.dashboard_routes import router as dashboard_router
from backend.routes.postmortem_routes import router as postmortem_router
from backend.routes.demo_routes import router as demo_router
from backend.routes.auth_routes import router as auth_router
from data.seed_data import seed_database_and_memory


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed database and memory if empty
    logger.info("Initializing OpsMind AI backend and memory layer...")
    seed_database_and_memory()
    logger.info("OpsMind AI ready to serve requests.")
    yield
    # Shutdown
    logger.info("OpsMind AI shutting down...")


app = FastAPI(
    title="OpsMind AI",
    description="An AI Incident Response Agent That Remembers, Learns, and Gets Better using Hindsight Memory.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "An internal server error occurred.", "detail": str(exc)},
    )

# Mount API routers
app.include_router(incidents_router)
app.include_router(memory_router)
app.include_router(learning_router)
app.include_router(dashboard_router)
app.include_router(postmortem_router)
app.include_router(demo_router)
app.include_router(auth_router)


@app.get("/api/health")
def health_check():
    """Health status and service configuration."""
    from memory.hindsight_service import memory_service
    from backend.llm import llm_service
    return {
        "status": "healthy",
        "app": "OpsMind AI",
        "version": "1.0.0",
        "hindsight": {
            "connected_to_remote": memory_service.use_remote,
            "total_facts": sum(len(b.facts) for b in memory_service.banks.values()),
            "evolution_stage": memory_service.evolution_stage
        },
        "llm": {
            "provider": "Groq" if llm_service.is_configured() else "Resilient Embedded SRE Engine",
            "model": llm_service.model if llm_service.is_configured() else "opsmind-sre-reasoner-v1"
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port, reload=True)
