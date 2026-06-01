import {
  formatDate,
  getMonthRange,
  getWeekRange,
  getMonthGridDays,
  getWeekDays,
  isSameMonth,
  isToday,
  navigateMonth,
  navigateWeek,
} from './calendarUtils';

describe('calendarUtils', () => {
  describe('formatDate', () => {
    it('Date를 YYYY-MM-DD 문자열로 변환한다', () => {
      expect(formatDate(new Date(2026, 5, 1))).toBe('2026-06-01');   // month is 0-indexed
      expect(formatDate(new Date(2026, 11, 31))).toBe('2026-12-31');
    });

    it('한 자리 월/일은 0으로 패딩된다', () => {
      expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
  });

  describe('getMonthRange', () => {
    it('월의 1일부터 말일까지 반환한다', () => {
      const range = getMonthRange(new Date(2026, 5, 15)); // June 2026
      expect(range.start).toBe('2026-06-01');
      expect(range.end).toBe('2026-06-30');
    });

    it('2월 말일을 올바르게 처리한다 (윤년)', () => {
      const range = getMonthRange(new Date(2024, 1, 10)); // Feb 2024 (leap)
      expect(range.start).toBe('2024-02-01');
      expect(range.end).toBe('2024-02-29');
    });
  });

  describe('getWeekRange', () => {
    it('월요일부터 일요일까지 반환한다 (ISO 주간)', () => {
      // 2026-06-01은 월요일
      const range = getWeekRange(new Date(2026, 5, 1));
      expect(range.start).toBe('2026-06-01');
      expect(range.end).toBe('2026-06-07');
    });

    it('주 중간의 날짜도 해당 주 월~일 범위를 반환한다', () => {
      // 2026-06-03은 수요일
      const range = getWeekRange(new Date(2026, 5, 3));
      expect(range.start).toBe('2026-06-01');
      expect(range.end).toBe('2026-06-07');
    });

    it('일요일 날짜도 해당 주 월~일 범위를 반환한다', () => {
      // 2026-06-07은 일요일
      const range = getWeekRange(new Date(2026, 5, 7));
      expect(range.start).toBe('2026-06-01');
      expect(range.end).toBe('2026-06-07');
    });
  });

  describe('getMonthGridDays', () => {
    it('항상 7의 배수 개 날짜를 반환한다', () => {
      const days = getMonthGridDays(new Date(2026, 5, 1)); // June 2026
      expect(days.length % 7).toBe(0);
    });

    it('모든 날짜가 Date 객체이다', () => {
      const days = getMonthGridDays(new Date(2026, 5, 1));
      days.forEach((d) => expect(d).toBeInstanceOf(Date));
    });

    it('그리드에 해당 월의 모든 날이 포함된다', () => {
      const days = getMonthGridDays(new Date(2026, 5, 1)); // June has 30 days
      const juneDays = days.filter((d) => d.getMonth() === 5);
      expect(juneDays).toHaveLength(30);
    });
  });

  describe('getWeekDays', () => {
    it('7개의 날짜를 반환한다', () => {
      const days = getWeekDays(new Date(2026, 5, 1));
      expect(days).toHaveLength(7);
    });

    it('첫 번째 날짜가 월요일이다', () => {
      const days = getWeekDays(new Date(2026, 5, 3)); // Wednesday
      expect(days[0].getDay()).toBe(1); // Monday
    });

    it('마지막 날짜가 일요일이다', () => {
      const days = getWeekDays(new Date(2026, 5, 3));
      expect(days[6].getDay()).toBe(0); // Sunday
    });
  });

  describe('isSameMonth', () => {
    it('같은 월이면 true를 반환한다', () => {
      expect(isSameMonth(new Date(2026, 5, 10), new Date(2026, 5, 1))).toBe(true);
    });

    it('다른 월이면 false를 반환한다', () => {
      expect(isSameMonth(new Date(2026, 6, 1), new Date(2026, 5, 1))).toBe(false);
    });

    it('다른 연도면 false를 반환한다', () => {
      expect(isSameMonth(new Date(2025, 5, 1), new Date(2026, 5, 1))).toBe(false);
    });
  });

  describe('isToday', () => {
    it('오늘 날짜에 대해 true를 반환한다', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('다른 날짜에 대해 false를 반환한다', () => {
      expect(isToday(new Date(2000, 0, 1))).toBe(false);
    });
  });

  describe('navigateMonth', () => {
    it('+1 방향으로 다음 달 1일을 반환한다', () => {
      const next = navigateMonth(new Date(2026, 5, 15), 1);
      expect(next.getMonth()).toBe(6);
      expect(next.getDate()).toBe(1);
    });

    it('-1 방향으로 이전 달 1일을 반환한다', () => {
      const prev = navigateMonth(new Date(2026, 5, 15), -1);
      expect(prev.getMonth()).toBe(4);
      expect(prev.getDate()).toBe(1);
    });

    it('연도 경계를 올바르게 처리한다 (1월 → 12월)', () => {
      const prev = navigateMonth(new Date(2026, 0, 1), -1);
      expect(prev.getFullYear()).toBe(2025);
      expect(prev.getMonth()).toBe(11);
    });
  });

  describe('navigateWeek', () => {
    it('+1 방향으로 7일 후 날짜를 반환한다', () => {
      const next = navigateWeek(new Date(2026, 5, 1), 1);
      expect(formatDate(next)).toBe('2026-06-08');
    });

    it('-1 방향으로 7일 전 날짜를 반환한다', () => {
      const prev = navigateWeek(new Date(2026, 5, 8), -1);
      expect(formatDate(prev)).toBe('2026-06-01');
    });
  });
});
