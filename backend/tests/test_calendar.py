"""
Tests for calendar service and GET /todos/calendar endpoint.

Run with:  pytest backend/tests/test_calendar.py -v
"""
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_USER_ID = "user-123"

_TODO_ROW = {
    "id": "todo-1",
    "title": "운동",
    "due_date": "2026-06-10",
    "priority": "high",
    "is_completed": False,
    "created_at": "2026-06-01T00:00:00Z",
    "category_id": "cat-1",
    "categories": {"name": "건강"},
}

_TODO_ROW_COMPLETED = {
    **_TODO_ROW,
    "id": "todo-2",
    "title": "독서",
    "is_completed": True,
    "categories": None,
}


def _make_calendar_mock(rows: list[dict]) -> MagicMock:
    """Properly chained Supabase mock for calendar service queries.

    Chain: table().select().eq().not_.is_().gte().lte().order().execute()
    """
    supabase = MagicMock()
    (
        supabase.table.return_value
        .select.return_value
        .eq.return_value
        .not_.is_.return_value
        .gte.return_value
        .lte.return_value
        .order.return_value
        .execute.return_value
    ) = MagicMock(data=rows)
    return supabase


def _make_router_client():
    from routers.calendar import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)
    fake_user = MagicMock()
    fake_user.id = _USER_ID
    fake_user.sub = None
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: MagicMock()
    return TestClient(app)


# ---------------------------------------------------------------------------
# Service unit tests
# ---------------------------------------------------------------------------


def test_get_calendar_todos_returns_filtered_list():
    """start~end 내 todos 목록 반환 — category_name 정규화 포함."""
    from services.calendar import get_calendar_todos

    mock_sb = _make_calendar_mock([_TODO_ROW])
    result = get_calendar_todos(user_id=_USER_ID, start="2026-06-01", end="2026-06-30", supabase=mock_sb)

    assert len(result) == 1
    assert result[0]["title"] == "운동"
    assert result[0]["category_name"] == "건강"
    assert result[0]["is_completed"] is False


def test_get_calendar_todos_includes_completed():
    """is_completed=True 항목도 캘린더에 포함된다."""
    from services.calendar import get_calendar_todos

    mock_sb = _make_calendar_mock([_TODO_ROW, _TODO_ROW_COMPLETED])
    result = get_calendar_todos(user_id=_USER_ID, start="2026-06-01", end="2026-06-30", supabase=mock_sb)

    assert len(result) == 2
    completed = next(r for r in result if r["id"] == "todo-2")
    assert completed["is_completed"] is True


def test_get_calendar_todos_empty_range():
    """결과 없으면 빈 리스트 반환."""
    from services.calendar import get_calendar_todos

    mock_sb = _make_calendar_mock([])
    result = get_calendar_todos(user_id=_USER_ID, start="2026-06-01", end="2026-06-30", supabase=mock_sb)

    assert result == []


def test_build_calendar_item_normalizes_category_name():
    """categories dict → category_name 문자열 추출, categories=None → None."""
    from services.calendar import _build_calendar_item

    row_with_cat = {**_TODO_ROW, "categories": {"name": "업무"}}
    item = _build_calendar_item(row_with_cat)
    assert item["category_name"] == "업무"

    row_no_cat = {**_TODO_ROW, "categories": None}
    item2 = _build_calendar_item(row_no_cat)
    assert item2["category_name"] is None


# ---------------------------------------------------------------------------
# Router integration tests
# ---------------------------------------------------------------------------


def test_get_calendar_200():
    """GET /todos/calendar?start=&end= → 200 + 리스트 반환."""
    client = _make_router_client()
    fake_data = [
        {
            "id": "todo-1",
            "title": "운동",
            "due_date": "2026-06-10",
            "priority": "high",
            "is_completed": False,
            "created_at": None,
            "category_id": "cat-1",
            "category_name": "건강",
        }
    ]
    with patch("routers.calendar.get_calendar_todos", return_value=fake_data):
        resp = client.get("/todos/calendar?start=2026-06-01&end=2026-06-30")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert data[0]["title"] == "운동"


def test_get_calendar_defaults_to_current_month():
    """start/end 생략해도 200 반환 (기본값: 이번 달)."""
    client = _make_router_client()
    with patch("routers.calendar.get_calendar_todos", return_value=[]):
        resp = client.get("/todos/calendar")
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_calendar_unauthorized_401():
    """인증 없으면 401."""
    from main import app

    c = TestClient(app, raise_server_exceptions=False)
    resp = c.get("/todos/calendar")
    assert resp.status_code == 401
