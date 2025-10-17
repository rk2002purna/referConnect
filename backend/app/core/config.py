from functools import lru_cache
from typing import List

from pydantic import AnyUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    ENV: str = Field(default="dev")
    DEBUG: bool = Field(default=False)

    # Security
    SECRET_KEY: str = Field(default="change-me")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15)
    REFRESH_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24 * 14)
    JWT_ALGORITHM: str = Field(default="HS256")
    ALGORITHM: str = Field(default="HS256")

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./referconnect.db")

    # CORS
    CORS_ALLOWED_ORIGINS: List[str] = Field(default_factory=lambda: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://referconnect.vercel.app",
        "https://*.vercel.app"
    ])
    ALLOWED_ORIGINS: str = Field(default="http://localhost:3000,http://127.0.0.1:3000,https://referconnect.vercel.app")

    # Email / Providers
    SENDGRID_API_KEY: str = Field(default="")
    SENDGRID_FROM_EMAIL: str = Field(default="")
    RESEND_API_KEY: str = Field(default="")
    RESEND_FROM_EMAIL: str = Field(default="")
    GMAIL_EMAIL: str = Field(default="")
    GMAIL_APP_PASSWORD: str = Field(default="")
    OUTLOOK_EMAIL: str = Field(default="")
    OUTLOOK_PASSWORD: str = Field(default="")
    YAHOO_EMAIL: str = Field(default="")
    YAHOO_APP_PASSWORD: str = Field(default="")
    EMAIL_FROM: str = Field(default="no-reply@referconnect.app")
    FROM_EMAIL: str = Field(default="noreply@referconnect.com")
    

    # Compliance flags
    GDPR_ENABLED: bool = Field(default=True)
    CCPA_ENABLED: bool = Field(default=True)


@lru_cache()
def get_settings() -> "Settings":
    return Settings()


settings = get_settings()


