"""Enhance employee profile with additional fields

Revision ID: 008_enhance_employee_profile
Revises: 007_add_otp_verification_table
Create Date: 2024-11-15 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008_enhance_employee_profile'
down_revision = '007_add_otp_verification_table'
branch_labels = None
depends_on = None


def upgrade():
    # Add new fields to employees table
    op.add_column('employees', sa.Column('department', sa.String(255), nullable=True))
    op.add_column('employees', sa.Column('office_location', sa.String(255), nullable=True))
    op.add_column('employees', sa.Column('years_at_company', sa.String(50), nullable=True))
    op.add_column('employees', sa.Column('start_date', sa.Date(), nullable=True))
    
    # Add new fields to companies table
    op.add_column('companies', sa.Column('industry', sa.String(100), nullable=True))
    op.add_column('companies', sa.Column('size', sa.String(50), nullable=True))
    op.add_column('companies', sa.Column('logo_url', sa.String(500), nullable=True))
    op.add_column('companies', sa.Column('location', sa.String(255), nullable=True))
    
    # Add new fields to users table for profile pictures
    op.add_column('users', sa.Column('profile_picture', sa.String(500), nullable=True))


def downgrade():
    # Remove added fields
    op.drop_column('employees', 'start_date')
    op.drop_column('employees', 'years_at_company')
    op.drop_column('employees', 'office_location')
    op.drop_column('employees', 'department')
    
    op.drop_column('companies', 'location')
    op.drop_column('companies', 'logo_url')
    op.drop_column('companies', 'size')
    op.drop_column('companies', 'industry')
    
    op.drop_column('users', 'profile_picture')
