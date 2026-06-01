import calendar
from datetime import date, datetime, timedelta, timezone
from typing import Optional


def calculate_next_due_date(
    recurrence_type: str,
    recurrence_days: Optional[str] = None,
    recurrence_day_of_month: Optional[int] = None,
) -> str:
    today = datetime.now(timezone.utc).date()  # dashboard.py와 동일한 UTC 기준

    if recurrence_type == "daily":
        return (today + timedelta(days=1)).isoformat()

    if recurrence_type == "weekly":
        if not recurrence_days:
            return (today + timedelta(days=7)).isoformat()
        days = {int(d) for d in recurrence_days.split(",")}
        today_wd = today.weekday()  # 0=월, 6=일 (recurrence_days 규칙과 동일)
        for delta in range(1, 8):
            if (today_wd + delta) % 7 in days:
                return (today + timedelta(days=delta)).isoformat()
        # range(1,8)이 모든 요일을 커버하므로 non-empty days면 항상 위에서 반환됨

    if recurrence_type == "monthly":
        day = recurrence_day_of_month or 1
        if today.month == 12:
            y, m = today.year + 1, 1
        else:
            y, m = today.year, today.month + 1
        max_day = calendar.monthrange(y, m)[1]
        return date(y, m, min(day, max_day)).isoformat()

    raise ValueError(f"알 수 없는 반복 유형: {recurrence_type}")
