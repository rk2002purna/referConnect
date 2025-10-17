"""Add dashboard tables

Revision ID: 003
Revises: 002
Create Date: 2024-01-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = 'b2d8b5ae8cc3'
branch_labels = None
depends_on = None


def upgrade():
    # Create job_recommendations table
    op.create_table('job_recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('match_score', sa.Float(), nullable=False),
        sa.Column('recommendation_reasons', sa.JSON(), nullable=True),
        sa.Column('is_viewed', sa.Boolean(), nullable=False),
        sa.Column('is_applied', sa.Boolean(), nullable=False),
        sa.Column('is_saved', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], )
    )
    op.create_index(op.f('ix_job_recommendations_user_id'), 'job_recommendations', ['user_id'], unique=False)
    op.create_index(op.f('ix_job_recommendations_job_id'), 'job_recommendations', ['job_id'], unique=False)

    # Create activity_feed table
    op.create_table('activity_feed',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('activity_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('action_url', sa.String(length=500), nullable=True),
        sa.Column('activity_metadata', sa.JSON(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], )
    )
    op.create_index(op.f('ix_activity_feed_user_id'), 'activity_feed', ['user_id'], unique=False)
    op.create_index(op.f('ix_activity_feed_activity_type'), 'activity_feed', ['activity_type'], unique=False)
    op.create_index(op.f('ix_activity_feed_is_read'), 'activity_feed', ['is_read'], unique=False)

    # Create saved_searches table
    op.create_table('saved_searches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('query', sa.String(length=500), nullable=False),
        sa.Column('filters', sa.JSON(), nullable=True),
        sa.Column('last_run', sa.DateTime(), nullable=True),
        sa.Column('new_results_count', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], )
    )
    op.create_index(op.f('ix_saved_searches_user_id'), 'saved_searches', ['user_id'], unique=False)

    # Create user_profile_completion table
    op.create_table('user_profile_completion',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('completion_percentage', sa.Integer(), nullable=False),
        sa.Column('completed_sections', sa.JSON(), nullable=True),
        sa.Column('missing_sections', sa.JSON(), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_user_profile_completion_user_id'), 'user_profile_completion', ['user_id'], unique=False)

    # Create dashboard_stats table
    op.create_table('dashboard_stats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('stats_type', sa.String(length=50), nullable=False),
        sa.Column('stats_data', sa.JSON(), nullable=True),
        sa.Column('period', sa.String(length=20), nullable=False),
        sa.Column('calculated_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], )
    )
    op.create_index(op.f('ix_dashboard_stats_user_id'), 'dashboard_stats', ['user_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_dashboard_stats_user_id'), table_name='dashboard_stats')
    op.drop_table('dashboard_stats')
    op.drop_index(op.f('ix_user_profile_completion_user_id'), table_name='user_profile_completion')
    op.drop_table('user_profile_completion')
    op.drop_index(op.f('ix_saved_searches_user_id'), table_name='saved_searches')
    op.drop_table('saved_searches')
    op.drop_index(op.f('ix_activity_feed_is_read'), table_name='activity_feed')
    op.drop_index(op.f('ix_activity_feed_activity_type'), table_name='activity_feed')
    op.drop_index(op.f('ix_activity_feed_user_id'), table_name='activity_feed')
    op.drop_table('activity_feed')
    op.drop_index(op.f('ix_job_recommendations_job_id'), table_name='job_recommendations')
    op.drop_index(op.f('ix_job_recommendations_user_id'), table_name='job_recommendations')
    op.drop_table('job_recommendations')
