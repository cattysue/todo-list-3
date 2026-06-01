import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  describe('todos.all', () => {
    it('["todos"] 배열을 반환한다', () => {
      expect(queryKeys.todos.all).toEqual(['todos']);
    });
  });

  describe('todos.dashboard()', () => {
    it('["todos", "dashboard"] 배열을 반환한다', () => {
      expect(queryKeys.todos.dashboard()).toEqual(['todos', 'dashboard']);
    });

    it('호출할 때마다 동일한 값을 반환한다', () => {
      expect(queryKeys.todos.dashboard()).toEqual(queryKeys.todos.dashboard());
    });
  });

  describe('todos.byCategory(id)', () => {
    it('["todos", "category", id] 배열을 반환한다', () => {
      expect(queryKeys.todos.byCategory('cat-123')).toEqual([
        'todos',
        'category',
        'cat-123',
      ]);
    });

    it('다른 id에 대해 다른 키를 반환한다', () => {
      const key1 = queryKeys.todos.byCategory('a');
      const key2 = queryKeys.todos.byCategory('b');
      expect(key1).not.toEqual(key2);
    });
  });

  describe('todos.search(q, filters)', () => {
    it('filters 없으면 [todos, search, q, {}] 반환', () => {
      expect(queryKeys.todos.search('abc')).toEqual(['todos', 'search', 'abc', {}]);
    });

    it('filters 있으면 [todos, search, q, filters] 반환', () => {
      expect(queryKeys.todos.search('', { priority: 'high' })).toEqual([
        'todos',
        'search',
        '',
        { priority: 'high' },
      ]);
    });

    it('todos.all prefix 포함 — invalidateQueries(todos.all) 가능', () => {
      const key = queryKeys.todos.search('test');
      expect(key[0]).toBe('todos');
    });
  });

  describe('categories.all', () => {
    it('[categories] 배열을 반환한다', () => {
      expect(queryKeys.categories.all).toEqual(['categories']);
    });
  });

  describe('todos.calendar(start, end)', () => {
    it('["todos", "calendar", start, end] 배열을 반환한다', () => {
      expect(queryKeys.todos.calendar('2026-06-01', '2026-06-30')).toEqual([
        'todos',
        'calendar',
        '2026-06-01',
        '2026-06-30',
      ]);
    });

    it('다른 범위에 대해 다른 키를 반환한다', () => {
      const k1 = queryKeys.todos.calendar('2026-06-01', '2026-06-30');
      const k2 = queryKeys.todos.calendar('2026-07-01', '2026-07-31');
      expect(k1).not.toEqual(k2);
    });

    it('todos prefix 포함 — invalidateQueries(todos.all) 가능', () => {
      const key = queryKeys.todos.calendar('2026-06-01', '2026-06-30');
      expect(key[0]).toBe('todos');
    });
  });

  describe('queryKeys 구조 불변성', () => {
    it('todos.all은 as const로 고정된 배열이다', () => {
      expect(Array.isArray(queryKeys.todos.all)).toBe(true);
      expect(queryKeys.todos.all[0]).toBe('todos');
    });
  });
});
