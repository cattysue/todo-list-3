from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from schemas.todo import TodoUpdateRequest, TodoUpdateResponse
from dependencies import get_current_user, get_supabase

router = APIRouter(prefix="/todos", tags=["todos"])


@router.patch("/{todo_id}", response_model=TodoUpdateResponse)
async def update_todo(
    todo_id: UUID,
    body: TodoUpdateRequest,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = getattr(current_user, "id", None) or getattr(current_user, "sub", None)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

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
