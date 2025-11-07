from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.config import SessionLocal
from app.dependency.auth import get_current_user
from app.schemas.Posts import PostSimple
from app.models.Posts import Post
from typing import List

router = APIRouter(prefix="/posts", tags=["user-posts"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get('/user/my-posts', response_model=List[PostSimple])
def get_my_posts(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=1000),
    current_user: object = Depends(get_current_user)
):
    """Get my posts"""
    
    posts = db.query(Post).filter(
        Post.user_id == current_user.id
    ).order_by(Post.updated_at.desc()).offset(skip).limit(limit).all()
    return posts


@router.delete('/user/delete/{post_id}')
def delete_my_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user)
):
    """Delete my own post - only owner can delete"""
    
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết không tồn tại"
        )
    
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xóa bài viết này"
        )
    
    db.delete(post)
    db.commit()
    
    return {"message": "Bài viết đã được xóa thành công"}
