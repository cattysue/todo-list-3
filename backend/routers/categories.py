from fastapi import APIRouter, Depends

from schemas.category import CategoryItem
from dependencies import get_current_user, get_supabase, require_user_id

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryItem])
def get_categories(
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    response = (
        supabase.table("categories")
        .select("id, name")
        .eq("user_id", user_id)
        .order("name")
        .execute()
    )
    return [CategoryItem(**row) for row in (response.data or [])]
