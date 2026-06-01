"""
Tests for todos service (create/update) and router endpoints.

Run with:  pytest backend/tests/test_todos.py -v
"""
from unittest.mock import MagicMock
import pytest

from services.todos import create_todo, update_todo_content


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(user_id: str = "user-123") -> MagicMock:
    user = MagicMock()
    user.id = user_id
    user.sub = None
    return user


def _mock_insert(returned_row: dict) -> MagicMock:
    """insert → select → single → execute 체인 mock."""
    mock = MagicMock()
    for method in ["table", "insert", "select", "single", "eq", "update", "execute"]:
        getattr(mock, method).return_value = mock
    execute_result = MagicMock()
    execute_result.data = returned_row
    mock.execute.return_value = execute_result
    return mock


def _mock_update(returned_rows: list[dict]) -> MagicMock:
    """update → eq → eq → select → execute 체인 mock."""
    mock = MagicMock()
    for method in ["table", "insert", "select", "single", "eq", "update"]:
        getattr(mock, method).return_value = mock
    execute_result = MagicMock()
    execute_result.data = returned_rows
    mock.execute.return_value = execute_result
    return mock


def _make_todo_row(
    id: str = "todo-1",
    title: str = "테스트 할일",
    recurrence_type=None,
    recurrence_days=None,
    recurrence_day_of_month=None,
    category_name=None,
) -> dict:
    return {
        "id": id,
        "title": title,
        "due_date": None,
        "priority": None,
        "is_completed": False,
        "created_at": "2026-06-01T00:00:00",
        "user_id": "user-123",
        "category_id": None,
        "categories": {"name": category_name} if category_name else None,
        "recurrence_type": recurrence_type,
        "recurrence_days": recurrence_days,
        "recurrence_day_of_month": recurrence_day_of_month,
    }


def _make_router_client(fake_user=None, insert_row=None, update_rows=None,
                         raise_server_exceptions=True):
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)

    if fake_user is not None:
        app.dependency_overrides[get_current_user] = lambda: fake_user

    if insert_row is not None:
        app.dependency_overrides[get_supabase] = lambda: _mock_insert(insert_row)
    elif update_rows is not None:
        app.dependency_overrides[get_supabase] = lambda: _mock_update(update_rows)

    return TestClient(app, raise_server_exceptions=raise_server_exceptions)


# ---------------------------------------------------------------------------
# Service layer — create_todo
# ---------------------------------------------------------------------------

def test_create_todo_no_recurrence():
    row = _make_todo_row(title="공부하기")
    mock = _mock_insert(row)

    result = create_todo(user_id="user-123", supabase=mock, title="공부하기")

    assert result["title"] == "공부하기"
    assert result["recurrence_type"] is None
    assert result["recurrence_days"] is None
    assert result["recurrence_day_of_month"] is None
    mock.table.assert_called_with("todos")
    mock.insert.assert_called_once()
    inserted = mock.insert.call_args[0][0]
    assert inserted["title"] == "공부하기"
    assert inserted["is_completed"] is False
    assert "recurrence_type" not in inserted


def test_create_todo_daily():
    row = _make_todo_row(recurrence_type="daily")
    mock = _mock_insert(row)

    result = create_todo(
        user_id="user-123",
        supabase=mock,
        title="매일 운동",
        recurrence_type="daily",
    )

    assert result["recurrence_type"] == "daily"
    inserted = mock.insert.call_args[0][0]
    assert inserted["recurrence_type"] == "daily"


def test_create_todo_weekly():
    row = _make_todo_row(recurrence_type="weekly", recurrence_days="0,2")
    mock = _mock_insert(row)

    result = create_todo(
        user_id="user-123",
        supabase=mock,
        title="주 2회 운동",
        recurrence_type="weekly",
        recurrence_days="0,2",
    )

    assert result["recurrence_type"] == "weekly"
    assert result["recurrence_days"] == "0,2"
    inserted = mock.insert.call_args[0][0]
    assert inserted["recurrence_type"] == "weekly"
    assert inserted["recurrence_days"] == "0,2"


def test_create_todo_monthly():
    row = _make_todo_row(recurrence_type="monthly", recurrence_day_of_month=15)
    mock = _mock_insert(row)

    result = create_todo(
        user_id="user-123",
        supabase=mock,
        title="월급날 정산",
        recurrence_type="monthly",
        recurrence_day_of_month=15,
    )

    assert result["recurrence_type"] == "monthly"
    assert result["recurrence_day_of_month"] == 15
    inserted = mock.insert.call_args[0][0]
    assert inserted["recurrence_type"] == "monthly"
    assert inserted["recurrence_day_of_month"] == 15


def test_create_todo_with_category_name():
    row = _make_todo_row(category_name="업무")
    mock = _mock_insert(row)

    result = create_todo(
        user_id="user-123",
        supabase=mock,
        title="보고서 작성",
        category_id="cat-1",
    )

    assert result["category_name"] == "업무"


def test_create_todo_sets_user_id():
    row = _make_todo_row()
    mock = _mock_insert(row)

    create_todo(user_id="user-xyz", supabase=mock, title="테스트")

    inserted = mock.insert.call_args[0][0]
    assert inserted["user_id"] == "user-xyz"


# ---------------------------------------------------------------------------
# Service layer — update_todo_content
# ---------------------------------------------------------------------------

def test_update_todo_recurrence_to_weekly():
    updated_row = _make_todo_row(recurrence_type="weekly", recurrence_days="1,3")
    mock = _mock_update([updated_row])

    result = update_todo_content(
        todo_id="todo-1",
        user_id="user-123",
        supabase=mock,
        recurrence_type="weekly",
        recurrence_days="1,3",
    )

    assert result["recurrence_type"] == "weekly"
    assert result["recurrence_days"] == "1,3"


def test_update_todo_content_title():
    updated_row = _make_todo_row(title="수정된 제목")
    mock = _mock_update([updated_row])

    result = update_todo_content(
        todo_id="todo-1",
        user_id="user-123",
        supabase=mock,
        title="수정된 제목",
    )

    assert result["title"] == "수정된 제목"
    update_payload = mock.update.call_args[0][0]
    assert update_payload["title"] == "수정된 제목"


def test_update_todo_no_fields_returns_none():
    mock = _mock_update([])

    result = update_todo_content(
        todo_id="todo-1",
        user_id="user-123",
        supabase=mock,
    )

    assert result is None
    mock.update.assert_not_called()


def test_update_todo_not_found_returns_none():
    mock = _mock_update([])

    result = update_todo_content(
        todo_id="nonexistent",
        user_id="user-123",
        supabase=mock,
        title="제목",
    )

    assert result is None


def test_update_todo_filters_by_user_id():
    updated_row = _make_todo_row()
    mock = _mock_update([updated_row])

    update_todo_content(
        todo_id="todo-1",
        user_id="user-abc",
        supabase=mock,
        title="수정",
    )

    eq_calls = [call[0] for call in mock.eq.call_args_list]
    assert ("id", "todo-1") in eq_calls
    assert ("user_id", "user-abc") in eq_calls


# ---------------------------------------------------------------------------
# Router — POST /todos
# ---------------------------------------------------------------------------

def test_create_todo_router_201():
    row = _make_todo_row(title="운동하기")
    client = _make_router_client(fake_user=_make_user(), insert_row=row)

    response = client.post("/todos", json={"title": "운동하기"})

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "운동하기"


def test_create_todo_router_with_recurrence():
    row = _make_todo_row(
        title="매주 회의",
        recurrence_type="weekly",
        recurrence_days="0,4",
    )
    client = _make_router_client(fake_user=_make_user(), insert_row=row)

    response = client.post(
        "/todos",
        json={
            "title": "매주 회의",
            "recurrence_type": "weekly",
            "recurrence_days": "0,4",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["recurrence_type"] == "weekly"
    assert data["recurrence_days"] == "0,4"


def test_create_todo_router_401():
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router

    app = FastAPI()
    app.include_router(router)
    client = TestClient(app, raise_server_exceptions=False)

    response = client.post("/todos", json={"title": "테스트"})

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Router — PUT /todos/{id}
# ---------------------------------------------------------------------------

def test_update_todo_router_200():
    updated_row = _make_todo_row(title="수정됨")
    client = _make_router_client(fake_user=_make_user(), update_rows=[updated_row])

    response = client.put("/todos/todo-1", json={"title": "수정됨"})

    assert response.status_code == 200
    assert response.json()["title"] == "수정됨"


def test_update_todo_router_404_when_not_found():
    client = _make_router_client(
        fake_user=_make_user(),
        update_rows=[],
        raise_server_exceptions=False,
    )

    response = client.put("/todos/nonexistent", json={"title": "제목"})

    assert response.status_code == 404


def test_update_todo_router_recurrence():
    updated_row = _make_todo_row(recurrence_type="monthly", recurrence_day_of_month=1)
    client = _make_router_client(fake_user=_make_user(), update_rows=[updated_row])

    response = client.put(
        "/todos/todo-1",
        json={"recurrence_type": "monthly", "recurrence_day_of_month": 1},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["recurrence_type"] == "monthly"
    assert data["recurrence_day_of_month"] == 1
