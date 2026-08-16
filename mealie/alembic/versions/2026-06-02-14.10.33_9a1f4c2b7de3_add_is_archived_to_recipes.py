"""'Add is_archived to recipes'

Revision ID: 9a1f4c2b7de3
Revises: 2187537c52b8
Create Date: 2026-06-02 14:10:33.512874

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "9a1f4c2b7de3"
down_revision: str | None = "2187537c52b8"
branch_labels: str | tuple[str, ...] | None = None
depends_on: str | tuple[str, ...] | None = None


def upgrade():
    with op.batch_alter_table("recipes", schema=None) as batch_op:
        batch_op.add_column(sa.Column("is_archived", sa.Boolean(), nullable=True))


def downgrade():
    with op.batch_alter_table("recipes", schema=None) as batch_op:
        batch_op.drop_column("is_archived")
