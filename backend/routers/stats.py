from typing import Literal

from fastapi import APIRouter, Depends, Query

from schemas.stats import CompletionStatsResponse
from services.stats import get_completion_stats
from dependencies import get_current_user, get_supabase, require_user_id

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/completion", response_model=CompletionStatsResponse)
def get_completion_stats_endpoint(
    period: Literal["weekly", "monthly"] = "weekly",
    count: int = Query(default=8, ge=1, le=52),
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    return get_completion_stats(
        user_id=user_id,
        supabase=supabase,
        period=period,
        count=count,
    )
