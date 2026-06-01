from typing import Any, Optional

from schemas.dashboard import TodoDashboardItem
from services.dashboard import _build_item


def search_todos(
    user_id: str,
    supabase,
    q: Optional[str] = None,
    priority: Optional[str] = None,
    due_date_from: Optional[str] = None,
    due_date_to: Optional[str] = None,
    is_completed: Optional[bool] = None,
    category_id: Optional[str] = None,
) -> list[TodoDashboardItem]:
    query = (
        supabase.table("todos")
        .select("*, categories(name)")
        .eq("user_id", user_id)
    )

    if q and q.strip():
        query = query.ilike("title", f"%{q.strip()}%")
    if priority:
        query = query.eq("priority", priority)
    if is_completed is not None:
        query = query.eq("is_completed", is_completed)
    if due_date_from:
        query = query.gte("due_date", due_date_from)
    if due_date_to:
        query = query.lte("due_date", due_date_to)
    if category_id:
        query = query.eq("category_id", category_id)

    response = query.order("created_at", desc=True).limit(50).execute()
    rows: list[dict[str, Any]] = response.data or []
    return [_build_item(row) for row in rows]
