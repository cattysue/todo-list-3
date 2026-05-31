# Deferred Work

## Deferred from: code review of 1-3-시간-섹션-컴포넌트-구현 (2026-06-01)

- `<section>` 랜드마크에 aria-label 또는 aria-labelledby 없음 — WCAG 2.1 SC 1.3.1/4.1.2, 스크린 리더 탐색 어려움. 전체 대시보드 접근성 개선 작업 시 처리.
- 에러 상태에 재시도 버튼 없음 — 일시적 네트워크 오류 시 페이지 전체 새로고침 외 복구 방법 없음. 에러 처리 개선 스토리로 처리.
- page.tsx + OverdueSection 이중 가드 유지보수 우려 — 현재 동작 정확하나 미래 변경 시 diverge 위험. 컴포넌트 리팩터링 시 단일 가드로 정리.

## Deferred from: code review of 1-4-대시보드에서-할일-완료-처리 (2026-06-01)

- `getUser()` + `getSession()` TOCTOU — 두 호출 사이 세션 만료 가능성. 기존 `getDashboardTodos`와 동일한 패턴; 전체 api.ts 인증 리팩터링 시 처리.
- 낙관적 업데이트 시 `DashboardResponse` 알 수 없는 필드 드롭 — 4개 키만 재구성하여 미래 필드 소실 가능성. `DashboardResponse` 타입 확장 시 처리.
- `NEXT_PUBLIC_API_URL` 트레일링 슬래시 가드 없음 — 기존 `getDashboardTodos`와 동일한 패턴; api.ts 공통 fetch 유틸 도입 시 처리.
- `OverdueSection` category_name 표시 / `DashboardSection` 미표시 UI 불일치 — Story 1.3 기존 설계 결정; 대시보드 UI 통합 개선 시 처리.
