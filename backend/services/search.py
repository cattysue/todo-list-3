from typing import Any, Optional

from schemas.dashboard import TodoDashboardItem
from services.dashboard import _build_item


def search_todos(
    user_id: str,
    supabase,
    q: Optional[str] = None,
) -> list[TodoDashboardItem]:
    query = (
        supabase.table("todos")
        .select("*, categories(name)")
        .eq("user_id", user_id)
    )

    if q and q.strip():
        query = query.ilike("title", f"%{q.strip()}%")

    response = query.order("created_at", desc=True).limit(50).execute()
    rows: list[dict[str, Any]] = response.data or []
    return [_build_item(row) for row in rows]
