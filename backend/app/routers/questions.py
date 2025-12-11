"""
Endpoints para generación de preguntas sobre cultura dominicana.
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional

from app import question_generator

router = APIRouter(prefix="/questions", tags=["questions"])

@router.get("/generate")
def generate_question(tema: Optional[str] = None, dificultad: Optional[str] = None):
    """Genera una pregunta aleatoria sobre cultura dominicana"""
    pregunta = question_generator.generar_pregunta_aleatoria(tema, dificultad)
    return pregunta

@router.get("/generate-quiz")
def generate_quiz(
    num_preguntas: int = 5, 
    tema: Optional[str] = None, 
    dificultad: Optional[str] = None
):
    """Genera un quiz completo con preguntas aleatorias"""
    if num_preguntas > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número máximo de preguntas es 20"
        )
    
    quiz = question_generator.generar_quiz_completo(num_preguntas, tema, dificultad)
    return {
        "quiz": quiz,
        "total_preguntas": len(quiz),
        "tema": tema or "general",
        "dificultad": dificultad or "mixta"
    }

@router.post("/verify")
def verify_answer(verification_data: dict):
    """Verifica si una respuesta es correcta"""
    pregunta_id = verification_data.get("pregunta_id")
    respuesta = verification_data.get("respuesta")
    preguntas_quiz = verification_data.get("preguntas_quiz", [])
    
    if not pregunta_id or not respuesta:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere pregunta_id y respuesta"
        )
    
    resultado = question_generator.verificar_respuesta(pregunta_id, respuesta, preguntas_quiz)
    return resultado

@router.get("/topics")
def get_available_topics():
    """Obtiene los temas disponibles para preguntas"""
    return {
        "temas": list(question_generator.CULTURE_KNOWLEDGE.keys()),
        "descripciones": {
            "historia": "Historia y personajes dominicanos",
            "musica": "Música tradicional y artistas",
            "gastronomia": "Comida y platos típicos",
            "geografia": "Geografía y lugares de RD",
            "tradiciones": "Festividades y costumbres"
        }
    }

@router.get("/openai-generate")
def generate_with_openai(tema: str = "cultura dominicana"):
    """Genera una pregunta usando OpenAI (si está configurado)"""
    try:
        pregunta = question_generator.generar_pregunta_openai(tema)
        return {
            "pregunta": pregunta,
            "fuente": "openai",
            "nota": "Requiere OPENAI_API_KEY en variables de entorno"
        }
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="OpenAI no está instalado. Ejecuta: pip install openai"
        )
    except Exception as e:
        # Fallback a generador local
        pregunta = question_generator.generar_pregunta_aleatoria(tema)
        return {
            "pregunta": pregunta,
            "fuente": "local (fallback)",
            "error": str(e)
        }

# Endpoint para demo/test
@router.get("/demo-quiz")
def get_demo_quiz():
    """Obtiene un quiz de demostración"""
    quiz = question_generator.generar_quiz_completo(3, dificultad="fácil")
    return {
        "titulo": "Demo: Cultura Dominicana Básica",
        "descripcion": "Quiz de demostración con preguntas fáciles",
        "quiz": quiz,
        "instrucciones": "Tienes 30 segundos por pregunta. ¡Buena suerte!"
    }