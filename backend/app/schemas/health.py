from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class ApiHealthResponse(BaseModel):
    """Health check response for the FastAPI application service."""
    status: str = Field(default="ok", description="API service status")
    project: str = Field(..., description="Project name")
    version: str = Field(..., description="API version")
    environment: str = Field(..., description="Runtime environment")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Current timestamp in UTC")
    message: str = Field(default="MedStock AI Backend API is running.", description="Service status message")
    db_check_url: str = Field(default="/api/health/db", description="Endpoint to verify live MySQL connection")


class DatabaseHealthResponse(BaseModel):
    """Health check response for the local MySQL database connection."""
    status: str = Field(..., description="Database status ('ok' if connected, 'degraded' if offline/unreachable)")
    connected: bool = Field(..., description="True if MySQL answered connection probe, False otherwise")
    dialect: str = Field(default="mysql", description="Configured SQL dialect")
    driver: str = Field(default="pymysql", description="Underlying database driver")
    host: str = Field(..., description="Configured MySQL host")
    port: int = Field(..., description="Configured MySQL port")
    database: str = Field(..., description="Configured target MySQL database name")
    message: str = Field(..., description="Summary status message")
    error_detail: Optional[str] = Field(default=None, description="Sanitized error details if disconnected")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of probe in UTC")
