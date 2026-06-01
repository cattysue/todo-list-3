"""
Tests for todos service (create/update) and router endpoints.

Run with:  pytest backend/tests/test_todos.py -v
"""
from unittest.mock import MagicMock, patch
import pytest

from services.todos import create_todo, update_todo_content, complete_todo


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(user_id: str = "user-123") -> MagicMock:
    user = MagicMock()
    user.id = user_id
    user.sub = None
    return user


def _make_mock_chain(data) -> MagicMock:
    """범용 Supabase 체인 mock — 모든 메서드가 self를 반환."""
    mock = MagicMock()
    for method in ["table", "insert", "update", "select", "eq", "single"]:
        getattr(mock, method).return_value = mock
    execute_result = MagicMock()
    execute_result.data = data
    mock.execute.return_value = execute_result
    return mock


def _mock_insert(returned_row: dict) -> MagicMock:
    """insert → select → single → execute 체인 mock."""
    return _make_mock_chain(returned_row)


def _mock_update(returned_rows: list[dict]) -> MagicMock:
    """update → eq → eq → select → execute 체인 mock."""
    return _make_mock_chain(returned_rows)


def _mock_update_with_select(returned_rows: list[dict]) -> MagicMock:
    """update → eq → eq → eq → select → execute 체인 mock (recurrence 필드 포함)."""
    mock = MagicMock()
    for method in ["table", "update", "select", "eq", "single", "insert"]:
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
    recurrence_paused: bool = False,
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
        "recurrence_paused": recurrence_paused,
    }


def _make_router_client(fake_user=None, insert_row=None, update_rows=None,
                         get_row=None, raise_server_exceptions=True):
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
    elif get_row is not None:
        app.dependency_overrides[get_supabase] = lambda: _mock_insert(get_row)

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
        updates={"recurrence_type": "weekly", "recurrence_days": "1,3"},
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
        updates={"title": "수정된 제목"},
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
        updates={},
    )

    assert result is None
    mock.update.assert_not_called()


def test_update_todo_not_found_returns_none():
    mock = _mock_update([])

    result = update_todo_content(
        todo_id="nonexistent",
        user_id="user-123",
        supabase=mock,
        updates={"title": "제목"},
    )

    assert result is None


def test_update_todo_filters_by_user_id():
    updated_row = _make_todo_row()
    mock = _mock_update([updated_row])

    update_todo_content(
        todo_id="todo-1",
        user_id="user-abc",
        supabase=mock,
        updates={"title": "수정"},
    )

    eq_calls = [call[0] for call in mock.eq.call_args_list]
    assert ("id", "todo-1") in eq_calls
    assert ("user_id", "user-abc") in eq_calls


def test_update_todo_clear_recurrence():
    """recurrence_type=None(null)을 명시적으로 전달하면 DB에 NULL로 업데이트."""
    updated_row = _make_todo_row(recurrence_type=None, recurrence_days=None)
    mock = _mock_update([updated_row])

    result = update_todo_content(
        todo_id="todo-1",
        user_id="user-123",
        supabase=mock,
        updates={"recurrence_type": None, "recurrence_days": None},
    )

    assert result["recurrence_type"] is None
    update_payload = mock.update.call_args[0][0]
    assert "recurrence_type" in update_payload
    assert update_payload["recurrence_type"] is None


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


_TODO_UUID = "11111111-1111-1111-1111-111111111111"


# ---------------------------------------------------------------------------
# Router — PUT /todos/{id}
# ---------------------------------------------------------------------------

def test_update_todo_router_200():
    updated_row = _make_todo_row(title="수정됨")
    client = _make_router_client(fake_user=_make_user(), update_rows=[updated_row])

    response = client.put(f"/todos/{_TODO_UUID}", json={"title": "수정됨"})

    assert response.status_code == 200
    assert response.json()["title"] == "수정됨"


def test_update_todo_router_404_when_not_found():
    """존재하지 않는 UUID는 404 반환."""
    client = _make_router_client(
        fake_user=_make_user(),
        update_rows=[],
        raise_server_exceptions=False,
    )

    response = client.put(f"/todos/{_TODO_UUID}", json={"title": "제목"})

    assert response.status_code == 404


def test_update_todo_router_422_invalid_uuid():
    """비-UUID 경로는 FastAPI가 422 반환."""
    client = _make_router_client(
        fake_user=_make_user(),
        update_rows=[],
        raise_server_exceptions=False,
    )

    response = client.put("/todos/not-a-uuid", json={"title": "제목"})

    assert response.status_code == 422


def test_update_todo_router_422_empty_body():
    """빈 바디 PUT은 422를 반환해야 함 (404가 아님)."""
    client = _make_router_client(
        fake_user=_make_user(),
        update_rows=[],
        raise_server_exceptions=False,
    )

    response = client.put(f"/todos/{_TODO_UUID}", json={})

    assert response.status_code == 422


def test_update_todo_router_clears_recurrence():
    """recurrence_type: null 전송 시 DB에 NULL로 저장."""
    cleared_row = _make_todo_row(recurrence_type=None, recurrence_days=None)
    client = _make_router_client(fake_user=_make_user(), update_rows=[cleared_row])

    response = client.put(
        f"/todos/{_TODO_UUID}",
        json={"recurrence_type": None, "recurrence_days": None},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["recurrence_type"] is None
    assert data["recurrence_days"] is None


def test_update_todo_router_recurrence():
    updated_row = _make_todo_row(recurrence_type="monthly", recurrence_day_of_month=1)
    client = _make_router_client(fake_user=_make_user(), update_rows=[updated_row])

    response = client.put(
        f"/todos/{_TODO_UUID}",
        json={"recurrence_type": "monthly", "recurrence_day_of_month": 1},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["recurrence_type"] == "monthly"
    assert data["recurrence_day_of_month"] == 1


# ---------------------------------------------------------------------------
# Router — GET /todos/{id}
# ---------------------------------------------------------------------------

def test_get_todo_router_200():
    row = _make_todo_row(title="운동하기", recurrence_type="weekly", recurrence_days="0,4")
    client = _make_router_client(fake_user=_make_user(), get_row=row)

    response = client.get(f"/todos/{_TODO_UUID}")

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "운동하기"
    assert data["recurrence_type"] == "weekly"
    assert data["recurrence_days"] == "0,4"


def test_get_todo_router_422_invalid_uuid():
    """비-UUID 경로는 FastAPI가 422 반환."""
    row = _make_todo_row()
    client = _make_router_client(
        fake_user=_make_user(),
        get_row=row,
        raise_server_exceptions=False,
    )

    response = client.get("/todos/not-a-uuid")

    assert response.status_code == 422


def test_get_todo_router_404():
    from unittest.mock import MagicMock

    mock = MagicMock()
    for method in ["table", "select", "eq", "single"]:
        getattr(mock, method).return_value = mock
    execute_result = MagicMock()
    execute_result.data = None
    mock.execute.return_value = execute_result

    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = lambda: _make_user()
    app.dependency_overrides[get_supabase] = lambda: mock
    client = TestClient(app, raise_server_exceptions=False)

    response = client.get(f"/todos/{_TODO_UUID}")

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Service layer — complete_todo
# ---------------------------------------------------------------------------

def test_complete_todo_no_recurrence_returns_row():
    """반복 없는 할일 완료 시 completed row 반환, create_todo 호출 안 됨."""
    row = _make_todo_row(recurrence_type=None)
    mock_sb = _mock_update([row])

    with patch("services.todos.create_todo") as mock_create:
        result = complete_todo(todo_id="todo-1", user_id="user-123", supabase=mock_sb)

    assert result is not None
    assert result["id"] == "todo-1"
    mock_create.assert_not_called()


def test_complete_todo_not_found_returns_none():
    """존재하지 않는 할일 완료 시 None 반환."""
    mock_sb = _mock_update([])

    result = complete_todo(todo_id="nonexistent", user_id="user-123", supabase=mock_sb)

    assert result is None


def test_complete_todo_daily_spawns_next_instance():
    """매일 반복 완료 시 calculate_next_due_date + create_todo 호출."""
    row = _make_todo_row(title="매일 운동", recurrence_type="daily")
    mock_sb = _mock_update([row])

    with patch("services.todos.calculate_next_due_date", return_value="2026-06-02") as mock_calc, \
         patch("services.todos.create_todo", return_value={}) as mock_create:
        result = complete_todo(todo_id="todo-1", user_id="user-123", supabase=mock_sb)

    mock_calc.assert_called_once_with(
        recurrence_type="daily",
        recurrence_days=None,
        recurrence_day_of_month=None,
    )
    create_kwargs = mock_create.call_args[1]
    assert create_kwargs["due_date"] == "2026-06-02"
    assert create_kwargs["title"] == "매일 운동"
    assert create_kwargs["recurrence_type"] == "daily"
    assert result is not None


def test_complete_todo_weekly_spawns_with_correct_recurrence():
    """매주 반복 완료 시 동일 recurrence_days로 create_todo 호출."""
    row = _make_todo_row(recurrence_type="weekly", recurrence_days="0,2")
    mock_sb = _mock_update([row])

    with patch("services.todos.calculate_next_due_date", return_value="2026-06-09") as mock_calc, \
         patch("services.todos.create_todo", return_value={}) as mock_create:
        complete_todo(todo_id="todo-1", user_id="user-123", supabase=mock_sb)

    mock_calc.assert_called_once_with(
        recurrence_type="weekly",
        recurrence_days="0,2",
        recurrence_day_of_month=None,
    )
    create_kwargs = mock_create.call_args[1]
    assert create_kwargs["recurrence_days"] == "0,2"
    assert create_kwargs["recurrence_type"] == "weekly"


def test_complete_todo_monthly_spawns_with_correct_day():
    """매월 반복 완료 시 recurrence_day_of_month로 create_todo 호출."""
    row = _make_todo_row(recurrence_type="monthly", recurrence_day_of_month=15)
    mock_sb = _mock_update([row])

    with patch("services.todos.calculate_next_due_date", return_value="2026-07-15") as mock_calc, \
         patch("services.todos.create_todo", return_value={}) as mock_create:
        complete_todo(todo_id="todo-1", user_id="user-123", supabase=mock_sb)

    mock_calc.assert_called_once_with(
        recurrence_type="monthly",
        recurrence_days=None,
        recurrence_day_of_month=15,
    )
    create_kwargs = mock_create.call_args[1]
    assert create_kwargs["recurrence_day_of_month"] == 15
    assert create_kwargs["due_date"] == "2026-07-15"


def test_complete_todo_spawn_failure_does_not_cancel_completion():
    """재생성 예외 발생 시에도 완료 행 반환 (AC: 6)."""
    row = _make_todo_row(recurrence_type="daily")
    mock_sb = _mock_update([row])

    with patch("services.todos.calculate_next_due_date", side_effect=Exception("DB 오류")):
        result = complete_todo(todo_id="todo-1", user_id="user-123", supabase=mock_sb)

    assert result is not None  # 완료 처리는 성공해야 함


def test_complete_todo_preserves_category_and_priority():
    """새 인스턴스에 원본 category_id, priority 전달."""
    row = _make_todo_row(
        title="보고서 작성",
        recurrence_type="weekly",
        recurrence_days="1",
    )
    # category_id, priority는 _make_todo_row에서 None이지만 명시적으로 set
    row["category_id"] = "cat-42"
    row["priority"] = "high"
    mock_sb = _mock_update([row])

    with patch("services.todos.calculate_next_due_date", return_value="2026-06-09"), \
         patch("services.todos.create_todo", return_value={}) as mock_create:
        complete_todo(todo_id="todo-1", user_id="user-123", supabase=mock_sb)

    create_kwargs = mock_create.call_args[1]
    assert create_kwargs["category_id"] == "cat-42"
    assert create_kwargs["priority"] == "high"


def test_complete_todo_paused_does_not_spawn():
    """recurrence_paused=True인 반복 할일 완료 시 새 인스턴스 생성 안 됨."""
    row = _make_todo_row(recurrence_type="daily", recurrence_paused=True)
    mock_sb = _mock_update_with_select([row])

    with patch("services.todos.calculate_next_due_date") as mock_calc:
        result = complete_todo(todo_id="todo-1", user_id="user-123", supabase=mock_sb)

    mock_calc.assert_not_called()
    assert result is not None
    assert result["recurrence_paused"] is True


# ---------------------------------------------------------------------------
# Router — PATCH /todos/{id}
# ---------------------------------------------------------------------------

def test_patch_router_completes_no_recurrence():
    """PATCH /todos/{id}: 반복 없는 할일 완료 → 200."""
    row = _make_todo_row(recurrence_type=None)
    # complete_todo를 patch하여 supabase mock 복잡도 제거
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = lambda: _make_user()
    app.dependency_overrides[get_supabase] = lambda: MagicMock()

    with patch("routers.todos.complete_todo", return_value={**row, "is_completed": True}):
        client = TestClient(app)
        response = client.patch(f"/todos/{_TODO_UUID}", json={"is_completed": True})

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "todo-1"
    assert data["is_completed"] is True


def test_patch_router_completes_with_recurrence_spawns_next():
    """PATCH /todos/{id}: 반복 할일 완료 → 200, create_todo 호출."""
    row = _make_todo_row(recurrence_type="daily")
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = lambda: _make_user()
    app.dependency_overrides[get_supabase] = lambda: MagicMock()

    with patch("routers.todos.complete_todo", return_value={**row, "is_completed": True}) as mock_complete:
        client = TestClient(app)
        response = client.patch(f"/todos/{_TODO_UUID}", json={"is_completed": True})

    assert response.status_code == 200
    mock_complete.assert_called_once_with(
        todo_id=_TODO_UUID,
        user_id="user-123",
        supabase=mock_complete.call_args[1]["supabase"],
    )


def test_patch_router_404_when_not_found():
    """PATCH /todos/{id}: 존재하지 않는 할일 → 404."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = lambda: _make_user()
    app.dependency_overrides[get_supabase] = lambda: MagicMock()

    with patch("routers.todos.complete_todo", return_value=None):
        client = TestClient(app, raise_server_exceptions=False)
        response = client.patch(f"/todos/{_TODO_UUID}", json={"is_completed": True})

    assert response.status_code == 404
