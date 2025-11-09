# TruthGuard - Hệ Thống Phát Hiện Tin Giả Tiếng Việt

## Giới thiệu

	**TruthGuard** là một nền tảng web ứng dụng Machine Learning để phát hiện và xác minh độ tin cậy của các tin tức tiếng Việt. Trong bối cảnh tin giả lan truyền nhanh chóng trên mạng xã hội, TruthGuard cung cấp công cụ tự động giúp người dùng kiểm chứng thông tin một cách nhanh chóng và chính xác.

!![Demo](https://raw.githubusercontent.com/SyxThan/TruthGuard/main/frontend/assets/demo/workflow.png)
## Demo giao diện
- Màn hình đăng nhập
- ![Demo](https://raw.githubusercontent.com/SyxThan/TruthGuard/main/frontend/assets/demo/login.png)
- Trang chủ
- ![Demo](https://raw.githubusercontent.com/SyxThan/TruthGuard/main/frontend/assets/demo/index.png)
- Trang kiểm tra tin tức
- !![Demo](https://raw.githubusercontent.com/SyxThan/TruthGuard/main/frontend/assets/demo/submit.png)
- Trang chia sẻ tin tức
- !![Demo](https://raw.githubusercontent.com/SyxThan/TruthGuard/main/frontend/assets/demo/share.png)
## Các tính năng nổi bật
- **Mô hình AI phát hiện tin giả**:
    - Sử dụng hai thuật toán Machine Learning: Logistic Regression và SVM
    - Trích xuất đặc trưng văn bản bằng TF-IDF (50,000 features, unigram & bigram)
    - Độ chính xác cao với dataset ReINTEL 2020 (8,715 mẫu huấn luyện)
    - Xử lý văn bản tiếng Việt chuyên biệt với thư viện Underthesea
- **Pipeline xử lý văn bản tiếng Việt**:
    - Tiền xử lý: Loại bỏ emoji, URL, HTML tags, chuẩn hóa ký tự
    - Tách từ (Word Segmentation) cho tiếng Việt
    - Chuẩn hóa văn bản: Xử lý ký tự lặp, dấu câu
    - Vector hóa TF-IDF với ngram_range=(1,2)
- **Hệ thống xác thực và phân quyền**:
    - JWT Token với thời gian hết hạn 60 phút
    - Mã hóa mật khẩu bằng Bcrypt (Passlib)
    - Phân quyền đa cấp: User và Admin
    - OAuth2PasswordBearer flow chuẩn
- **Quản lý nội dung thông minh**:
    - CRUD đầy đủ cho bài viết (Posts) với trạng thái draft/published
    - Upload và quản lý nhiều ảnh cho mỗi bài viết
    - Tự động kiểm duyệt dựa trên điểm tin cậy AI
    - Lịch sử kiểm tra và quản lý bài viết cá nhân
- **Crawl dữ liệu tự động**:
    - Sử dụng Selenium để thu thập tin tức từ VnExpress
    - Tự động gán nhãn "Thật" cho nguồn tin uy tín
    - Lưu trữ và chuẩn hóa dữ liệu vào database
## Stack Công nghệ

- **Backend**:
    - Framework: FastAPI, Pydantic
    - Database: MySQL (SQLAlchemy ORM)
    - ML Libraries: scikit-learn, pandas, numpy
    - Xử lý NLP: Underthesea (tách từ tiếng Việt)
    - Lưu trữ mô hình: Joblib
    - Xác thực: JWT (python-jose), Passlib[bcrypt]
    - Web Scraping: Selenium, ChromeDriver
    - Visualization: Matplotlib, Seaborn
- **Frontend**:
    - Core: HTML5, CSS3, JavaScript (ES6+)
    - Styling: Tailwind CSS / Custom CSS
    - API Communication: Fetch API
    - State Management: localStorage (JWT tokens)
- **Machine Learning**:
    - Models: Logistic Regression, Support Vector Machine (Linear kernel)
    - Feature Engineering: TfidfVectorizer
    - Dataset: ReINTEL 2020 (9,713 mẫu)
    - Evaluation: Accuracy, Precision, Recall, F1-Score, Confusion Matrix
## Chạy dự án
### 1. Clone Repository
```bash
git clone https://github.com/SyxThan/TruthGuard.git
cd TruthGuard
```
### 2. Tạo môi trường và cài đặt thư viện
```bash
python -m venv venv
pip install -r requirements.txt
```

```env
# Ở trong file core/config thay đổi đường dẫn database của bạn dạng này
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/truthguard
```
### 3. Chạy Backend 
```
cd src
uvicorn main:app
```
### 4. Chạy Frontend
- Mở file index.html nhấn GOLIVE 
