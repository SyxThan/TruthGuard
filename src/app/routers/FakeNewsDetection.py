from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import SessionLocal
from app.schemas.Posts import PostCreate, PostResponse, FakeNewsCheckResponse
from app.dependency.auth import get_current_user
from app.models.Posts import Post
from app.models.Categories import Category
from app.models.Post_images import PostImage
from app.models.User import User
from app.dependency.standard import preprocess_pipeline, check_label
from typing import Optional
from datetime import datetime
import os
import joblib


PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

model_path = os.path.join(PROJECT_ROOT, "logreg_fake_news_model.pkl")
vectorizer_path = os.path.join(PROJECT_ROOT, "tfidf_vectorizer.pkl")

loaded_model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

router = APIRouter(prefix="/posts", tags=["fake-news-detection"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post('/user-share', response_model=FakeNewsCheckResponse)
def user_share_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    """
    Endpoint cho user share bài viết.
    - Tự động lấy user_id từ token
    - Nhận image URLs (đã upload trước qua /images/upload-multiple)
    - Nếu confidence_score >= 75%: status = "published"
    - Nếu < 75%: status = "draft"
    
    Workflow:
    1. Frontend: Upload ảnh qua /images/upload-multiple → Nhận URLs
    2. Frontend: Gọi /user-share với URLs đó
    """
    if not post_data.content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nội dung bài viết không được để trống"
        )
    
    combine_text = f"{post_data.title} {post_data.content}"
    if not combine_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nội dung sau khi xử lý trống"
        )
    
    # AI Analysis
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
    
    # Validate category
    if post_data.category_id:
        category = db.query(Category).filter(Category.id == post_data.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category không tồn tại")
    
    
    final_status = "published" if label == "Real" else "draft"
    
    try:
    # Lưu post
        saved_post = Post(
            user_id=current_user.id,  # Lấy từ token
            category_id=post_data.category_id,
            title=post_data.title,
            content=post_data.content,
            status=final_status,
            credibility_score=dscore,
            credibility_label=cre_label,
            published_at=datetime.now() if final_status == "published" else None
        )
        db.add(saved_post)
        db.flush()  # ← Dùng flush để lấy ID nhưng chưa commit
        
        # Lưu images
        if getattr(post_data, 'images', None):
            for img_url in post_data.images:
                img = PostImage(post_id=saved_post.id, image_url=img_url)
                db.add(img)
        
        db.commit()  # ← Commit 1 lần duy nhất
        db.refresh(saved_post)
    
    except Exception as e:
        db.rollback()
        raise HTTPException(500, detail=str(e))
    
    return {
        "is_fake": is_fake,
        "confidence_score": dscore,
        "credibility_label": cre_label,
        "label": label,
        "probabilities": proba_dict,
        "preprocessed_text": preprocessed,
        "post": saved_post
    }