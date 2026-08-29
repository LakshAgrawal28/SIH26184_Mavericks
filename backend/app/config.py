from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

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
    default_admin_password: str = "admin123"

    frontend_url: str = "http://localhost:3000"
    backend_cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    scan_max_bytes: int = 524288000
    scan_work_dir: str = "/tmp/ecdat-scans"
    sync_scan: bool = False  # set SYNC_SCAN=true for local dev without Celery worker

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.backend_cors_origins.split(",") if o.strip()]


settings = Settings()
