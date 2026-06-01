"""
Tests for stats service: get_completion_stats, _build_periods, _parse_dt.
"""
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock

import pytest

from services.stats import get_completion_stats, _build_periods, _parse_dt


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_supabase(completed_data=None, all_data=None):
    """두 번 연속 쿼리를 실행하는 Supabase mock."""
    mock = MagicMock()
    side_effects = [
        _make_execute_result(completed_data or []),
        _make_execute_result(all_data or []),
    ]
    call_count = [0]

    def _chain_side_effect(*args, **kwargs):
        inner = MagicMock()
        for method in ["select", "eq", "gte", "lte", "execute"]:
            getattr(inner, method).return_value = inner

        def execute_side_effect():
            result = side_effects[call_count[0]]
            call_count[0] += 1
            return result

        inner.execute.side_effect = execute_side_effect
        return inner

    mock.table.side_effect = _chain_side_effect
    return mock


def _make_execute_result(data):
    result = MagicMock()
    result.data = data
    return result


def _iso(dt: datetime) -> str:
    return dt.isoformat()


# ---------------------------------------------------------------------------
# _parse_dt
# ---------------------------------------------------------------------------

def test_parse_dt_utc_z():
    dt = _parse_dt("2026-06-01T12:00:00Z")
    assert dt.tzinfo is not None
    assert dt.year == 2026 and dt.month == 6 and dt.day == 1


def test_parse_dt_offset():
    dt = _parse_dt("2026-06-01T12:00:00+00:00")
    assert dt.tzinfo is not None


def test_parse_dt_naive_gets_utc():
    dt = _parse_dt("2026-06-01T12:00:00")
    assert dt.tzinfo == timezone.utc


# ---------------------------------------------------------------------------
# _build_periods — weekly
# ---------------------------------------------------------------------------

def test_build_periods_weekly_count():
    now = datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc)  # 월요일
    periods = _build_periods(now, "weekly", 8)
    assert len(periods) == 8


def test_build_periods_weekly_labels_format():
    now = datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc)
    periods = _build_periods(now, "weekly", 4)
    for p in periods:
        assert "-W" in p["label"]


def test_build_periods_weekly_ascending_order():
    now = datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc)
    periods = _build_periods(now, "weekly", 4)
    starts = [p["start"] for p in periods]
    assert starts == sorted(starts)


def test_build_periods_weekly_no_gap():
    now = datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc)
    periods = _build_periods(now, "weekly", 4)
    for i in range(len(periods) - 1):
        assert periods[i]["end"] == periods[i + 1]["start"]


# ---------------------------------------------------------------------------
# _build_periods — monthly
# ---------------------------------------------------------------------------

def test_build_periods_monthly_count():
    now = datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc)
    periods = _build_periods(now, "monthly", 6)
    assert len(periods) == 6


def test_build_periods_monthly_labels_format():
    now = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    periods = _build_periods(now, "monthly", 3)
    for p in periods:
        parts = p["label"].split("-")
        assert len(parts) == 2
        assert parts[1].isdigit() and 1 <= int(parts[1]) <= 12


def test_build_periods_monthly_ascending_order():
    now = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    periods = _build_periods(now, "monthly", 6)
    starts = [p["start"] for p in periods]
    assert starts == sorted(starts)


def test_build_periods_monthly_crosses_year_boundary():
    now = datetime(2026, 2, 15, 12, 0, tzinfo=timezone.utc)
    periods = _build_periods(now, "monthly", 6)
    labels = [p["label"] for p in periods]
    assert "2025-09" in labels
    assert "2026-02" in labels


# ---------------------------------------------------------------------------
# get_completion_stats — weekly
# ---------------------------------------------------------------------------

def test_get_completion_stats_weekly_returns_correct_count():
    now = datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc)
    this_monday = datetime(2026, 6, 1, 0, 0, tzinfo=timezone.utc)  # 2026-06-01 = 월요일

    completed = [{"id": "1", "completed_at": _iso(this_monday + timedelta(hours=1)), "created_at": _iso(this_monday)}]
    all_todos = [{"id": "1", "created_at": _iso(this_monday)}]

    supabase = _make_supabase(completed_data=completed, all_data=all_todos)
    result = get_completion_stats("user-1", supabase, "weekly", 8)

    assert result["period"] == "weekly"
    assert len(result["data"]) == 8
    last_period = result["data"][-1]
    assert last_period["completed_count"] == 1
    assert last_period["total_count"] == 1
    assert last_period["completion_rate"] == 100.0


def test_get_completion_stats_weekly_empty_returns_zeros():
    supabase = _make_supabase(completed_data=[], all_data=[])
    result = get_completion_stats("user-1", supabase, "weekly", 8)
    for period_data in result["data"]:
        assert period_data["completed_count"] == 0
        assert period_data["total_count"] == 0
        assert period_data["completion_rate"] == 0.0


def test_get_completion_stats_rate_calculation():
    this_monday = datetime(2026, 6, 1, 0, 0, tzinfo=timezone.utc)
    completed = [
        {"id": "1", "completed_at": _iso(this_monday + timedelta(hours=1)), "created_at": _iso(this_monday)},
        {"id": "2", "completed_at": _iso(this_monday + timedelta(hours=2)), "created_at": _iso(this_monday)},
    ]
    all_todos = [
        {"id": "1", "created_at": _iso(this_monday)},
        {"id": "2", "created_at": _iso(this_monday)},
        {"id": "3", "created_at": _iso(this_monday)},
        {"id": "4", "created_at": _iso(this_monday)},
    ]
    supabase = _make_supabase(completed_data=completed, all_data=all_todos)
    result = get_completion_stats("user-1", supabase, "weekly", 8)
    last = result["data"][-1]
    assert last["completed_count"] == 2
    assert last["total_count"] == 4
    assert last["completion_rate"] == 50.0


# ---------------------------------------------------------------------------
# get_completion_stats — monthly
# ---------------------------------------------------------------------------

def test_get_completion_stats_monthly_returns_correct_count():
    now = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    june_start = datetime(2026, 6, 1, 0, 0, tzinfo=timezone.utc)

    completed = [{"id": "1", "completed_at": _iso(june_start + timedelta(days=1)), "created_at": _iso(june_start)}]
    all_todos = [{"id": "1", "created_at": _iso(june_start)}]

    supabase = _make_supabase(completed_data=completed, all_data=all_todos)
    result = get_completion_stats("user-1", supabase, "monthly", 6)

    assert result["period"] == "monthly"
    assert len(result["data"]) == 6
    last = result["data"][-1]
    assert last["label"] == "2026-06"
    assert last["completed_count"] == 1


def test_get_completion_stats_no_due_date_todos_counted():
    """마감일 없는 완료 할일도 집계에 포함된다."""
    this_monday = datetime(2026, 6, 1, 0, 0, tzinfo=timezone.utc)
    completed = [
        {"id": "1", "completed_at": _iso(this_monday + timedelta(hours=1)), "created_at": _iso(this_monday)},
    ]
    all_todos = [{"id": "1", "created_at": _iso(this_monday)}]

    supabase = _make_supabase(completed_data=completed, all_data=all_todos)
    result = get_completion_stats("user-1", supabase, "weekly", 8)
    last = result["data"][-1]
    assert last["completed_count"] == 1
