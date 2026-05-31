from datetime import datetime, timedelta, date, timezone
from typing import Any

from schemas.dashboard import DashboardResponse, TodoDashboardItem

PRIORITY_ORDER = {"high": 3, "medium": 2, "low": 1}


def _get_week_boundaries() -> tuple[date, date, date]:
    today = datetime.now(timezone.utc).date()
    tomorrow = today + timedelta(days=1)
    # ISO weekday: Mon=0 ... Sun=6 → Sunday = today + (6 - weekday)
    this_week_end = today + timedelta(days=(6 - today.weekday()))
    return today, tomorrow, this_week_end


def _coerce_date(raw) -> date | None:
    # datetime is a subclass of date — detect datetime FIRST via .hour attribute
    # (date has no .hour) to avoid TypeError when comparing due (datetime) to
    # today (date). Using hasattr instead of isinstance(raw, datetime) so this
    # function stays correct even when `datetime` is monkeypatched in tests.
    if raw is None:
        return None
    if hasattr(raw, "hour"):  # datetime has hour/minute/second; bare date does not
        return raw.date()
    if isinstance(raw, date):
        return raw
    return date.fromisoformat(str(raw))


def _build_item(row: dict[str, Any]) -> TodoDashboardItem:
    categories = row.get("categories") or {}
    category_name = categories.get("name") if isinstance(categories, dict) else None
    return TodoDashboardItem(
        id=row["id"],
        title=row["title"],
        due_date=row.get("due_date"),
        priority=row.get("priority"),
        is_completed=row.get("is_completed", False),
        created_at=row.get("created_at"),
        category_id=row.get("category_id"),
        category_name=category_name,
    )


def get_dashboard_todos(user_id: str, supabase) -> DashboardResponse:
    today, tomorrow, this_week_end = _get_week_boundaries()

    # Fetch overdue + this-week todos. Lower bound: 90 days back to cap historical data.
    cutoff = str(today - timedelta(days=90))
    response = (
        supabase.table("todos")
        .select("*, categories(name)")
        .eq("user_id", user_id)
        .eq("is_completed", False)
        .not_.is_("due_date", "null")
        .gte("due_date", cutoff)
        .lte("due_date", str(this_week_end))
        .execute()
    )

    rows: list[dict[str, Any]] = response.data or []

    overdue: list[TodoDashboardItem] = []
    today_items: list[TodoDashboardItem] = []
    tomorrow_items: list[TodoDashboardItem] = []
    this_week_items: list[TodoDashboardItem] = []

    for row in rows:
        # Belt-and-suspenders guard: skip completed items even if DB filter missed them.
        if row.get("is_completed"):
            continue

        due = _coerce_date(row.get("due_date"))
        if due is None:
            continue

        item = _build_item(row)

        if due < today:
            overdue.append(item)
        elif due == today:
            today_items.append(item)
        elif due == tomorrow:
            tomorrow_items.append(item)
        elif tomorrow < due <= this_week_end:
            this_week_items.append(item)

    # overdue: due_date ASC (oldest first)
    overdue.sort(key=lambda t: _coerce_date(t.due_date) or date.min)

    # today: priority DESC, then created_at ASC
    # Use a tz-aware sentinel so the sort never mixes naive/aware datetimes
    # (Supabase returns UTC-aware timestamps; naive datetime.min raises TypeError).
    _TZ_MIN = datetime.min.replace(tzinfo=timezone.utc)
    today_items.sort(
        key=lambda t: (-PRIORITY_ORDER.get(t.priority or "", 0), t.created_at or _TZ_MIN)
    )

    return DashboardResponse(
        overdue=overdue,
        today=today_items,
        tomorrow=tomorrow_items,
        this_week=this_week_items,
    )
