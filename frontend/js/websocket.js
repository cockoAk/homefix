//Clase para manejar conexiones WebSocket con el backend
//Esta clase es usada tanto por game-room.html como por game-lobby.html <-- recordar esto

class GameWebSocket {
    constructor(roomCode, playerId, playerName, isHost = false) {
        this.roomCode = roomCode;
        this.playerId = playerId;
        this.playerName = playerName;
        this.isHost = isHost;
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Callbacks
        this.onConnect = null;
        this.onDisconnect = null;
        this.onMessage = null;
        this.onError = null;
        
        // Event listeners específicos
        this.eventListeners = {
            'player_joined': [],
            'player_left': [],
            'game_started': [],
            'next_question': [],
            'answer_received': [],
            'show_results': [],
            'game_over': [],
            'player_answer': [],
            'time_update': [],
            'leaderboard_update': []
        };
    }
    
    // Conectar al servidor WebSocket
    connect() {
        try {
            // Construir URL de WebSocket
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.hostname}:8000/game/ws/${this.roomCode}/${this.playerId}`;
            
            console.log(`🔗 Conectando WebSocket a: ${wsUrl}`);
            
            this.socket = new WebSocket(wsUrl);
            
            // Configurar event handlers
            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onerror = this.handleError.bind(this);
            
        } catch (error) {
            console.error('❌ Error creando WebSocket:', error);
            this.triggerError(error.message);
        }
    }
    
    // Manejar conexión exitosa
    handleOpen(event) {
        console.log('✅ WebSocket conectado');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Notificar al servidor que nos hemos unido
        this.send({
            type: 'player_joined',
            player_id: this.playerId,
            player_name: this.playerName,
            is_host: this.isHost,
            timestamp: Date.now()
        });
        
        // Ejecutar callback onConnect si existe
        if (this.onConnect) {
            this.onConnect(event);
        }
    }
    
    // Manejar cierre de conexión
    handleClose(event) {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        this.connected = false;
        
        // Intentar reconectar si no fue un cierre intencional
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
        }
        
        // Ejecutar callback onDisconnect si existe
        if (this.onDisconnect) {
            this.onDisconnect(event);
        }
    }
    
    // Manejar mensajes recibidos
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('📩 Mensaje WebSocket recibido:', data);
            
            // Ejecutar callback general onMessage si existe
            if (this.onMessage) {
                this.onMessage(data);
            }
            
            // Ejecutar listeners específicos para este tipo de mensaje
            if (data.type && this.eventListeners[data.type]) {
                this.eventListeners[data.type].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error en listener para ${data.type}:`, error);
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ Error procesando mensaje WebSocket:', error, event.data);
        }
    }
    
    // Manejar errores
    handleError(event) {
        console.error('❌ Error en WebSocket:', event);
        this.triggerError('Error de conexión WebSocket');
    }
    
    // Enviar mensaje al servidor
    send(data) {
        if (!this.connected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket no está conectado, no se puede enviar:', data);
            return false;
        }
        
        try {
            const message = JSON.stringify(data);
            this.socket.send(message);
            console.log('📤 Mensaje WebSocket enviado:', data);
            return true;
        } catch (error) {
            console.error('❌ Error enviando mensaje WebSocket:', error);
            this.triggerError('Error enviando mensaje');
            return false;
        }
    }
    
    // Reconectar automáticamente
    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('🚫 Máximo de reconexiones alcanzado');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        
        console.log(`🔄 Intentando reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts} en ${delay}ms`);
        
        setTimeout(() => {
            if (!this.connected) {
                this.connect();
            }
        }, delay);
    }
    
    // Desconectar intencionalmente
    disconnect() {
        if (this.socket) {
            this.socket.close(1000, 'Desconexión intencional');
        }
        this.connected = false;
    }
    
    // Registrar listener para tipo específico de mensaje
    on(eventType, callback) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType].push(callback);
        } else {
            console.warn(`⚠️ Tipo de evento no reconocido: ${eventType}`);
        }
    }
    
    // Remover listener
    off(eventType, callback) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType] = this.eventListeners[eventType].filter(cb => cb !== callback);
        }
    }
    
    // Disparar error
    triggerError(message) {
        if (this.onError) {
            this.onError(new Error(message));
        }
    }
    
    // ============ MÉTODOS ESPECÍFICOS DEL JUEGO ============
    
    // Enviar respuesta a pregunta
    submitAnswer(questionId, answer, responseTime) {
        return this.send({
            type: 'answer',
            question_id: questionId,
            answer: answer,
            response_time: responseTime,
            player_id: this.playerId,
            timestamp: Date.now()
        });
    }
    
    // Host: Solicitar siguiente pregunta
    requestNextQuestion(questionData = null) {
        if (!this.isHost) {
            console.warn('⚠️ Solo el host puede solicitar siguiente pregunta');
            return false;
        }
        
        return this.send({
            type: 'next_question',
            question: questionData,
            timestamp: Date.now()
        });
    }
    
    // Host: Mostrar resultados de pregunta actual
    showResults(correctAnswer, stats = {}) {
        if (!this.isHost) {
            console.warn('⚠️ Solo el host puede mostrar resultados');
            return false;
        }
        
        return this.send({
            type: 'show_results',
            correct_answer: correctAnswer,
            stats: stats,
            timestamp: Date.now()
        });
    }
    
    // Host: Terminar juego
    endGame(finalLeaderboard = []) 
    {
        if (!this.isHost) {
            console.warn('⚠️ Solo el host puede terminar el juego');
            return false;
        }
        
        return this.send({
            type: 'game_over',
            leaderboard: finalLeaderboard,
            timestamp: Date.now()
        });
    }
    
    // Host: Iniciar juego
    startGame(quizData = null) 
    {
        if (!this.isHost) {
            console.warn('⚠️ Solo el host puede iniciar el juego');
            return false;
        }
        
        return this.send({
            type: 'game_started',
            quiz: quizData,
            timestamp: Date.now()
        });
    }
    
    // Enviar mensaje de chat
    sendChatMessage(message) 
    {
        return this.send({
            type: 'chat_message',
            message: message,
            player_id: this.playerId,
            player_name: this.playerName,
            timestamp: Date.now()
        });
    }
    
    // Actualizar estado de jugador (listo/no listo)
    updatePlayerStatus(isReady)
    {
        return this.send({
            type: 'player_status',
            player_id: this.playerId,
            is_ready: isReady,
            timestamp: Date.now()
        });
    }
    
    // ============ UTILIDADES ============
    
    // Verificar estado de conexión
    isConnected() {
        return this.connected && this.socket && this.socket.readyState === WebSocket.OPEN;
    }
    
    // Obtener tiempo de ping
    ping() {
        if (!this.isConnected()) return null;
        
        const startTime = Date.now();
        this.send({ type: 'ping', timestamp: startTime });
        
        //ver respuesta de ping
        return new Promise((resolve) => {
            const pingListener = (data) => {
                if (data.type === 'pong' && data.timestamp === startTime) {
                    this.off('pong', pingListener);
                    resolve(Date.now() - startTime);
                }
            };
            
            this.on('pong', pingListener);
            
            // Timeout después de 5 segundos
            setTimeout(() => {
                this.off('pong', pingListener);
                resolve(null);
            }, 5000);
        });
    }
}

// Helper para obtener parámetros de URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const paramsObj = {};
    
    for (const [key, value] of params.entries()) {
        paramsObj[key] = value;
    }
    
    return paramsObj;
}

// Helper para obtener información jugador
function getPlayerInfo() {
    const params = getUrlParams();
    const sessionPlayerId = sessionStorage.getItem('player_id');
    const sessionPlayerName = sessionStorage.getItem('player_name');
    const authUser = window.auth?.getUser();
    
    return {
        roomCode: params.room || sessionStorage.getItem('current_room'),
        playerId: params.player || sessionPlayerId || authUser?.id || `guest_${Date.now()}`,
        playerName: params.name || sessionPlayerName || authUser?.full_name || 'Jugador',
        isHost: params.host === 'true' || sessionStorage.getItem('is_host') === 'true'
    };
}

// Inicializar WebSocket automáticamente si estamos en una página de juego
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar en páginas de juego
    const isGamePage = window.location.pathname.includes('game-room') || 
                    window.location.pathname.includes('game-lobby');
    
    if (isGamePage && !window.gameSocket) {
        const playerInfo = getPlayerInfo();
        
        if (playerInfo.roomCode) {
            window.gameSocket = new GameWebSocket(
                playerInfo.roomCode,
                playerInfo.playerId,
                playerInfo.playerName,
                playerInfo.isHost
            );
            
            // Conectar automáticamente
            window.gameSocket.connect();
            
            // Manejar cierre de página
            window.addEventListener('beforeunload', function() {
                if (window.gameSocket && window.gameSocket.isConnected()) {
                    window.gameSocket.disconnect();
                }
            });
            
        } else {
            console.error('❌ No se encontró código de sala');
            alert('Error: No se encontró código de sala. Redirigiendo al dashboard.');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
    }
});

// Exportar para uso global
window.GameWebSocket = GameWebSocket;
window.getPlayerInfo = getPlayerInfo;