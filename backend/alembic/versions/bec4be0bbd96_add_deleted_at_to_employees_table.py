"""add_deleted_at_to_employees_table

Revision ID: bec4be0bbd96
Revises: 008_enhance_employee_profile
Create Date: 2025-10-19 20:19:03.402173

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bec4be0bbd96'
down_revision = '008_enhance_employee_profile'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add deleted_at column to employees table
    op.add_column('employees', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove deleted_at column from employees table
    op.drop_column('employees', 'deleted_at')
