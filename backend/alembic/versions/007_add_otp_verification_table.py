"""add otp_verification_table

Revision ID: 007
Revises: 005
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create otp_verifications table
    op.create_table('otp_verifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('company_email', sa.String(length=255), nullable=False),
        sa.Column('otp_code', sa.String(length=6), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('verified', sa.Boolean(), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['verified_companies.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_otp_verifications_user_id'), 'otp_verifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_otp_verifications_expires_at'), 'otp_verifications', ['expires_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_otp_verifications_expires_at'), table_name='otp_verifications')
    op.drop_index(op.f('ix_otp_verifications_user_id'), table_name='otp_verifications')
    
    # Drop table
    op.drop_table('otp_verifications')
