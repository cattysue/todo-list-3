# Deferred Work

## Deferred from: code review of 1-3-시간-섹션-컴포넌트-구현 (2026-06-01)

- `<section>` 랜드마크에 aria-label 또는 aria-labelledby 없음 — WCAG 2.1 SC 1.3.1/4.1.2, 스크린 리더 탐색 어려움. 전체 대시보드 접근성 개선 작업 시 처리.
- 에러 상태에 재시도 버튼 없음 — 일시적 네트워크 오류 시 페이지 전체 새로고침 외 복구 방법 없음. 에러 처리 개선 스토리로 처리.
- page.tsx + OverdueSection 이중 가드 유지보수 우려 — 현재 동작 정확하나 미래 변경 시 diverge 위험. 컴포넌트 리팩터링 시 단일 가드로 정리.
