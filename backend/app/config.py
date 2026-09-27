from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite:///./ecdat_dev.db"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "ecdat_minio"
    minio_secret_key: str = "ecdat_minio_secret"
    minio_bucket: str = "ecdat-scans"
    minio_secure: bool = False

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    default_admin_email: str = "admin@example.com"
    # Unset → random password on first admin bootstrap (see ensure_default_admin).
    default_admin_password: str | None = None

    frontend_url: str = "http://localhost:3000"
    backend_cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    scan_max_bytes: int = 524288000
    scan_work_dir: str = "/tmp/ecdat-scans"
    # Local development works without Redis/MinIO by default. Set SYNC_SCAN=false
    # when running the Celery and object-storage services used by deployments.
    sync_scan: bool = True

    ai_narration_enabled: bool = False
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-20b"
    # Max artefacts embedded in AI context (lower = fewer tokens, less rate-limit pressure).
    groq_context_artefact_limit: int = 40

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.backend_cors_origins.split(",") if o.strip()]


settings = Settings()
