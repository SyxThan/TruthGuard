from ..core.config import Base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func, Float
from sqlalchemy.orm import relationship


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    content = Column(String, nullable=False)
    status = Column(String(50), default="draft")

    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    credibility_score = Column(Float, nullable=True)
    credibility_label = Column(String(50), nullable=True)
    