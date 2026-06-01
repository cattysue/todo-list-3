export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthRange(date: Date): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: formatDate(start), end: formatDate(end) };
}

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

function getMondayOf(date: Date): Date {
  const isoDay = date.getDay() === 0 ? 6 : date.getDay() - 1; // Mon=0, Sun=6
  const monday = new Date(date);
  monday.setDate(date.getDate() - isoDay);
  return monday;
}

export function getWeekRange(date: Date): { start: string; end: string } {
  const monday = getMondayOf(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: formatDate(monday), end: formatDate(sunday) };
}

// Returns all days for the month grid (Mon-Sun rows, padded with adjacent-month days)
export function getMonthGridDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const endPad = lastDay.getDay() === 0 ? 0 : 7 - lastDay.getDay();

  const gridStart = new Date(firstDay);
  gridStart.setDate(1 - startPad);
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(lastDay.getDate() + endPad);

  const days: Date[] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function getWeekDays(date: Date): Date[] {
  const monday = getMondayOf(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function isSameMonth(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

export function isToday(date: Date): boolean {
  return formatDate(date) === formatDate(new Date());
}

export function navigateMonth(date: Date, direction: 1 | -1): Date {
  return new Date(date.getFullYear(), date.getMonth() + direction, 1);
}

export function navigateWeek(date: Date, direction: 1 | -1): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + direction * 7);
  return d;
}
