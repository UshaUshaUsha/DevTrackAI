
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


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), default="Active", nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, server_default=func.now())


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False)
    status = Column(String(30), default="Open", nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(
    Integer,
    ForeignKey("projects.id"),
    nullable=True
)
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


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), default="Pending", nullable=False)
    priority = Column(String(20), default="Medium", nullable=False)

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, server_default=func.now())

