from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from app.core.config import SessionLocal
from app.dependency.auth import require_admin
from app.schemas.Posts import PostCreate, PostUpdate, PostResponse, PostSimple
from app.models.Posts import Post
from app.models.Categories import Category
from app.models.Post_images import PostImage
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/posts", tags=["posts-crud"], dependencies=[Depends(require_admin)])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get('/', response_model=List[PostSimple])
def get_all_posts(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    category_id: Optional[int] = None
):
    """List posts with filter and pagination"""
    query = db.query(Post)
    
    if status:
        query = query.filter(Post.status == status)
    
    if user_id:
        query = query.filter(Post.user_id == user_id)
    
    if category_id:
        query = query.filter(Post.category_id == category_id)
    
    posts = query.order_by(Post.updated_at.desc()).offset(skip).limit(limit).all()
    
    return posts


@router.post('/', response_model=PostResponse)
def create_post(post_data: PostCreate, db: Session = Depends(get_db)):
    """Manually create post (admin)"""
    
    if post_data.category_id is not None:
        category = db.query(Category).filter(Category.id == post_data.category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category không tồn tại")

    new_post = Post(
        user_id=post_data.user_id,
        category_id=post_data.category_id,
        title=post_data.title,
        content=post_data.content,
        status=post_data.status,
        published_at=post_data.published_at
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    if getattr(post_data, 'images', None):
        for img_url in post_data.images:
            img = PostImage(post_id=new_post.id, image_url=img_url)
            db.add(img)
        db.commit()
        db.refresh(new_post)

    return new_post


@router.get('/{post_id}', response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Get post details by ID"""
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bài viết không tồn tại")

    return post


@router.put('/{post_id}', response_model=PostResponse)
def update_post_full(
    post_id: int,
    post_data: PostUpdate,
    db: Session = Depends(get_db)
):
    """Update all post fields"""
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết không tồn tại"
        )
    
    if post_data.title is not None:
        post.title = post_data.title
    
    if post_data.content is not None:
        post.content = post_data.content
    
    if post_data.category_id is not None:
        category = db.query(Category).filter(Category.id == post_data.category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category không tồn tại")
        post.category_id = post_data.category_id
    
    if post_data.status is not None:
        if post_data.status == "published" and post.published_at is None:
            post.published_at = datetime.now()
        post.status = post_data.status
    
    db.commit()
    db.refresh(post)
    
    return post




@router.delete('/{post_id}')
def delete_post(post_id: int, db: Session = Depends(get_db)):
    """Delete post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết không tồn tại"
        )
    
    db.delete(post)
    db.commit()
    
    return {"message": "Bài viết đã được xóa thành công"}


class StatusUpdate(BaseModel):
    status: str


@router.patch('/{post_id}/status', response_model=PostResponse)
def change_post_status(
    post_id: int,
    status_data: StatusUpdate,
    db: Session = Depends(get_db)
):
    """Change post status"""
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết không tồn tại"
        )
    
    if status_data.status == "published" and post.published_at is None:
        post.published_at = datetime.now()
    
    post.status = status_data.status
    
    db.commit()
    db.refresh(post)
    
    return post
