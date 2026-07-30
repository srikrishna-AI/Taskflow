from __future__ import annotations

from typing import List

from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.task import task_category_association


class Category(Base):
    """Task category for organizing tasks."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    meta_data: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)

    user: Mapped["User"] = relationship(back_populates="categories")
    tasks: Mapped[List["Task"]] = relationship(
        secondary=task_category_association,
        back_populates="categories",
        lazy="selectin",
    )
