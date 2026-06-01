from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class TodoCalendarItem(BaseModel):
    id: str
    title: str
    due_date: Optional[date] = None
    priority: Optional[str] = None
    is_completed: bool
    created_at: Optional[datetime] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None

    model_config = {"from_attributes": True}
