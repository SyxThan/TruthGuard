import joblib
import re
import pandas as pd
from underthesea import word_tokenize
import os
from pydantic import BaseModel
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