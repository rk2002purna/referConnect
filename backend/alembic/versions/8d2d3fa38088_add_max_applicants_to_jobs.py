"""add_max_applicants_to_jobs

Revision ID: 8d2d3fa38088
Revises: e5a07dff9f7e
Create Date: 2025-10-19 23:46:11.335942

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8d2d3fa38088'
down_revision = 'e5a07dff9f7e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add max_applicants column to jobs table
    op.add_column('jobs', sa.Column('max_applicants', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove max_applicants column from jobs table
    op.drop_column('jobs', 'max_applicants')
