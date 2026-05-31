from fastapi import APIRouter, Depends, HTTPException, status

from schemas.dashboard import DashboardResponse
from services.dashboard import get_dashboard_todos
from dependencies import get_current_user, get_supabase

router = APIRouter(prefix="/todos", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    # Supabase SDK v1 exposes user.id; v2 may use user.sub — try both.
    user_id = getattr(current_user, "id", None) or getattr(current_user, "sub", None)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return get_dashboard_todos(user_id=user_id, supabase=supabase)
