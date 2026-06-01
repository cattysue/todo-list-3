from typing import Literal, Optional

from pydantic import BaseModel, Field


class RecurrenceControlRequest(BaseModel):
    action: Literal["skip", "pause", "resume", "end"]


class RecurrenceControlResponse(BaseModel):
    todo_id: str
    action: str


class TodoUpdateRequest(BaseModel):
    is_completed: Literal[True]


class TodoUpdateResponse(BaseModel):
    id: str
    is_completed: bool


class TodoCreateRequest(BaseModel):
    title: str
    category_id: Optional[str] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    due_date: Optional[str] = None
    recurrence_type: Optional[Literal["daily", "weekly", "monthly"]] = None
    recurrence_days: Optional[str] = Field(
        default=None, pattern=r"^[0-6](,[0-6])*$"
    )
    recurrence_day_of_month: Optional[int] = Field(default=None, ge=1, le=31)


class TodoContentUpdateRequest(BaseModel):
    title: Optional[str] = None
    category_id: Optional[str] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    due_date: Optional[str] = None
    recurrence_type: Optional[Literal["daily", "weekly", "monthly"]] = None
    recurrence_days: Optional[str] = Field(
        default=None, pattern=r"^[0-6](,[0-6])*$"
    )
    recurrence_day_of_month: Optional[int] = Field(default=None, ge=1, le=31)


class TodoCreateResponse(BaseModel):
    id: str
    title: str
    due_date: Optional[str] = None
    priority: Optional[str] = None
    is_completed: bool
    created_at: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    recurrence_type: Optional[str] = None
    recurrence_days: Optional[str] = None
    recurrence_day_of_month: Optional[int] = None
    recurrence_paused: bool = False
    model_config = {"from_attributes": True}
