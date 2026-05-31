"""
Tests for dashboard service and router.

Run with:  pytest backend/tests/test_dashboard.py -v
"""
from datetime import datetime, timedelta, date, timezone
from unittest.mock import MagicMock, patch
import pytest

from schemas.dashboard import DashboardResponse, TodoDashboardItem
from services.dashboard import get_dashboard_todos, _get_week_boundaries, _coerce_date


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_row(
    id: str | int,
    title: str,
    due_date,
    is_completed: bool = False,
    priority: str = "medium",
    created_at=None,
    category_name: str | None = None,
) -> dict:
    return {
        "id": str(id),
        "title": title,
        "due_date": due_date,
        "is_completed": is_completed,
        "priority": priority,
        "created_at": created_at or datetime(2026, 1, 1, 0, 0, 0),
        "user_id": "user-123",
        "category_id": "cat-1" if category_name else None,
        "categories": {"name": category_name} if category_name else None,
    }


def _mock_supabase(rows: list[dict]) -> MagicMock:
    supabase = MagicMock()
    (
        supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .not_.is_.return_value
        .gte.return_value
        .lte.return_value
        .execute.return_value
    ) = MagicMock(data=rows)
    return supabase


# ---------------------------------------------------------------------------
# Unit tests — _coerce_date
# ---------------------------------------------------------------------------

def test_coerce_date_from_date():
    d = date(2026, 6, 1)
    assert _coerce_date(d) == d


def test_coerce_date_from_datetime():
    """datetime is a subclass of date — must call .date() to avoid TypeError."""
    dt = datetime(2026, 6, 1, 12, 0, 0)
    assert _coerce_date(dt) == date(2026, 6, 1)


def test_coerce_date_from_string():
    assert _coerce_date("2026-06-01") == date(2026, 6, 1)


def test_coerce_date_none():
    assert _coerce_date(None) is None


# ---------------------------------------------------------------------------
# Unit tests — _get_week_boundaries
# ---------------------------------------------------------------------------

def test_week_boundaries_tuesday():
    """Tuesday: this_week_end should be the coming Sunday."""
    tuesday = date(2026, 6, 2)  # known Tuesday
    with patch("services.dashboard.datetime") as mock_dt:
        mock_dt.now.return_value = datetime(2026, 6, 2)
        today, tomorrow, this_week_end = _get_week_boundaries()
    assert today == tuesday
    assert tomorrow == date(2026, 6, 3)
    assert this_week_end == date(2026, 6, 7)  # Sunday


def test_week_boundaries_sunday():
    """Sunday: this_week_end == today."""
    with patch("services.dashboard.datetime") as mock_dt:
        mock_dt.now.return_value = datetime(2026, 6, 7)  # Sunday
        today, tomorrow, this_week_end = _get_week_boundaries()
    assert this_week_end == today


# ---------------------------------------------------------------------------
# Unit tests — get_dashboard_todos (section classification)
# ---------------------------------------------------------------------------

BASE_DATE = date(2026, 6, 2)  # Tuesday


def _run(rows, fixed_date=BASE_DATE):
    supabase = _mock_supabase(rows)
    with patch("services.dashboard.datetime") as mock_dt:
        mock_dt.now.return_value = datetime(
            fixed_date.year, fixed_date.month, fixed_date.day
        )
        mock_dt.min = datetime.min
        return get_dashboard_todos("user-123", supabase)


def test_overdue_section():
    """Items with due_date before today go to overdue."""
    rows = [_make_row("1", "Old task", BASE_DATE - timedelta(days=2))]
    result = _run(rows)
    assert len(result.overdue) == 1
    assert result.overdue[0].title == "Old task"
    assert len(result.today) == 0
    assert len(result.tomorrow) == 0
    assert len(result.this_week) == 0


def test_today_section():
    rows = [_make_row("1", "Due today", BASE_DATE)]
    result = _run(rows)
    assert len(result.today) == 1
    assert result.today[0].title == "Due today"


def test_tomorrow_section():
    rows = [_make_row("1", "Due tomorrow", BASE_DATE + timedelta(days=1))]
    result = _run(rows)
    assert len(result.tomorrow) == 1
    assert result.tomorrow[0].title == "Due tomorrow"


def test_this_week_section():
    # BASE_DATE is Tuesday (2026-06-02); this_week_end = Sunday 2026-06-07
    due = BASE_DATE + timedelta(days=3)  # Friday
    rows = [_make_row("1", "This week", due)]
    result = _run(rows)
    assert len(result.this_week) == 1
    assert result.this_week[0].title == "This week"
    assert len(result.tomorrow) == 0


def test_this_week_excludes_tomorrow():
    """tomorrow items must NOT appear in this_week."""
    tomorrow = BASE_DATE + timedelta(days=1)
    rows = [_make_row("1", "Tomorrow task", tomorrow)]
    result = _run(rows)
    assert len(result.tomorrow) == 1
    assert len(result.this_week) == 0


def test_beyond_this_week_excluded():
    """Items beyond this_week_end appear in no section."""
    far_future = BASE_DATE + timedelta(days=30)
    rows = [_make_row("1", "Far future", far_future)]
    result = _run(rows)
    assert len(result.overdue) == 0
    assert len(result.today) == 0
    assert len(result.tomorrow) == 0
    assert len(result.this_week) == 0


# ---------------------------------------------------------------------------
# AC-3: completed and no due_date items are excluded
# ---------------------------------------------------------------------------

def test_completed_todos_excluded():
    """Completed items passed through the mock must be discarded by the service layer."""
    rows = [_make_row("1", "Done task", BASE_DATE, is_completed=True)]
    result = _run(rows)  # Feed completed row — service must filter it out
    assert (
        len(result.overdue)
        + len(result.today)
        + len(result.tomorrow)
        + len(result.this_week)
    ) == 0


def test_no_due_date_excluded():
    """Row with due_date=None must be skipped."""
    rows = [_make_row("1", "No due date", None)]
    result = _run(rows)
    assert (
        len(result.overdue)
        + len(result.today)
        + len(result.tomorrow)
        + len(result.this_week)
    ) == 0


# ---------------------------------------------------------------------------
# due_date as datetime (finding #1 regression test)
# ---------------------------------------------------------------------------

def test_due_date_as_datetime_object():
    """If Supabase returns a datetime for a date column, no TypeError should occur."""
    due_as_datetime = datetime(BASE_DATE.year, BASE_DATE.month, BASE_DATE.day, 0, 0, 0)
    rows = [_make_row("1", "Datetime due", due_as_datetime)]
    result = _run(rows)
    assert len(result.today) == 1


# ---------------------------------------------------------------------------
# AC-4: overdue sorted by due_date ASC
# ---------------------------------------------------------------------------

def test_overdue_sorted_asc():
    older = BASE_DATE - timedelta(days=5)
    newer = BASE_DATE - timedelta(days=1)
    rows = [_make_row("2", "Newer overdue", newer), _make_row("1", "Older overdue", older)]
    result = _run(rows)
    assert result.overdue[0].due_date == older
    assert result.overdue[1].due_date == newer


def test_overdue_has_category_name():
    rows = [_make_row("1", "Task", BASE_DATE - timedelta(days=1), category_name="Work")]
    result = _run(rows)
    assert result.overdue[0].category_name == "Work"


# ---------------------------------------------------------------------------
# AC-5: today sorted by priority DESC, created_at ASC
# ---------------------------------------------------------------------------

def test_today_priority_sort():
    t1 = datetime(2026, 1, 1)
    t2 = datetime(2026, 1, 2)
    rows = [
        _make_row("1", "Low prio", BASE_DATE, priority="low", created_at=t1),
        _make_row("2", "High prio", BASE_DATE, priority="high", created_at=t2),
        _make_row("3", "Medium prio", BASE_DATE, priority="medium", created_at=t1),
    ]
    result = _run(rows)
    priorities = [i.priority for i in result.today]
    assert priorities == ["high", "medium", "low"]


def test_today_same_priority_created_at_asc():
    t1 = datetime(2026, 1, 1)
    t2 = datetime(2026, 1, 3)
    rows = [
        _make_row("2", "Later created", BASE_DATE, priority="high", created_at=t2),
        _make_row("1", "Earlier created", BASE_DATE, priority="high", created_at=t1),
    ]
    result = _run(rows)
    assert result.today[0].title == "Earlier created"
    assert result.today[1].title == "Later created"


# ---------------------------------------------------------------------------
# Response structure
# ---------------------------------------------------------------------------

def test_response_has_all_sections():
    result = _run([])
    assert hasattr(result, "overdue")
    assert hasattr(result, "today")
    assert hasattr(result, "tomorrow")
    assert hasattr(result, "this_week")
    assert isinstance(result.overdue, list)
    assert isinstance(result.today, list)
    assert isinstance(result.tomorrow, list)
    assert isinstance(result.this_week, list)


# ---------------------------------------------------------------------------
# Router tests (auth guard — AC-7)
# ---------------------------------------------------------------------------

def test_router_requires_auth():
    """Endpoint without Authorization header must return 401."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.dashboard import router

    app = FastAPI()
    app.include_router(router)
    client = TestClient(app, raise_server_exceptions=False)

    response = client.get("/todos/dashboard")
    assert response.status_code == 401


def test_router_authenticated_returns_dashboard():
    """With valid auth, endpoint returns DashboardResponse shape."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.dashboard import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)

    fake_user = MagicMock()
    fake_user.id = "user-123"
    fake_user.sub = None
    fake_supabase = _mock_supabase([])

    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: fake_supabase

    client = TestClient(app)
    response = client.get("/todos/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "overdue" in data
    assert "today" in data
    assert "tomorrow" in data
    assert "this_week" in data


def test_router_missing_user_id_returns_401():
    """If user object has neither .id nor .sub, endpoint must return 401."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.dashboard import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)

    fake_user = MagicMock(spec=[])  # no attributes at all
    fake_supabase = _mock_supabase([])

    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: fake_supabase

    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/todos/dashboard")
    assert response.status_code == 401
