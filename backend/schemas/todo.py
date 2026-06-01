from typing import Literal, Optional

from pydantic import BaseModel


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
    recurrence_days: Optional[str] = None
    recurrence_day_of_month: Optional[int] = None


class TodoContentUpdateRequest(BaseModel):
    title: Optional[str] = None
    category_id: Optional[str] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    due_date: Optional[str] = None
    recurrence_type: Optional[Literal["daily", "weekly", "monthly"]] = None
    recurrence_days: Optional[str] = None
    recurrence_day_of_month: Optional[int] = None


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
    model_config = {"from_attributes": True}
