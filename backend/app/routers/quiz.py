from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import crud, schemas
from app.routers.users import get_current_user

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

# ============ QUIZ CRUD ENDPOINTS ============

@router.post("/", response_model=schemas.QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(
    quiz: schemas.QuizCreate,
    current_user: schemas.UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea un nuevo quiz"""
    try:
        db_quiz = crud.create_quiz(db, quiz, current_user.id)
        return db_quiz
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[schemas.QuizResponse])
def read_quizzes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Obtiene todos los quizzes públicos"""
    quizzes = crud.get_public_quizzes(db, skip=skip, limit=limit)
    return quizzes

@router.get("/my-quizzes", response_model=List[schemas.QuizResponse])
def read_my_quizzes(
    current_user: schemas.UserResponse = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Obtiene los quizzes del usuario actual"""
    quizzes = crud.get_user_quizzes(db, current_user.id, skip=skip, limit=limit)
    return quizzes

@router.get("/{quiz_id}", response_model=schemas.QuizResponse)
def read_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Obtiene un quiz por ID"""
    db_quiz = crud.get_quiz(db, quiz_id=quiz_id)
    if db_quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz no encontrado"
        )
    
    # Verificar si es público o el usuario es el creador
    # (esto se manejará mejor con permisos más adelante)
    if db_quiz.is_public == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este quiz es privado"
        )
    
    return db_quiz

@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    current_user: schemas.UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elimina un quiz (solo si es del usuario)"""
    success = crud.delete_quiz(db, quiz_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz no encontrado o no tienes permisos"
        )
    return {"message": "Quiz eliminado correctamente"}

# ============ GAME ENDPOINTS ============

@router.post("/{quiz_id}/start-game", response_model=schemas.GameSessionResponse)
def start_game_from_quiz(
    quiz_id: int,
    game_data: schemas.GameSessionCreate,
    current_user: schemas.UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea una sesión de juego a partir de un quiz"""
    # Verificar que el quiz existe
    quiz = crud.get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz no encontrado"
        )
    
    # Crear sesión de juego
    game_data.quiz_id = quiz_id
    db_game = crud.create_game_session(db, game_data, current_user.id)
    return db_game

# ============ TEST ENDPOINTS ============

@router.get("/test/populate")
def populate_test_quizzes(
    current_user: schemas.UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea quizzes de prueba (solo desarrollo)"""
    from datetime import datetime
    
    # Quiz 1: Historia Dominicana
    quiz1 = schemas.QuizCreate(
        title="Historia Dominicana Básica",
        description="Preguntas básicas sobre la historia de República Dominicana",
        is_public=True,
        questions=[
            schemas.QuestionCreate(
                question_text="¿En qué año se firmó la Independencia Dominicana?",
                options={"A": "1821", "B": "1844", "C": "1865", "D": "1916"},
                correct_answer="B",
                points=10
            ),
            schemas.QuestionCreate(
                question_text="¿Quién es considerado el padre de la patria?",
                options={
                    "A": "Juan Pablo Duarte",
                    "B": "Francisco del Rosario Sánchez", 
                    "C": "Matías Ramón Mella",
                    "D": "Todos los anteriores"
                },
                correct_answer="D",
                points=15
            )
        ]
    )
    
    # Quiz 2: Música Dominicana
    quiz2 = schemas.QuizCreate(
        title="Música Dominicana",
        description="Preguntas sobre merengue, bachata y más",
        is_public=True,
        questions=[
            schemas.QuestionCreate(
                question_text="¿Qué instrumento es típico del merengue?",
                options={"A": "Maracas", "B": "Güira", "C": "Bongó", "D": "Saxofón"},
                correct_answer="B",
                points=10
            )
        ]
    )
    
    try:
        crud.create_quiz(db, quiz1, current_user.id)
        crud.create_quiz(db, quiz2, current_user.id)
        return {"message": "Quizzes de prueba creados exitosamente"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )