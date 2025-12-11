from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List, Dict, Any
from datetime import datetime

from app import models, schemas
from app.utils.security import get_password_hash, verify_password

# ============ USER CRUD ============

def get_user(db: Session, user_id: int) -> Optional[models.UserSesion]:
    """Obtiene un usuario por ID"""
    return db.query(models.UserSesion).filter(models.UserSesion.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.UserSesion]:
    """Obtiene un usuario por email"""
    return db.query(models.UserSesion).filter(models.UserSesion.email == email).first()

def authenticate_user(db: Session, email: str, password: str) -> Optional[models.UserSesion]:
    """Autentica un usuario"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user

def create_user(db: Session, user: schemas.UserCreate) -> models.UserSesion:
    """Crea un nuevo usuario"""
    # Verificar si el email ya existe
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise ValueError(f"El email {user.email} ya está registrado")
    
    # Crear usuario con contraseña hasheada
    hashed_password = get_password_hash(user.password)
    db_user = models.UserSesion(
        email=user.email,
        password=hashed_password,
        profile=models.UserProfile(
            full_name=user.full_name,
            age=user.age
        )
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise ValueError("Error al crear el usuario")

def update_user(db: Session, user_id: int, user_update: Dict[str, Any]) -> Optional[models.UserSesion]:
    """Actualiza un usuario"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    for key, value in user_update.items():
        if hasattr(db_user, key):
            setattr(db_user, key, value)
        elif hasattr(db_user.profile, key):
            setattr(db_user.profile, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

# ============ QUIZ CRUD ============

def create_quiz(db: Session, quiz: schemas.QuizCreate, user_id: int) -> models.Quiz:
    """Crea un nuevo quiz"""
    db_quiz = models.Quiz(
        title=quiz.title,
        description=quiz.description,
        created_by=user_id,
        is_public=1 if quiz.is_public else 0
    )
    
    # Agregar preguntas si existen
    for question in quiz.questions:
        db_question = models.Question(
            question_text=question.question_text,
            options=question.options,
            correct_answer=question.correct_answer,
            points=question.points,
            time_limit=question.time_limit
        )
        db_quiz.questions.append(db_question)
    
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

def get_quiz(db: Session, quiz_id: int) -> Optional[models.Quiz]:
    """Obtiene un quiz por ID"""
    return db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()

def get_user_quizzes(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Quiz]:
    """Obtiene todos los quizzes de un usuario"""
    return db.query(models.Quiz).filter(models.Quiz.created_by == user_id).offset(skip).limit(limit).all()

def get_public_quizzes(db: Session, skip: int = 0, limit: int = 100) -> List[models.Quiz]:
    """Obtiene todos los quizzes públicos"""
    return db.query(models.Quiz).filter(models.Quiz.is_public == 1).offset(skip).limit(limit).all()

def delete_quiz(db: Session, quiz_id: int, user_id: int) -> bool:
    """Elimina un quiz (solo si es del usuario)"""
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.created_by == user_id
    ).first()
    
    if not quiz:
        return False
    
    db.delete(quiz)
    db.commit()
    return True

# ============ GAME SESSION CRUD ============

import uuid

def create_game_session(db: Session, game: schemas.GameSessionCreate, host_id: int) -> models.GameSession:
    """Crea una nueva sesión de juego"""
    # Generar código único de sala
    room_code = str(uuid.uuid4())[:8].upper()
    
    # Verificar que el código no exista (muy improbable, pero por seguridad)
    while db.query(models.GameSession).filter(models.GameSession.room_code == room_code).first():
        room_code = str(uuid.uuid4())[:8].upper()
    
    db_game = models.GameSession(
        room_code=room_code,
        quiz_id=game.quiz_id,
        host_id=host_id,
        max_players=game.max_players,
        status="waiting"  # waiting, active, finished
    )
    
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game

def get_game_session(db: Session, room_code: str) -> Optional[models.GameSession]:
    """Obtiene una sesión de juego por código de sala"""
    return db.query(models.GameSession).filter(models.GameSession.room_code == room_code).first()

def get_active_game_sessions(db: Session, skip: int = 0, limit: int = 100) -> List[models.GameSession]:
    """Obtiene todas las sesiones de juego activas"""
    return db.query(models.GameSession).filter(
        models.GameSession.status.in_(["waiting", "active"])
    ).offset(skip).limit(limit).all()

def update_game_status(db: Session, room_code: str, status: str) -> Optional[models.GameSession]:
    """Actualiza el estado de una sesión de juego"""
    game = get_game_session(db, room_code)
    if not game:
        return None
    
    game.status = status
    
    if status == "active" and not game.started_at:
        game.started_at = datetime.now()
    elif status == "finished" and not game.finished_at:
        game.finished_at = datetime.now()
    
    db.commit()
    db.refresh(game)
    return game

# ============ PLAYER ANSWER CRUD ============

def create_player_answer(db: Session, answer: schemas.PlayerAnswerCreate) -> models.PlayerAnswer:
    """Registra una respuesta de un jugador"""
    # Obtener la pregunta para verificar respuesta correcta
    question = db.query(models.Question).filter(models.Question.id == answer.question_id).first()
    
    if not question:
        raise ValueError("Pregunta no encontrada")
    
    # Verificar si la respuesta es correcta
    is_correct = answer.answer == question.correct_answer
    points_earned = question.points if is_correct else 0
    
    db_answer = models.PlayerAnswer(
        game_id=answer.game_id,
        player_id=answer.player_id,
        question_id=answer.question_id,
        answer=answer.answer,
        is_correct=1 if is_correct else 0,
        points_earned=points_earned,
        response_time=answer.response_time
    )
    
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer

def get_player_answers(db: Session, game_id: int, player_id: int) -> List[models.PlayerAnswer]:
    """Obtiene todas las respuestas de un jugador en un juego"""
    return db.query(models.PlayerAnswer).filter(
        models.PlayerAnswer.game_id == game_id,
        models.PlayerAnswer.player_id == player_id
    ).all()

def get_game_leaderboard(db: Session, game_id: int) -> List[Dict]:
    """Obtiene el ranking de un juego"""
    from sqlalchemy import func
    
    # Consulta para obtener puntuación total por jugador
    result = db.query(
        models.PlayerAnswer.player_id,
        func.sum(models.PlayerAnswer.points_earned).label('total_score'),
        func.count(models.PlayerAnswer.id).label('total_answers'),
        func.avg(models.PlayerAnswer.response_time).label('avg_response_time')
    ).filter(
        models.PlayerAnswer.game_id == game_id
    ).group_by(
        models.PlayerAnswer.player_id
    ).order_by(
        func.sum(models.PlayerAnswer.points_earned).desc()
    ).all()
    
    leaderboard = []
    for row in result:
        # Obtener nombre del usuario
        user = get_user(db, row.player_id)
        leaderboard.append({
            "player_id": row.player_id,
            "player_name": user.profile.full_name if user and user.profile else "Anónimo",
            "total_score": row.total_score or 0,
            "total_answers": row.total_answers or 0,
            "avg_response_time": float(row.avg_response_time) if row.avg_response_time else 0
        })
    
    return leaderboard