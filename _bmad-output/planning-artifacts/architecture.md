---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-06-01'
inputDocuments:
  - _bmad-output/planning-artifacts/briefs/brief-todo-list-3-2026-06-01/brief.md
  - _bmad-output/planning-artifacts/prds/prd-todo-list-3-2026-06-01/prd.md
workflowType: 'architecture'
project_name: 'todo-list-3'
user_name: 'Catty'
date: '2026-06-01'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## 프로젝트 컨텍스트 분석

### 요구사항 개요

**기능 요구사항:**
- Phase 1 (MVP): FR-1~5 — 시간 중심 대시보드 (기한 초과·오늘·내일·이번 주 섹션, 대시보드 완료 처리)
- Phase 2: FR-6~10 — 이메일 알림 + 검색/필터
- Phase 3: FR-11~13 — 반복 할일 + 템플릿
- Phase 4: FR-14~17 — 캘린더 뷰 + 생산성 통계

**비기능 요구사항:**
- 대시보드 초기 로드 < 1초 (Supabase 마감일 인덱스 필수)
- 검색 결과 갱신 < 300ms (debounce 적용)
- 반응형 웹 (PWA 수준)

**규모 및 복잡도:**
- 주요 도메인: 풀스택 웹 (Next.js + FastAPI + Supabase)
- 복잡도: 낮음-중간
- 단일 사용자 — 멀티테넌시 불필요

### 기술 제약 및 의존성

- **기존 스택 고정:** Next.js (프론트), FastAPI (백엔드), Supabase (DB + Auth), Railway (배포)
- **스케줄링 인프라 미결:** 이메일 알림(FR-6) 및 반복 할일(FR-11) 모두 scheduled job 필요. Railway Cron vs. Supabase Edge Functions scheduled trigger — Phase 2 시작 전 결정 필요
- **이메일 서비스 미결:** Resend / SendGrid / Supabase SMTP 중 선택 필요 (Phase 2)
- **비목표 명확:** 네이티브 앱, AI, 외부 캘린더 동기화, 팀 협업 없음

### 식별된 횡단 관심사

1. **날짜/시간 처리** — "오늘/이번 주" 경계 계산이 대시보드, 알림, 반복 할일 전반에 영향. 서버 타임존 기준 단일화 필요
2. **인증 상태** — 로그인 후 `/dashboard` 리다이렉트, API 인증 토큰 전파
3. **데이터 동기화** — 대시보드에서의 완료 처리가 카테고리 뷰에 즉시 반영 (FR-5)
4. **스케줄링 인프라** — Phase 2 이메일 알림 + Phase 3 반복 할일 공통 기반
5. **성능** — Supabase `todos.due_date` 인덱스가 Phase 1 NFR 달성의 전제 조건

## 기술 기반 (스타터 평가)

### 1차 기술 도메인

풀스택 웹 — 기존 Next.js + FastAPI + Supabase + Railway 스택 확장

### 기존 코드베이스 확장

이 프로젝트는 신규 스타터가 아닌 기존 운영 중인 코드베이스에 기능을 추가한다. 새로운 스타터 평가는 해당 없음.

### 기술 스택 현황

**프론트엔드:**
- Next.js — App Router / Pages Router 중 어느 것을 사용 중인지 추후 확인
- 스타일링 솔루션 — Tailwind CSS / CSS Modules / 기타 추후 확인

**백엔드:**
- FastAPI (Python) — 기존 엔드포인트에 마감일 기준 필터링 API 추가

**데이터베이스 / 인증:**
- Supabase PostgreSQL — `todos.due_date` 인덱스 추가 필요
- Supabase Auth — 기존 인증 흐름 활용

**배포:**
- Railway — 현재 배포 플랫폼 유지

**아키텍처적으로 확인이 필요한 사항:**
- Next.js App Router vs Pages Router (라우팅 패턴에 영향)
- 현재 상태 관리 방식 (React Query / SWR / 기타)
- Supabase 클라이언트 설정 방식 (클라이언트 사이드 / 서버 사이드)

## 핵심 아키텍처 결정

### 결정 우선순위 분석

**필수 결정 (구현 차단):**
- 대시보드 API 패턴: FastAPI 경유
- 프론트엔드 데이터 패칭: TanStack Query 도입

**중요 결정 (아키텍처에 영향):**
- Next.js App Router 기준 (Pages Router일 경우 패턴 재확인 필요)
- 스케줄링: Railway Cron Job (Phase 2~3)

**연기된 결정 (MVP 이후):**
- 이메일 서비스 선택 (Resend / SendGrid) — Phase 2 시작 전 결정
- 브라우저 푸시 알림 인프라 — Phase 2 후반

### 데이터 아키텍처

- **API 패턴:** 프론트 → FastAPI → Supabase (기존 패턴 유지)
- **DB 변경:** `todos.due_date` 컬럼 인덱스 추가 필수 (Phase 1 NFR 달성 전제)
- **쿼리 전략:** FastAPI에서 마감일 기준 필터링 엔드포인트 신설

### 인증 & 보안

- **인증:** Supabase Auth 기존 흐름 유지
- **API 보안:** 기존 FastAPI 인증 미들웨어 대시보드 엔드포인트에 동일 적용

### API & 통신 패턴

- **스타일:** REST (기존 FastAPI 패턴 유지)
- **신규 엔드포인트:** `GET /todos/dashboard` — due_date 기준 섹션 분류 응답
- **에러 처리:** 기존 FastAPI 에러 패턴 유지

### 프론트엔드 아키텍처

- **라우터:** Next.js App Router 기준 (불확실 — 구현 시 확인)
- **상태/데이터 패칭:** TanStack Query 도입
  - 대시보드 ↔ 카테고리 뷰 동기화: `invalidateQueries(['todos'])` 패턴
  - 완료 처리 후 자동 리페치로 FR-5 구현
- **신규 페이지:** `/dashboard` route 추가, 로그인 후 리다이렉트 처리

### 인프라 & 배포

- **배포:** Railway 유지
- **스케줄링 (Phase 2~3):** Railway Cron Job
  - 이메일 알림 트리거 (FR-6)
  - 반복 할일 자동 생성 (FR-11)

### 결정 영향 분석

**구현 순서:**
1. Supabase `due_date` 인덱스 추가
2. FastAPI 대시보드 필터링 엔드포인트 (`GET /todos/dashboard`)
3. Next.js `/dashboard` 페이지 + TanStack Query 데이터 패칭
4. 로그인 후 `/dashboard` 리다이렉트

**컴포넌트 간 의존성:**
- TanStack Query 캐시 키 통일 → 대시보드·카테고리 뷰 동기화 보장
- `due_date` 인덱스 → 대시보드 < 1초 NFR의 전제 조건

## 구현 패턴 & 일관성 규칙

### 식별된 잠재적 충돌 포인트

6개 영역: 네이밍, 프로젝트 구조, API 포맷, 날짜/시간 처리, 상태 관리, 에러 처리

### 네이밍 패턴

**데이터베이스 (Supabase PostgreSQL):**
- 테이블명: 복수 snake_case → `todos`, `categories`
- 컬럼명: snake_case → `due_date`, `user_id`, `created_at`
- 외래키: `{단수_테이블명}_id` → `category_id`, `user_id`
- 인덱스: `idx_{테이블}_{컬럼}` → `idx_todos_due_date`

**API 엔드포인트 (FastAPI):**
- URL: 복수 명사, snake_case → `/todos`, `/categories`
- 특수 엔드포인트: 동사 없이 명사로 → `/todos/dashboard`
- 경로 파라미터: `{id}` 형식
- 쿼리 파라미터: snake_case → `?category_id=1`

**코드 네이밍:**
- Python (FastAPI): 함수·변수 snake_case, 클래스 PascalCase
  - 예: `get_dashboard_todos()`, `class TodoResponse`
- TypeScript (Next.js): 컴포넌트 PascalCase, 함수·변수 camelCase
  - 예: `DashboardPage`, `useDashboardTodos()`, `categoryId`
- 파일명:
  - Next.js App Router 규칙 파일: `page.tsx`, `layout.tsx`, `loading.tsx`
  - 커스텀 컴포넌트: PascalCase → `TodoItem.tsx`, `DashboardSection.tsx`
  - FastAPI 라우터: snake_case → `dashboard.py`, `todos.py`

### 구조 패턴

**프론트엔드 (Next.js App Router 기준):**
```
app/
  dashboard/
    page.tsx          ← /dashboard 페이지
    loading.tsx       ← 로딩 스켈레톤
  (auth)/
    login/page.tsx
  components/
    todos/            ← 할일 관련 공통 컴포넌트
    ui/               ← 범용 UI 컴포넌트
  lib/
    api.ts            ← FastAPI 호출 함수 모음
    queryKeys.ts      ← TanStack Query 키 중앙 관리
```

**백엔드 (FastAPI):**
```
routers/
  todos.py
  dashboard.py        ← 신규: 대시보드 전용 라우터
  categories.py
schemas/
  todo.py             ← Pydantic 모델
services/
  dashboard.py        ← 날짜 기준 필터링 비즈니스 로직
```

**테스트:**
- 프론트엔드: 컴포넌트 옆 co-located `*.test.tsx`
- 백엔드: `tests/test_{module}.py`

### API 포맷 패턴

**성공 응답 — 대시보드 신규 엔드포인트:**
```json
{
  "overdue": [...],
  "today": [...],
  "tomorrow": [...],
  "this_week": [...]
}
```

**에러 응답 (FastAPI 기본):**
```json
{ "detail": "에러 메시지" }
```

**날짜/시간 형식:**
- API 전달: ISO 8601 문자열 → `"2026-06-01T00:00:00Z"`
- DB 저장: UTC timestamp
- UI 표시: 사용자 로컬 시간 (프론트엔드에서 변환)

**JSON 필드 네이밍:**
- FastAPI 응답: snake_case (Python 기본)
- 프론트엔드: camelCase (TypeScript 기본)
- 변환: FastAPI `model_config = ConfigDict(populate_by_name=True)` 또는 프론트엔드 API 레이어에서 변환

### 날짜/시간 처리 패턴 (핵심)

> 대시보드, 알림, 반복 할일 전반에 영향하는 최중요 패턴

- **"오늘" 기준:** FastAPI 서버에서 계산 (UTC 기준 날짜)
- **섹션 분류 로직:** 백엔드에서 처리, 프론트엔드는 결과만 렌더링
- **클라이언트 타임존:** 표시 전용, 비즈니스 로직에 사용 금지
- **"이번 주" 범위:** ISO 기준 월요일~일요일 (PRD §9 가정)

### 상태 관리 패턴 (TanStack Query)

**쿼리 키 구조 (`lib/queryKeys.ts`에 중앙 관리):**
```typescript
export const queryKeys = {
  todos: {
    all: ['todos'] as const,
    dashboard: () => ['todos', 'dashboard'] as const,
    byCategory: (id: string) => ['todos', 'category', id] as const,
  }
}
```

**완료 처리 후 캐시 무효화 패턴:**
```typescript
// 완료 처리 mutation 후 반드시 실행
queryClient.invalidateQueries({ queryKey: queryKeys.todos.all })
// → 대시보드와 카테고리 뷰 동시 갱신 (FR-5 구현)
```

**낙관적 업데이트:** 완료 체크 시 즉시 UI 반영 후 서버 동기화

### 에러 처리 패턴

**FastAPI:**
- 인증 실패: `401 Unauthorized`
- 리소스 없음: `404 Not Found`
- 유효성 오류: `422 Unprocessable Entity`

**프론트엔드:**
- 네트워크 에러: TanStack Query `onError` → toast 알림
- 사용자 표시 메시지: 한국어
- 로딩 실패 시: 빈 섹션 표시 (앱 크래시 금지)

### 로딩 상태 패턴

- 초기 로드: 스켈레톤 UI (`loading.tsx` 또는 Suspense)
- 뮤테이션 중: 버튼 비활성화 + 인디케이터
- 백그라운드 리페치: 별도 표시 없음 (UX 방해 금지)

### 모든 AI 에이전트 준수 사항

- `queryKeys.ts` 외부에서 쿼리 키 문자열 리터럴 사용 금지
- 날짜 경계 계산을 프론트엔드 컴포넌트에 직접 작성 금지 → 백엔드 API 응답 사용
- FastAPI 라우터에서 비즈니스 로직 직접 구현 금지 → `services/` 레이어 사용
- 완료 처리 후 `queryKeys.todos.all` 무효화 누락 금지 (동기화 깨짐)

## 프로젝트 구조 & 경계

### 완성 프로젝트 디렉토리 구조

> 기호: ← 기존 | ★ Phase 1 신규 | ◆ Phase 2+ 예정

```
todo-list-3/
├── frontend/                          ← Next.js (기존)
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── .env.local
│   └── src/
│       ├── app/
│       │   ├── layout.tsx             ← 로그인 후 /dashboard 리다이렉트 수정 ★
│       │   ├── page.tsx
│       │   ├── dashboard/             ★ Phase 1 (FR-1~5)
│       │   │   ├── page.tsx
│       │   │   └── loading.tsx
│       │   ├── categories/            ← 기존
│       │   │   └── [id]/
│       │   │       └── page.tsx
│       │   ├── settings/              ◆ Phase 2 (FR-7)
│       │   │   └── page.tsx
│       │   ├── calendar/              ◆ Phase 4 (FR-14~15)
│       │   │   └── page.tsx
│       │   ├── stats/                 ◆ Phase 4 (FR-16~17)
│       │   │   └── page.tsx
│       │   └── (auth)/
│       │       ├── login/page.tsx
│       │       └── register/page.tsx
│       ├── components/
│       │   ├── dashboard/             ★ Phase 1
│       │   │   ├── DashboardSection.tsx
│       │   │   ├── OverdueSection.tsx   ← FR-2
│       │   │   ├── TodaySection.tsx     ← FR-3
│       │   │   ├── TomorrowSection.tsx  ← FR-4
│       │   │   └── WeekSection.tsx      ← FR-4
│       │   ├── todos/                 ← 기존
│       │   │   ├── TodoItem.tsx
│       │   │   ├── TodoForm.tsx
│       │   │   └── TodoList.tsx
│       │   └── ui/                    ← 기존
│       │       ├── Button.tsx
│       │       └── Skeleton.tsx
│       ├── lib/
│       │   ├── api.ts                 ← FastAPI 호출 함수 (기존 + 확장)
│       │   ├── queryKeys.ts           ★ Phase 1 신규 (TanStack Query 키 중앙 관리)
│       │   └── utils.ts
│       ├── hooks/
│       │   ├── useDashboard.ts        ★ Phase 1
│       │   └── useTodos.ts            ← 기존
│       └── types/
│           └── index.ts
│
└── backend/                           ← FastAPI (기존)
    ├── requirements.txt
    ├── main.py
    ├── .env
    ├── routers/
    │   ├── todos.py                   ← 기존
    │   ├── categories.py              ← 기존
    │   ├── dashboard.py               ★ Phase 1 (GET /todos/dashboard)
    │   └── notifications.py           ◆ Phase 2 (FR-6~7)
    ├── schemas/
    │   ├── todo.py                    ← 기존
    │   └── dashboard.py               ★ Phase 1 (DashboardResponse Pydantic 모델)
    ├── services/
    │   ├── dashboard.py               ★ Phase 1 (날짜 기준 섹션 분류 로직)
    │   ├── email.py                   ◆ Phase 2 (FR-6)
    │   └── recurring.py               ◆ Phase 3 (FR-11~12)
    ├── database/
    │   └── migrations/
    │       └── add_due_date_index.sql ★ Phase 1 (idx_todos_due_date)
    └── tests/
        ├── test_todos.py              ← 기존
        └── test_dashboard.py          ★ Phase 1
```

### 아키텍처 경계

**API 경계:**
- 프론트엔드 → FastAPI: REST (`/todos/dashboard`, `/todos`, `/categories`)
- FastAPI → Supabase: Supabase Python 클라이언트
- 인증 경계: Supabase Auth 토큰 → FastAPI 미들웨어 검증

**컴포넌트 경계:**
- `app/dashboard/page.tsx` — 데이터 패칭, 섹션 레이아웃
- `components/dashboard/*` — 순수 표시 컴포넌트 (props만 받음)
- `hooks/useDashboard.ts` — TanStack Query 로직 캡슐화
- `lib/api.ts` — FastAPI 호출 단일 진입점

**서비스 경계:**
- `services/dashboard.py` — 날짜 기준 분류 전용 (비즈니스 로직)
- `routers/dashboard.py` — HTTP 요청/응답 처리만
- 라우터에서 직접 DB 쿼리 금지

**데이터 경계:**
- Supabase RLS(Row Level Security): 사용자별 데이터 격리
- `todos.due_date` 인덱스: 대시보드 쿼리 성능 보장

### 요구사항 → 구조 매핑

| FR | 파일/디렉토리 |
|----|--------------|
| FR-1 (대시보드 페이지) | `app/dashboard/page.tsx`, `routers/dashboard.py` |
| FR-2 (기한 초과) | `components/dashboard/OverdueSection.tsx`, `services/dashboard.py` |
| FR-3 (오늘 마감) | `components/dashboard/TodaySection.tsx` |
| FR-4 (내일/이번 주) | `components/dashboard/TomorrowSection.tsx`, `WeekSection.tsx` |
| FR-5 (대시보드 완료) | `hooks/useDashboard.ts` → `invalidateQueries(todos.all)` |
| FR-6~7 (알림) | `services/email.py`, `routers/notifications.py` |
| FR-9~10 (검색/필터) | `components/todos/SearchFilter.tsx` (Phase 2) |
| FR-11~12 (반복) | `services/recurring.py` (Phase 3) |
| FR-14~15 (캘린더) | `app/calendar/page.tsx` (Phase 4) |

### 데이터 흐름

```
사용자 → /dashboard 접속
  → app/dashboard/page.tsx
  → hooks/useDashboard.ts (TanStack Query)
  → lib/api.ts (GET /todos/dashboard)
  → FastAPI routers/dashboard.py
  → services/dashboard.py (날짜 기준 분류)
  → Supabase todos 테이블 (due_date 인덱스)
  → DashboardResponse { overdue, today, tomorrow, this_week }
  → 각 Section 컴포넌트 렌더링
```

### Phase 1 구현 시작점

1. `database/migrations/add_due_date_index.sql` 실행
2. `lib/queryKeys.ts` 생성
3. `schemas/dashboard.py` + `services/dashboard.py` 작성
4. `routers/dashboard.py` 연결
5. `hooks/useDashboard.ts` + `app/dashboard/` 구현
6. 로그인 리다이렉트 수정

## 아키텍처 검증 결과

### 일관성 검증 ✅

**결정 호환성:**
- Next.js App Router + TanStack Query — 공식 지원, 완전 호환
- FastAPI + Supabase Python 클라이언트 — 기존 운영 검증됨
- Railway 배포 + Railway Cron Job — 동일 플랫폼, 추가 인프라 불필요
- `invalidateQueries(todos.all)` 패턴 — FR-5 동기화 요구사항과 정확히 매핑

**패턴 일관성:**
- DB snake_case / API snake_case / TS camelCase — 레이어별 명확히 구분됨
- `queryKeys.ts` 중앙 관리 — TanStack Query 결정과 정합
- `services/` 비즈니스 로직 분리 — FastAPI 라우터 패턴과 정합

**구조 정합:**
- `app/dashboard/` → FR-1~5 전체 커버
- `services/dashboard.py` → 날짜 분류 로직 격리
- `database/migrations/` → Phase 1 NFR(인덱스) 전제 조건 충족

### 요구사항 커버리지 검증

**기능 요구사항 (FR) 커버리지:**

| FR | 커버리지 | 위치 |
|----|---------|------|
| FR-1 대시보드 페이지 | ✅ | `app/dashboard/page.tsx`, `routers/dashboard.py` |
| FR-2 기한 초과 섹션 | ✅ | `OverdueSection.tsx`, `services/dashboard.py` |
| FR-3 오늘 마감 섹션 | ✅ | `TodaySection.tsx` |
| FR-4 내일/이번 주 | ✅ | `TomorrowSection.tsx`, `WeekSection.tsx` |
| FR-5 대시보드 완료 | ✅ | `invalidateQueries` 패턴 |
| FR-6~7 알림 | ✅ | `services/email.py` (Phase 2) |
| FR-8 브라우저 푸시 | ✅ | Phase 2 후반 — 비목표로 명확히 연기 |
| FR-9~10 검색/필터 | ✅ | Phase 2 예정 구조 확보 |
| FR-11~12 반복 할일 | ✅ | `services/recurring.py` (Phase 3) |
| FR-13 템플릿 | ⚠️ | Phase 3 — 구조에 명시적 파일 매핑 없음 |
| FR-14~15 캘린더 | ✅ | `app/calendar/page.tsx` (Phase 4) |
| FR-16~17 통계 | ✅ | `app/stats/page.tsx` (Phase 4) |

**비기능 요구사항 커버리지:**
- 대시보드 < 1초 → `idx_todos_due_date` 인덱스 ✅
- 검색 < 300ms → debounce + FastAPI 쿼리 최적화 ✅
- 반응형 웹 → Next.js 기본 지원 ✅

### 구현 준비도 검증

**결정 완성도:**
- Phase 1 핵심 결정 모두 문서화 ✅
- 스택 버전 미검증 ⚠️ (구현 시 확인 필요)
- App Router / Pages Router 불확실 ⚠️ (구현 시 확인 필요)

**구조 완성도:**
- Phase 1 파일/디렉토리 완전 명시 ✅
- FR-13 템플릿용 파일 위치 미정 ⚠️ (Phase 3 이전에 추가)

**패턴 완성도:**
- 네이밍 / 에러 처리 / 로딩 상태 / 날짜 처리 ✅
- queryKeys 구조 코드 예시 포함 ✅

### 갭 분석 결과

**Critical 갭 (없음):**
Phase 1 구현을 차단하는 결정 누락 없음.

**Important 갭:**
- App Router / Pages Router 미확인 — 구현 시작 전 코드베이스에서 확인 필요
- FR-13 템플릿 파일 위치 미매핑 — Phase 3 설계 전 추가

**Nice-to-Have 갭:**
- 주요 라이브러리 버전 미검증 (Next.js, TanStack Query, FastAPI)
- CI/CD 파이프라인 미정의

### 아키텍처 완성도 체크리스트

**요구사항 분석**
- [x] 프로젝트 컨텍스트 분석 완료
- [x] 규모 및 복잡도 평가 완료
- [x] 기술 제약 식별 완료
- [x] 횡단 관심사 매핑 완료

**아키텍처 결정**
- [x] 핵심 결정 문서화
- [x] 기술 스택 명세
- [x] 통합 패턴 정의
- [x] 성능 고려사항 반영

**구현 패턴**
- [x] 네이밍 컨벤션 수립
- [x] 구조 패턴 정의
- [x] 통신 패턴 명세
- [x] 프로세스 패턴 문서화

**프로젝트 구조**
- [x] 완전한 디렉토리 구조 정의
- [x] 컴포넌트 경계 수립
- [x] 통합 포인트 매핑
- [x] FR → 구조 매핑 완성

### 아키텍처 준비도 평가

**Overall Status: READY WITH MINOR GAPS**

**신뢰도:** 높음 — Phase 1 MVP 구현에 필요한 모든 결정이 완료됨

**핵심 강점:**
- 기존 스택 최대 활용 — 학습 비용 없음
- 날짜/시간 처리 패턴이 명확하게 백엔드에 집중됨
- TanStack Query 캐시 무효화 패턴으로 FR-5 동기화 문제 사전 해결
- Phase별 점진적 구조 확장 경로 명확

**향후 보완 사항:**
- Phase 3 시작 전 FR-13 템플릿 파일 위치 추가
- Phase 2 시작 전 이메일 서비스 선택 결정

### 구현 핸드오프

**AI 에이전트 지침:**
- 모든 아키텍처 결정을 문서 그대로 따를 것
- `queryKeys.ts` 외부에서 쿼리 키 문자열 사용 금지
- 날짜 경계 계산은 반드시 백엔드에서 처리
- 완료 처리 후 `todos.all` 캐시 무효화 필수

**Phase 1 첫 구현 우선순위:**
1. 기존 코드베이스에서 App Router / Pages Router 확인
2. `database/migrations/add_due_date_index.sql` 실행
3. `lib/queryKeys.ts` 생성
4. FastAPI `services/dashboard.py` → `routers/dashboard.py`
5. `hooks/useDashboard.ts` + `app/dashboard/` 구현
6. 로그인 후 `/dashboard` 리다이렉트 추가
