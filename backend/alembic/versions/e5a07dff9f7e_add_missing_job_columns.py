"""add_missing_job_columns

Revision ID: e5a07dff9f7e
Revises: b40b588a1d99
Create Date: 2025-10-19 23:45:15.030780

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e5a07dff9f7e'
down_revision = 'b40b588a1d99'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to jobs table to match the model
    op.add_column('jobs', sa.Column('company', sa.String(255), nullable=False, server_default=''))
    op.add_column('jobs', sa.Column('job_type', sa.String(50), nullable=False, server_default='full-time'))
    op.add_column('jobs', sa.Column('salary_min', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('salary_max', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('currency', sa.String(3), nullable=False, server_default='USD'))
    op.add_column('jobs', sa.Column('requirements', sa.String(), nullable=True))
    op.add_column('jobs', sa.Column('benefits', sa.String(), nullable=True))
    op.add_column('jobs', sa.Column('skills_required', sa.String(), nullable=True))
    op.add_column('jobs', sa.Column('experience_level', sa.String(20), nullable=False, server_default='entry'))
    op.add_column('jobs', sa.Column('remote_work', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('jobs', sa.Column('application_deadline', sa.DateTime(), nullable=True))
    op.add_column('jobs', sa.Column('contact_email', sa.String(255), nullable=False, server_default=''))
    op.add_column('jobs', sa.Column('department', sa.String(255), nullable=True))
    op.add_column('jobs', sa.Column('views', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('jobs', sa.Column('applications_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('jobs', sa.Column('max_applicants', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('posted_by', sa.Integer(), nullable=False, server_default='1'))
    
    # Create index for posted_by
    op.create_index(op.f('ix_jobs_posted_by'), 'jobs', ['posted_by'], unique=False)
    
    # Create foreign key for posted_by
    op.create_foreign_key('fk_jobs_posted_by', 'jobs', 'users', ['posted_by'], ['id'])


def downgrade() -> None:
    # Remove the added columns
    op.drop_constraint('fk_jobs_posted_by', 'jobs', type_='foreignkey')
    op.drop_index(op.f('ix_jobs_posted_by'), table_name='jobs')
    op.drop_column('jobs', 'posted_by')
    op.drop_column('jobs', 'max_applicants')
    op.drop_column('jobs', 'applications_count')
    op.drop_column('jobs', 'views')
    op.drop_column('jobs', 'department')
    op.drop_column('jobs', 'contact_email')
    op.drop_column('jobs', 'application_deadline')
    op.drop_column('jobs', 'remote_work')
    op.drop_column('jobs', 'experience_level')
    op.drop_column('jobs', 'skills_required')
    op.drop_column('jobs', 'benefits')
    op.drop_column('jobs', 'requirements')
    op.drop_column('jobs', 'currency')
    op.drop_column('jobs', 'salary_max')
    op.drop_column('jobs', 'salary_min')
    op.drop_column('jobs', 'job_type')
    op.drop_column('jobs', 'company')
