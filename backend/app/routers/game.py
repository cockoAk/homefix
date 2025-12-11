from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict
import json
import uuid

from app.database import get_db
from app import crud, schemas
from app.routers.users import get_current_user
from app.websocket_manager import connection_manager

router = APIRouter(prefix="/game", tags=["game"])

# ============ HTTP ENDPOINTS ============

@router.post("/create", response_model=schemas.GameSessionResponse)
def create_game_session(
    game_data: schemas.GameSessionCreate,
    current_user: schemas.UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea una nueva sesión de juego"""
    try:
        db_game = crud.create_game_session(db, game_data, current_user.id)
        return db_game
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/active", response_model=List[schemas.GameSessionResponse])
def get_active_sessions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Obtiene todas las sesiones de juego activas"""
    return crud.get_active_game_sessions(db, skip=skip, limit=limit)

@router.get("/room/{room_code}", response_model=schemas.GameSessionResponse)
def get_game_session(room_code: str, db: Session = Depends(get_db)):
    """Obtiene información de una sala por código"""
    game = crud.get_game_session(db, room_code)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sala no encontrada"
        )
    return game

@router.post("/{room_code}/start")
def start_game_session(
    room_code: str,
    current_user: schemas.UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Inicia una sesión de juego (solo el host)"""
    game = crud.get_game_session(db, room_code)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sala no encontrada"
        )
    
    if game.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el host puede iniciar el juego"
        )
    
    updated_game = crud.update_game_status(db, room_code, "active")
    if not updated_game:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al iniciar el juego"
        )
    
    return {"message": "Juego iniciado", "room_code": room_code}

@router.get("/{room_code}/leaderboard")
def get_game_leaderboard(room_code: str, db: Session = Depends(get_db)):
    """Obtiene el ranking de una sala"""
    game = crud.get_game_session(db, room_code)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sala no encontrada"
        )
    
    leaderboard = crud.get_game_leaderboard(db, game.id)
    return {
        "room_code": room_code,
        "game_id": game.id,
        "leaderboard": leaderboard
    }

# ============ WEBSOCKET ENDPOINTS ============

@router.websocket("/ws/{room_code}/{player_id}")
async def websocket_game_endpoint(
    websocket: WebSocket,
    room_code: str,
    player_id: int
):
    """WebSocket para comunicación en tiempo real del juego"""
    await connection_manager.connect(websocket, room_code)
    
    try:
        # Notificar a todos que un jugador se unió
        await connection_manager.broadcast_to_room(
            room_code,
            {
                "type": "player_joined",
                "player_id": player_id,
                "room_code": room_code,
                "message": f"Jugador {player_id} se ha unido"
            }
        )
        
        while True:
            # Recibir mensaje del cliente
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Procesar diferentes tipos de mensajes
            if message["type"] == "answer":
                # Un jugador envía una respuesta
                await connection_manager.broadcast_to_room(
                    room_code,
                    {
                        "type": "answer_received",
                        "player_id": player_id,
                        "question_id": message.get("question_id"),
                        "answer": message.get("answer"),
                        "timestamp": message.get("timestamp")
                    }
                )
                
            elif message["type"] == "next_question":
                # Host solicita siguiente pregunta
                await connection_manager.broadcast_to_room(
                    room_code,
                    {
                        "type": "next_question",
                        "question": message.get("question"),
                        "question_number": message.get("question_number"),
                        "total_questions": message.get("total_questions")
                    }
                )
                
            elif message["type"] == "show_results":
                # Mostrar resultados de la pregunta
                await connection_manager.broadcast_to_room(
                    room_code,
                    {
                        "type": "show_results",
                        "correct_answer": message.get("correct_answer"),
                        "stats": message.get("stats")
                    }
                )
                
            elif message["type"] == "game_over":
                # Fin del juego
                await connection_manager.broadcast_to_room(
                    room_code,
                    {
                        "type": "game_over",
                        "final_leaderboard": message.get("leaderboard")
                    }
                )
    
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, room_code)
        # Notificar que un jugador se fue
        await connection_manager.broadcast_to_room(
            room_code,
            {
                "type": "player_left",
                "player_id": player_id,
                "message": f"Jugador {player_id} se ha desconectado"
            }
        )

# ============ TEST ENDPOINTS ============

@router.post("/test/create-demo")
def create_demo_game(
    current_user: schemas.UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea un juego de demostración (para pruebas)"""
    # Primero crear un quiz de prueba si no existe
    from app import models
    
    # Buscar o crear quiz de prueba
    quiz = db.query(models.Quiz).filter(
        models.Quiz.title == "Demo: Cultura Dominicana"
    ).first()
    
    if not quiz:
        quiz = models.Quiz(
            title="Demo: Cultura Dominicana",
            description="Quiz de demostración para pruebas",
            created_by=current_user.id,
            is_public=1
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        
        # Agregar preguntas de demo
        questions_data = [
            {
                "question_text": "¿En qué año se firmó la Independencia Dominicana?",
                "options": {"A": "1821", "B": "1844", "C": "1865", "D": "1916"},
                "correct_answer": "B",
                "points": 10
            },
            {
                "question_text": "¿Qué instrumento es típico del merengue?",
                "options": {"A": "Maracas", "B": "Güira", "C": "Bongó", "D": "Saxofón"},
                "correct_answer": "B", 
                "points": 10
            }
        ]
        
        for q_data in questions_data:
            question = models.Question(
                quiz_id=quiz.id,
                **q_data
            )
            db.add(question)
        
        db.commit()
    
    # Crear juego
    game_data = schemas.GameSessionCreate(
        quiz_id=quiz.id,
        max_players=10
    )
    
    db_game = crud.create_game_session(db, game_data, current_user.id)
    
    return {
        "message": "Juego de demostración creado",
        "room_code": db_game.room_code,
        "quiz_id": quiz.id,
        "game_id": db_game.id
    }