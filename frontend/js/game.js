/**
 * Lógica del juego para estudiantes (game-room.html)
 * Maneja pantallas, preguntas, respuestas y WebSocket
 */

class GameClient {
    constructor() {
        // Estado del juego
        this.gameState = {
            roomCode: null,
            playerId: null,
            playerName: null,
            isHost: false,
            gameStatus: 'waiting', // waiting, active, question, results, finished
            currentQuestion: null,
            currentQuestionIndex: 0,
            totalQuestions: 0,
            selectedAnswer: null,
            hasAnswered: false,
            score: 0,
            players: [],
            leaderboard: [],
            timer: 0,
            timerInterval: null
        };
        
        // Referencias a elementos DOM
        this.elements = {};
        
        // WebSocket
        this.ws = null;
        
        // Inicializar
        this.init();
    }
    
    // Inicializar el juego
    async init() {
        console.log('🎮 Inicializando cliente de juego...');
        
        // Obtener información del jugador
        const playerInfo = getPlayerInfo();
        this.gameState.roomCode = playerInfo.roomCode;
        this.gameState.playerId = playerInfo.playerId;
        this.gameState.playerName = playerInfo.playerName;
        this.gameState.isHost = playerInfo.isHost;
        
        // Verificar que tenemos código de sala
        if (!this.gameState.roomCode) {
            alert('Error: No se encontró código de sala');
            window.location.href = 'dashboard.html';
            return;
        }
        
        // Obtener referencias a elementos DOM
        this.cacheElements();
        
        // Configurar elementos iniciales
        this.setupInitialUI();
        
        // Configurar WebSocket
        this.setupWebSocket();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Intentar cargar información de la sala desde API
        await this.loadRoomInfo();
        
        console.log('✅ Cliente de juego inicializado');
    }
    
    // Obtener referencias a elementos DOM
    cacheElements() {
        this.elements = {
            // Header
            roomName: document.getElementById('room-name'),
            roomCodeDisplay: document.getElementById('room-code-display'),
            roomStatus: document.getElementById('room-status'),
            playerCount: document.getElementById('player-count'),
            playerName: document.getElementById('player-name'),
            playerScore: document.getElementById('player-score'),
            leaveRoomBtn: document.getElementById('leave-room-btn'),
            
            // Pantallas
            waitingScreen: document.getElementById('waiting-screen'),
            questionScreen: document.getElementById('question-screen'),
            resultsScreen: document.getElementById('results-screen'),
            finalScreen: document.getElementById('final-screen'),
            
            // Pantalla de espera
            waitingMessage: document.getElementById('waiting-message'),
            playersList: document.getElementById('players-list'),
            codeBox: document.getElementById('code-box'),
            
            // Pantalla de pregunta
            currentQuestion: document.getElementById('current-question'),
            totalQuestions: document.getElementById('total-questions'),
            questionText: document.getElementById('question-text'),
            optionsContainer: document.getElementById('options-container'),
            timer: document.getElementById('timer'),
            timerProgress: document.querySelector('.timer-progress'),
            questionPoints: document.getElementById('question-points'),
            answeredCount: document.getElementById('answered-count'),
            totalPlayers: document.getElementById('total-players'),
            submitAnswerBtn: document.getElementById('submit-answer-btn'),
            
            // Pantalla de resultados
            answerFeedback: document.getElementById('answer-feedback'),
            correctAnswerText: document.getElementById('correct-answer-text'),
            pointsEarned: document.getElementById('points-earned'),
            correctPercentage: document.getElementById('correct-percentage'),
            fastestTime: document.getElementById('fastest-time'),
            yourTime: document.getElementById('your-time'),
            miniLeaderboard: document.getElementById('mini-leaderboard'),
            nextQuestionBtn: document.getElementById('next-question-btn'),
            
            // Pantalla final
            finalPlayerScore: document.getElementById('final-player-score'),
            finalPlayerPosition: document.getElementById('final-player-position'),
            finalPlayerName: document.getElementById('final-player-name'),
            finalLeaderboard: document.getElementById('final-leaderboard'),
            playAgainBtn: document.getElementById('play-again-btn'),
            backToDashboardBtn: document.getElementById('back-to-dashboard-btn'),
            
            // Chat
            openChatBtn: document.getElementById('open-chat-btn'),
            closeChatBtn: document.getElementById('close-chat-btn'),
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            sendChatBtn: document.getElementById('send-chat-btn'),
            chatNotification: document.getElementById('chat-notification')
        };
    }
    
    // Configurar UI inicial
    setupInitialUI() {
        // Mostrar información de sala
        if (this.elements.roomCodeDisplay) {
            const code = this.gameState.roomCode;
            this.elements.roomCodeDisplay.textContent = `Código: ${code}`;
        }
        
        if (this.elements.codeBox) {
            const code = this.gameState.roomCode;
            const formattedCode = code.replace(/(.{4})/g, '$1 ').trim();
            this.elements.codeBox.textContent = formattedCode;
        }
        
        // Mostrar nombre del jugador
        if (this.elements.playerName) {
            this.elements.playerName.textContent = this.gameState.playerName;
        }
        
        if (this.elements.finalPlayerName) {
            this.elements.finalPlayerName.textContent = this.gameState.playerName;
        }
        
        // Mostrar puntuación inicial
        this.updateScore(0);
        
        // Mostrar pantalla de espera por defecto
        this.showScreen('waiting');
    }
    
    // Configurar WebSocket
    setupWebSocket() {
        // Usar la instancia global de WebSocket
        this.ws = window.gameSocket;
        
        if (!this.ws) {
            console.error('❌ WebSocket no disponible');
            return;
        }
        
        // Configurar callbacks
        this.ws.onConnect = () => {
            console.log('✅ Conectado al juego');
            this.updateStatus('Conectado', 'connected');
        };
        
        this.ws.onDisconnect = () => {
            console.log('🔌 Desconectado del juego');
            this.updateStatus('Desconectado', 'disconnected');
            this.showMessage('Se perdió la conexión. Intentando reconectar...', 'warning');
        };
        
        this.ws.onError = (error) => {
            console.error('❌ Error de WebSocket:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        };
        
        // Configurar listeners de eventos específicos
        this.setupWebSocketListeners();
    }
    
    // Configurar listeners de WebSocket
    setupWebSocketListeners() {
        if (!this.ws) return;
        
        // Jugador se unió
        this.ws.on('player_joined', (data) => {
            this.addPlayerToList(data);
            this.updatePlayerCount();
            this.showNotification(`${data.player_name} se ha unido`, 'info');
        });
        
        // Jugador se fue
        this.ws.on('player_left', (data) => {
            this.removePlayerFromList(data.player_id);
            this.updatePlayerCount();
            this.showNotification(`${data.player_name} se ha ido`, 'info');
        });
        
        // Juego iniciado
        this.ws.on('game_started', (data) => {
            this.onGameStarted(data);
        });
        
        // Nueva pregunta
        this.ws.on('next_question', (data) => {
            this.onNextQuestion(data);
        });
        
        // Resultados de pregunta
        this.ws.on('show_results', (data) => {
            this.onShowResults(data);
        });
        
        // Juego terminado
        this.ws.on('game_over', (data) => {
            this.onGameOver(data);
        });
        
        // Actualización de ranking
        this.ws.on('leaderboard_update', (data) => {
            this.updateLeaderboard(data.leaderboard);
        });
        
        // Actualización de tiempo
        this.ws.on('time_update', (data) => {
            this.updateTimer(data.time_left);
        });
        
        // Respuesta de jugador (para mostrar estadísticas en tiempo real)
        this.ws.on('answer_received', (data) => {
            if (data.player_id !== this.gameState.playerId) {
                this.updateAnsweredCount();
            }
        });
        
        // Mensaje de chat
        this.ws.on('chat_message', (data) => {
            this.addChatMessage(data);
        });
    }
    
    // Configurar event listeners de UI
    setupEventListeners() {
        // Botón para salir
        if (this.elements.leaveRoomBtn) {
            this.elements.leaveRoomBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres salir de la sala?')) {
                    this.leaveRoom();
                }
            });
        }
        
        // Botón para enviar respuesta
        if (this.elements.submitAnswerBtn) {
            this.elements.submitAnswerBtn.addEventListener('click', () => {
                this.submitAnswer();
            });
        }
        
        // Botón para siguiente pregunta (solo host)
        if (this.elements.nextQuestionBtn) {
            this.elements.nextQuestionBtn.addEventListener('click', () => {
                if (this.gameState.isHost) {
                    this.ws.requestNextQuestion();
                }
            });
        }
        
        // Botones de acción final
        if (this.elements.playAgainBtn) {
            this.elements.playAgainBtn.addEventListener('click', () => {
                // Recargar página para jugar otra vez
                window.location.reload();
            });
        }
        
        if (this.elements.backToDashboardBtn) {
            this.elements.backToDashboardBtn.addEventListener('click', () => {
                window.location.href = 'dashboard.html';
            });
        }
        
        // Chat
        if (this.elements.openChatBtn) {
            this.elements.openChatBtn.addEventListener('click', () => {
                this.toggleChat();
            });
        }
        
        if (this.elements.closeChatBtn) {
            this.elements.closeChatBtn.addEventListener('click', () => {
                this.toggleChat();
            });
        }
        
        if (this.elements.sendChatBtn && this.elements.chatInput) {
            this.elements.sendChatBtn.addEventListener('click', () => {
                this.sendChatMessage();
            });
            
            this.elements.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
    }
    
    // Cargar información de la sala desde API
    async loadRoomInfo() {
        try {
            const roomCode = this.gameState.roomCode;
            const response = await window.quizAPI.getGame(roomCode);
            
            if (response) {
                // Actualizar estado del juego
                this.gameState.gameStatus = response.status;
                this.updateStatus(response.status === 'active' ? 'En juego' : 'Esperando', response.status);
                
                // Actualizar nombre de sala si existe
                if (response.room_name && this.elements.roomName) {
                    this.elements.roomName.textContent = response.room_name;
                }
                
                // Cargar jugadores si están disponibles
                if (response.players) {
                    this.gameState.players = response.players;
                    this.updatePlayersList();
                    this.updatePlayerCount();
                }
                
                // Si el juego ya está activo, cargar pregunta actual
                if (response.status === 'active' && response.current_question > 0) {
                    // En una implementación real, cargaríamos la pregunta actual
                    // Por ahora, mostramos pantalla de espera
                    this.showMessage('El juego ya comenzó. Esperando siguiente pregunta...', 'info');
                }
            }
        } catch (error) {
            console.error('Error cargando información de sala:', error);
        }
    }
    
    // ============ MANEJADORES DE EVENTOS WEBSOCKET ============ //
    
    // Juego iniciado
    onGameStarted(data) {
        console.log('🚀 Juego iniciado:', data);
        this.gameState.gameStatus = 'active';
        this.gameState.totalQuestions = data.quiz?.questions?.length || 10;
        
        this.updateStatus('En juego', 'active');
        this.showScreen('question');
        this.showNotification('¡El juego ha comenzado!', 'success');
        
        // Si hay datos del quiz, preparar primera pregunta
        if (data.quiz) {
            // En una implementación completa, cargaríamos el quiz completo
        }
    }
    
    // Nueva pregunta recibida
    onNextQuestion(data) {
        console.log('❓ Nueva pregunta:', data);
        this.gameState.gameStatus = 'question';
        this.gameState.currentQuestion = data.question;
        this.gameState.currentQuestionIndex = data.question_number || (this.gameState.currentQuestionIndex + 1);
        this.gameState.selectedAnswer = null;
        this.gameState.hasAnswered = false;
        this.gameState.timer = data.question?.time_limit || 30;
        
        // Mostrar pantalla de pregunta
        this.showScreen('question');
        
        // Actualizar UI de pregunta
        this.updateQuestionUI();
        
        // Iniciar temporizador
        this.startTimer();
        
        // Mostrar notificación
        this.showNotification(`Pregunta ${this.gameState.currentQuestionIndex}`, 'info');
    }
    
    // Mostrar resultados de pregunta
    onShowResults(data) {
        console.log('📊 Mostrando resultados:', data);
        this.gameState.gameStatus = 'results';
        
        // Detener temporizador
        this.stopTimer();
        
        // Mostrar pantalla de resultados
        this.showScreen('results');
        
        // Actualizar UI de resultados
        this.updateResultsUI(data);
        
        // Habilitar botón de siguiente pregunta si somos host
        if (this.gameState.isHost && this.elements.nextQuestionBtn) {
            this.elements.nextQuestionBtn.classList.remove('hidden');
        }
    }
    
    // Juego terminado
    onGameOver(data) {
        console.log('🏁 Juego terminado:', data);
        this.gameState.gameStatus = 'finished';
        
        // Detener temporizador si está corriendo
        this.stopTimer();
        
        // Actualizar ranking final
        if (data.leaderboard) {
            this.gameState.leaderboard = data.leaderboard;
            
            // Encontrar posición del jugador actual
            const playerPosition = this.gameState.leaderboard.findIndex(
                player => player.player_id === this.gameState.playerId
            );
            
            // Actualizar UI final
            this.updateFinalUI(playerPosition);
        }
        
        // Mostrar pantalla final
        this.showScreen('final');
        
        // Mostrar notificación
        this.showNotification('¡Juego terminado!', 'success');
        window.ui?.showConfetti?.();
    }
    
    // ============ MÉTODOS DE UI ============ //
    
    // Mostrar pantalla específica
    showScreen(screenName) {
        // Ocultar todas las pantallas
        if (this.elements.waitingScreen) this.elements.waitingScreen.classList.add('hidden');
        if (this.elements.questionScreen) this.elements.questionScreen.classList.add('hidden');
        if (this.elements.resultsScreen) this.elements.resultsScreen.classList.add('hidden');
        if (this.elements.finalScreen) this.elements.finalScreen.classList.add('hidden');
        
        // Mostrar pantalla solicitada
        switch (screenName) {
            case 'waiting':
                if (this.elements.waitingScreen) this.elements.waitingScreen.classList.remove('hidden');
                break;
            case 'question':
                if (this.elements.questionScreen) this.elements.questionScreen.classList.remove('hidden');
                break;
            case 'results':
                if (this.elements.resultsScreen) this.elements.resultsScreen.classList.remove('hidden');
                break;
            case 'final':
                if (this.elements.finalScreen) this.elements.finalScreen.classList.remove('hidden');
                break;
        }
    }
    
    // Actualizar UI de pregunta
    updateQuestionUI() {
        const question = this.gameState.currentQuestion;
        if (!question) return;
        
        // Actualizar contador de preguntas
        if (this.elements.currentQuestion && this.elements.totalQuestions) {
            this.elements.currentQuestion.textContent = this.gameState.currentQuestionIndex;
            this.elements.totalQuestions.textContent = this.gameState.totalQuestions;
        }
        
        // Actualizar texto de pregunta
        if (this.elements.questionText) {
            this.elements.questionText.textContent = question.pregunta || question.question_text;
        }
        
        // Actualizar puntos
        if (this.elements.questionPoints) {
            this.elements.questionPoints.textContent = question.puntos || question.points || 10;
        }
        
        // Actualizar opciones
        if (this.elements.optionsContainer) {
            this.elements.optionsContainer.innerHTML = '';
            
            const options = question.opciones || question.options;
            if (options && typeof options === 'object') {
                Object.entries(options).forEach(([letter, text]) => {
                    const optionBtn = this.createOptionButton(letter, text);
                    this.elements.optionsContainer.appendChild(optionBtn);
                });
            }
        }
        
        // Reiniciar contador de respuestas
        this.updateAnsweredCount();
        
        // Deshabilitar botón de enviar
        if (this.elements.submitAnswerBtn) {
            this.elements.submitAnswerBtn.disabled = true;
            this.elements.submitAnswerBtn.textContent = 'Selecciona una respuesta';
        }
    }
    
    // Crear botón de opción
    createOptionButton(letter, text) {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.innerHTML = `
            <div class="option-letter">${letter}</div>
            <div class="option-text">${text}</div>
        `;
        
        button.addEventListener('click', () => {
            if (this.gameState.hasAnswered) return;
            
            // Deseleccionar todas las opciones
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Seleccionar esta opción
            button.classList.add('selected');
            this.gameState.selectedAnswer = letter;
            
            // Habilitar botón de enviar
            if (this.elements.submitAnswerBtn) {
                this.elements.submitAnswerBtn.disabled = false;
                this.elements.submitAnswerBtn.textContent = 'Enviar respuesta';
            }
        });
        
        return button;
    }
    
    // Actualizar UI de resultados
    updateResultsUI(data) {
        const question = this.gameState.currentQuestion;
        const selectedAnswer = this.gameState.selectedAnswer;
        const correctAnswer = data.correct_answer || question?.respuesta_correcta;
        
        // Determinar si la respuesta fue correcta
        const isCorrect = selectedAnswer === correctAnswer;
        const pointsEarned = isCorrect ? (question?.puntos || 10) : 0;
        
        // Actualizar puntuación
        if (isCorrect) {
            this.updateScore(this.gameState.score + pointsEarned);
        }
        
        // Actualizar feedback
        if (this.elements.answerFeedback) {
            const icon = this.elements.answerFeedback.querySelector('.feedback-icon');
            const title = this.elements.answerFeedback.querySelector('h3');
            const feedbackText = this.elements.correctAnswerText;
            const pointsElement = this.elements.pointsEarned;
            
            if (icon) {
                icon.className = `feedback-icon ${isCorrect ? 'correct' : 'incorrect'}`;
                icon.innerHTML = `<i class="fas fa-${isCorrect ? 'check' : 'times'}-circle"></i>`;
            }
            
            if (title) {
                title.textContent = isCorrect ? '¡Correcto!' : 'Incorrecto';
            }
            
            if (feedbackText) {
                const correctText = question?.explicacion || `La respuesta correcta es: ${correctAnswer}`;
                feedbackText.textContent = isCorrect 
                    ? '¡Tu respuesta fue correcta!' 
                    : correctText;
            }
            
            if (pointsElement) {
                pointsElement.textContent = pointsEarned;
            }
        }
        
        // Actualizar estadísticas
        if (data.stats) {
            if (this.elements.correctPercentage) {
                this.elements.correctPercentage.textContent = `${data.stats.correct_percentage || 0}%`;
            }
            if (this.elements.fastestTime) {
                this.elements.fastestTime.textContent = `${data.stats.fastest_time || 0}s`;
            }
        }
        
        // Actualizar tiempo del jugador
        if (this.elements.yourTime) {
            // En una implementación real, tendríamos el tiempo de respuesta
            this.elements.yourTime.textContent = '--s';
        }
        
        // Actualizar mini leaderboard
        if (data.leaderboard && this.elements.miniLeaderboard) {
            this.updateMiniLeaderboard(data.leaderboard.slice(0, 5));
        }
        
        // Resaltar opción correcta/incorrecta
        if (this.elements.optionsContainer) {
            const options = this.elements.optionsContainer.querySelectorAll('.option-btn');
            options.forEach(optionBtn => {
                const optionLetter = optionBtn.querySelector('.option-letter').textContent;
                
                if (optionLetter === correctAnswer) {
                    optionBtn.classList.add('correct');
                } else if (optionLetter === selectedAnswer && !isCorrect) {
                    optionBtn.classList.add('incorrect');
                }
                
                optionBtn.disabled = true;
            });
        }
    }
    
    // Actualizar UI final
    updateFinalUI(playerPosition) {
        // Actualizar puntuación final
        if (this.elements.finalPlayerScore) {
            this.elements.finalPlayerScore.textContent = this.gameState.score;
        }
        
        // Actualizar posición
        if (this.elements.finalPlayerPosition) {
            const positions = ['1er', '2do', '3er', '4to', '5to', '6to', '7mo', '8vo', '9no', '10mo'];
            const positionText = playerPosition >= 0 && playerPosition < positions.length 
                ? `${positions[playerPosition]} lugar`
                : `${playerPosition + 1}° lugar`;
            
            this.elements.finalPlayerPosition.textContent = positionText;
        }
        
        // Actualizar leaderboard final
        if (this.elements.finalLeaderboard && this.gameState.leaderboard) {
            this.updateFinalLeaderboard(this.gameState.leaderboard);
        }
    }
    
    // ============ MÉTODOS DEL JUEGO ============ //
    
    // Enviar respuesta
    submitAnswer() {
        if (!this.gameState.selectedAnswer || this.gameState.hasAnswered) {
            return;
        }
        
        const question = this.gameState.currentQuestion;
        if (!question) return;
        
        // Calcular tiempo de respuesta (simulado por ahora)
        const timeLeft = this.gameState.timer;
        const responseTime = 30 - timeLeft; // 30 segundos totales
        
        // Enviar respuesta por WebSocket
        if (this.ws) {
            const success = this.ws.submitAnswer(
                question.id,
                this.gameState.selectedAnswer,
                responseTime
            );
            
            if (success) {
                this.gameState.hasAnswered = true;
                
                // Deshabilitar botón de enviar
                if (this.elements.submitAnswerBtn) {
                    this.elements.submitAnswerBtn.disabled = true;
                    this.elements.submitAnswerBtn.textContent = 'Respuesta enviada';
                }
                
                // Deshabilitar todas las opciones
                document.querySelectorAll('.option-btn').forEach(btn => {
                    btn.disabled = true;
                });
                
                // Mostrar confirmación
                this.showNotification('¡Respuesta enviada!', 'success');
            }
        }
    }
    
    // Iniciar temporizador
    startTimer() {
        this.stopTimer(); // Detener cualquier timer existente
        
        this.gameState.timer = this.gameState.currentQuestion?.time_limit || 30;
        
        if (this.elements.timer) {
            this.elements.timer.textContent = this.gameState.timer;
        }
        
        // Actualizar círculo de progreso
        this.updateTimerCircle(100);
        
        this.gameState.timerInterval = setInterval(() => {
            this.gameState.timer--;
            
            // Actualizar display
            if (this.elements.timer) {
                this.elements.timer.textContent = this.gameState.timer;
            }
            
            // Actualizar círculo de progreso
            const percentage = (this.gameState.timer / 30) * 100;
            this.updateTimerCircle(percentage);
            
            // Si el tiempo se acaba, enviar respuesta automáticamente
            if (this.gameState.timer <= 0) {
                this.stopTimer();
                
                if (!this.gameState.hasAnswered && this.gameState.selectedAnswer) {
                    // Enviar respuesta automáticamente
                    this.submitAnswer();
                } else if (!this.gameState.hasAnswered) {
                    // Mostrar mensaje de tiempo agotado
                    this.showNotification('¡Tiempo agotado!', 'warning');
                }
            }
        }, 1000);
    }
    
    // Detener temporizador
    stopTimer() {
        if (this.gameState.timerInterval) {
            clearInterval(this.gameState.timerInterval);
            this.gameState.timerInterval = null;
        }
    }
    
    // Actualizar círculo del temporizador
    updateTimerCircle(percentage) {
        if (this.elements.timerProgress) {
            const circumference = 2 * Math.PI * 36; // radio 36
            const offset = circumference - (percentage / 100) * circumference;
            this.elements.timerProgress.style.strokeDashoffset = offset;
        }
    }
    
    // Actualizar temporizador desde WebSocket
    updateTimer(timeLeft) {
        this.gameState.timer = timeLeft;
        
        if (this.elements.timer) {
            this.elements.timer.textContent = timeLeft;
        }
        
        // Actualizar círculo de progreso
        const percentage = (timeLeft / 30) * 100;
        this.updateTimerCircle(percentage);
    }
    
    // ============ MÉTODOS DE JUGADORES ============ //
    
    // Agregar jugador a la lista
    addPlayerToList(data) {
        const player = {
            id: data.player_id,
            name: data.player_name,
            score: 0,
            isReady: false
        };
        
        // Verificar si el jugador ya existe
        const existingIndex = this.gameState.players.findIndex(p => p.id === player.id);
        if (existingIndex === -1) {
            this.gameState.players.push(player);
            this.updatePlayersList();
        }
    }
    
    // Remover jugador de la lista
    removePlayerFromList(playerId) {
        this.gameState.players = this.gameState.players.filter(p => p.id !== playerId);
        this.updatePlayersList();
    }
    
    // Actualizar lista de jugadores en UI
    updatePlayersList() {
        if (!this.elements.playersList) return;
        
        if (this.gameState.players.length === 0) {
            this.elements.playersList.innerHTML = `
                <div class="empty-players">
                    <i class="fas fa-user-clock"></i>
                    <p>Esperando jugadores...</p>
                </div>
            `;
            return;
        }
        
        this.elements.playersList.innerHTML = '';
        
        this.gameState.players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            playerElement.innerHTML = `
                <div class="player-avatar-small">
                    <i class="fas fa-user"></i>
                </div>
                <div class="player-details">
                    <div class="player-name">${player.name}</div>
                    <div class="player-status ${player.isReady ? 'ready' : 'connected'}">
                        <i class="fas fa-${player.isReady ? 'check' : 'user'}"></i>
                        ${player.isReady ? 'Listo' : 'Conectado'}
                    </div>
                </div>
                <div class="player-score">${player.score}</div>
            `;
            
            this.elements.playersList.appendChild(playerElement);
        });
    }
    
    // Actualizar contador de jugadores
    updatePlayerCount() {
        if (this.elements.playerCount) {
            this.elements.playerCount.textContent = this.gameState.players.length;
        }
        
        if (this.elements.totalPlayers) {
            this.elements.totalPlayers.textContent = this.gameState.players.length;
        }
    }
    
    // Actualizar contador de respuestas
    updateAnsweredCount() {
        if (this.elements.answeredCount) {
            // En una implementación real, contaríamos respuestas recibidas
            // Por ahora, simular progreso
            const answered = Math.min(
                this.gameState.players.length,
                Math.floor(Math.random() * this.gameState.players.length)
            );
            this.elements.answeredCount.textContent = answered;
        }
    }
    
    // ============ MÉTODOS DE PUNTUACIÓN ============
    
    // Actualizar puntuación
    updateScore(newScore) {
        this.gameState.score = newScore;
        
        if (this.elements.playerScore) {
            this.elements.playerScore.textContent = newScore;
        }
        
        if (this.elements.finalPlayerScore) {
            this.elements.finalPlayerScore.textContent = newScore;
        }
    }
    
    // Actualizar leaderboard
    updateLeaderboard(leaderboard) {
        this.gameState.leaderboard = leaderboard;
        // Se actualizará en la UI cuando sea necesario
    }
    
    // Actualizar mini leaderboard
    updateMiniLeaderboard(topPlayers) {
        if (!this.elements.miniLeaderboard) return;
        
        this.elements.miniLeaderboard.innerHTML = '';
        
        topPlayers.forEach((player, index) => {
            const position = index + 1;
            const isCurrentPlayer = player.player_id === this.gameState.playerId;
            
            const playerElement = document.createElement('div');
            playerElement.className = `leaderboard-item ${isCurrentPlayer ? 'current-player' : ''}`;
            playerElement.innerHTML = `
                <div class="leaderboard-position">${position}°</div>
                <div class="leaderboard-name">${player.player_name}</div>
                <div class="leaderboard-score">${player.score}</div>
            `;
            
            this.elements.miniLeaderboard.appendChild(playerElement);
        });
    }
    
    // Actualizar leaderboard final
    updateFinalLeaderboard(leaderboard) {
        if (!this.elements.finalLeaderboard) return;
        
        this.elements.finalLeaderboard.innerHTML = '';
        
        leaderboard.forEach((player, index) => {
            const position = index + 1;
            const isCurrentPlayer = player.player_id === this.gameState.playerId;
            
            const playerElement = document.createElement('div');
            playerElement.className = `leaderboard-item ${isCurrentPlayer ? 'current-player' : ''}`;
            playerElement.innerHTML = `
                <div class="leaderboard-position">${position}°</div>
                <div class="leaderboard-name">${player.player_name}</div>
                <div class="leaderboard-score">${player.score}</div>
            `;
            
            this.elements.finalLeaderboard.appendChild(playerElement);
        });
    }
    
    // ============ MÉTODOS DE CHAT ============ //
    
    // Alternar visibilidad del chat
    toggleChat() {
        const sidebar = document.querySelector('.game-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
            
            // Limpiar notificaciones
            if (this.elements.chatNotification) {
                this.elements.chatNotification.classList.add('hidden');
            }
        }
    }
    
    // Enviar mensaje de chat
    sendChatMessage() {
        if (!this.elements.chatInput || !this.ws) return;
        
        const message = this.elements.chatInput.value.trim();
        if (!message) return;
        
        // Enviar por WebSocket
        this.ws.sendChatMessage(message);
        
        // Limpiar input
        this.elements.chatInput.value = '';
        
        // Agregar mensaje localmente (se agregará también cuando llegue por WS)
        this.addChatMessage({
            player_id: this.gameState.playerId,
            player_name: this.gameState.playerName,
            message: message,
            timestamp: Date.now()
        }, true);
    }
    
    // Agregar mensaje al chat
    addChatMessage(data, isOwn = false) {
        if (!this.elements.chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isOwn ? 'own' : ''}`;
        
        const time = new Date(data.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageElement.innerHTML = `
            <div class="message-sender">${data.player_name}</div>
            <div class="message-text">${data.message}</div>
            <div class="message-time">${time}</div>
        `;
        
        this.elements.chatMessages.appendChild(messageElement);
        
        // Auto-scroll al último mensaje
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // Mostrar notificación si el chat está cerrado
        const sidebar = document.querySelector('.game-sidebar');
        if (!sidebar?.classList.contains('open') && !isOwn) {
            if (this.elements.chatNotification) {
                const currentCount = parseInt(this.elements.chatNotification.textContent) || 0;
                this.elements.chatNotification.textContent = currentCount + 1;
                this.elements.chatNotification.classList.remove('hidden');
            }
        }
    }
    
    // ============ MÉTODOS DE UTILIDAD ============ //
    
    // Actualizar estado de la sala
    updateStatus(text, statusClass) {
        if (this.elements.roomStatus) {
            this.elements.roomStatus.textContent = text;
            this.elements.roomStatus.className = `room-status ${statusClass}`;
        }
        
        if (this.elements.waitingMessage) {
            switch (statusClass) {
                case 'waiting':
                    this.elements.waitingMessage.textContent = 'Esperando que el host inicie el juego...';
                    break;
                case 'active':
                    this.elements.waitingMessage.textContent = '¡El juego ha comenzado!';
                    break;
                case 'finished':
                    this.elements.waitingMessage.textContent = 'El juego ha terminado.';
                    break;
            }
        }
    }
    
    // Mostrar mensaje temporal
    showMessage(text, type = 'info') {
        // Usar sistema de mensajes existente si está disponible
        if (window.ui && window.ui.showMessage) {
            window.ui.showMessage(text, type);
        } else {
            // Crear mensaje temporal
            const message = document.createElement('div');
            message.className = `temp-message ${type}`;
            message.textContent = text;
            message.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#2ecc71'};
                color: white;
                border-radius: 8px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            `;
            
            document.body.appendChild(message);
            
            setTimeout(() => {
                message.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => message.remove(), 300);
            }, 3000);
        }
    }
    
    // Mostrar notificación (más discreta que showMessage)
    showNotification(text, type = 'info') {
        console.log(`🔔 ${type.toUpperCase()}: ${text}`);
        // Podríamos implementar un sistema de notificaciones más elegante
    }
    
    // Salir de la sala
    leaveRoom() {
        // Desconectar WebSocket
        if (this.ws) {
            this.ws.disconnect();
        }
        
        // Limpiar sessionStorage
        sessionStorage.removeItem('current_room');
        sessionStorage.removeItem('player_name');
        sessionStorage.removeItem('player_id');
        sessionStorage.removeItem('is_host');
        
        // Redirigir al dashboard
        window.location.href = 'dashboard.html';
    }
}

// Inicializar el juego cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar en game-room.html
    if (window.location.pathname.includes('game-room.html')) {
        window.gameClient = new GameClient();
    }
});