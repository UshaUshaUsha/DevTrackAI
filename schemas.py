from pydantic import BaseModel
from typing import Literal


class IssueCreate(BaseModel):
    title: str
    description: str
    priority: Literal["Low", "Medium", "High"]
    status: Literal["Open", "In Progress", "Resolved"] = "Open"


class IssueResponse(BaseModel):
    id: int
    title: str
    description: str
    priority: Literal["Low", "Medium", "High"]
    status: Literal["Open", "In Progress", "Resolved"]