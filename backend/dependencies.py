from __future__ import annotations

import os
from functools import lru_cache
from typing import TYPE_CHECKING, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

if TYPE_CHECKING:
    from supabase import Client

security = HTTPBearer()


@lru_cache(maxsize=1)
def _supabase_singleton() -> Any:
    from supabase import create_client  # lazy import — not needed at test time

    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def get_supabase() -> Any:
    return _supabase_singleton()


def require_user_id(current_user) -> str:
    user_id = getattr(current_user, "id", None) or getattr(current_user, "sub", None)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user_id


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase),
):
    try:
        result = supabase.auth.get_user(credentials.credentials)
        if result.user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        return result.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
