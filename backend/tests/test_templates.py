"""
Tests for templates service and /templates endpoints.

Run with:  pytest backend/tests/test_templates.py -v
"""
from unittest.mock import MagicMock, call, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_TMPL_UUID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
_ITEM_UUID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
_USER_ID = "user-123"


def _make_template(name: str = "아침 루틴", items: list | None = None) -> dict:
    return {
        "id": _TMPL_UUID,
        "user_id": _USER_ID,
        "name": name,
        "created_at": "2026-06-01T00:00:00Z",
        "todo_template_items": items or [],
    }


def _make_item(
    title: str = "운동",
    priority: str | None = "high",
    due_date_offset: int | None = 0,
    sort_order: int = 0,
) -> dict:
    return {
        "id": _ITEM_UUID,
        "template_id": _TMPL_UUID,
        "title": title,
        "category_id": None,
        "priority": priority,
        "due_date_offset": due_date_offset,
        "sort_order": sort_order,
    }


# ---------------------------------------------------------------------------
# Service layer — list_templates
# ---------------------------------------------------------------------------

def test_list_templates_empty():
    mock_sb = MagicMock()
    mock_sb.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = []

    from services.templates import list_templates
    result = list_templates(user_id=_USER_ID, supabase=mock_sb)

    assert result == []
    mock_sb.table.assert_called_with("todo_templates")


def test_list_templates_returns_data():
    tmpl = _make_template(items=[_make_item()])
    mock_sb = MagicMock()
    mock_sb.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [tmpl]

    from services.templates import list_templates
    result = list_templates(user_id=_USER_ID, supabase=mock_sb)

    assert len(result) == 1
    assert result[0]["name"] == "아침 루틴"
    # _normalize_template으로 todo_template_items → items 변환
    assert "items" in result[0]
    assert "todo_template_items" not in result[0]


# ---------------------------------------------------------------------------
# Service layer — create_template
# ---------------------------------------------------------------------------

def test_create_template_inserts_template_and_items():
    mock_sb = MagicMock()

    # todo_templates insert → single → execute
    tmpl_data = {"id": _TMPL_UUID, "name": "아침 루틴", "created_at": "2026-06-01T00:00:00Z", "user_id": _USER_ID}
    tmpl_execute = MagicMock()
    tmpl_execute.data = tmpl_data
    mock_sb.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value = tmpl_execute

    # todo_template_items insert → select → execute
    items_data = [{"id": _ITEM_UUID, "title": "운동", "template_id": _TMPL_UUID, "sort_order": 0}]
    items_execute = MagicMock()
    items_execute.data = items_data

    # 두 번째 table("todo_template_items") 호출을 위해 side_effect 사용
    call_count = {"n": 0}

    def table_side_effect(name):
        call_count["n"] += 1
        m = MagicMock()
        if name == "todo_templates":
            m.insert.return_value.select.return_value.single.return_value.execute.return_value = tmpl_execute
        else:
            m.insert.return_value.select.return_value.execute.return_value = items_execute
        return m

    mock_sb.table.side_effect = table_side_effect

    from services.templates import create_template
    result = create_template(
        user_id=_USER_ID,
        name="아침 루틴",
        items=[{"title": "운동", "priority": "high", "due_date_offset": 0}],
        supabase=mock_sb,
    )

    assert result["id"] == _TMPL_UUID
    assert result["name"] == "아침 루틴"
    # _normalize_template 후 items 키로 변환됨
    assert result["items"] == items_data
    assert "todo_template_items" not in result
    # todo_templates, todo_template_items 두 테이블 호출
    assert call_count["n"] == 2


def test_create_template_empty_items_skips_items_insert():
    mock_sb = MagicMock()
    tmpl_data = {"id": _TMPL_UUID, "name": "빈 템플릿", "created_at": "2026-06-01T00:00:00Z", "user_id": _USER_ID}
    tmpl_execute = MagicMock()
    tmpl_execute.data = tmpl_data
    mock_sb.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value = tmpl_execute

    from services.templates import create_template
    result = create_template(user_id=_USER_ID, name="빈 템플릿", items=[], supabase=mock_sb)

    assert result["items"] == []
    assert "todo_template_items" not in result
    # todo_templates 테이블만 호출 (items insert 없음)
    mock_sb.table.assert_called_once_with("todo_templates")


# ---------------------------------------------------------------------------
# Service layer — delete_template
# ---------------------------------------------------------------------------

def test_delete_template_returns_true_on_success():
    mock_sb = MagicMock()
    mock_sb.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
        {"id": _TMPL_UUID}
    ]

    from services.templates import delete_template
    result = delete_template(template_id=_TMPL_UUID, user_id=_USER_ID, supabase=mock_sb)

    assert result is True


def test_delete_template_returns_false_on_not_found():
    mock_sb = MagicMock()
    mock_sb.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value.data = []

    from services.templates import delete_template
    result = delete_template(template_id=_TMPL_UUID, user_id=_USER_ID, supabase=mock_sb)

    assert result is False


# ---------------------------------------------------------------------------
# Service layer — apply_template
# ---------------------------------------------------------------------------

def _make_apply_mock_sb(template_data: dict | None) -> MagicMock:
    """apply_template용 select().single() mock."""
    mock_sb = MagicMock()
    execute = MagicMock()
    execute.data = template_data
    mock_sb.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = execute
    return mock_sb


def test_apply_template_not_found_returns_none():
    mock_sb = _make_apply_mock_sb(None)

    from services.templates import apply_template
    result = apply_template(template_id=_TMPL_UUID, user_id=_USER_ID, base_date=None, supabase=mock_sb)

    assert result is None


def test_apply_template_today_uses_utc_date():
    item = _make_item(title="운동", due_date_offset=1)
    tmpl = _make_template(items=[item])
    mock_sb = _make_apply_mock_sb(tmpl)

    fixed_today = "2026-06-01"

    with patch("services.templates.datetime") as mock_dt, \
         patch("services.templates.create_todo", return_value={"id": "new-1", "title": "운동"}) as mock_create:
        from datetime import date, timezone
        mock_dt.now.return_value.date.return_value = date.fromisoformat(fixed_today)
        mock_dt.now.return_value.date.return_value = date(2026, 6, 1)

        from services.templates import apply_template
        result = apply_template(template_id=_TMPL_UUID, user_id=_USER_ID, base_date=None, supabase=mock_sb)

    assert result is not None
    assert len(result) == 1
    # offset=1 → 2026-06-02
    mock_create.assert_called_once()
    call_kwargs = mock_create.call_args.kwargs
    assert call_kwargs["due_date"] == "2026-06-02"


def test_apply_template_with_base_date():
    item = _make_item(title="독서", due_date_offset=3)
    tmpl = _make_template(items=[item])
    mock_sb = _make_apply_mock_sb(tmpl)

    with patch("services.templates.create_todo", return_value={"id": "new-1", "title": "독서"}) as mock_create:
        from services.templates import apply_template
        result = apply_template(
            template_id=_TMPL_UUID,
            user_id=_USER_ID,
            base_date="2026-06-10",
            supabase=mock_sb,
        )

    assert result is not None
    assert len(result) == 1
    call_kwargs = mock_create.call_args.kwargs
    assert call_kwargs["due_date"] == "2026-06-13"  # 2026-06-10 + 3일


def test_apply_template_null_offset_no_due_date():
    item = _make_item(title="운동", due_date_offset=None)
    tmpl = _make_template(items=[item])
    mock_sb = _make_apply_mock_sb(tmpl)

    with patch("services.templates.create_todo", return_value={"id": "new-1", "title": "운동"}) as mock_create:
        from services.templates import apply_template
        result = apply_template(
            template_id=_TMPL_UUID,
            user_id=_USER_ID,
            base_date="2026-06-01",
            supabase=mock_sb,
        )

    assert result is not None
    call_kwargs = mock_create.call_args.kwargs
    assert call_kwargs["due_date"] is None


def test_apply_template_empty_items_returns_empty_list():
    tmpl = _make_template(items=[])
    mock_sb = _make_apply_mock_sb(tmpl)

    from services.templates import apply_template
    result = apply_template(
        template_id=_TMPL_UUID, user_id=_USER_ID, base_date=None, supabase=mock_sb
    )

    assert result == []


def test_apply_template_sort_order_respected():
    """sort_order 기준으로 정렬되어 create_todo가 순서대로 호출되어야 함."""
    item0 = _make_item(title="첫번째", due_date_offset=0, sort_order=0)
    item1 = _make_item(title="두번째", due_date_offset=1, sort_order=1)
    # 역순으로 저장되어 있어도 sort_order로 정렬
    tmpl = _make_template(items=[item1, item0])
    mock_sb = _make_apply_mock_sb(tmpl)

    created_titles = []

    def fake_create_todo(**kwargs):
        created_titles.append(kwargs["title"])
        return {"id": "x", "title": kwargs["title"]}

    with patch("services.templates.create_todo", side_effect=fake_create_todo):
        from services.templates import apply_template
        apply_template(
            template_id=_TMPL_UUID, user_id=_USER_ID, base_date="2026-06-01", supabase=mock_sb
        )

    assert created_titles == ["첫번째", "두번째"]


# ---------------------------------------------------------------------------
# Router integration tests
# ---------------------------------------------------------------------------

from fastapi import FastAPI
from fastapi.testclient import TestClient


def _make_fake_user(user_id: str = _USER_ID) -> MagicMock:
    user = MagicMock()
    user.id = user_id
    user.sub = None
    return user


def _make_router_client():
    from routers.templates import router
    from dependencies import get_current_user, get_supabase

    app = FastAPI()
    app.include_router(router)
    fake_user = _make_fake_user()
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: MagicMock()
    return TestClient(app)


def test_get_templates_200():
    client = _make_router_client()
    # 서비스에서 _normalize_template 거친 결과 (items 키)
    tmpl = {
        "id": _TMPL_UUID,
        "name": "아침 루틴",
        "created_at": "2026-06-01T00:00:00Z",
        "items": [],
    }
    with patch("routers.templates.list_templates", return_value=[tmpl]):
        resp = client.get("/templates")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "아침 루틴"


def test_create_template_201():
    client = _make_router_client()
    tmpl = {
        "id": _TMPL_UUID,
        "name": "저녁 루틴",
        "created_at": "2026-06-01T00:00:00Z",
        "items": [
            {"id": _ITEM_UUID, "title": "산책", "category_id": None, "priority": None, "due_date_offset": None, "sort_order": 0}
        ],
    }
    with patch("routers.templates.create_template", return_value=tmpl):
        resp = client.post(
            "/templates",
            json={"name": "저녁 루틴", "items": [{"title": "산책"}]},
        )
    assert resp.status_code == 201
    assert resp.json()["name"] == "저녁 루틴"


def test_delete_template_204():
    client = _make_router_client()
    with patch("routers.templates.delete_template", return_value=True):
        resp = client.delete(f"/templates/{_TMPL_UUID}")
    assert resp.status_code == 204


def test_delete_template_404():
    client = _make_router_client()
    with patch("routers.templates.delete_template", return_value=False):
        resp = client.delete(f"/templates/{_TMPL_UUID}")
    assert resp.status_code == 404
    assert "템플릿을 찾을 수 없습니다" in resp.json()["detail"]


def test_apply_template_201():
    client = _make_router_client()
    todo = {
        "id": "new-todo-1",
        "title": "운동",
        "due_date": "2026-06-02",
        "priority": "high",
        "is_completed": False,
        "created_at": "2026-06-01T00:00:00Z",
        "category_id": None,
        "category_name": None,
        "recurrence_type": None,
        "recurrence_days": None,
        "recurrence_day_of_month": None,
        "recurrence_paused": False,
    }
    with patch("routers.templates.apply_template", return_value=[todo]):
        resp = client.post(f"/templates/{_TMPL_UUID}/apply", json={})
    assert resp.status_code == 201
    assert resp.json()[0]["title"] == "운동"


def test_apply_template_404():
    client = _make_router_client()
    with patch("routers.templates.apply_template", return_value=None):
        resp = client.post(f"/templates/{_TMPL_UUID}/apply", json={})
    assert resp.status_code == 404
    assert "템플릿을 찾을 수 없습니다" in resp.json()["detail"]


def test_apply_template_empty_items_returns_201_empty_list():
    """항목이 없는 템플릿은 404가 아니라 201 + 빈 리스트."""
    client = _make_router_client()
    with patch("routers.templates.apply_template", return_value=[]):
        resp = client.post(f"/templates/{_TMPL_UUID}/apply", json={})
    assert resp.status_code == 201
    assert resp.json() == []
