"""
Central settings, loaded from environment variables.
Local-first by default (SQLite) so the team can run/demo without
depending on internet or a hosted DB. Swap DATABASE_URL to point at
Postgres (Render/Neon/etc.) with zero code changes.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "TransitOps")
    API_V1_PREFIX: str = "/api/v1"

    # PostgreSQL only — per project spec, SQLite is not permitted.
    # Set this in .env (local Postgres, Neon, Render, etc.)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/transitops"
    )

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-in-prod-please")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
    # 480 min = 8 hours, matches hackathon duration so tokens won't expire mid-demo


settings = Settings()
