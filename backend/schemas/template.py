from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel


class TemplateItemRequest(BaseModel):
    title: str
    category_id: Optional[str] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    due_date_offset: Optional[int] = None


class TemplateCreateRequest(BaseModel):
    name: str
    items: list[TemplateItemRequest]


class TemplateItemResponse(BaseModel):
    id: str
    title: str
    category_id: Optional[str] = None
    priority: Optional[str] = None
    due_date_offset: Optional[int] = None
    sort_order: int = 0


class TemplateResponse(BaseModel):
    id: str
    name: str
    created_at: str
    items: list[TemplateItemResponse]


class TemplateApplyRequest(BaseModel):
    base_date: Optional[date] = None
