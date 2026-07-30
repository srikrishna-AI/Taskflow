import logging
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.categories import router as categories_router
from app.api.routes.tasks import router as tasks_router
from app.core.config import settings
from app.db.session import Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("task_management")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-process rate limiting middleware for demo purposes."""

    def __init__(self, app: Any, max_requests: int = 120, window_seconds: int = 60) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = {}

    async def dispatch(self, request: Any, call_next: Any) -> Any:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        bucket = self.requests.setdefault(client_ip, [])
        bucket[:] = [timestamp for timestamp in bucket if now - timestamp < self.window_seconds]
        if len(bucket) >= self.max_requests:
            from starlette.responses import JSONResponse

            return JSONResponse(status_code=429, content={"detail": "Too many requests"})
        bucket.append(now)
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")
    yield


app = FastAPI(title=settings.project_name, version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)

app.include_router(auth_router, prefix=settings.api_v1_str)
app.include_router(tasks_router, prefix=settings.api_v1_str)
app.include_router(categories_router, prefix=settings.api_v1_str)


@app.get("/health")
def health_check() -> dict[str, str]:
    """Basic health endpoint."""
    return {"status": "ok"}
