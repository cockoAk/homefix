"""
Gestor de juegos en memoria para partidas en tiempo real.
Mantiene estado de salas activas y puntuaciones.
"""
from typing import Dict, List, Optional
import uuid
from datetime import datetime
import asyncio

class GameManager:
    """
    Maneja el estado de las salas de juego en memoria.
    Para producción, esto debería persistirse en Redis o DB.
    """
    
    def __init__(self):
        self.rooms: Dict[str, Dict] = {}  # room_code -> room_data
        self.player_connections: Dict[str, Dict] = {}  # room_code -> {player_id: websocket}
        self.game_state: Dict[str, Dict] = {}  # room_code -> game_state
        
    def create_room(self, host_id: int, quiz_id: Optional[int] = None, 
                   max_players: int = 20, room_name: str = "") -> str:
        """Crea una nueva sala de juego"""
        room_code = str(uuid.uuid4())[:8].upper()
        
        # Asegurar código único
        while room_code in self.rooms:
            room_code = str(uuid.uuid4())[:8].upper()
        
        self.rooms[room_code] = {
            "room_code": room_code,
            "host_id": host_id,
            "quiz_id": quiz_id,
            "room_name": room_name or f"Sala {room_code}",
            "max_players": max_players,
            "status": "waiting",  # waiting, active, finished
            "players": [],
            "created_at": datetime.now().isoformat(),
            "started_at": None,
            "finished_at": None,
            "current_question": 0,
            "total_questions": 0
        }
        
        self.player_connections[room_code] = {}
        self.game_state[room_code] = {
            "answers": {},  # question_id -> {player_id: answer}
            "scores": {},   # player_id -> total_score
            "question_start_time": None
        }
        
        return room_code
    
    def join_room(self, room_code: str, player_id: int, player_name: str) -> Optional[Dict]:
        """Un jugador se une a una sala"""
        if room_code not in self.rooms:
            return None
        
        room = self.rooms[room_code]
        
        # Verificar límite de jugadores
        if len(room["players"]) >= room["max_players"]:
            return None
        
        # Verificar si el jugador ya está en la sala
        for player in room["players"]:
            if player["player_id"] == player_id:
                return player
        
        # Agregar jugador
        player_data = {
            "player_id": player_id,
            "player_name": player_name,
            "joined_at": datetime.now().isoformat(),
            "score": 0,
            "answers": []
        }
        
        room["players"].append(player_data)
        self.game_state[room_code]["scores"][player_id] = 0
        
        return player_data
    
    def leave_room(self, room_code: str, player_id: int) -> bool:
        """Un jugador abandona la sala"""
        if room_code not in self.rooms:
            return False
        
        room = self.rooms[room_code]
        
        # Remover jugador
        room["players"] = [p for p in room["players"] if p["player_id"] != player_id]
        
        # Remover conexión WebSocket si existe
        if player_id in self.player_connections[room_code]:
            del self.player_connections[room_code][player_id]
        
        # Remover del estado del juego
        if player_id in self.game_state[room_code]["scores"]:
            del self.game_state[room_code]["scores"][player_id]
        
        # Si no hay jugadores, limpiar sala después de un tiempo
        if not room["players"]:
            # Podríamos programar limpieza aquí
            pass
        
        return True
    
    def start_game(self, room_code: str) -> bool:
        """Inicia el juego en una sala"""
        if room_code not in self.rooms:
            return False
        
        room = self.rooms[room_code]
        
        if room["status"] != "waiting":
            return False
        
        room["status"] = "active"
        room["started_at"] = datetime.now().isoformat()
        room["current_question"] = 0
        
        return True
    
    def submit_answer(self, room_code: str, player_id: int, 
                     question_id: int, answer: str, is_correct: bool, points: int) -> bool:
        """Registra una respuesta de un jugador"""
        if room_code not in self.rooms or room_code not in self.game_state:
            return False
        
        # Registrar respuesta
        if question_id not in self.game_state[room_code]["answers"]:
            self.game_state[room_code]["answers"][question_id] = {}
        
        self.game_state[room_code]["answers"][question_id][player_id] = {
            "answer": answer,
            "is_correct": is_correct,
            "points": points if is_correct else 0,
            "timestamp": datetime.now().isoformat()
        }
        
        # Actualizar puntuación
        if is_correct:
            self.game_state[room_code]["scores"][player_id] = \
                self.game_state[room_code]["scores"].get(player_id, 0) + points
        
        # Actualizar en lista de jugadores
        for player in self.rooms[room_code]["players"]:
            if player["player_id"] == player_id:
                player["score"] = self.game_state[room_code]["scores"][player_id]
                player["answers"].append({
                    "question_id": question_id,
                    "answer": answer,
                    "is_correct": is_correct,
                    "points": points if is_correct else 0
                })
                break
        
        return True
    
    def get_leaderboard(self, room_code: str) -> List[Dict]:
        """Obtiene el ranking de una sala"""
        if room_code not in self.rooms:
            return []
        
        players = self.rooms[room_code]["players"].copy()
        players.sort(key=lambda x: x["score"], reverse=True)
        
        leaderboard = []
        for i, player in enumerate(players):
            leaderboard.append({
                "position": i + 1,
                "player_id": player["player_id"],
                "player_name": player["player_name"],
                "score": player["score"],
                "total_answers": len(player["answers"]),
                "correct_answers": sum(1 for a in player["answers"] if a["is_correct"])
            })
        
        return leaderboard
    
    def get_room_stats(self, room_code: str) -> Optional[Dict]:
        """Obtiene estadísticas de una sala"""
        if room_code not in self.rooms:
            return None
        
        room = self.rooms[room_code]
        leaderboard = self.get_leaderboard(room_code)
        
        return {
            "room_code": room_code,
            "status": room["status"],
            "total_players": len(room["players"]),
            "max_players": room["max_players"],
            "current_question": room["current_question"],
            "total_questions": room["total_questions"],
            "leaderboard": leaderboard,
            "created_at": room["created_at"],
            "started_at": room["started_at"],
            "finished_at": room["finished_at"]
        }
    
    def finish_game(self, room_code: str) -> bool:
        """Finaliza el juego en una sala"""
        if room_code not in self.rooms:
            return False
        
        self.rooms[room_code]["status"] = "finished"
        self.rooms[room_code]["finished_at"] = datetime.now().isoformat()
        
        return True
    
    def cleanup_old_rooms(self, hours_old: int = 24):
        """Limpia salas antiguas (para mantenimiento)"""
        now = datetime.now()
        rooms_to_remove = []
        
        for room_code, room in self.rooms.items():
            created_at = datetime.fromisoformat(room["created_at"])
            hours_passed = (now - created_at).total_seconds() / 3600
            
            if hours_passed > hours_old:
                rooms_to_remove.append(room_code)
        
        for room_code in rooms_to_remove:
            self.cleanup_room(room_code)
    
    def cleanup_room(self, room_code: str):
        """Limpia completamente una sala"""
        if room_code in self.rooms:
            del self.rooms[room_code]
        if room_code in self.player_connections:
            del self.player_connections[room_code]
        if room_code in self.game_state:
            del self.game_state[room_code]

# Instancia global del gestor de juegos
game_manager = GameManager()