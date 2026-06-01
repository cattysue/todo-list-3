import logging
from typing import Any, Optional

from services.recurring import calculate_next_due_date

logger = logging.getLogger(__name__)


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


_COMPLETE_SELECT = (
    "id, is_completed, title, category_id, priority, created_at,"
    " recurrence_type, recurrence_days, recurrence_day_of_month, recurrence_paused"
)


def complete_todo(todo_id: str, user_id: str, supabase) -> Optional[dict]:
    result = (
        supabase.table("todos")
        .update({"is_completed": True})
        .eq("id", todo_id)
        .eq("user_id", user_id)
        .eq("is_completed", False)  # 이미 완료된 할일은 건너뜀 — 중복 재생성 방지
        .select(_COMPLETE_SELECT)   # categories JOIN 불필요 (라우터는 id/is_completed만 사용)
        .execute()
    )
    rows = result.data
    if not rows:
        return None

    completed = _normalize_row(rows[0])

    if completed.get("recurrence_type") and not completed.get("recurrence_paused"):
        try:
            next_due = calculate_next_due_date(
                recurrence_type=completed["recurrence_type"],
                recurrence_days=completed.get("recurrence_days"),
                recurrence_day_of_month=completed.get("recurrence_day_of_month"),
            )
            create_todo(
                user_id=user_id,
                supabase=supabase,
                title=completed["title"],
                category_id=completed.get("category_id"),
                priority=completed.get("priority"),
                due_date=next_due,
                recurrence_type=completed["recurrence_type"],
                recurrence_days=completed.get("recurrence_days"),
                recurrence_day_of_month=completed.get("recurrence_day_of_month"),
            )
        except Exception as e:
            logger.warning("반복 할일 재생성 실패 (todo_id=%s): %s", todo_id, e, exc_info=True)

    return completed


def control_recurrence(todo_id: str, user_id: str, action: str, supabase) -> Optional[dict]:
    """반복 할일 제어: skip / pause / resume / end."""
    todo = get_todo(todo_id=todo_id, user_id=user_id, supabase=supabase)
    if not todo or not todo.get("recurrence_type"):
        return None

    if action == "skip":
        next_due = calculate_next_due_date(
            recurrence_type=todo["recurrence_type"],
            recurrence_days=todo.get("recurrence_days"),
            recurrence_day_of_month=todo.get("recurrence_day_of_month"),
        )
        create_todo(
            user_id=user_id,
            supabase=supabase,
            title=todo["title"],
            category_id=todo.get("category_id"),
            priority=todo.get("priority"),
            due_date=next_due,
            recurrence_type=todo["recurrence_type"],
            recurrence_days=todo.get("recurrence_days"),
            recurrence_day_of_month=todo.get("recurrence_day_of_month"),
        )
        supabase.table("todos").delete().eq("id", todo_id).eq("user_id", user_id).execute()
        return {"id": todo_id, "action": action}

    if action == "pause":
        update_todo_content(
            todo_id=todo_id,
            user_id=user_id,
            supabase=supabase,
            updates={"recurrence_paused": True},
        )
        return {"id": todo_id, "action": action}

    if action == "resume":
        update_todo_content(
            todo_id=todo_id,
            user_id=user_id,
            supabase=supabase,
            updates={"recurrence_paused": False},
        )
        next_due = calculate_next_due_date(
            recurrence_type=todo["recurrence_type"],
            recurrence_days=todo.get("recurrence_days"),
            recurrence_day_of_month=todo.get("recurrence_day_of_month"),
        )
        create_todo(
            user_id=user_id,
            supabase=supabase,
            title=todo["title"],
            category_id=todo.get("category_id"),
            priority=todo.get("priority"),
            due_date=next_due,
            recurrence_type=todo["recurrence_type"],
            recurrence_days=todo.get("recurrence_days"),
            recurrence_day_of_month=todo.get("recurrence_day_of_month"),
        )
        return {"id": todo_id, "action": action}

    if action == "end":
        update_todo_content(
            todo_id=todo_id,
            user_id=user_id,
            supabase=supabase,
            updates={
                "recurrence_type": None,
                "recurrence_days": None,
                "recurrence_day_of_month": None,
                "recurrence_paused": False,
            },
        )
        return {"id": todo_id, "action": action}

    return None


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
        "recurrence_paused": row.get("recurrence_paused", False),
    }
