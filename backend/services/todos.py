from typing import Any, Optional


def create_todo(
    user_id: str,
    supabase,
    title: str,
    category_id: Optional[str] = None,
    priority: Optional[str] = None,
    due_date: Optional[str] = None,
    recurrence_type: Optional[str] = None,
    recurrence_days: Optional[str] = None,
    recurrence_day_of_month: Optional[int] = None,
) -> dict:
    optional: dict[str, Any] = {
        "category_id": category_id,
        "priority": priority,
        "due_date": due_date,
        "recurrence_type": recurrence_type,
        "recurrence_days": recurrence_days,
        "recurrence_day_of_month": recurrence_day_of_month,
    }
    data: dict[str, Any] = {
        "user_id": user_id,
        "title": title,
        "is_completed": False,
        **{k: v for k, v in optional.items() if v is not None},
    }

    response = (
        supabase.table("todos")
        .insert(data)
        .select("*, categories(name)")
        .single()
        .execute()
    )
    row = response.data
    return _normalize_row(row)


def get_todo(todo_id: str, user_id: str, supabase) -> Optional[dict]:
    response = (
        supabase.table("todos")
        .select("*, categories(name)")
        .eq("id", todo_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not response.data:
        return None
    return _normalize_row(response.data)


def update_todo_content(
    todo_id: str,
    user_id: str,
    supabase,
    updates: dict[str, Any],
) -> Optional[dict]:
    if not updates:
        return None

    response = (
        supabase.table("todos")
        .update(updates)
        .eq("id", todo_id)
        .eq("user_id", user_id)
        .select("*, categories(name)")
        .execute()
    )
    rows = response.data
    if not rows:
        return None
    return _normalize_row(rows[0])


def _normalize_row(row: dict) -> dict:
    categories = row.get("categories")
    category_name = categories.get("name") if isinstance(categories, dict) else None
    return {
        "id": row.get("id"),
        "title": row.get("title"),
        "due_date": str(row["due_date"]) if row.get("due_date") else None,
        "priority": row.get("priority"),
        "is_completed": row.get("is_completed", False),
        "created_at": str(row["created_at"]) if row.get("created_at") else None,
        "category_id": row.get("category_id"),
        "category_name": category_name,
        "recurrence_type": row.get("recurrence_type"),
        "recurrence_days": row.get("recurrence_days"),
        "recurrence_day_of_month": row.get("recurrence_day_of_month"),
    }
