from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.config import SessionLocal
from app.schemas.Posts import PostCreate, PostResponse, FakeNewsCheckResponse
from app.dependency.auth import require_admin
from app.models.Posts import Post
from app.models.Categories import Category
from app.models.Post_images import PostImage
from app.dependency.standard import preprocess_pipeline, check_label
from typing import Optional
from datetime import datetime
import joblib
import re
import pandas as pd
from underthesea import word_tokenize
import os


PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

model_path = os.path.join(PROJECT_ROOT, "logreg_fake_news_model.pkl")
vectorizer_path = os.path.join(PROJECT_ROOT, "tfidf_vectorizer.pkl")

loaded_model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

router = APIRouter(prefix="/posts", tags=["fake-news-detection"], dependencies=[Depends(require_admin)])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




@router.post('/check-and-publish', response_model=FakeNewsCheckResponse)
def check_and_publish_post(
    post_data: PostCreate,
    db: Session = Depends(get_db)
):
    """Check + Publish - Kiểm tra tin giả và lưu kết quả vào database (share.html)"""
    if not post_data.content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nội dung bài viết không được để trống"
        )
    
    combine_text = f"{post_data.title} {post_data.content}"
    if not combine_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nội dung sau khi xử lý trống, vui lòng nhập nội dung hợp lệ"
        )
    
    preprocessed = preprocess_pipeline(combine_text)
    vector_text = vectorizer.transform([preprocessed])

    prediction = loaded_model.predict(vector_text)[0]
    prediction_proba = loaded_model.predict_proba(vector_text)[0]
    
    classes = loaded_model.classes_
    proba_dict = {}
    for idx, class_lb in enumerate(classes):
        label_name = "Real" if class_lb == 1 else "Fake"
        proba_dict[label_name] = float(prediction_proba[idx])
    
    is_fake = bool(prediction == 0)
    label = "Fake" if is_fake else "Real"

    idx = list(classes).index(prediction)
    dscore = float(prediction_proba[idx])
    cre_label = check_label(is_fake, dscore)

    if post_data.category_id is not None:
        category = db.query(Category).filter(Category.id == post_data.category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category không tồn tại")

    saved_post = Post(
        user_id=post_data.user_id,
        category_id=post_data.category_id,
        title=post_data.title,
        content=post_data.content,
        status=post_data.status if post_data.status else "published",
        credibility_score=dscore,
        credibility_label=cre_label,
        published_at=datetime.now() if (post_data.status == "published" or not post_data.status) else post_data.published_at
    )
    db.add(saved_post)
    db.commit()
    db.refresh(saved_post)

    if getattr(post_data, 'images', None):
        for img_url in post_data.images:
            img = PostImage(post_id=saved_post.id, image_url=img_url)
            db.add(img)
        db.commit()
        db.refresh(saved_post)

    return {
        "is_fake": is_fake,
        "confidence_score": dscore,
        "credibility_label": cre_label,
        "label": label,
        "probabilities": proba_dict,
        "preprocessed_text": preprocessed,
        "post": saved_post
    }
