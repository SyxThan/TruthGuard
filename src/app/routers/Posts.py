from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from app.core.config import SessionLocal
from app.schemas.Posts import PostCreate, PostUpdate, PostResponse, PostSimple, FakeNewsCheckResponse
from app.models.Posts import Post
from app.models.Categories import Category
from app.models.Post_images import PostImage
from typing import List, Optional
from datetime import datetime
import joblib
import re
import pandas as pd
from underthesea import word_tokenize
import os
from pydantic import BaseModel

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

model_path = os.path.join(PROJECT_ROOT, "logreg_fake_news_model.pkl")
vectorizer_path = os.path.join(PROJECT_ROOT, "tfidf_vectorizer.pkl")

loaded_model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)


router = APIRouter(prefix="/posts", tags=["posts"])



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ===================================================================
#  HÀM TIỀN XỬ LÝ 
# ===================================================================

def remove_emoji(text):
    """Loại bỏ emoji"""
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        u"\U0001f926-\U0001f937"
        u"\U00010000-\U0010ffff"
        u"\u2640-\u2642"
        u"\u2600-\u2B55"
        u"\u200d"
        u"\u23cf"
        u"\u23e9"
        u"\u231a"
        u"\ufe0f"  # dingbats
        u"\u3030"
        "]+", flags=re.UNICODE)
    return emoji_pattern.sub(r'', text)

def clean_text(text):
    """Làm sạch văn bản tiếng Việt"""
    if pd.isna(text):
        return ""
    text = str(text).lower()
    text = remove_emoji(text)
    text = re.sub(r'http\S+|www\S+|https\S+|<url>', '', text, flags=re.MULTILINE) # URL
    text = re.sub(r'\S+@\S+', '', text) # Email
    text = re.sub(r'\b\d{10,11}\b', '', text) # Số điện thoại
    text = re.sub(r'<.*?>', '', text) # HTML
    text = text.replace('_', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s.,!?_-]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def vietnamese_tokenize(text):
    """Tách từ tiếng Việt"""
    if not text:
        return ""
    try:
        tokenized_text = word_tokenize(text, format="text")
        return tokenized_text
    except:
        return text

VIETNAMESE_STOPWORDS= set([
    'bị', 'bởi', 'cả', 'các', 'cái', 'cần', 'càng', 'chỉ', 'chiếc',
    'cho', 'chứ', 'chưa', 'chuyện', 'có', 'có_thể', 'cứ', 'của',
    'cùng', 'cũng', 'đã', 'đang', 'đây', 'để', 'đến_nỗi', 'đều',
    'điều', 'do', 'đó', 'được', 'dưới', 'gì', 'khi', 'không',
    'là', 'lại', 'lên', 'lúc', 'mà', 'mỗi', 'một_cách', 'này',
    'nên', 'nếu', 'ngay', 'nhiều', 'như', 'nhưng', 'những', 'nơi',
    'nữa', 'phải', 'qua', 'ra', 'rằng', 'rất', 'rồi', 'sau',
    'sẽ', 'so', 'sự', 'tại', 'theo', 'thì', 'trên', 'trước',
    'từ', 'từng', 'và', 'vẫn', 'vào', 'vậy', 'vì', 'việc',
    'với', 'vừa', 'ai', 'anh', 'bao_giờ', 'bao_lâu', 'bao_nhiêu', 'bên', 'bộ',
    'chị', 'chúng_ta', 'chúng_tôi', 'cuộc', 'em', 'hết', 'họ',
    'hoặc', 'khác', 'kể', 'khiến', 'làm', 'loại', 'lòng', 'mình',
    'muốn', 'người', 'nhà', 'nhất', 'nhỏ', 'những', 'năm', 'nào',
    'này', 'nào', 'nếu', 'ông', 'qua', 'quá', 'quyển', 'sau_đó',
    'thằng', 'thì', 'thứ', 'tin', 'tôi', 'tới', 'vài', 'vẫn',
    'về', 'việc', 'vòng', 'xa', 'xuống', 'ý', 'đã', 'đem', 'đến',
    'định', 'đó', 'đời', 'đồng_thời', 'để', 'đều', 'đi', 'điều',
    'đơn_vị', 'được', 'gần', 'họ', 'giờ', 'hay', 'hơn', 'ít',
    'liên_quan', 'lúc', 'lên', 'mấy', 'ngoài', 'nhiều', 'nhằm',
    'như_vậy', 'phía', 'trong', 'tuy', 'từng', 'tới', 'về',
    'với', 'xem'
])

def remove_stopwords(text, stopwords=VIETNAMESE_STOPWORDS):
    """Loại bỏ stopwords"""
    if not text: return ""
    words = text.split()
    filtered_words = [word for word in words if word not in stopwords]
    return ' '.join(filtered_words)

def normalize_repeated_chars(text):
    return re.sub(r'(.)\1{2,}', r'\1', text)

def remove_extra_punctuation(text):
    text = re.sub(r'[.]{2,}', '.', text)
    text = re.sub(r'[!]{2,}', '!', text)
    text = re.sub(r'[?]{2,}', '?', text)
    return text

def normalize_numbers(text):
    return text

def preprocess_pipeline(text, remove_stop=True):
    text = clean_text(text)
    text = normalize_repeated_chars(text)
    text = remove_extra_punctuation(text)
    text = vietnamese_tokenize(text)
    if remove_stop:
        text = remove_stopwords(text)
    text = normalize_numbers(text)
    return text

# ===================================================================
# KẾT THÚC TIỀN XỬ LÝ
# ===================================================================


# ===================================================================
# Hàm Thresold
# ===================================================================

def check_label(is_fake: bool, confidence_score: float) -> str:
    """
    Xác định mức độ tin cậy: Thật, Chưa Rõ, Giả
    
    Logic:
    - Nếu confidence >= 70%:
        + Fake → "Giả"
        + Real → "Thật"
    - Nếu confidence < 70%: "Chưa Rõ"
    """
    if confidence_score >= 0.7:
        return "Giả" if is_fake else "Thật"
    else:
        return "Chưa Rõ"


@router.post('/', response_model=PostResponse)
def create_post(post_data: PostCreate, db: Session = Depends(get_db)):
    
    # Nếu có category_id, kiểm tra tồn tại
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

    # Nếu có images gửi kèm (danh sách URL), tạo các bản ghi PostImage
    if getattr(post_data, 'images', None):
        for img_url in post_data.images:
            img = PostImage(post_id=new_post.id, image_url=img_url)
            db.add(img)
        db.commit()
        # refresh relationships by reloading post
        db.refresh(new_post)

    return new_post




# ============= PREDICT =================
@router.post('/predict', response_model=FakeNewsCheckResponse)
def predict_post(
    post_data: PostCreate,
    db: Session = Depends(get_db),
    save: bool = Query(False, description="Nếu true sẽ lưu kết quả prediction thành một Post trong DB")
):
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
    # Tiền xử lý trước khi vectorize
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

    saved_post = None
    # Nếu người gọi muốn lưu kết quả prediction thành 1 post
    if save:
        if post_data.category_id is not None:
            category = db.query(Category).filter(Category.id == post_data.category_id).first()
            if not category:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category không tồn tại")

        saved_post = Post(
            user_id=post_data.user_id,
            category_id=post_data.category_id,
            title=post_data.title,
            content=post_data.content,
            status=post_data.status,
            credibility_score=dscore,
            credibility_label=cre_label,
            published_at=post_data.published_at
        )
        db.add(saved_post)
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

       


@router.get('/', response_model=List[PostSimple])
def get_all_posts(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    category_id: Optional[int] = None
):
    """Lấy danh sách bài viết với filter"""
    query = db.query(Post)
    
    # Filter theo status
    if status:
        query = query.filter(Post.status == status)
    
    # Filter theo user_id
    if user_id:
        query = query.filter(Post.user_id == user_id)
    
    # Filter theo category_id
    if category_id:
        query = query.filter(Post.category_id == category_id)
    
    # Sắp xếp theo ngày cập nhật mới nhất
    posts = query.order_by(Post.updated_at.desc()).offset(skip).limit(limit).all()
    
    return posts


@router.get('/published', response_model=List[PostSimple])
def get_published_posts(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Lấy danh sách bài viết đã published"""
    posts = db.query(Post).filter(
        Post.status == "published"
    ).order_by(Post.published_at.desc()).offset(skip).limit(limit).all()
    
    return posts


@router.get('/{post_id}', response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Lấy chi tiết bài viết theo ID"""
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bài viết không tồn tại")

    return post


@router.get('/category/{category_id}', response_model=List[PostSimple])
def get_posts_by_category(
    category_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Lấy danh sách bài viết theo category"""
    posts = db.query(Post).filter(Post.category_id == category_id).order_by(Post.updated_at.desc()).offset(skip).limit(limit).all()

    return posts





@router.put('/{post_id}', response_model=PostResponse)
def update_post(
    post_id: int,
    post_data: PostUpdate,
    db: Session = Depends(get_db)
):
    """Cập nhật bài viết"""
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết không tồn tại"
        )
    
    # Cập nhật các trường nếu có
    if post_data.title is not None:
        post.title = post_data.title
    
    if post_data.content is not None:
        post.content = post_data.content
    
    if post_data.category_id is not None:
        # Kiểm tra category có tồn tại
        category = db.query(Category).filter(Category.id == post_data.category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category không tồn tại")
        post.category_id = post_data.category_id
    
    if post_data.status is not None:
        # Nếu chuyển sang published và chưa có published_at
        if post_data.status == "published" and post.published_at is None:
            post.published_at = datetime.now()
        post.status = post_data.status
    
    db.commit()
    db.refresh(post)
    
    return post



class ImagesPayload(BaseModel):
    images: List[str]


@router.post('/{post_id}/images', response_model=PostResponse)
def add_images_to_post(post_id: int, payload: ImagesPayload = Body(...), db: Session = Depends(get_db)):
    """Thêm danh sách URL ảnh vào Post (tạo bản ghi `post_images`).

    - payload.images: danh sách URL (strings).
    - Trả về Post đã được cập nhật (với danh sách images nếu ORM mapping có relationship).
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bài viết không tồn tại")

    for img_url in payload.images:
        img = PostImage(post_id=post.id, image_url=img_url)
        db.add(img)
    db.commit()
    db.refresh(post)

    return post


@router.delete('/{post_id}')
def delete_post(post_id: int, db: Session = Depends(get_db)):
    """Xóa bài viết"""
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết không tồn tại"
        )
    
    db.delete(post)
    db.commit()
    
    return None


@router.post('/{post_id}/publish', response_model=PostResponse)
def publish_post(post_id: int, db: Session = Depends(get_db)):
    """Publish bài viết"""
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết không tồn tại"
        )
    
    if post.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bài viết đã được published"
        )
    
    post.status = "published"
    post.published_at = datetime.now()
    
    db.commit()
    db.refresh(post)
    
    return post


@router.post('/{post_id}/unpublish', response_model=PostResponse)
def unpublish_post(post_id: int, db: Session = Depends(get_db)):
    """Unpublish bài viết (chuyển về draft)"""
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết không tồn tại"
        )
    
    post.status = "draft"
    
    db.commit()
    db.refresh(post)
    
    return post