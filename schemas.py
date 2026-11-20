from pydantic import BaseModel
from typing import Literal
from typing import Optional


class IssueCreate(BaseModel):
    title: str
    description: str
    priority: Literal["Low", "Medium", "High"]
    status: Literal["Open", "In Progress", "Resolved"] = "Open"
    project_id: Optional[int] = None


class IssueResponse(BaseModel):
    id: int
    title: str
    description: str
    priority: Literal["Low", "Medium", "High"]
    status: Literal["Open", "In Progress", "Resolved"]