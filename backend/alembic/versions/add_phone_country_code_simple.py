"""add_phone_country_code_simple

Revision ID: add_phone_country_code_simple
Revises: 8d2d3fa38088
Create Date: 2025-10-21 17:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_phone_country_code_simple'
down_revision = '8d2d3fa38088'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add phone_country_code column to users table
    op.add_column('users', sa.Column('phone_country_code', sa.String(length=10), nullable=True, default='+91'))


def downgrade() -> None:
    # Remove phone_country_code column from users table
    op.drop_column('users', 'phone_country_code')
