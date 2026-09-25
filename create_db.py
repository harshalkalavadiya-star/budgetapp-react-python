"""
Create the PostgreSQL database `budget_db` if it does not exist.

Usage:
    python create_db.py
"""

from urllib.parse import quote_plus

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from app.config import get_settings


def main() -> None:
    settings = get_settings()
    conn = psycopg2.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        dbname="postgres",
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (settings.db_name,))
    exists = cur.fetchone()
    if exists:
        print(f"Database '{settings.db_name}' already exists.")
    else:
        cur.execute(f'CREATE DATABASE "{settings.db_name}"')
        print(f"Database '{settings.db_name}' created successfully.")
    cur.close()
    conn.close()

    # Show encoded URL hint (password masked)
    _ = quote_plus(settings.db_password)
    print(f"Ready. Start API with: uvicorn app.main:app --reload")


if __name__ == "__main__":
    main()
