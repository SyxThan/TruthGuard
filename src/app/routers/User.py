from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.config import SessionLocal
from app.schemas.User import UserBase, UserResponse, UserUpdate, LoginBase
from typing import List
from app.models.User import User
from passlib.context import CryptContext
from app.dependency.auth import create_access_token

router = APIRouter(prefix="/users", tags=["users"])

# Cấu hình mã hóa password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
   
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    
    return pwd_context.verify(plain_password, hashed_password)


@router.post('/register', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserBase, db: Session = Depends(get_db)):
    
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password_hash),
        full_name=user.full_name,
        phone_number=user.phone_number
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post('/login')
def login(credentials: LoginBase, db: Session = Depends(get_db)):
    """Đăng nhập"""
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username hoặc password không đúng"
        )
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username hoặc password không đúng"
        )
    
    token = create_access_token({"sub": str(user.id), "username": user.username})
    return {
        "message": "Đăng nhập thành công",
        "user_id": user.id,
        "username": user.username,
        "access_token": token,
        "token_type": "bearer"
    }


@router.get('/', response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """Lấy danh sách tất cả users"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get('/{user_id}', response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Lấy thông tin user theo ID"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    
    return user


@router.put('/{user_id}', response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    """Cập nhật thông tin user"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    
    # Cập nhật các trường nếu có
    if user_data.email is not None:
        # Kiểm tra email mới có bị trùng không
        existing_email = db.query(User).filter(
            User.email == user_data.email,
            User.id != user_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email đã được sử dụng"
            )
        user.email = user_data.email
    
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    
    if user_data.phone_number is not None:
        user.phone_number = user_data.phone_number
    
    db.commit()
    db.refresh(user)
    
    return user


@router.post('/token')
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai username hoặc mật khẩu"
        )
    access_token = create_access_token({"sub": str(user.id), "username": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
