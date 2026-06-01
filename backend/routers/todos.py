from datetime import date
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from schemas.dashboard import TodoDashboardItem
from schemas.todo import TodoUpdateRequest, TodoUpdateResponse
from services.search import search_todos as search_todos_service
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


@router.patch("/{todo_id}", response_model=TodoUpdateResponse)
async def update_todo(
    todo_id: UUID,
    body: TodoUpdateRequest,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)

    result = (
        supabase.table("todos")
        .update({"is_completed": body.is_completed})
        .eq("id", str(todo_id))
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="할일을 찾을 수 없습니다.",
        )

    row = result.data[0]
    return TodoUpdateResponse(id=row["id"], is_completed=row["is_completed"])
