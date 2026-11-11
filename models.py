
from sqlalchemy import (
    Column, Integer, String, Text,
    DateTime, ForeignKey, JSON, func
)
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False)
    status = Column(String(30), default="Open", nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)

    category = Column(String(100), nullable=False)
    suggested_priority = Column(String(20), nullable=False)
    root_cause = Column(Text, nullable=False)
    troubleshooting_steps = Column(JSON, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
