import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app import __version__
from app.api.router import api_router
from app.api.routes import health
from app.core.config import settings
from app.core.database import check_db_connection, init_db, sanitize_error

# Configure application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("medstock_ai.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager: runs startup and shutdown events."""
    logger.info("Starting %s v%s in %s mode...", settings.PROJECT_NAME, __version__, settings.ENVIRONMENT)
    logger.info("Configured Database URI: %s", settings.masked_database_uri)
    logger.info("Allowed CORS Origins: %s", settings.CORS_ORIGINS)

    # Test MySQL connectivity probe on startup
    is_connected, msg, error_detail = check_db_connection()
    if is_connected:
        logger.info("MySQL Startup Probe: SUCCESS - %s", msg)
        init_db()
    else:
        logger.warning(
            "MySQL Startup Probe: NOTICE - %s (Details: %s). "
            "Backend will continue in degraded mode until MySQL credentials are configured in backend/.env.",
            msg,
            error_detail,
        )

    yield

    logger.info("Shutting down %s...", settings.PROJECT_NAME)


def create_application() -> FastAPI:
    """Factory to instantiate and configure the FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=__version__,
        description=(
            "MedStock AI Backend — Phase 2 REST API foundation providing local MySQL "
            "persistence and health diagnostics for Type C retail pharmacies."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Enable CORS with explicit development allowlist
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Global Exception Handler: ensures no sensitive database credentials or raw tracebacks are exposed
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        clean_msg = sanitize_error(str(exc))
        logger.error("Unhandled exception processing %s %s: %s", request.method, request.url.path, clean_msg)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred.",
                "message": clean_msg,
            },
        )

    # Root welcome and diagnostic endpoint
    @app.get(
        "/",
        tags=["System"],
        summary="API Root",
        description="Returns API metadata and documentation links.",
    )
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": __version__,
            "environment": settings.ENVIRONMENT,
            "database_dialect": "mysql",
            "driver": "pymysql",
            "documentation": "/docs",
            "api_health": f"{settings.API_V1_STR}/health",
            "db_health": f"{settings.API_V1_STR}/health/db",
        }

    # Mount API routes under /api
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Also mount health router at root level for standard health-check tooling
    app.include_router(health.router)

    return app


app = create_application()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
    )
