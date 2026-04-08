from pydantic import BaseModel, EmailStr
from typing import Dict, Any

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    code: str

class OTPResend(BaseModel):
    email: EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class QuizSubmit(BaseModel):
    answers: Dict[str, str]

class VerifyAnswer(BaseModel):
    id: str
    answer: str

class CreativeSubmit(BaseModel):
    response: str
