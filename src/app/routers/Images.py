from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from sqlalchemy.orm import Session
from app.core.config import SessionLocal
from app.schemas.Posts import PostResponse
from app.models.Posts import Post
from app.models.Post_images import PostImage
from typing import List
from pydantic import BaseModel
import os
import shutil
from datetime import datetime

router = APIRouter(tags=["images"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


UPLOAD_DIR = "uploads/images"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ImagesPayload(BaseModel):
    images: List[str]


class ImageResponse(BaseModel):
    image_url: str
    message: str


@router.post('/posts/{post_id}/images', response_model=PostResponse)
def add_images_to_post(
    post_id: int,
    payload: ImagesPayload = Body(...),
    db: Session = Depends(get_db)
):
    """Add images to post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bài viết không tồn tại")

    for img_url in payload.images:
        img = PostImage(post_id=post.id, image_url=img_url)
        db.add(img)
    db.commit()
    db.refresh(post)

    return post


@router.delete('/posts/{post_id}/images/{image_id}')
def delete_image_from_post(
    post_id: int,
    image_id: int,
    db: Session = Depends(get_db)
):
    """Delete image from post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bài viết không tồn tại")
    
    image = db.query(PostImage).filter(
        PostImage.id == image_id,
        PostImage.post_id == post_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hình ảnh không tồn tại")
    
    db.delete(image)
    db.commit()
    
    return {"message": "Hình ảnh đã được xóa thành công"}


@router.post('/images/upload', response_model=ImageResponse)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload image independently"""
    
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload file: {str(e)}"
        )
    
    image_url = f"/{UPLOAD_DIR}/{filename}"
    
    return {
        "image_url": image_url,
        "message": "File uploaded successfully"
    }
