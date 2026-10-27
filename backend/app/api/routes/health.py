from fastapi import APIRouter, status
from app import __version__
from app.core.config import settings
from app.core.database import check_db_connection
from app.schemas.health import ApiHealthResponse, DatabaseHealthResponse

router = APIRouter(tags=["Health & Diagnostics"])


@router.get(
    "/health",
    response_model=ApiHealthResponse,
    status_code=status.HTTP_200_OK,
    summary="API Service Health Check",
    description="Confirms that the MedStock AI FastAPI backend application is running and responsive.",
)
def get_api_health() -> ApiHealthResponse:
    """
    Check the FastAPI backend service health.
    Fast, deterministic check confirming the web server is operating.
    """
    return ApiHealthResponse(
        status="ok",
        project=settings.PROJECT_NAME,
        version=__version__,
        environment=settings.ENVIRONMENT,
        message="MedStock AI Backend API is running.",
        db_check_url=f"{settings.API_V1_STR}/health/db",
    )


@router.get(
    "/health/db",
    response_model=DatabaseHealthResponse,
    status_code=status.HTTP_200_OK,
    summary="MySQL Database Connection Health Check",
    description="Performs an active SQL probe ('SELECT 1') against the configured local MySQL instance.",
)
def get_database_health() -> DatabaseHealthResponse:
    """
    Verify live connectivity to the local MySQL server.
    Reports connection success or sanitized diagnostic details without exposing passwords.
    """
    is_connected, msg, error_detail = check_db_connection()

    return DatabaseHealthResponse(
        status="ok" if is_connected else "degraded",
        connected=is_connected,
        dialect="mysql",
        driver="pymysql",
        host=settings.effective_host,
        port=settings.MYSQL_PORT,
        database=settings.effective_database,
        message=msg,
        error_detail=error_detail,
    )
