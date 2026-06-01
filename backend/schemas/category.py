from pydantic import BaseModel


class CategoryItem(BaseModel):
    id: str
    name: str

    model_config = {"from_attributes": True}
