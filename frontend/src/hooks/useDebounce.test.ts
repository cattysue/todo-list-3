import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('초기값을 즉시 반환한다', () => {
    const { result } = renderHook(() => useDebounce('초기값', 300));
    expect(result.current).toBe('초기값');
  });

  it('300ms 이전에는 값이 업데이트되지 않는다', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: '초기' } },
    );

    rerender({ value: '변경됨' });
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('초기');
  });

  it('300ms 경과 후 값이 업데이트된다', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: '초기' } },
    );

    rerender({ value: '변경됨' });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('변경됨');
  });

  it('연속 입력 시 마지막 값으로 debounce된다', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: '초기' } },
    );

    rerender({ value: '첫번째' });
    act(() => { jest.advanceTimersByTime(100); });

    rerender({ value: '두번째' });
    act(() => { jest.advanceTimersByTime(100); });

    rerender({ value: '세번째' });
    act(() => { jest.advanceTimersByTime(100); });

    // 아직 300ms 미도달
    expect(result.current).toBe('초기');

    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('세번째');
  });

  it('delay가 변경되면 새 delay로 적용된다', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: '초기', delay: 300 } },
    );

    rerender({ value: '변경됨', delay: 500 });
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe('초기');

    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('변경됨');
  });

  it('숫자 타입도 debounce된다', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } },
    );

    rerender({ value: 42 });
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe(42);
  });
});
