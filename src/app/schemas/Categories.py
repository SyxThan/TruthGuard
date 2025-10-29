from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255, pattern="^[a-z0-9-]+$")
    parent_id: Optional[int] = None


# Schema để tạo category mới
class CategoryCreate(CategoryBase):
    pass


# Schema để cập nhật category
class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255, pattern="^[a-z0-9-]+$")
    parent_id: Optional[int] = None


# Schema response đơn giản (không có subcategories)
class CategorySimple(CategoryBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# Schema response với subcategories (danh mục con)
class CategoryResponse(CategoryBase):
    id: int
    subcategories: List["CategorySimple"] = []
    
    model_config = ConfigDict(from_attributes=True)


# Cần thiết cho forward reference
CategoryResponse.model_rebuild()