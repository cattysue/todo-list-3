from typing import Literal

from pydantic import BaseModel


class PeriodData(BaseModel):
    label: str
    completed_count: int
    total_count: int
    completion_rate: float


class CompletionStatsResponse(BaseModel):
    period: Literal["weekly", "monthly"]
    data: list[PeriodData]


class CategoryStatData(BaseModel):
    category_id: str
    category_name: str
    total_count: int
    completed_count: int
    completion_rate: float


class CategoryStatsResponse(BaseModel):
    data: list[CategoryStatData]
