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


@router.get('/my-posts', response_model=List[PostSimple])
def get_my_posts(
    db: Session = Depends(get_db),
    user_id: int = Query(..., description="Current user ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: object = Depends(get_current_user)
):
    """Get my posts"""
    
    if hasattr(current_user, "id") and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    posts = db.query(Post).filter(
        Post.user_id == user_id
    ).order_by(Post.updated_at.desc()).offset(skip).limit(limit).all()
    return posts


@router.get('/check-history', response_model=List[PostSimple])
def get_check_history(
    db: Session = Depends(get_db),
    user_id: int = Query(..., description="Current user ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: object = Depends(get_current_user)
):
    """Get check history - Posts that have been analyzed for fake news"""
    
    if hasattr(current_user, "id") and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    posts = db.query(Post).filter(
        Post.user_id == user_id,
        Post.credibility_label.isnot(None)
    ).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts
