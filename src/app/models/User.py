from ..core.config import Base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer,primary_key = True, autoincrement = True)
    username = Column(String(50), unique= True, nullable = False)
    email = Column(String(100), unique = True, nullable = False)
    password_hash = Column(String(255), unique = True, nullable = False)
    full_name = Column(String(100), nullable = True)
    phone_number = Column(String(15), nullable = False)
    is_admin = Column(Boolean, default = False)


