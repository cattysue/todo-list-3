from datetime import date, datetime, timedelta, timezone
from typing import Optional

from services.todos import create_todo


def _normalize_template(raw: dict) -> dict:
    """Supabase의 todo_template_items 키를 TemplateResponse의 items 키로 정규화."""
    raw["items"] = sorted(
        raw.pop("todo_template_items", []),
        key=lambda x: x.get("sort_order", 0),
    )
    return raw


def list_templates(user_id: str, supabase) -> list[dict]:
    resp = (
        supabase.table("todo_templates")
        .select("*, todo_template_items(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [_normalize_template(t) for t in (resp.data or [])]


def create_template(user_id: str, name: str, items: list[dict], supabase) -> dict:
    tmpl_resp = (
        supabase.table("todo_templates")
        .insert({"user_id": user_id, "name": name})
        .select("*")
        .single()
        .execute()
    )
    template = tmpl_resp.data
    template_id = template["id"]

    if items:
        item_rows = [
            {
                "template_id": template_id,
                "title": item["title"],
                "category_id": item.get("category_id"),
                "priority": item.get("priority"),
                "due_date_offset": item.get("due_date_offset"),
                "sort_order": idx,
            }
            for idx, item in enumerate(items)
        ]
        items_resp = (
            supabase.table("todo_template_items")
            .insert(item_rows)
            .select("*")
            .execute()
        )
        template["todo_template_items"] = items_resp.data or []
    else:
        template["todo_template_items"] = []

    return _normalize_template(template)


def delete_template(template_id: str, user_id: str, supabase) -> bool:
    resp = (
        supabase.table("todo_templates")
        .delete()
        .eq("id", template_id)
        .eq("user_id", user_id)
        .select("id")
        .execute()
    )
    return bool(resp.data)


def apply_template(
    template_id: str, user_id: str, base_date: Optional[date], supabase
) -> Optional[list[dict]]:
    """템플릿 항목들을 할일로 일괄 생성한다.

    Returns:
        None: 템플릿이 존재하지 않음 (라우터에서 404 반환)
        list: 생성된 할일 목록 (빈 리스트 포함)
    """
    resp = (
        supabase.table("todo_templates")
        .select("*, todo_template_items(*)")
        .eq("id", template_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not resp.data:
        return None

    if base_date is not None:
        resolved_base = base_date
    else:
        resolved_base = datetime.now(timezone.utc).date()

    items = sorted(
        resp.data.get("todo_template_items", []),
        key=lambda x: x.get("sort_order", 0),
    )
    created = []
    try:
        for item in items:
            offset = item.get("due_date_offset")
            due_date = (resolved_base + timedelta(days=offset)).isoformat() if offset is not None else None
            todo = create_todo(
                user_id=user_id,
                supabase=supabase,
                title=item["title"],
                category_id=item.get("category_id"),
                priority=item.get("priority"),
                due_date=due_date,
            )
            created.append(todo)
    except Exception:
        # 부분 커밋 rollback: 이미 생성된 할일 삭제
        for todo in created:
            if todo.get("id"):
                try:
                    supabase.table("todos").delete().eq("id", todo["id"]).eq("user_id", user_id).execute()
                except Exception:
                    pass
        raise
    return created
