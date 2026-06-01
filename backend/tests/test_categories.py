"""
Tests for categories router.

Run with:  pytest backend/tests/test_categories.py -v
"""
from unittest.mock import MagicMock

from conftest import make_fluent_supabase_mock


def _make_user(user_id: str = "user-123") -> MagicMock:
    user = MagicMock()
    user.id = user_id
    user.sub = None
    return user


def _make_categories_client(rows: list[dict], fake_user=None, *, raise_server_exceptions: bool = True):
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.categories import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)

    if fake_user is not None:
        app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: make_fluent_supabase_mock(rows)

    return TestClient(app, raise_server_exceptions=raise_server_exceptions)


def test_categories_router_requires_auth():
    """인증 헤더 없으면 401 반환."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.categories import router

    app = FastAPI()
    app.include_router(router)
    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/categories")
    assert response.status_code == 401


def test_categories_router_returns_list():
    """인증 후 카테고리 목록 반환."""
    client = _make_categories_client(
        [{"id": "cat-1", "name": "업무"}, {"id": "cat-2", "name": "개인"}],
        fake_user=_make_user(),
    )
    response = client.get("/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["name"] == "업무"
    assert data[1]["name"] == "개인"


def test_categories_router_returns_empty_list():
    """카테고리 없을 때 빈 리스트 반환."""
    client = _make_categories_client([], fake_user=_make_user())
    response = client.get("/categories")
    assert response.status_code == 200
    assert response.json() == []


def test_categories_router_missing_user_id_returns_401():
    """user 객체에 id/sub 없으면 401 반환."""
    client = _make_categories_client(
        [], fake_user=MagicMock(spec=[]), raise_server_exceptions=False
    )
    response = client.get("/categories")
    assert response.status_code == 401


def test_categories_filters_by_user_id():
    """user_id로 필터링되는지 확인."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routers.categories import router
    from dependencies import get_current_user, get_supabase

    fake_supabase = make_fluent_supabase_mock([{"id": "cat-1", "name": "업무"}])
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = lambda: _make_user("user-xyz")
    app.dependency_overrides[get_supabase] = lambda: fake_supabase

    client = TestClient(app)
    client.get("/categories")
    fake_supabase.eq.assert_called_with("user_id", "user-xyz")
