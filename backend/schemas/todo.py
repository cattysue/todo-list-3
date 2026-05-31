from pydantic import BaseModel


class TodoUpdateRequest(BaseModel):
    is_completed: bool


class TodoUpdateResponse(BaseModel):
    id: str
    is_completed: bool
