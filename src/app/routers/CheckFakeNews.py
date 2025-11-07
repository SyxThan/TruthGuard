from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.config import SessionLocal
from app.schemas.Posts import PostCreateCheck, PostResponse, FakeNewsCheckResponse
from app.models.Posts import Post
from app.models.Categories import Category
from app.models.Post_images import PostImage
from typing import Optional
from datetime import datetime
from app.dependency.standard import preprocess_pipeline, check_label
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

router = APIRouter(prefix="/posts", tags=["check-fake-news"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




@router.post('/analyze', response_model=FakeNewsCheckResponse)
def analyze_post(
    post_data: PostCreateCheck,
    db: Session = Depends(get_db)
):
    """Check only - Kiểm tra tin giả mà không lưu vào database (submit.html)"""
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

    return {
        "is_fake": is_fake,
        "confidence_score": dscore,
        "credibility_label": cre_label,
        "label": label,
        "probabilities": proba_dict,
        "preprocessed_text": preprocessed,
        "post": None
    }


