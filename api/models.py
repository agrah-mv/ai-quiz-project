from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_verified = Column(Boolean, default=False)
    has_paid = Column(Boolean, default=False)

class OTP(Base):
    __tablename__ = "otp"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    code = Column(String)

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)
    passed = Column(Boolean)

class Response(Base):
    __tablename__ = "responses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    relevance = Column(Float, default=0)
    creativity = Column(Float, default=0)
    clarity = Column(Float, default=0)
    impact = Column(Float, default=0)
    total_score = Column(Float, default=0)

class EvaluationAudit(Base):
    __tablename__ = "evaluation_audits"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    response_content = Column(String)
    stage = Column(String, index=True)
    agent = Column(String, index=True)
    tool_name = Column(String, nullable=True)
    input_payload = Column(String, nullable=True)
    output_payload = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
