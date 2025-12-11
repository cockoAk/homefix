from sqlalchemy import ForeignKey, Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base  # <-- CORREGIDO: usa app.database

# Modelo para la tabla de sesiones de usuario
class UserSesion(Base):
    __tablename__ = "user_sesion"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Hasheada
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Integer, default=1)  # 1 = activo, 0 = inactivo
    
    # Relaciones
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    quizzes_created = relationship("Quiz", back_populates="creator")

# Modelo para la tabla de perfiles de usuario
class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, ForeignKey("user_sesion.id"), primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    avatar_url = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relación
    user = relationship("UserSesion", back_populates="profile")

# Modelo para quizzes
class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("user_sesion.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_public = Column(Integer, default=1)  # 1 = público, 0 = privado
    
    # Relaciones
    creator = relationship("UserSesion", back_populates="quizzes_created")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")

# Modelo para preguntas
class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # {"A": "texto", "B": "texto", ...}
    correct_answer = Column(String(2), nullable=False)  # "A", "B", "C", o "D"
    points = Column(Integer, default=10)
    time_limit = Column(Integer, default=30)  # segundos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relación
    quiz = relationship("Quiz", back_populates="questions")

# Modelo para partidas/juegos en vivo
class GameSession(Base):
    __tablename__ = "game_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String(8), unique=True, index=True, nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)
    host_id = Column(Integer, ForeignKey("user_sesion.id"))
    status = Column(String(20), default="waiting")  # waiting, active, finished
    current_question = Column(Integer, default=0)
    max_players = Column(Integer, default=20)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    host = relationship("UserSesion")

# Modelo para respuestas de jugadores
class PlayerAnswer(Base):
    __tablename__ = "player_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("game_sessions.id"))
    player_id = Column(Integer, ForeignKey("user_sesion.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    answer = Column(String(2), nullable=False)  # "A", "B", "C", o "D"
    is_correct = Column(Integer, default=0)  # 0 = incorrecta, 1 = correcta
    points_earned = Column(Integer, default=0)
    response_time = Column(Integer)  # segundos que tardó
    created_at = Column(DateTime(timezone=True), server_default=func.now())