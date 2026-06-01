from datetime import date
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from schemas.dashboard import TodoDashboardItem
from schemas.todo import (
    TodoUpdateRequest,
    TodoUpdateResponse,
    TodoCreateRequest,
    TodoContentUpdateRequest,
    TodoCreateResponse,
    RecurrenceControlRequest,
    RecurrenceControlResponse,
)
from services.search import search_todos as search_todos_service
from services.todos import create_todo, get_todo, update_todo_content, complete_todo, control_recurrence
from dependencies import get_current_user, get_supabase, require_user_id

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("/search", response_model=list[TodoDashboardItem])
def search_todos(
    q: Optional[str] = None,
    priority: Optional[Literal["high", "medium", "low"]] = None,
    due_date_from: Optional[date] = None,
    due_date_to: Optional[date] = None,
    is_completed: Optional[bool] = None,
    category_id: Optional[str] = None,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    return search_todos_service(
        user_id=user_id,
        supabase=supabase,
        q=q,
        priority=priority,
        due_date_from=due_date_from.isoformat() if due_date_from else None,
        due_date_to=due_date_to.isoformat() if due_date_to else None,
        is_completed=is_completed,
        category_id=category_id,
    )


@router.get("/{todo_id}", response_model=TodoCreateResponse)
def get_todo_endpoint(
    todo_id: UUID,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    row = get_todo(todo_id=str(todo_id), user_id=user_id, supabase=supabase)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="할일을 찾을 수 없습니다.",
        )
    return row


@router.post("", response_model=TodoCreateResponse, status_code=status.HTTP_201_CREATED)
def create_todo_endpoint(
    body: TodoCreateRequest,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    row = create_todo(
        user_id=user_id,
        supabase=supabase,
        title=body.title,
        category_id=body.category_id,
        priority=body.priority,
        due_date=body.due_date,
        recurrence_type=body.recurrence_type,
        recurrence_days=body.recurrence_days,
        recurrence_day_of_month=body.recurrence_day_of_month,
    )
    return row


@router.put("/{todo_id}", response_model=TodoCreateResponse)
def update_todo_content_endpoint(
    todo_id: UUID,
    body: TodoContentUpdateRequest,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    if not body.model_fields_set:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="업데이트할 필드가 없습니다.",
        )
    updates = {field: getattr(body, field) for field in body.model_fields_set}
    row = update_todo_content(
        todo_id=str(todo_id),
        user_id=user_id,
        supabase=supabase,
        updates=updates,
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="할일을 찾을 수 없습니다.",
        )
    return row


@router.patch("/{todo_id}", response_model=TodoUpdateResponse)
async def update_todo(
    todo_id: UUID,
    body: TodoUpdateRequest,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    _ = body  # FastAPI가 is_completed: Literal[True] 검증에 사용; complete_todo는 True를 고정 적용
    row = complete_todo(todo_id=str(todo_id), user_id=user_id, supabase=supabase)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="할일을 찾을 수 없습니다.",
        )
    return TodoUpdateResponse(id=row["id"], is_completed=row["is_completed"])


@router.post("/{todo_id}/recurrence", response_model=RecurrenceControlResponse)
def control_todo_recurrence(
    todo_id: UUID,
    body: RecurrenceControlRequest,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    result = control_recurrence(
        todo_id=str(todo_id),
        user_id=user_id,
        action=body.action,
        supabase=supabase,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="반복 할일을 찾을 수 없습니다.",
        )
    return RecurrenceControlResponse(todo_id=str(todo_id), action=body.action)
