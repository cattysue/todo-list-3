"""Shared test helpers for all backend tests."""
from unittest.mock import MagicMock


def make_fluent_supabase_mock(rows: list[dict]) -> MagicMock:
    """Fluent Supabase mock — 모든 빌더 메서드가 self 반환."""
    mock = MagicMock()
    for method in ["table", "select", "eq", "ilike", "gte", "lte", "order", "limit", "not_"]:
        getattr(mock, method).return_value = mock
    execute_result = MagicMock()
    execute_result.data = rows
    mock.execute.return_value = execute_result
    return mock
