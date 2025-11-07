from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.core.config import SessionLocal
from app.schemas.Posts import PostSimple
from app.models.Posts import Post
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/posts", tags=["posts-filter"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/published', response_model=List[PostSimple])
def get_published_posts(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get published posts"""
    posts = db.query(Post).filter(
        Post.status == "published"
    ).order_by(Post.published_at.desc()).offset(skip).limit(limit).all()
    
    return posts

@router.get('/draft', response_model=List[PostSimple])
def get_draft_posts(
    db: Session = Depends(get_db),
    user_id: int = Query(..., description="User ID to get draft posts"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get draft posts (mine)"""
    posts = db.query(Post).filter(
        Post.status == "draft",
        Post.user_id == user_id
    ).order_by(Post.updated_at.desc()).offset(skip).limit(limit).all()
    
    return posts



@router.get('/search', response_model=List[PostSimple])
def search_posts(
    db: Session = Depends(get_db),
    q: str = Query(..., description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Search posts by title or content (published only)"""
    search_query = f"%{q}%"
    
    posts = db.query(Post).filter(
        Post.status == "published",
        or_(
            Post.title.ilike(search_query),
            Post.content.ilike(search_query)
        )
    ).order_by(Post.published_at.desc()).offset(skip).limit(limit).all()
    
    return posts

@router.get('/category/{category_id}', response_model=List[PostSimple])
def get_posts_by_category(
    category_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get published posts by category"""
    posts = db.query(Post).filter(
        Post.status == "published",
        Post.category_id == category_id
    ).order_by(Post.published_at.desc()).offset(skip).limit(limit).all()

    return posts

