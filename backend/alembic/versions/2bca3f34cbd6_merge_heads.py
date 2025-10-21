"""merge_heads

Revision ID: 2bca3f34cbd6
Revises: add_phone_country_code_simple, d83159a10bfc
Create Date: 2025-10-21 17:45:06.903180

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2bca3f34cbd6'
down_revision = ('add_phone_country_code_simple', 'd83159a10bfc')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
