from datetime import date as date_type, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends

from schemas.calendar import TodoCalendarItem
from services.calendar import get_calendar_todos
from dependencies import get_current_user, get_supabase, require_user_id

router = APIRouter(prefix="/todos", tags=["calendar"])


@router.get("/calendar", response_model=list[TodoCalendarItem])
def get_calendar(
    start: Optional[str] = None,
    end: Optional[str] = None,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    today = datetime.now(timezone.utc).date()

    resolved_start = start or today.replace(day=1).isoformat()
    if end:
        resolved_end = end
    else:
        ref = date_type.fromisoformat(resolved_start)
        next_month_first = (ref.replace(day=28) + timedelta(days=4)).replace(day=1)
        resolved_end = (next_month_first - timedelta(days=1)).isoformat()

    return get_calendar_todos(
        user_id=user_id,
        start=resolved_start,
        end=resolved_end,
        supabase=supabase,
    )
