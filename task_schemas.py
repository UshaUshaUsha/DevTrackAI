
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from typing import Literal


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    priority: Literal["Low", "Medium", "High"] = "Medium"
    project_id: int
    assigned_to: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    status: Optional[Literal["Pending", "In Progress", "Completed"]] = None
    priority: Optional[Literal["Low", "Medium", "High"]] = None
    assigned_to: Optional[int] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    project_id: int
    assigned_to: Optional[int]
    created_by: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
