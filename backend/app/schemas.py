from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional, Dict, List

# ============ USER SCHEMAS ============

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    age: int

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: int  # <-- Cambiado de bool a int
    
    class Config:
        from_attributes = True
# ============ QUIZ SCHEMAS ============

class QuestionBase(BaseModel):
    question_text: str
    options: Dict[str, str]  # {"A": "Opción A", "B": "Opción B", ...}
    correct_answer: str  # "A", "B", "C", o "D"
    points: int = 10
    time_limit: int = 30

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_public: bool = True

class QuizCreate(QuizBase):
    questions: List[QuestionCreate] = []

class QuizResponse(QuizBase):
    id: int
    created_by: int
    created_at: datetime
    questions: List[QuestionResponse] = []
    
    class Config:
        from_attributes = True

# ============ GAME SCHEMAS ============

class GameSessionBase(BaseModel):
    quiz_id: Optional[int] = None
    max_players: int = 20

class GameSessionCreate(GameSessionBase):
    pass

class GameSessionResponse(GameSessionBase):
    id: int
    room_code: str
    host_id: int
    status: str
    current_question: int
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PlayerAnswerBase(BaseModel):
    question_id: int
    answer: str  # "A", "B", "C", o "D"
    response_time: Optional[int] = None

class PlayerAnswerCreate(PlayerAnswerBase):
    game_id: int
    player_id: int

class PlayerAnswerResponse(PlayerAnswerBase):
    id: int
    is_correct: bool
    points_earned: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============ TOKEN SCHEMAS ============

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None