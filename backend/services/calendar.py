def _build_calendar_item(row: dict) -> dict:
    categories = row.get("categories") or {}
    category_name = categories.get("name") if isinstance(categories, dict) else None
    return {
        "id": row["id"],
        "title": row["title"],
        "due_date": row.get("due_date"),
        "priority": row.get("priority"),
        "is_completed": row.get("is_completed", False),
        "created_at": row.get("created_at"),
        "category_id": row.get("category_id"),
        "category_name": category_name,
    }


def get_calendar_todos(
    user_id: str,
    start: str,
    end: str,
    supabase,
) -> list[dict]:
    response = (
        supabase.table("todos")
        .select("*, categories(name)")
        .eq("user_id", user_id)
        .not_.is_("due_date", "null")
        .gte("due_date", start)
        .lte("due_date", end)
        .order("due_date", desc=False)
        .execute()
    )
    rows = response.data or []
    return [_build_calendar_item(row) for row in rows]
