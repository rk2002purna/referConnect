"""add_deleted_at_to_jobs_table

Revision ID: b40b588a1d99
Revises: bec4be0bbd96
Create Date: 2025-10-19 23:39:26.785160

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b40b588a1d99'
down_revision = 'bec4be0bbd96'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add deleted_at column to jobs table
    op.add_column('jobs', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove deleted_at column from jobs table
    op.drop_column('jobs', 'deleted_at')
