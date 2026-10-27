from pathlib import Path
from typing import List, Optional, Union
import urllib.parse
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url

# Root directory of backend
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables and backend/.env file."""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # General Project Info
    PROJECT_NAME: str = "MedStock AI Backend"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    # Server Configuration
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS Allowlist for Vite Frontend
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return []

    # MySQL Connection Settings (Default: 127.0.0.1:3306)
    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""
    MYSQL_DATABASE: str = "medstock_ai"

    # Optional alias fallbacks
    MYSQL_SERVER: Optional[str] = None
    MYSQL_DB: Optional[str] = None

    # Optional Direct Connection URL override
    DATABASE_URL: Optional[str] = None

    @property
    def effective_host(self) -> str:
        return self.MYSQL_SERVER or self.MYSQL_HOST

    @property
    def effective_database(self) -> str:
        return self.MYSQL_DB or self.MYSQL_DATABASE

    @property
    def sqlalchemy_database_uri(self) -> str:
        """
        Construct a validated MySQL SQLAlchemy connection URI using PyMySQL driver.
        Format: mysql+pymysql://USER:PASSWORD@HOST:PORT/DATABASE?charset=utf8mb4
        """
        if self.DATABASE_URL:
            url_str = self.DATABASE_URL.strip()
            # Normalize generic mysql:// to mysql+pymysql://
            if url_str.startswith("mysql://"):
                url_str = url_str.replace("mysql://", "mysql+pymysql://", 1)
            elif not url_str.startswith("mysql+pymysql://"):
                url_str = f"mysql+pymysql://{url_str.split('://', 1)[-1]}"
            return url_str

        # URL-encode password in case it contains special characters
        encoded_password = urllib.parse.quote_plus(self.MYSQL_PASSWORD) if self.MYSQL_PASSWORD else ""
        auth_part = f"{self.MYSQL_USER}:{encoded_password}" if encoded_password else self.MYSQL_USER

        return (
            f"mysql+pymysql://{auth_part}@{self.effective_host}:{self.MYSQL_PORT}/{self.effective_database}"
            f"?charset=utf8mb4"
        )

    @property
    def masked_database_uri(self) -> str:
        """Return MySQL database URI with password obscured to prevent secret exposure in logs/API."""
        try:
            parsed = make_url(self.sqlalchemy_database_uri)
            return parsed.render_as_string(hide_password=True)
        except Exception:
            return (
                f"mysql+pymysql://{self.MYSQL_USER}:***@{self.effective_host}:{self.MYSQL_PORT}/"
                f"{self.effective_database}?charset=utf8mb4"
            )


# Global settings singleton
settings = Settings()
