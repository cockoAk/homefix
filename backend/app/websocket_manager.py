from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.player_info: Dict[str, Dict] = {}  # room_code -> {player_id: info}
    
    async def connect(self, websocket: WebSocket, room_code: str):
        await websocket.accept()
        
        if room_code not in self.active_connections:
            self.active_connections[room_code] = []
            self.player_info[room_code] = {}
        
        self.active_connections[room_code].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self.active_connections:
            self.active_connections[room_code].remove(websocket)
            if not self.active_connections[room_code]:
                del self.active_connections[room_code]
                if room_code in self.player_info:
                    del self.player_info[room_code]
    
    async def broadcast_to_room(self, room_code: str, message: dict):
        """Envía mensaje a todos en la sala"""
        if room_code in self.active_connections:
            disconnected = []
            for connection in self.active_connections[room_code]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            # Eliminar conexiones desconectadas
            for connection in disconnected:
                self.active_connections[room_code].remove(connection)
    
    async def send_to_player(self, room_code: str, player_id: int, message: dict):
        """Envía mensaje a un jugador específico (si implementamos identificación)"""
        # Para implementación futura
        pass
    
    def register_player(self, room_code: str, player_id: int, player_name: str):
        """Registra información de un jugador en la sala"""
        if room_code not in self.player_info:
            self.player_info[room_code] = {}
        
        self.player_info[room_code][player_id] = {
            "name": player_name,
            "score": 0,
            "connected": True
        }
    
    def update_player_score(self, room_code: str, player_id: int, points: int):
        """Actualiza puntuación de un jugador"""
        if (room_code in self.player_info and 
            player_id in self.player_info[room_code]):
            self.player_info[room_code][player_id]["score"] += points
    
    def get_room_players(self, room_code: str) -> List[Dict]:
        """Obtiene lista de jugadores en una sala"""
        if room_code not in self.player_info:
            return []
        
        players = []
        for player_id, info in self.player_info[room_code].items():
            players.append({
                "player_id": player_id,
                "name": info["name"],
                "score": info["score"],
                "connected": info["connected"]
            })
        
        return sorted(players, key=lambda x: x["score"], reverse=True)

# Instancia global
connection_manager = ConnectionManager()