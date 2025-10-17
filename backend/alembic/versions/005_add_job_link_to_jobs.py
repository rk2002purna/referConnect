"""add_job_link_to_jobs

Revision ID: 005
Revises: 3b3b1a3f2173
Create Date: 2025-01-27 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '3b3b1a3f2173'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add job_link column to jobs table
    op.add_column('jobs', sa.Column('job_link', sa.String(500), nullable=True))


def downgrade() -> None:
    # Remove job_link column from jobs table
    op.drop_column('jobs', 'job_link')
