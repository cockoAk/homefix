"""
Generador de preguntas sobre cultura dominicana.
Versión local simple (sin dependencias externas).
"""
import random
import json
from typing import Dict, List, Optional
from datetime import datetime

# Base de conocimientos sobre cultura dominicana
CULTURE_KNOWLEDGE = {
    "historia": [
        {
            "pregunta": "¿En qué año se firmó la Independencia Dominicana?",
            "opciones": {"A": "1821", "B": "1844", "C": "1865", "D": "1916"},
            "respuesta_correcta": "B",
            "explicacion": "La Independencia Dominicana se firmó el 27 de febrero de 1844.",
            "dificultad": "fácil"
        },
        {
            "pregunta": "¿Quiénes son los Padres de la Patria Dominicana?",
            "opciones": {
                "A": "Juan Pablo Duarte, Francisco del Rosario Sánchez, Matías Ramón Mella",
                "B": "Pedro Santana, Buenaventura Báez, Ulises Heureaux",
                "C": "Gregorio Luperón, Fernando Arturo de Meriño, Eugenio María de Hostos",
                "D": "Rafael Trujillo, Joaquín Balaguer, Juan Bosch"
            },
            "respuesta_correcta": "A",
            "explicacion": "Los Padres de la Patria son Juan Pablo Duarte, Francisco del Rosario Sánchez y Matías Ramón Mella.",
            "dificultad": "media"
        },
        {
            "pregunta": "¿En qué batalla se selló definitivamente la independencia dominicana?",
            "opciones": {"A": "Batalla de Azua", "B": "Batalla de Santiago", "C": "Batalla de Las Carreras", "D": "Batalla de Santomé"},
            "respuesta_correcta": "D",
            "explicacion": "La Batalla de Santomé (1855) consolidó la independencia dominicana.",
            "dificultad": "difícil"
        }
    ],
    "musica": [
        {
            "pregunta": "¿Qué instrumento es característico del merengue dominicano?",
            "opciones": {"A": "Maracas", "B": "Güira", "C": "Bongó", "D": "Saxofón"},
            "respuesta_correcta": "B",
            "explicacion": "La güira es el instrumento de percusión metálico característico del merengue.",
            "dificultad": "fácil"
        },
        {
            "pregunta": "¿Quién es conocido como 'El Mayimbe' de la bachata?",
            "opciones": {"A": "Juan Luis Guerra", "B": "Anthony Santos", "C": "Romeo Santos", "D": "Vicente García"},
            "respuesta_correcta": "B",
            "explicacion": "Anthony Santos es conocido como 'El Mayimbe' por su contribución a la bachata.",
            "dificultad": "media"
        }
    ],
    "gastronomia": [
        {
            "pregunta": "¿Cuál es el plato nacional de República Dominicana?",
            "opciones": {"A": "Mangú", "B": "Sancocho", "C": "La Bandera", "D": "Mofongo"},
            "respuesta_correcta": "C",
            "explicacion": "'La Bandera' es el plato nacional: arroz blanco, habichuelas guisadas y carne.",
            "dificultad": "fácil"
        },
        {
            "pregunta": "¿De qué está hecho el mangú?",
            "opciones": {"A": "Yuca hervida", "B": "Plátano verde machacado", "C": "Arroz molido", "D": "Maíz triturado"},
            "respuesta_correcta": "B",
            "explicacion": "El mangú se hace con plátano verde hervido y machacado.",
            "dificultad": "media"
        }
    ],
    "geografia": [
        {
            "pregunta": "¿Cuál es la montaña más alta de República Dominicana?",
            "opciones": {"A": "Pico Duarte", "B": "Loma La Pelona", "C": "Monte Tina", "D": "Cordillera Central"},
            "respuesta_correcta": "A",
            "explicacion": "El Pico Duarte es la montaña más alta del Caribe con 3,087 metros.",
            "dificultad": "fácil"
        },
        {
            "pregunta": "¿Qué río es el más largo de República Dominicana?",
            "opciones": {"A": "Río Ozama", "B": "Río Yaque del Norte", "C": "Río Nizao", "D": "Río Yuna"},
            "respuesta_correcta": "B",
            "explicacion": "El Río Yaque del Norte recorre aproximadamente 296 km.",
            "dificultad": "media"
        }
    ],
    "tradiciones": [
        {
            "pregunta": "¿Qué se celebra el 27 de febrero en República Dominicana?",
            "opciones": {"A": "Día de la Restauración", "B": "Día de la Independencia", "C": "Día de la Bandera", "D": "Día de Duarte"},
            "respuesta_correcta": "B",
            "explicacion": "El 27 de febrero se celebra el Día de la Independencia Nacional.",
            "dificultad": "fácil"
        },
        {
            "pregunta": "¿Qué baile tradicional dominicano tiene influencia africana y española?",
            "opciones": {"A": "Merengue", "B": "Bachata", "C": "Palo", "D": "Mangulina"},
            "respuesta_correcta": "D",
            "explicacion": "La Mangulina es un baile folklórico con influencias africanas y españolas.",
            "dificultad": "difícil"
        }
    ]
}

def generar_pregunta_aleatoria(tema: str = None, dificultad: str = None) -> Dict:
    """Genera una pregunta aleatoria sobre cultura dominicana"""
    
    # Filtrar por tema si se especifica
    if tema and tema in CULTURE_KNOWLEDGE:
        preguntas_disponibles = CULTURE_KNOWLEDGE[tema]
    else:
        # Juntar todas las preguntas
        preguntas_disponibles = []
        for preguntas_tema in CULTURE_KNOWLEDGE.values():
            preguntas_disponibles.extend(preguntas_tema)
    
    # Filtrar por dificultad si se especifica
    if dificultad:
        preguntas_disponibles = [p for p in preguntas_disponibles if p["dificultad"] == dificultad]
    
    if not preguntas_disponibles:
        # Pregunta por defecto si no hay disponibles
        return {
            "id": random.randint(1000, 9999),
            "pregunta": "¿En qué año se firmó la Independencia Dominicana?",
            "opciones": {"A": "1821", "B": "1844", "C": "1865", "D": "1916"},
            "respuesta_correcta": "B",
            "explicacion": "La Independencia Dominicana se firmó el 27 de febrero de 1844.",
            "tema": "historia",
            "dificultad": "fácil",
            "puntos": 10,
            "tiempo_limite": 30,
            "generada_en": datetime.now().isoformat()
        }
    
    # Seleccionar pregunta aleatoria
    pregunta = random.choice(preguntas_disponibles)
    
    # Determinar el tema
    tema_encontrado = "general"
    for t, preguntas in CULTURE_KNOWLEDGE.items():
        if pregunta in preguntas:
            tema_encontrado = t
            break
    
    # Asignar puntos según dificultad
    puntos_map = {"fácil": 10, "media": 15, "difícil": 20}
    puntos = puntos_map.get(pregunta.get("dificultad", "fácil"), 10)
    
    return {
        "id": random.randint(1000, 9999),
        "pregunta": pregunta["pregunta"],
        "opciones": pregunta["opciones"],
        "respuesta_correcta": pregunta["respuesta_correcta"],
        "explicacion": pregunta.get("explicacion", ""),
        "tema": tema_encontrado,
        "dificultad": pregunta.get("dificultad", "media"),
        "puntos": puntos,
        "tiempo_limite": 30,  # segundos por defecto
        "generada_en": datetime.now().isoformat()
    }

def generar_quiz_completo(num_preguntas: int = 5, tema: str = None, dificultad: str = None) -> List[Dict]:
    """Genera un quiz completo con múltiples preguntas"""
    if num_preguntas > 20:
        num_preguntas = 20  # Límite
    
    quiz = []
    for i in range(num_preguntas):
        pregunta = generar_pregunta_aleatoria(tema, dificultad)
        pregunta["numero"] = i + 1
        quiz.append(pregunta)
    
    return quiz

def verificar_respuesta(pregunta_id: int, respuesta: str, preguntas_quiz: List[Dict]) -> Dict:
    """Verifica si una respuesta es correcta"""
    for pregunta in preguntas_quiz:
        if pregunta["id"] == pregunta_id:
            es_correcta = pregunta["respuesta_correcta"] == respuesta
            return {
                "es_correcta": es_correcta,
                "respuesta_correcta": pregunta["respuesta_correcta"],
                "explicacion": pregunta.get("explicacion", ""),
                "puntos": pregunta["puntos"] if es_correcta else 0
            }
    
    return {"es_correcta": False, "respuesta_correcta": "", "explicacion": "Pregunta no encontrada", "puntos": 0}

# Versión con OpenAI (opcional)
def generar_pregunta_openai(tema: str = "cultura dominicana"):
    """
    Versión con OpenAI (requiere API key).
    Para usar, instala: pip install openai
    """
    try:
        import openai
        import os
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return generar_pregunta_aleatoria(tema)
        
        openai.api_key = api_key
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un experto en cultura dominicana. Genera preguntas educativas."},
                {"role": "user", "content": f"""Genera UNA pregunta de trivia sobre {tema}.
                
                Formato JSON:
                {{
                    "pregunta": "texto de la pregunta",
                    "opciones": {{"A": "opción A", "B": "opción B", "C": "opción C", "D": "opción D"}},
                    "respuesta_correcta": "A/B/C/D",
                    "explicacion": "breve explicación",
                    "tema": "tema específico",
                    "dificultad": "fácil/media/difícil"
                }}"""}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        content = response.choices[0].message.content
        # Extraer JSON de la respuesta
        start = content.find('{')
        end = content.rfind('}') + 1
        
        if start != -1 and end != 0:
            json_str = content[start:end]
            pregunta_data = json.loads(json_str)
            pregunta_data["id"] = random.randint(1000, 9999)
            pregunta_data["puntos"] = 15  # Puntos por defecto para preguntas IA
            pregunta_data["tiempo_limite"] = 30
            pregunta_data["generada_en"] = datetime.now().isoformat()
            return pregunta_data
        
    except Exception as e:
        print(f"Error con OpenAI: {e}")
    
    # Fallback a pregunta local
    return generar_pregunta_aleatoria(tema) 