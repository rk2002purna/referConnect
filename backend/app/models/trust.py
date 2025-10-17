from __future__ import annotations

from datetime import datetime
from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field, Column, JSON

from .base import TimestampedModel


class TrustScore(TimestampedModel, table=True):
    __tablename__ = "trust_scores"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(unique=True, index=True)
    score: int = Field(..., ge=0, le=100, index=True)
    level: str = Field(max_length=20, index=True)
    factors: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    previous_score: Optional[int] = Field(default=None)
    trend: str = Field(default="stable", max_length=20)
    last_updated: datetime = Field(default_factory=datetime.utcnow, index=True)


class FraudAlert(TimestampedModel, table=True):
    __tablename__ = "fraud_alerts"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    activity_type: str = Field(max_length=50, index=True)
    risk_level: str = Field(max_length=20, index=True)
    description: str = Field(max_length=1000)
    evidence: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    status: str = Field(default="open", max_length=20, index=True)
    resolved_at: Optional[datetime] = Field(default=None)
    resolved_by: Optional[int] = Field(default=None, index=True)


class FraudDetectionRule(TimestampedModel, table=True):
    __tablename__ = "fraud_detection_rules"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    description: str = Field(max_length=1000)
    rule_type: str = Field(max_length=50, index=True)
    conditions: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    risk_score: int = Field(..., ge=0, le=100)
    is_active: bool = Field(default=True, index=True)


class TrustScoreHistory(TimestampedModel, table=True):
    __tablename__ = "trust_score_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    score: int = Field(..., ge=0, le=100)
    previous_score: Optional[int] = Field(default=None)
    score_change: int = Field(default=0)
    reason: str = Field(max_length=500)
    factors: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    updated_by: int = Field(index=True)

