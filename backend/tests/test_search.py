"""
Tests for search service and router.

Run with:  pytest backend/tests/test_search.py -v
"""
from datetime import datetime
from unittest.mock import MagicMock, call
import pytest

from schemas.dashboard import TodoDashboardItem
from services.search import search_todos


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_row(
    id: str,
    title: str,
    due_date=None,
    is_completed: bool = False,
    priority: str = "medium",
    created_at=None,
    category_name: str | None = None,
) -> dict:
    return {
        "id": id,
        "title": title,
        "due_date": due_date,
        "is_completed": is_completed,
        "priority": priority,
        "created_at": created_at or datetime(2026, 1, 1),
        "user_id": "user-123",
        "category_id": "cat-1" if category_name else None,
        "categories": {"name": category_name} if category_name else None,
    }


def _mock_supabase(rows: list[dict]) -> MagicMock:
    """Fluent mock — 모든 빌더 메서드가 self 반환."""
    mock = MagicMock()
    for method in ["table", "select", "eq", "ilike", "gte", "lte", "order", "limit", "not_"]:
        getattr(mock, method).return_value = mock
    execute_result = MagicMock()
    execute_result.data = rows
    mock.execute.return_value = execute_result
    return mock


# ---------------------------------------------------------------------------
# Unit tests — search_todos service
# ---------------------------------------------------------------------------

def test_search_no_query_returns_all():
    """q=None이면 전체 할일 반환 (ilike 미적용)."""
    rows = [
        _make_row("1", "프로젝트 A"),
        _make_row("2", "장보기"),
    ]
    supabase = _mock_supabase(rows)
    result = search_todos(user_id="user-123", supabase=supabase, q=None)
    assert len(result) == 2
    # ilike가 호출되지 않았는지 확인
    supabase.ilike.assert_not_called()


def test_search_empty_query_returns_all():
    """q='' (빈 문자열)이면 전체 할일 반환."""
    rows = [_make_row("1", "할일 1")]
    supabase = _mock_supabase(rows)
    result = search_todos(user_id="user-123", supabase=supabase, q="")
    assert len(result) == 1
    supabase.ilike.assert_not_called()


def test_search_with_query_calls_ilike():
    """q가 있으면 ilike("title", "%q%") 호출."""
    rows = [_make_row("1", "프로젝트 A")]
    supabase = _mock_supabase(rows)
    search_todos(user_id="user-123", supabase=supabase, q="프로젝트")
    supabase.ilike.assert_called_once_with("title", "%프로젝트%")


def test_search_with_query_returns_matching():
    """쿼리 결과를 TodoDashboardItem 리스트로 반환."""
    rows = [_make_row("1", "프로젝트 A", category_name="업무")]
    supabase = _mock_supabase(rows)
    result = search_todos(user_id="user-123", supabase=supabase, q="프로젝트")
    assert len(result) == 1
    assert isinstance(result[0], TodoDashboardItem)
    assert result[0].title == "프로젝트 A"
    assert result[0].category_name == "업무"


def test_search_returns_empty_list_when_no_match():
    """일치하는 항목이 없으면 빈 리스트 반환."""
    supabase = _mock_supabase([])
    result = search_todos(user_id="user-123", supabase=supabase, q="없는검색어")
    assert result == []


def test_search_filters_by_user_id():
    """user_id 필터가 호출되는지 확인."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-abc", supabase=supabase, q=None)
    supabase.eq.assert_called_with("user_id", "user-abc")


def test_search_orders_by_created_at_desc():
    """created_at DESC 정렬이 적용되는지 확인."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-123", supabase=supabase, q=None)
    supabase.order.assert_called_once_with("created_at", desc=True)


def test_search_includes_all_fields():
    """결과 항목에 필요한 모든 필드가 포함됨."""
    from datetime import date
    rows = [_make_row("1", "테스트", due_date=date(2026, 6, 10), priority="high", category_name="개인")]
    supabase = _mock_supabase(rows)
    result = search_todos(user_id="user-123", supabase=supabase, q=None)
    item = result[0]
    assert item.id == "1"
    assert item.title == "테스트"
    assert item.priority == "high"
    assert item.category_name == "개인"


def test_search_supabase_returns_none_data():
    """supabase 응답의 data가 None이면 빈 리스트 반환."""
    supabase = _mock_supabase(None)
    # data=None → _mock_supabase sets execute_result.data = None
    result = search_todos(user_id="user-123", supabase=supabase, q=None)
    assert result == []


# ---------------------------------------------------------------------------
# Router tests
# ---------------------------------------------------------------------------

def test_search_router_requires_auth():
    """인증 헤더 없으면 401 반환."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router

    app = FastAPI()
    app.include_router(router)
    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/todos/search")
    assert response.status_code == 401


def test_search_router_returns_list_without_query():
    """인증 후 q 없이 호출 시 전체 목록 반환."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)

    fake_user = MagicMock()
    fake_user.id = "user-123"
    fake_user.sub = None
    fake_supabase = _mock_supabase([_make_row("1", "할일 1")])

    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: fake_supabase

    client = TestClient(app)
    response = client.get("/todos/search")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["title"] == "할일 1"


def test_search_router_with_query_param():
    """q 파라미터 전달 시 검색 결과 반환."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)

    fake_user = MagicMock()
    fake_user.id = "user-123"
    fake_user.sub = None
    fake_supabase = _mock_supabase([_make_row("1", "프로젝트 기획")])

    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: fake_supabase

    client = TestClient(app)
    response = client.get("/todos/search?q=프로젝트")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["title"] == "프로젝트 기획"


def test_search_router_missing_user_id_returns_401():
    """user 객체에 id/sub 없으면 401 반환."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)

    fake_user = MagicMock(spec=[])  # id, sub 없음
    fake_supabase = _mock_supabase([])

    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: fake_supabase

    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/todos/search")
    assert response.status_code == 401


def test_search_router_does_not_conflict_with_patch():
    """GET /todos/search가 PATCH /todos/{todo_id}와 충돌하지 않음."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
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
    # search는 GET — PATCH 엔드포인트와 다른 메서드
    response = client.get("/todos/search")
    assert response.status_code == 200

# ---------------------------------------------------------------------------
# Unit tests — filter parameters (Story 3.2)
# ---------------------------------------------------------------------------

def test_filter_by_priority():
    """priority 파라미터 있을 때 .eq("priority", ...) 호출."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-123", supabase=supabase, priority="high")
    supabase.eq.assert_any_call("priority", "high")


def test_filter_by_priority_none_no_eq():
    """priority=None이면 .eq("priority", ...) 호출 없음."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-123", supabase=supabase, priority=None)
    calls = [str(c) for c in supabase.eq.call_args_list]
    assert not any("priority" in c for c in calls)


def test_filter_by_due_date_from():
    """.gte("due_date", due_date_from) 호출 확인."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-123", supabase=supabase, due_date_from="2026-06-01")
    supabase.gte.assert_called_once_with("due_date", "2026-06-01")


def test_filter_by_due_date_to():
    """.lte("due_date", due_date_to) 호출 확인."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-123", supabase=supabase, due_date_to="2026-06-07")
    supabase.lte.assert_called_once_with("due_date", "2026-06-07")


def test_filter_by_is_completed_true():
    """.eq("is_completed", True) 호출 확인."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-123", supabase=supabase, is_completed=True)
    supabase.eq.assert_any_call("is_completed", True)


def test_filter_by_is_completed_false():
    """.eq("is_completed", False) 호출 확인."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-123", supabase=supabase, is_completed=False)
    supabase.eq.assert_any_call("is_completed", False)


def test_filter_is_completed_none_not_called():
    """is_completed=None이면 .eq("is_completed", ...) 호출 없음."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-123", supabase=supabase, is_completed=None)
    calls = [str(c) for c in supabase.eq.call_args_list]
    assert not any("is_completed" in c for c in calls)


def test_filter_by_category_id():
    """.eq("category_id", ...) 호출 확인."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-123", supabase=supabase, category_id="cat-abc")
    supabase.eq.assert_any_call("category_id", "cat-abc")


def test_combined_filter_and_keyword():
    """q + priority 동시 적용 시 ilike와 eq 모두 호출."""
    supabase = _mock_supabase([])
    search_todos(user_id="user-123", supabase=supabase, q="프로젝트", priority="high")
    supabase.ilike.assert_called_once_with("title", "%프로젝트%")
    supabase.eq.assert_any_call("priority", "high")


def test_combined_date_range_filter():
    """due_date_from + due_date_to 동시 적용."""
    supabase = _mock_supabase([])
    search_todos(
        user_id="user-123",
        supabase=supabase,
        due_date_from="2026-06-02",
        due_date_to="2026-06-08",
    )
    supabase.gte.assert_called_once_with("due_date", "2026-06-02")
    supabase.lte.assert_called_once_with("due_date", "2026-06-08")


def test_no_filter_returns_all():
    """모든 파라미터 None이면 기존 동작 유지 — gte/lte/eq(priority)/eq(is_completed) 미호출."""
    supabase = _mock_supabase([_make_row("1", "할일")])
    result = search_todos(user_id="user-123", supabase=supabase)
    assert len(result) == 1
    supabase.gte.assert_not_called()
    supabase.lte.assert_not_called()
    supabase.ilike.assert_not_called()


# ---------------------------------------------------------------------------
# Router tests — filter parameters (Story 3.2)
# ---------------------------------------------------------------------------

def _make_search_client(rows: list[dict], *, raise_server_exceptions: bool = True):
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.todos import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)

    fake_user = MagicMock()
    fake_user.id = "user-123"
    fake_user.sub = None

    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: _mock_supabase(rows)

    return TestClient(app, raise_server_exceptions=raise_server_exceptions)


def test_search_router_with_priority_filter():
    """priority 쿼리 파라미터 전달 시 200 반환."""
    client = _make_search_client([_make_row("1", "높음 우선순위 할일", priority="high")])
    response = client.get("/todos/search?priority=high")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_search_router_with_is_completed_filter():
    """is_completed 쿼리 파라미터 전달 시 200 반환."""
    client = _make_search_client([])
    response = client.get("/todos/search?is_completed=false")
    assert response.status_code == 200


def test_search_router_combined_filters():
    """복합 필터 파라미터 전달 시 200 반환."""
    client = _make_search_client([_make_row("1", "이번 주 할일", priority="high")])
    response = client.get(
        "/todos/search?priority=high&is_completed=false&due_date_from=2026-06-02&due_date_to=2026-06-08"
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
