from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    project_name: str = "Task Management API"
    api_v1_str: str = "/api"
    backend_cors_origins: List[str] = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "http://localhost:3002", 
        "http://127.0.0.1:3002"
    ]

    database_url: str = "postgresql+psycopg://postgres:root@localhost:5432/taskmanagement"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "taskmanagement"
    db_user: str = "postgres"
    db_password: str = "root"

    jwt_secret_key: str = "change-me"
    jwt_refresh_secret_key: str = "change-me-refresh"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
