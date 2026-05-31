from typing import Literal

from pydantic import BaseModel


class TodoUpdateRequest(BaseModel):
    is_completed: Literal[True]


class TodoUpdateResponse(BaseModel):
    id: str
    is_completed: bool
