from celery import Celery

from app.config import settings

celery_app = Celery("ecdat", broker=settings.celery_broker_url, backend=settings.celery_result_backend)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "UTC"


@celery_app.task(name="run_crypto_scan")
def run_crypto_scan(scan_id: str) -> None:
    import uuid

    from app.db.session import SessionLocal
    from app.services.scan_service import run_scan_job

    db = SessionLocal()
    try:
        run_scan_job(db, uuid.UUID(scan_id))
    finally:
        db.close()
