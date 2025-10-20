from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect, Depends

from app.core.config import settings
from app.api.v1.router import api_router_v1
from app.dependencies.auth import get_current_user
from app.models.user import User


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
        allow_origins=["*"],  # Allow all origins for now
        allow_credentials=False,  # Set to False when allowing all origins
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["health"])  # liveness probe
    async def health_check() -> dict:
        return {"status": "ok", "message": "ReferConnect API is running"}

    app.include_router(api_router_v1, prefix="/api/v1")

    # In-memory connection mapping (demo only; replace with Redis pub/sub for scale)
    user_connections: dict[int, set[WebSocket]] = {}

    @app.websocket("/ws/notifications")
    async def notifications_ws(websocket: WebSocket, user: User = Depends(get_current_user)):
        await websocket.accept()
        user_set = user_connections.setdefault(user.id, set())
        user_set.add(websocket)
        try:
            while True:
                # Keep connection alive; no inbound messages expected
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            user_set.discard(websocket)
            if not user_set:
                user_connections.pop(user.id, None)

    return app


app = create_app()


