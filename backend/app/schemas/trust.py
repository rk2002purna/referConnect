from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class TrustScoreLevel(str, Enum):
    low = "low"  # 0-30
    medium = "medium"  # 31-70
    high = "high"  # 71-100


class FraudRiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class SuspiciousActivityType(str, Enum):
    multiple_accounts = "multiple_accounts"
    fake_referrals = "fake_referrals"
    spam_behavior = "spam_behavior"
    unusual_patterns = "unusual_patterns"
    account_takeover = "account_takeover"
    payment_fraud = "payment_fraud"


class TrustScore(BaseModel):
    user_id: int
    score: int = Field(..., ge=0, le=100)
    level: TrustScoreLevel
    factors: List[Dict[str, Any]] = []
    last_updated: datetime
    previous_score: Optional[int] = None
    trend: str = "stable"  # "up", "down", "stable"


class FraudAlert(BaseModel):
    id: int
    user_id: int
    activity_type: SuspiciousActivityType
    risk_level: FraudRiskLevel
    description: str
    evidence: Dict[str, Any] = {}
    status: str = "open"  # "open", "investigating", "resolved", "false_positive"
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None


class TrustMetrics(BaseModel):
    total_users: int
    high_trust_users: int
    medium_trust_users: int
    low_trust_users: int
    average_trust_score: float
    fraud_alerts_count: int
    resolved_alerts_count: int
    false_positive_rate: float


class TrustAnalysis(BaseModel):
    user_id: int
    trust_score: TrustScore
    risk_factors: List[str] = []
    positive_factors: List[str] = []
    recommendations: List[str] = []
    last_activity: Optional[datetime] = None


class FraudDetectionRule(BaseModel):
    id: int
    name: str
    description: str
    rule_type: str
    conditions: Dict[str, Any]
    risk_score: int
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class TrustScoreUpdate(BaseModel):
    user_id: int
    score_change: int
    reason: str
    factors: List[Dict[str, Any]] = []
    updated_by: int

