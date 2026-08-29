import json
from io import BytesIO

import boto3
from botocore.client import Config

from app.config import settings


class StorageService:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url=f"{'https' if settings.minio_secure else 'http'}://{settings.minio_endpoint}",
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            self.client.head_bucket(Bucket=settings.minio_bucket)
        except Exception:
            try:
                self.client.create_bucket(Bucket=settings.minio_bucket)
            except Exception:
                pass

    def upload_bytes(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        self.client.put_object(
            Bucket=settings.minio_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return key

    def download_to_file(self, key: str, dest_path: str) -> None:
        self.client.download_file(settings.minio_bucket, key, dest_path)

    def get_bytes(self, key: str) -> bytes:
        obj = self.client.get_object(Bucket=settings.minio_bucket, Key=key)
        return obj["Body"].read()

    def upload_json(self, key: str, payload: dict) -> str:
        return self.upload_bytes(key, json.dumps(payload, indent=2).encode(), "application/json")


_storage_instance: StorageService | None = None


def get_storage_service() -> StorageService:
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = StorageService()
    return _storage_instance


class _LazyStorageProxy:
    def __getattr__(self, name: str):
        return getattr(get_storage_service(), name)


storage_service = _LazyStorageProxy()
