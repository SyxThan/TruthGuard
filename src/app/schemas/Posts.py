from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Literal, Dict


class PostImageSchema(BaseModel):
    
    id: Optional[int] = None
    post_id: Optional[int] = None
    image_url: str 
    alt_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PostBase(BaseModel):
    

    title: str 
    content: str 
    category_id: Optional[int] = None
   
    status: Literal["draft", "published", "archived"] = Field("draft", description="Trạng thái bài viết")
  
    published_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PostCreate(PostBase):
    url: Optional[str] = None
    images: Optional[List[str]] = []

class PostCreateCheck(BaseModel):
    title: str 
    content: str 
    



class PostUpdate(BaseModel):
    
    title: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[Literal["draft", "published", "archived"]] = None
    published_at: Optional[datetime] = None
    images: Optional[List[str]] = None  

    model_config = ConfigDict(from_attributes=True)


class PostResponse(PostBase):
    
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    images: List[PostImageSchema] = []
    credibility_score: Optional[float] = None
    credibility_label: Optional[str] = None
  

    model_config = ConfigDict(from_attributes=True)


class PostSimple(BaseModel):
    """Simple post representation for listing"""
    
    id: int
    user_id: int
    title: str
    content: str
    category_id: Optional[int] = None
    status: str = "draft"
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    credibility_score: Optional[float] = None
    credibility_label: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class FakeNewsCheckResponse(BaseModel):
    
    is_fake: bool
    confidence_score: float
    credibility_label: str
    label: str
    probabilities: Dict[str, float]
    preprocessed_text: Optional[str] = None
    post: Optional[PostResponse] = None

    model_config = ConfigDict(from_attributes=True)
