from pydantic import BaseModel, EmailStr
from typing import Optional, List


class UserBase(BaseModel):
    username : str
    email : Optional[EmailStr] = None
    password : str
    full_name : Optional[str] = None
    phone_number : Optional[str] = None
 

class LoginBase(BaseModel):
    username : str
    password : str

class UserUpdate(BaseModel):
    email : Optional[EmailStr] = None
    full_name : Optional[str] = None
    phone_number : Optional[str] = None

class UserResponse(BaseModel):
    id : Optional[int] = None
    username : str
    email : Optional[EmailStr] = None
    full_name : Optional[str] = None
    phone_number : Optional[str] = None
    is_admin : Optional[bool] = False


