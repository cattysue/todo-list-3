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

  describe('queryKeys 구조 불변성', () => {
    it('todos.all은 as const로 고정된 배열이다', () => {
      expect(Array.isArray(queryKeys.todos.all)).toBe(true);
      expect(queryKeys.todos.all[0]).toBe('todos');
    });
  });
});
