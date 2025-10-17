from typing import List, Optional, Dict, Any, Tuple
from sqlmodel import select, and_, or_, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from datetime import datetime, timedelta
import json

from app.models.trust import TrustScore, FraudAlert, FraudDetectionRule, TrustScoreHistory
from app.models.user import User, Referral, Job, Employee, JobSeeker
from app.schemas.trust import (
    TrustScore as TrustScoreSchema, FraudAlert as FraudAlertSchema,
    TrustMetrics, TrustAnalysis, FraudDetectionRule as FraudDetectionRuleSchema,
    TrustScoreUpdate, TrustScoreLevel, FraudRiskLevel, SuspiciousActivityType
)


class TrustService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_trust_score(self, user_id: int) -> TrustScoreSchema:
        """Calculate trust score for a user based on various factors."""
        # Get user data
        user_result = await self.db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Start with base score
        score = 50
        factors = []
        
        # Factor 1: Account age (0-20 points)
        account_age_days = (datetime.utcnow() - user.created_at).days
        if account_age_days >= 365:
            age_score = 20
        elif account_age_days >= 180:
            age_score = 15
        elif account_age_days >= 90:
            age_score = 10
        elif account_age_days >= 30:
            age_score = 5
        else:
            age_score = 0
        
        score += age_score
        factors.append({
            "factor": "account_age",
            "value": account_age_days,
            "score": age_score,
            "max_score": 20
        })

        # Factor 2: Email verification (0-10 points)
        if user.is_email_verified:
            email_score = 10
            factors.append({
                "factor": "email_verified",
                "value": True,
                "score": email_score,
                "max_score": 10
            })
        else:
            email_score = 0
            factors.append({
                "factor": "email_verified",
                "value": False,
                "score": email_score,
                "max_score": 10
            })
        score += email_score

        # Factor 3: Profile completeness (0-15 points)
        profile_score = 0
        if user.role == "employee":
            emp_result = await self.db.execute(
                select(Employee).where(Employee.user_id == user_id)
            )
            employee = emp_result.scalar_one_or_none()
            if employee:
                if employee.title:
                    profile_score += 5
                if employee.badges:
                    profile_score += 5
                if employee.company_id:
                    profile_score += 5
        elif user.role == "jobseeker":
            seeker_result = await self.db.execute(
                select(JobSeeker).where(JobSeeker.user_id == user_id)
            )
            job_seeker = seeker_result.scalar_one_or_none()
            if job_seeker:
                if job_seeker.skills:
                    profile_score += 5
                if job_seeker.years_experience:
                    profile_score += 5
                if job_seeker.current_company:
                    profile_score += 5

        score += profile_score
        factors.append({
            "factor": "profile_completeness",
            "value": profile_score,
            "score": profile_score,
            "max_score": 15
        })

        # Factor 4: Referral success rate (0-25 points)
        if user.role == "employee":
            referrals_result = await self.db.execute(
                select(Referral).where(Referral.employee_id == user_id)
            )
            referrals = referrals_result.scalars().all()
            
            if referrals:
                total_referrals = len(referrals)
                successful_referrals = len([r for r in referrals if r.status == "hired"])
                success_rate = (successful_referrals / total_referrals) * 100
                
                if success_rate >= 50:
                    success_score = 25
                elif success_rate >= 25:
                    success_score = 15
                elif success_rate >= 10:
                    success_score = 10
                else:
                    success_score = 5
                
                score += success_score
                factors.append({
                    "factor": "referral_success_rate",
                    "value": success_rate,
                    "score": success_score,
                    "max_score": 25
                })

        # Factor 5: Activity consistency (0-10 points)
        # Check for regular activity over the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Count referrals made in last 30 days
        recent_referrals_result = await self.db.execute(
            select(func.count(Referral.id)).where(
                and_(
                    Referral.employee_id == user_id,
                    Referral.created_at >= thirty_days_ago
                )
            )
        )
        recent_referrals = recent_referrals_result.scalar()
        
        if recent_referrals >= 5:
            activity_score = 10
        elif recent_referrals >= 2:
            activity_score = 5
        else:
            activity_score = 0
        
        score += activity_score
        factors.append({
            "factor": "recent_activity",
            "value": recent_referrals,
            "score": activity_score,
            "max_score": 10
        })

        # Factor 6: Negative factors (penalties)
        # Check for fraud alerts
        fraud_alerts_result = await self.db.execute(
            select(func.count(FraudAlert.id)).where(
                and_(
                    FraudAlert.user_id == user_id,
                    FraudAlert.status == "open"
                )
            )
        )
        open_fraud_alerts = fraud_alerts_result.scalar()
        
        if open_fraud_alerts > 0:
            penalty = open_fraud_alerts * 10
            score -= penalty
            factors.append({
                "factor": "fraud_alerts",
                "value": open_fraud_alerts,
                "score": -penalty,
                "max_score": 0
            })

        # Ensure score is within bounds
        score = max(0, min(100, score))

        # Determine trust level
        if score >= 71:
            level = TrustScoreLevel.high
        elif score >= 31:
            level = TrustScoreLevel.medium
        else:
            level = TrustScoreLevel.low

        # Get previous score for trend calculation
        previous_score_result = await self.db.execute(
            select(TrustScore).where(TrustScore.user_id == user_id)
        )
        previous_trust_score = previous_score_result.scalar_one_or_none()
        
        previous_score = previous_trust_score.score if previous_trust_score else None
        trend = "stable"
        
        if previous_score is not None:
            if score > previous_score + 5:
                trend = "up"
            elif score < previous_score - 5:
                trend = "down"

        # Update or create trust score
        if previous_trust_score:
            previous_trust_score.score = score
            previous_trust_score.level = level
            previous_trust_score.factors = factors
            previous_trust_score.previous_score = previous_score
            previous_trust_score.trend = trend
            previous_trust_score.last_updated = datetime.utcnow()
            self.db.add(previous_trust_score)
        else:
            new_trust_score = TrustScore(
                user_id=user_id,
                score=score,
                level=level,
                factors=factors,
                previous_score=previous_score,
                trend=trend
            )
            self.db.add(new_trust_score)

        # Record in history
        history_entry = TrustScoreHistory(
            user_id=user_id,
            score=score,
            previous_score=previous_score,
            score_change=score - (previous_score or 0),
            reason="Automatic calculation",
            factors=factors,
            updated_by=user_id  # System update
        )
        self.db.add(history_entry)

        await self.db.commit()

        return TrustScoreSchema(
            user_id=user_id,
            score=score,
            level=level,
            factors=factors,
            last_updated=datetime.utcnow(),
            previous_score=previous_score,
            trend=trend
        )

    async def get_trust_score(self, user_id: int) -> Optional[TrustScoreSchema]:
        """Get current trust score for a user."""
        result = await self.db.execute(
            select(TrustScore).where(TrustScore.user_id == user_id)
        )
        trust_score = result.scalar_one_or_none()
        
        if not trust_score:
            return None
        
        return TrustScoreSchema(
            user_id=trust_score.user_id,
            score=trust_score.score,
            level=trust_score.level,
            factors=trust_score.factors or [],
            last_updated=trust_score.last_updated,
            previous_score=trust_score.previous_score,
            trend=trust_score.trend
        )

    async def detect_fraud_patterns(self, user_id: int) -> List[FraudAlertSchema]:
        """Detect potential fraud patterns for a user."""
        alerts = []
        
        # Pattern 1: Multiple referrals to same job
        duplicate_referrals_result = await self.db.execute(
            text("""
                SELECT job_id, COUNT(*) as count
                FROM referrals 
                WHERE employee_id = :user_id
                GROUP BY job_id
                HAVING COUNT(*) > 3
            """),
            {"user_id": user_id}
        )
        duplicate_referrals = duplicate_referrals_result.fetchall()
        
        for job_id, count in duplicate_referrals:
            alerts.append(FraudAlertSchema(
                id=0,  # Will be set when saved
                user_id=user_id,
                activity_type=SuspiciousActivityType.fake_referrals,
                risk_level=FraudRiskLevel.medium,
                description=f"Multiple referrals ({count}) to same job",
                evidence={"job_id": job_id, "referral_count": count},
                status="open",
                created_at=datetime.utcnow()
            ))

        # Pattern 2: Rapid account creation and activity
        user_result = await self.db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        
        if user:
            account_age_hours = (datetime.utcnow() - user.created_at).total_seconds() / 3600
            
            if account_age_hours < 24:  # Less than 24 hours old
                recent_activity_result = await self.db.execute(
                    select(func.count(Referral.id)).where(
                        and_(
                            Referral.employee_id == user_id,
                            Referral.created_at >= user.created_at
                        )
                    )
                )
                recent_activity = recent_activity_result.scalar()
                
                if recent_activity > 5:
                    alerts.append(FraudAlertSchema(
                        id=0,
                        user_id=user_id,
                        activity_type=SuspiciousActivityType.unusual_patterns,
                        risk_level=FraudRiskLevel.high,
                        description=f"High activity ({recent_activity} referrals) in new account",
                        evidence={"account_age_hours": account_age_hours, "activity_count": recent_activity},
                        status="open",
                        created_at=datetime.utcnow()
                    ))

        # Save alerts to database
        for alert in alerts:
            fraud_alert = FraudAlert(
                user_id=alert.user_id,
                activity_type=alert.activity_type,
                risk_level=alert.risk_level,
                description=alert.description,
                evidence=alert.evidence,
                status=alert.status
            )
            self.db.add(fraud_alert)
        
        await self.db.commit()
        
        return alerts

    async def get_trust_metrics(self) -> TrustMetrics:
        """Get overall trust metrics."""
        # Total users
        total_users_result = await self.db.execute(select(func.count(User.id)))
        total_users = total_users_result.scalar()
        
        # Trust score distribution
        trust_scores_result = await self.db.execute(
            select(TrustScore.level, func.count(TrustScore.id))
            .group_by(TrustScore.level)
        )
        trust_distribution = {row[0]: row[1] for row in trust_scores_result.fetchall()}
        
        high_trust = trust_distribution.get("high", 0)
        medium_trust = trust_distribution.get("medium", 0)
        low_trust = trust_distribution.get("low", 0)
        
        # Average trust score
        avg_score_result = await self.db.execute(
            select(func.avg(TrustScore.score))
        )
        average_trust_score = avg_score_result.scalar() or 0.0
        
        # Fraud alerts
        total_alerts_result = await self.db.execute(select(func.count(FraudAlert.id)))
        total_alerts = total_alerts_result.scalar()
        
        resolved_alerts_result = await self.db.execute(
            select(func.count(FraudAlert.id)).where(FraudAlert.status == "resolved")
        )
        resolved_alerts = resolved_alerts_result.scalar()
        
        false_positive_rate = 0.0  # Would need to track false positives
        
        return TrustMetrics(
            total_users=total_users,
            high_trust_users=high_trust,
            medium_trust_users=medium_trust,
            low_trust_users=low_trust,
            average_trust_score=average_trust_score,
            fraud_alerts_count=total_alerts,
            resolved_alerts_count=resolved_alerts,
            false_positive_rate=false_positive_rate
        )

    async def get_trust_analysis(self, user_id: int) -> TrustAnalysis:
        """Get detailed trust analysis for a user."""
        trust_score = await self.get_trust_score(user_id)
        if not trust_score:
            trust_score = await self.calculate_trust_score(user_id)
        
        # Analyze risk factors
        risk_factors = []
        positive_factors = []
        
        for factor in trust_score.factors:
            if factor["score"] < 0:
                risk_factors.append(f"{factor['factor']}: {factor['score']} points")
            elif factor["score"] > 0:
                positive_factors.append(f"{factor['factor']}: +{factor['score']} points")
        
        # Generate recommendations
        recommendations = []
        if trust_score.score < 50:
            recommendations.append("Complete your profile to increase trust score")
            recommendations.append("Verify your email address")
        if "fraud_alerts" in [f["factor"] for f in trust_score.factors]:
            recommendations.append("Address any open fraud alerts")
        if trust_score.level == TrustScoreLevel.low:
            recommendations.append("Consider reaching out to support for account review")
        
        return TrustAnalysis(
            user_id=user_id,
            trust_score=trust_score,
            risk_factors=risk_factors,
            positive_factors=positive_factors,
            recommendations=recommendations,
            last_activity=datetime.utcnow()
        )

