from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router_v1


def create_app() -> FastAPI:
    app = FastAPI(
        title="ReferConnect Backend",
        version="0.1.0",
        openapi_url="/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["health"])  # liveness probe
    async def health_check() -> dict:
        return {"status": "ok"}

    app.include_router(api_router_v1, prefix="/api/v1")

    return app


app = create_app()


