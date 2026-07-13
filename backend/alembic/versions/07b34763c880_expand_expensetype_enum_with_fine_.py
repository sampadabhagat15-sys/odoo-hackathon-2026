"""expand expensetype enum with Fine, Parking, Repair

Revision ID: 07b34763c880
Revises: ae16247f30b9
Create Date: 2026-07-13 15:12:40.548149

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '07b34763c880'
down_revision: Union[str, None] = 'ae16247f30b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Postgres enums need explicit ALTER TYPE ADD VALUE — SQLAlchemy/Alembic
    # autogenerate doesn't detect Python enum value changes on its own.
    # ADD VALUE ... IF NOT EXISTS makes this safe to re-run.
    op.execute("ALTER TYPE expensetype ADD VALUE IF NOT EXISTS 'Fine'")
    op.execute("ALTER TYPE expensetype ADD VALUE IF NOT EXISTS 'Parking'")
    op.execute("ALTER TYPE expensetype ADD VALUE IF NOT EXISTS 'Repair'")


def downgrade() -> None:
    # Postgres has no ALTER TYPE ... DROP VALUE — removing enum values
    # requires rebuilding the type entirely. Not implemented; this
    # migration is effectively one-directional.
    pass
