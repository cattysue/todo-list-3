"""
Tests for control_recurrence service and POST /todos/{id}/recurrence endpoint.

Run with:  pytest backend/tests/test_recurrence_control.py -v
"""
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_recurring_todo(
    todo_id: str = "todo-1",
    recurrence_type: str = "daily",
    recurrence_days=None,
    recurrence_day_of_month=None,
    recurrence_paused: bool = False,
) -> dict:
    return {
        "id": todo_id,
        "title": "매일 운동",
        "category_id": None,
        "priority": None,
        "due_date": "2026-06-01",
        "is_completed": False,
        "created_at": "2026-06-01T00:00:00",
        "recurrence_type": recurrence_type,
        "recurrence_days": recurrence_days,
        "recurrence_day_of_month": recurrence_day_of_month,
        "recurrence_paused": recurrence_paused,
    }


def _make_mock_supabase_for_delete() -> MagicMock:
    """delete().eq().eq().execute() 체인 mock."""
    mock = MagicMock()
    mock.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()
    return mock


_TODO_UUID = "11111111-1111-1111-1111-111111111111"


# ---------------------------------------------------------------------------
# Service layer — control_recurrence
# ---------------------------------------------------------------------------

def test_control_recurrence_skip_creates_next_and_deletes_current():
    todo = _make_recurring_todo(recurrence_type="daily")
    mock_sb = _make_mock_supabase_for_delete()

    with patch("services.todos.get_todo", return_value=todo), \
         patch("services.todos.calculate_next_due_date", return_value="2026-06-02") as mock_calc, \
         patch("services.todos.create_todo", return_value={}) as mock_create:
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="skip", supabase=mock_sb
        )

    assert result == {"id": "todo-1", "action": "skip"}
    mock_calc.assert_called_once_with(
        recurrence_type="daily",
        recurrence_days=None,
        recurrence_day_of_month=None,
    )
    mock_create.assert_called_once()
    create_kwargs = mock_create.call_args[1]
    assert create_kwargs["due_date"] == "2026-06-02"
    assert create_kwargs["recurrence_type"] == "daily"
    assert create_kwargs["title"] == "매일 운동"
    # delete 호출 확인
    mock_sb.table.assert_called_with("todos")


def test_control_recurrence_skip_weekly_passes_recurrence_days():
    todo = _make_recurring_todo(recurrence_type="weekly", recurrence_days="0,2")
    mock_sb = _make_mock_supabase_for_delete()

    with patch("services.todos.get_todo", return_value=todo), \
         patch("services.todos.calculate_next_due_date", return_value="2026-06-03") as mock_calc, \
         patch("services.todos.create_todo", return_value={}) as mock_create:
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="skip", supabase=mock_sb
        )

    assert result == {"id": "todo-1", "action": "skip"}
    mock_calc.assert_called_once_with(
        recurrence_type="weekly",
        recurrence_days="0,2",
        recurrence_day_of_month=None,
    )
    create_kwargs = mock_create.call_args[1]
    assert create_kwargs["recurrence_days"] == "0,2"


def test_control_recurrence_pause_sets_paused_flag():
    todo = _make_recurring_todo()
    mock_sb = MagicMock()

    with patch("services.todos.get_todo", return_value=todo), \
         patch("services.todos.update_todo_content", return_value={}) as mock_update:
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="pause", supabase=mock_sb
        )

    assert result == {"id": "todo-1", "action": "pause"}
    mock_update.assert_called_once_with(
        todo_id="todo-1",
        user_id="user-123",
        supabase=mock_sb,
        updates={"recurrence_paused": True},
    )


def test_control_recurrence_resume_creates_next_and_keeps_current_paused():
    """resume: 다음 인스턴스 생성 + 현재 인스턴스는 recurrence_paused=True 유지 (중복 방지)."""
    todo = _make_recurring_todo(recurrence_paused=True)
    mock_sb = MagicMock()

    with patch("services.todos.get_todo", return_value=todo), \
         patch("services.todos.update_todo_content") as mock_update, \
         patch("services.todos.calculate_next_due_date", return_value="2026-06-02") as mock_calc, \
         patch("services.todos.create_todo", return_value={}) as mock_create:
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="resume", supabase=mock_sb
        )

    assert result == {"id": "todo-1", "action": "resume"}
    # 현재 인스턴스 unpaused 처리 금지 — complete_todo 중복 재생성 차단 목적
    mock_update.assert_not_called()
    mock_calc.assert_called_once()
    mock_create.assert_called_once()
    create_kwargs = mock_create.call_args[1]
    assert create_kwargs["due_date"] == "2026-06-02"


def test_control_recurrence_resume_on_active_todo_is_noop():
    """이미 활성 상태(recurrence_paused=False)인 할일에 resume → 인스턴스 생성 없이 성공 반환."""
    todo = _make_recurring_todo(recurrence_paused=False)
    mock_sb = MagicMock()

    with patch("services.todos.get_todo", return_value=todo), \
         patch("services.todos.create_todo") as mock_create:
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="resume", supabase=mock_sb
        )

    assert result == {"id": "todo-1", "action": "resume"}
    mock_create.assert_not_called()


def test_control_recurrence_end_clears_recurrence_fields():
    todo = _make_recurring_todo()
    mock_sb = MagicMock()

    with patch("services.todos.get_todo", return_value=todo), \
         patch("services.todos.update_todo_content", return_value={}) as mock_update:
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="end", supabase=mock_sb
        )

    assert result == {"id": "todo-1", "action": "end"}
    mock_update.assert_called_once_with(
        todo_id="todo-1",
        user_id="user-123",
        supabase=mock_sb,
        updates={
            "recurrence_type": None,
            "recurrence_days": None,
            "recurrence_day_of_month": None,
            "recurrence_paused": False,
        },
    )


def test_control_recurrence_not_found_returns_none():
    mock_sb = MagicMock()

    with patch("services.todos.get_todo", return_value=None):
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="pause", supabase=mock_sb
        )

    assert result is None


def test_control_recurrence_non_recurring_returns_none():
    non_recurring = _make_recurring_todo()
    non_recurring["recurrence_type"] = None
    mock_sb = MagicMock()

    with patch("services.todos.get_todo", return_value=non_recurring):
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="pause", supabase=mock_sb
        )

    assert result is None


def test_control_recurrence_pause_concurrent_delete_returns_none():
    """pause 중 할일이 동시 삭제됐을 때(update_todo_content → None) → None 반환."""
    todo = _make_recurring_todo()
    mock_sb = MagicMock()

    with patch("services.todos.get_todo", return_value=todo), \
         patch("services.todos.update_todo_content", return_value=None):
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="pause", supabase=mock_sb
        )

    assert result is None


def test_control_recurrence_end_concurrent_delete_returns_none():
    """end 중 할일이 동시 삭제됐을 때(update_todo_content → None) → None 반환."""
    todo = _make_recurring_todo()
    mock_sb = MagicMock()

    with patch("services.todos.get_todo", return_value=todo), \
         patch("services.todos.update_todo_content", return_value=None):
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="end", supabase=mock_sb
        )

    assert result is None


def test_control_recurrence_resume_spawn_failure_returns_none():
    """resume 시 create_todo 실패 → None 반환 (DB 상태 변경 없음)."""
    todo = _make_recurring_todo(recurrence_paused=True)
    mock_sb = MagicMock()

    with patch("services.todos.get_todo", return_value=todo), \
         patch("services.todos.calculate_next_due_date", return_value="2026-06-02"), \
         patch("services.todos.create_todo", side_effect=Exception("DB error")):
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="resume", supabase=mock_sb
        )

    assert result is None


def test_control_recurrence_unknown_action_returns_none():
    todo = _make_recurring_todo()
    mock_sb = MagicMock()

    with patch("services.todos.get_todo", return_value=todo):
        from services.todos import control_recurrence
        result = control_recurrence(
            todo_id="todo-1", user_id="user-123", action="unknown", supabase=mock_sb
        )

    assert result is None


# ---------------------------------------------------------------------------
# Router layer — POST /todos/{id}/recurrence
# ---------------------------------------------------------------------------

def _make_router_client(fake_user=None):
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)

    if fake_user is not None:
        app.dependency_overrides[get_current_user] = lambda: fake_user

    app.dependency_overrides[get_supabase] = lambda: MagicMock()

    return TestClient(app)


def _make_user(user_id: str = "user-123") -> MagicMock:
    user = MagicMock()
    user.id = user_id
    user.sub = None
    return user


def test_router_recurrence_skip_returns_200():
    client = _make_router_client(fake_user=_make_user())
    result_payload = {"id": _TODO_UUID, "action": "skip"}

    with patch("routers.todos.control_recurrence", return_value=result_payload):
        response = client.post(
            f"/todos/{_TODO_UUID}/recurrence",
            json={"action": "skip"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["todo_id"] == _TODO_UUID
    assert data["action"] == "skip"


def test_router_recurrence_pause_returns_200():
    client = _make_router_client(fake_user=_make_user())
    result_payload = {"id": _TODO_UUID, "action": "pause"}

    with patch("routers.todos.control_recurrence", return_value=result_payload):
        response = client.post(
            f"/todos/{_TODO_UUID}/recurrence",
            json={"action": "pause"},
        )

    assert response.status_code == 200
    assert response.json()["action"] == "pause"


def test_router_recurrence_resume_returns_200():
    client = _make_router_client(fake_user=_make_user())
    result_payload = {"id": _TODO_UUID, "action": "resume"}

    with patch("routers.todos.control_recurrence", return_value=result_payload):
        response = client.post(
            f"/todos/{_TODO_UUID}/recurrence",
            json={"action": "resume"},
        )

    assert response.status_code == 200
    assert response.json()["action"] == "resume"


def test_router_recurrence_end_returns_200():
    client = _make_router_client(fake_user=_make_user())
    result_payload = {"id": _TODO_UUID, "action": "end"}

    with patch("routers.todos.control_recurrence", return_value=result_payload):
        response = client.post(
            f"/todos/{_TODO_UUID}/recurrence",
            json={"action": "end"},
        )

    assert response.status_code == 200
    assert response.json()["action"] == "end"


def test_router_recurrence_not_found_returns_404():
    client = _make_router_client(fake_user=_make_user())

    with patch("routers.todos.control_recurrence", return_value=None):
        response = client.post(
            f"/todos/{_TODO_UUID}/recurrence",
            json={"action": "pause"},
        )

    assert response.status_code == 404
    assert "반복 할일을 찾을 수 없습니다" in response.json()["detail"]


def test_router_recurrence_invalid_action_returns_422():
    client = _make_router_client(fake_user=_make_user())

    response = client.post(
        f"/todos/{_TODO_UUID}/recurrence",
        json={"action": "invalid_action"},
    )

    assert response.status_code == 422
