from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class TodoDashboardItem(BaseModel):
    # id is str to support Supabase UUID primary keys (uuid_generate_v4() default).
    # Change to int if your todos table uses a serial/integer PK.
    id: str
    title: str
    due_date: Optional[date] = None
    priority: Optional[str] = None
    is_completed: bool
    # Optional + None default handles missing field gracefully (finding #3).
    # Supabase returns timezone-aware datetimes; consumers should treat as UTC.
    created_at: Optional[datetime] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    overdue: list[TodoDashboardItem]
    today: list[TodoDashboardItem]
    tomorrow: list[TodoDashboardItem]
    this_week: list[TodoDashboardItem]
