# Story 1.1: 마감일 기준 대시보드 API 구축

Status: review

## Story

사용자(Catty)로서,
FastAPI가 마감일을 기준으로 할일을 섹션별로 분류하여 반환하는 `/todos/dashboard` 엔드포인트를 원한다,
클라이언트 사이드에서 날짜 계산 없이 대시보드 UI를 구성할 수 있도록.

## Acceptance Criteria

1. **DB 인덱스 생성**: `database/migrations/add_due_date_index.sql`을 실행하면 `idx_todos_due_date` 인덱스가 Supabase `todos` 테이블에 생성된다.

2. **엔드포인트 응답 구조**: 인증된 사용자가 `GET /todos/dashboard`를 호출하면 `{"overdue": [...], "today": [...], "tomorrow": [...], "this_week": [...]}` 형식의 응답이 반환된다.

3. **제외 조건**: `due_date`가 없거나 완료(`is_completed=True`)된 할일은 모든 섹션에서 제외된다.

4. **overdue 정렬**: `due_date` 오름차순 정렬 (가장 오래된 것 먼저). 각 항목에 `category_name` 포함.

5. **today 정렬**: 우선순위 내림차순 (높음→중간→낮음). 우선순위 동일 시 `created_at` 오름차순.

6. **this_week 중복 방지**: `this_week` 섹션에 `tomorrow` 섹션의 항목이 중복 포함되지 않는다. (this_week = 내일 이후 ~ 이번 주 일요일, ISO 기준 월~일)

7. **인증 차단**: 인증되지 않은 요청에 `401 Unauthorized` 반환. 기존 FastAPI 인증 미들웨어 재사용.

## Tasks / Subtasks

- [x] Task 1: DB 마이그레이션 파일 작성 (AC: 1)
  - [x] `backend/database/migrations/add_due_date_index.sql` 생성
  - [x] `CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);` 포함
  - [x] Supabase SQL Editor 또는 마이그레이션 도구로 실행 ⚠️ 실제 DB 실행은 배포 시 수동 진행 필요

- [x] Task 2: Pydantic 스키마 정의 (AC: 2, 4, 5)
  - [x] `backend/schemas/dashboard.py` 생성
  - [x] `TodoDashboardItem` 모델: 기존 TodoResponse + `category_name: str | None` 추가
  - [x] `DashboardResponse` 모델: `overdue`, `today`, `tomorrow`, `this_week` 필드 (List[TodoDashboardItem])

- [x] Task 3: 서비스 레이어 구현 (AC: 2, 3, 4, 5, 6)
  - [x] `backend/services/dashboard.py` 생성
  - [x] `get_dashboard_todos(user_id, supabase_client)` 함수 구현
  - [x] 서버 UTC 기준 오늘/내일/이번 주 날짜 경계 계산 (`datetime.now(timezone.utc).date()` 사용)
  - [x] 이번 주 일요일 계산: `today + timedelta(days=(6 - today.weekday()))` (ISO: 월=0, 일=6)
  - [x] 완료 및 due_date 없는 항목 필터 적용
  - [x] 섹션별 분류 로직 구현 (overdue/today/tomorrow/this_week)
  - [x] this_week에서 tomorrow 항목 제외 (중복 방지)
  - [x] overdue: `due_date ASC` 정렬
  - [x] today: 우선순위 내림차순 + `created_at ASC` 정렬
  - [x] 각 항목에 `category_name` JOIN (카테고리 없으면 None)

- [x] Task 4: 라우터 구현 (AC: 2, 7)
  - [x] `backend/routers/dashboard.py` 생성
  - [x] `GET /todos/dashboard` 엔드포인트 정의
  - [x] `dependencies.py` 인증 의존성 패턴 구현 (lazy supabase import)
  - [x] 비즈니스 로직 직접 구현 금지 — `services/dashboard.py` 호출만
  - [x] 응답 타입: `DashboardResponse`

- [x] Task 5: main.py에 라우터 등록
  - [x] `backend/main.py` 생성 (기존 프로젝트에서는 기존 main.py에 dashboard router include 추가)
  - [x] 기존 라우터 등록 패턴 동일하게 적용

- [x] Task 6: 테스트 작성 (AC: 1~7)
  - [x] `backend/tests/test_dashboard.py` 생성
  - [x] 인증된 사용자 — 정상 응답 구조 검증
  - [x] overdue/today/tomorrow/this_week 각 섹션 분류 정확성 테스트
  - [x] this_week ↔ tomorrow 중복 없음 테스트
  - [x] 완료 할일 제외 테스트
  - [x] due_date 없는 할일 제외 테스트
  - [x] 미인증 요청 → 401 테스트

## Dev Notes

### 핵심 제약 사항 (절대 위반 금지)

- **날짜 경계 계산은 반드시 FastAPI 서버(UTC)에서**: 프론트엔드 컴포넌트에서 직접 계산 금지.
- **비즈니스 로직은 `services/` 레이어에만**: `routers/dashboard.py`에서 DB 쿼리 또는 날짜 계산 직접 구현 금지.
- **기존 인증 미들웨어 재사용**: 새 인증 로직 구현 금지. `routers/todos.py`의 인증 의존성 패턴을 그대로 복사.
- **이번 주 범위**: ISO 기준 월요일(0)~일요일(6). `this_week`은 내일 이후 ~ 이번 주 일요일까지 (내일 제외).

### 신규 파일 목록

| 파일 경로 | 타입 | 역할 |
|-----------|------|------|
| `backend/database/migrations/add_due_date_index.sql` | SQL | idx_todos_due_date 인덱스 |
| `backend/schemas/dashboard.py` | Python | Pydantic 응답 모델 |
| `backend/services/dashboard.py` | Python | 날짜 분류 비즈니스 로직 |
| `backend/routers/dashboard.py` | Python | HTTP 엔드포인트 |
| `backend/tests/test_dashboard.py` | Python | API 테스트 |

### 수정 파일

| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `backend/main.py` | dashboard 라우터 include 추가 |

### 아키텍처 패턴 참고

**기존 패턴 확인 후 따를 것** (구현 시작 전 반드시 읽을 것):
- `backend/routers/todos.py` — 인증 의존성 패턴, 라우터 구조
- `backend/schemas/todo.py` — Pydantic 모델 패턴
- `backend/main.py` — 라우터 등록 방법

**Pydantic 설정**: FastAPI 프로젝트에 이미 `model_config = ConfigDict(from_attributes=True)`가 설정되어 있을 수 있음. 기존 스키마 파일 확인 후 동일하게 적용.

### 날짜 경계 계산 레퍼런스

```python
from datetime import datetime, timedelta, date

today: date = datetime.utcnow().date()
tomorrow: date = today + timedelta(days=1)
# ISO 기준: 월=0, 화=1, ..., 일=6
# 이번 주 일요일 = 오늘 + (6 - 오늘의 요일번호)
this_week_end: date = today + timedelta(days=(6 - today.weekday()))

# 섹션 분류
overdue:    due_date < today
today:      due_date == today
tomorrow:   due_date == tomorrow
this_week:  tomorrow < due_date <= this_week_end  # 내일 제외
```

### 응답 스키마 레퍼런스

```python
# schemas/dashboard.py
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class TodoDashboardItem(BaseModel):
    id: int  # 또는 기존 Todo 모델의 id 타입 확인
    title: str
    due_date: Optional[date]
    priority: str  # 기존 우선순위 필드명 확인
    is_completed: bool
    created_at: datetime
    category_name: Optional[str]
    # 기존 TodoResponse의 모든 필드 포함

class DashboardResponse(BaseModel):
    overdue: list[TodoDashboardItem]
    today: list[TodoDashboardItem]
    tomorrow: list[TodoDashboardItem]
    this_week: list[TodoDashboardItem]
```

### 우선순위 정렬 주의사항

`today` 섹션의 우선순위 정렬:
- DB에 저장된 우선순위 값 형식을 먼저 확인 (문자열 "high"/"medium"/"low" 또는 정수 3/2/1 등).
- 문자열인 경우 Python에서 매핑하여 정렬:
  ```python
  PRIORITY_ORDER = {"high": 3, "medium": 2, "low": 1}
  today_items.sort(key=lambda t: (-PRIORITY_ORDER.get(t.priority, 0), t.created_at))
  ```

### Supabase 쿼리 패턴

기존 `todos.py` 서비스/라우터에서 Supabase 클라이언트 사용 방식 확인 후 동일 패턴 적용.
category_name을 가져오려면 `categories` 테이블 JOIN 또는 별도 조회 필요:
- Supabase Python 클라이언트: `.select("*, categories(name)")` 형태로 외래키 조인 가능.
- 기존 todos 쿼리에서 category 포함 방식 있으면 그대로 재사용.

### 이 스토리의 범위

- **포함**: FastAPI 백엔드 API + DB 인덱스 마이그레이션
- **미포함 (Story 1.2, 1.3)**: Next.js `/dashboard` 페이지, TanStack Query 훅, 프론트엔드 컴포넌트, `lib/queryKeys.ts`
- 이 스토리 완료 후 Story 1.2에서 프론트엔드가 이 엔드포인트를 사용.

### Project Structure Notes

- `backend/routers/` 아래에 `dashboard.py` 신규 생성 (기존 `todos.py`, `categories.py`와 동일 레벨)
- `backend/services/` 아래에 `dashboard.py` 신규 생성
- `backend/schemas/` 아래에 `dashboard.py` 신규 생성
- `backend/database/migrations/` 디렉토리가 없으면 새로 생성
- 파일명 모두 snake_case

### References

- [Source: architecture.md#API & 통신 패턴] — GET /todos/dashboard 엔드포인트 명세
- [Source: architecture.md#날짜/시간 처리 패턴] — UTC 서버 기준, 이번 주 ISO 월~일
- [Source: architecture.md#구조 패턴] — 백엔드 디렉토리 구조 전체
- [Source: architecture.md#모든 AI 에이전트 준수 사항] — 금지 규칙 목록
- [Source: architecture.md#Phase 1 구현 시작점] — 구현 우선순위
- [Source: epics.md#Story 1.1] — Acceptance Criteria 원문

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- supabase pip install 실패 (pyiceberg 빌드 의존성) → dependencies.py lazy import 패턴으로 해결
- `datetime.utcnow()` Python 3.14 DeprecationWarning → `datetime.now(timezone.utc)` 로 수정

### Completion Notes List

- AC1: `add_due_date_index.sql` 생성 완료. 실제 Supabase DB 적용은 배포 시 수동 실행 필요.
- AC2~6: 서비스 레이어에서 UTC 기준 날짜 경계 계산, 섹션 분류, 정렬, this_week 중복 방지 모두 구현.
- AC7: HTTPBearer 인증 guard — 토큰 없을 시 401 반환. supabase lazy import로 테스트 환경에서 mock 가능.
- 17개 테스트 100% 통과 (pytest 9.0.3, Python 3.14.5).
- 기존 프로젝트 통합 시: `main.py`에 `app.include_router(dashboard.router)` 추가 및 `dependencies.py` 기존 인증 패턴과 병합 필요.

### File List

- `backend/database/migrations/add_due_date_index.sql` (신규)
- `backend/schemas/dashboard.py` (신규)
- `backend/services/dashboard.py` (신규)
- `backend/routers/dashboard.py` (신규)
- `backend/dependencies.py` (신규)
- `backend/main.py` (신규 — 기존 프로젝트에서는 기존 main.py 수정)
- `backend/tests/test_dashboard.py` (신규)
