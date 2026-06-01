"""
Tests for services/recurring.py — calculate_next_due_date pure function.

Run with: pytest backend/tests/test_recurring.py -v
"""
from datetime import date, timedelta
from unittest.mock import patch

import pytest

from services.recurring import calculate_next_due_date


# ---------------------------------------------------------------------------
# daily
# ---------------------------------------------------------------------------

def test_calculate_daily():
    result = calculate_next_due_date("daily")
    expected = (date.today() + timedelta(days=1)).isoformat()
    assert result == expected


# ---------------------------------------------------------------------------
# weekly — single day
# ---------------------------------------------------------------------------

def test_calculate_weekly_single_day_result_is_correct_weekday():
    """단일 요일 지정 시 결과가 해당 요일인지 확인."""
    result = calculate_next_due_date("weekly", recurrence_days="0")  # 매주 월요일
    result_date = date.fromisoformat(result)
    assert result_date.weekday() == 0  # 0 = 월요일


def test_calculate_weekly_result_is_after_today():
    """결과 날짜가 항상 오늘 이후여야 한다."""
    for day in range(7):
        result = calculate_next_due_date("weekly", recurrence_days=str(day))
        result_date = date.fromisoformat(result)
        assert result_date > date.today()


def test_calculate_weekly_same_weekday_skips_to_next_week():
    """오늘과 지정 요일이 같으면 7일 후로 설정 (delta=1~7 순회, 오늘 제외)."""
    today_wd = date.today().weekday()
    result = calculate_next_due_date("weekly", recurrence_days=str(today_wd))
    result_date = date.fromisoformat(result)
    # delta=1~7 범위이므로 최소 1일, 최대 7일 후
    assert result_date > date.today()
    assert (result_date - date.today()).days <= 7


# ---------------------------------------------------------------------------
# weekly — multiple days
# ---------------------------------------------------------------------------

def test_calculate_weekly_multiple_days_result_is_one_of_specified():
    """복수 요일(월/수/금) 중 오늘 이후 첫 번째 발생일 확인."""
    result = calculate_next_due_date("weekly", recurrence_days="0,2,4")
    result_date = date.fromisoformat(result)
    assert result_date.weekday() in {0, 2, 4}
    assert result_date > date.today()


def test_calculate_weekly_multiple_days_picks_nearest():
    """지정 요일 중 오늘에서 가장 가까운 날 반환."""
    fixed_wednesday = date(2026, 6, 3)  # 수요일
    with patch("services.recurring.datetime") as mock_dt:
        mock_dt.now.return_value.date.return_value = fixed_wednesday

        # 수/금 지정 → 오늘(수)은 제외 → 가장 가까운 금(2일 후)
        result = calculate_next_due_date("weekly", recurrence_days="2,4")

    result_date = date.fromisoformat(result)
    assert result_date.weekday() == 4  # 금요일
    assert (result_date - fixed_wednesday).days == 2


def test_calculate_weekly_no_recurrence_days_fallback():
    """recurrence_days가 None이면 7일 후 fallback."""
    result = calculate_next_due_date("weekly", recurrence_days=None)
    expected = (date.today() + timedelta(days=7)).isoformat()
    assert result == expected


# ---------------------------------------------------------------------------
# monthly
# ---------------------------------------------------------------------------

def test_calculate_monthly_correct_month():
    """다음 달 지정 날짜 반환."""
    result = calculate_next_due_date("monthly", recurrence_day_of_month=15)
    result_date = date.fromisoformat(result)
    today = date.today()

    if today.month == 12:
        assert result_date.month == 1
        assert result_date.year == today.year + 1
    else:
        assert result_date.month == today.month + 1
        assert result_date.year == today.year

    assert result_date.day == 15


def test_calculate_monthly_december_wraps_to_january():
    """12월에 완료 시 다음 해 1월로 설정."""
    fixed_dec = date(2026, 12, 10)
    with patch("services.recurring.datetime") as mock_dt:
        mock_dt.now.return_value.date.return_value = fixed_dec

        result = calculate_next_due_date("monthly", recurrence_day_of_month=5)

    result_date = date.fromisoformat(result)
    assert result_date.year == 2027
    assert result_date.month == 1
    assert result_date.day == 5


def test_calculate_monthly_overflow_clamped_to_last_day():
    """31일 지정 시 2월이면 28/29일로 조정."""
    fixed_jan = date(2026, 1, 15)
    with patch("services.recurring.datetime") as mock_dt:
        mock_dt.now.return_value.date.return_value = fixed_jan

        result = calculate_next_due_date("monthly", recurrence_day_of_month=31)

    result_date = date.fromisoformat(result)
    assert result_date.month == 2
    assert result_date.day == 28  # 2026년 2월은 28일


# ---------------------------------------------------------------------------
# error handling
# ---------------------------------------------------------------------------

def test_calculate_unknown_type_raises_value_error():
    with pytest.raises(ValueError, match="알 수 없는 반복 유형"):
        calculate_next_due_date("hourly")
