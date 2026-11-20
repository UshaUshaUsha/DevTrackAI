
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(Active|Completed|On Hold)$")


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    owner_id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
