from datetime import datetime, timezone, timedelta
from typing import Literal


def get_completion_stats(
    user_id: str,
    supabase,
    period: Literal["weekly", "monthly"],
    count: int,
) -> dict:
    """
    completed_at 기준으로 기간별 완료 통계를 집계한다.
    completed_count: 해당 기간에 completed_at이 속하는 완료된 할일 수
    total_count: 해당 기간에 created_at이 속하는 모든 할일 수
    completion_rate: completed_count / total_count * 100 (total=0이면 0.0)
    """
    now = datetime.now(timezone.utc)
    periods = _build_periods(now, period, count)

    earliest_start = periods[0]["start"]

    completed_rows = (
        supabase.table("todos")
        .select("id, completed_at, created_at")
        .eq("user_id", user_id)
        .eq("is_completed", True)
        .gte("completed_at", earliest_start.isoformat())
        .lte("completed_at", now.isoformat())
        .execute()
        .data
    ) or []

    all_rows = (
        supabase.table("todos")
        .select("id, created_at")
        .eq("user_id", user_id)
        .gte("created_at", earliest_start.isoformat())
        .lte("created_at", now.isoformat())
        .execute()
        .data
    ) or []

    completed_dts = [
        (r, _parse_dt(r["completed_at"]))
        for r in completed_rows
        if r.get("completed_at")
    ]
    all_dts = [
        (r, _parse_dt(r["created_at"]))
        for r in all_rows
        if r.get("created_at")
    ]

    result = []
    for p in periods:
        completed_count = sum(
            1 for _, dt in completed_dts
            if p["start"] <= dt < p["end"]
        )
        total_count = sum(
            1 for _, dt in all_dts
            if p["start"] <= dt < p["end"]
        )
        raw_rate = completed_count / total_count * 100 if total_count > 0 else 0.0
        rate = round(min(100.0, raw_rate), 1)
        result.append({
            "label": p["label"],
            "completed_count": completed_count,
            "total_count": total_count,
            "completion_rate": rate,
        })

    return {"period": period, "data": result}


def _parse_dt(dt_str: str) -> datetime:
    """ISO 문자열 → timezone-aware datetime."""
    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _build_periods(now: datetime, period: str, count: int) -> list[dict]:
    """가장 오래된 기간부터 최근 기간 순으로 count개 기간 목록을 반환한다."""
    periods = []
    if period == "weekly":
        current_monday = now - timedelta(days=now.weekday())
        current_monday = current_monday.replace(hour=0, minute=0, second=0, microsecond=0)
        for i in range(count - 1, -1, -1):
            week_start = current_monday - timedelta(weeks=i)
            week_end = week_start + timedelta(weeks=1)
            iso_year, iso_week, _ = week_start.isocalendar()
            periods.append({
                "label": f"{iso_year}-W{iso_week:02d}",
                "start": week_start,
                "end": week_end,
            })
    else:  # monthly
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        for i in range(count - 1, -1, -1):
            year = current_month_start.year
            month = current_month_start.month - i
            while month <= 0:
                month += 12
                year -= 1
            month_start = current_month_start.replace(year=year, month=month, day=1)
            if month == 12:
                month_end = month_start.replace(year=year + 1, month=1, day=1)
            else:
                month_end = month_start.replace(month=month + 1, day=1)
            periods.append({
                "label": f"{year}-{month:02d}",
                "start": month_start,
                "end": month_end,
            })
    return periods
