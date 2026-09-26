"""Additive column patches for existing SQLite (and other) databases.

SQLAlchemy ``create_all`` does not ALTER existing tables. Local demo DBs
created before later model fields (token_version, suggested_data_lifetime_x)
otherwise fail on startup.
"""
from __future__ import annotations

import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

_PATCHES: list[tuple[str, str, str]] = [
    ("users", "token_version", "INTEGER DEFAULT 0"),
    ("scans", "owner_id", "CHAR(32)"),
    ("scans", "parent_scan_id", "CHAR(32)"),
    ("scans", "suggested_data_lifetime_x", "FLOAT"),
]


def ensure_schema_patches(engine: Engine) -> None:
    if engine.dialect.name != "sqlite":
        return
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, column, ddl in _PATCHES:
            if table not in tables:
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            if column in existing:
                continue
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
            logger.info("Added missing column %s.%s", table, column)
            inspector = inspect(engine)
