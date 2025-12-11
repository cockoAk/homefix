/**
 * Lógica del lobby para el host/profesor (game-lobby.html)
 * Controla el flujo del juego, jugadores, preguntas
 */

class GameLobby {
    constructor() {
        // Estado del lobby
        this.lobbyState = {
            roomCode: null,
            hostId: null,
            gameStatus: 'waiting', // waiting, starting, active, question, results, finished
            currentQuestion: null,
            currentQuestionIndex: 0,
            totalQuestions: 10,
            players: [],
            leaderboard: [],
            quizData: null,
            settings: {
                timerPerQuestion: 30,
                showAnswers: 'after',
                pointsSystem: 'standard',
                gameMode: 'classic',
                music: 'calm',
                powerups: true
            },
            timer: null,
            questionTimer: null
        };
        
        // Referencias a elementos DOM
        this.elements = {};
        
        // WebSocket
        this.ws = null;
        
        // Preguntas del quiz
        this.quizQuestions = [];
        
        // Inicializar
        this.init();
    }
    
    // Inicializar el lobby
    async init() {
        console.log('🎛️ Inicializando lobby del host...');
        
        // Obtener información del host
        const playerInfo = getPlayerInfo();
        this.lobbyState.roomCode = playerInfo.roomCode;
        this.lobbyState.hostId = playerInfo.playerId;
        
        // Verificar que somos host
        if (!playerInfo.isHost) {
            alert('Error: Solo el host puede acceder al lobby. Redirigiendo...');
            window.location.href = `game-room.html?room=${playerInfo.roomCode}`;
            return;
        }
        
        // Verificar que tenemos código de sala
        if (!this.lobbyState.roomCode) {
            alert('Error: No se encontró código de sala');
            window.location.href = 'dashboard.html';
            return;
        }
        
        // Obtener referencias a elementos DOM
        this.cacheElements();
        
        // Configurar UI inicial
        this.setupInitialUI();
        
        // Configurar WebSocket
        this.setupWebSocket();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar información de la sala
        await this.loadRoomInfo();
        
        // Cargar quiz si existe
        await this.loadQuizData();
        
        console.log('✅ Lobby del host inicializado');
    }
    
    // Obtener referencias a elementos DOM
    cacheElements() {
        this.elements = {
            // Header
            lobbyRoomCode: document.getElementById('lobby-room-code'),
            lobbyStatus: document.getElementById('lobby-status'),
            startGameBtn: document.getElementById('start-game-btn'),
            endGameBtn: document.getElementById('end-game-btn'),
            backToDashboard: document.getElementById('back-to-dashboard'),
            
            // Panel de jugadores
            connectedPlayers: document.getElementById('connected-players'),
            lobbyPlayersList: document.getElementById('lobby-players-list'),
            totalPlayersCount: document.getElementById('total-players-count'),
            readyPlayersCount: document.getElementById('ready-players-count'),
            avgScore: document.getElementById('avg-score'),
            
            // Panel de control
            gameStateIndicator: document.getElementById('game-state-indicator'),
            gameStateText: document.getElementById('game-state-text'),
            nextQuestionBtn: document.getElementById('next-question-btn'),
            showResultsBtn: document.getElementById('show-results-btn'),
            skipQuestionBtn: document.getElementById('skip-question-btn'),
            currentQNumber: document.getElementById('current-q-number'),
            totalQNumber: document.getElementById('total-q-number'),
            currentQuestionText: document.getElementById('current-question-text'),
            questionTimer: document.getElementById('question-timer'),
            
            // Configuración
            timerSetting: document.getElementById('timer-setting'),
            musicSetting: document.getElementById('music-setting'),
            powerupsSetting: document.getElementById('powerups-setting'),
            questionOrder: document.getElementById('question-order'),
            pointsSystem: document.getElementById('points-system'),
            showAnswers: document.getElementById('show-answers'),
            gameMode: document.getElementById('game-mode'),
            
            // Panel de estadísticas
            answersReceived: document.getElementById('answers-received'),
            correctIncorrect: document.getElementById('correct-incorrect'),
            avgResponseTime: document.getElementById('avg-response-time'),
            participationRate: document.getElementById('participation-rate'),
            lobbyLeaderboard: document.getElementById('lobby-leaderboard'),
            
            // Información del quiz
            quizTitle: document.getElementById('quiz-title'),
            quizQuestionCount: document.getElementById('quiz-question-count'),
            quizTopic: document.getElementById('quiz-topic'),
            quizDifficulty: document.getElementById('quiz-difficulty'),
            
            // Footer
            footerRoomCode: document.getElementById('footer-room-code'),
            copyCodeBtn: document.getElementById('copy-code-btn'),
            shareLinkBtn: document.getElementById('share-link-btn'),
            fullscreenBtn: document.getElementById('fullscreen-btn'),
            
            // Modales
            advancedSettingsModal: document.getElementById('advanced-settings-modal'),
            startGameModal: document.getElementById('start-game-modal'),
            saveSettingsBtn: document.getElementById('save-settings-btn'),
            cancelSettingsBtn: document.getElementById('cancel-settings-btn'),
            countdownNumber: document.getElementById('countdown-number'),
            readyCount: document.getElementById('ready-count'),
            totalQuestionsCount: document.getElementById('total-questions-count'),
            estimatedTime: document.getElementById('estimated-time'),
            cancelStartBtn: document.getElementById('cancel-start-btn')
        };
    }
    
    // Configurar UI inicial
    setupInitialUI() {
        // Mostrar código de sala
        if (this.elements.lobbyRoomCode) {
            this.elements.lobbyRoomCode.textContent = `Código: ${this.lobbyState.roomCode}`;
        }
        
        if (this.elements.footerRoomCode) {
            this.elements.footerRoomCode.textContent = this.lobbyState.roomCode;
        }
        
        // Actualizar estado del juego
        this.updateGameStatus('waiting');
        
        // Configurar valores por defecto en selects
        this.setupSettingsDefaults();
    }
    
    // Configurar valores por defecto de configuración
    setupSettingsDefaults() {
        if (this.elements.timerSetting) {
            this.elements.timerSetting.value = this.lobbyState.settings.timerPerQuestion;
        }
        
        if (this.elements.musicSetting) {
            this.elements.musicSetting.value = this.lobbyState.settings.music;
        }
        
        if (this.elements.powerupsSetting) {
            this.elements.powerupsSetting.value = this.lobbyState.settings.powerups ? 'on' : 'off';
        }
        
        if (this.elements.questionOrder) {
            this.elements.questionOrder.value = 'sequential';
        }
        
        if (this.elements.pointsSystem) {
            this.elements.pointsSystem.value = this.lobbyState.settings.pointsSystem;
        }
        
        if (this.elements.showAnswers) {
            this.elements.showAnswers.value = this.lobbyState.settings.showAnswers;
        }
        
        if (this.elements.gameMode) {
            this.elements.gameMode.value = this.lobbyState.settings.gameMode;
        }
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
            console.log('✅ Lobby conectado al juego');
            this.showNotification('Lobby conectado', 'success');
        };
        
        this.ws.onDisconnect = () => {
            console.log('🔌 Lobby desconectado');
            this.showNotification('Se perdió la conexión', 'warning');
        };
        
        this.ws.onError = (error) => {
            console.error('❌ Error de WebSocket en lobby:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        };
        
        // Configurar listeners de eventos específicos
        this.setupWebSocketListeners();
    }
    
    // Configurar listeners de WebSocket
    setupWebSocketListeners() {
        if (!this.ws) return;
        
        // Jugador se unió
        this.ws.on('player_joined', (data) => {
            this.onPlayerJoined(data);
        });
        
        // Jugador se fue
        this.ws.on('player_left', (data) => {
            this.onPlayerLeft(data);
        });
        
        // Estado de jugador actualizado
        this.ws.on('player_status', (data) => {
            this.onPlayerStatusUpdate(data);
        });
        
        // Respuesta recibida
        this.ws.on('answer_received', (data) => {
            this.onAnswerReceived(data);
        });
        
        // Chat message
        this.ws.on('chat_message', (data) => {
            // Podríamos mostrar chat en el lobby también
        });
        
        // Ping/Pong para mantener conexión
        setInterval(() => {
            if (this.ws && this.ws.isConnected()) {
                this.ws.ping();
            }
        }, 30000);
    }
    
    // Configurar event listeners de UI
    setupEventListeners() {
        // Botones principales
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        if (this.elements.endGameBtn) {
            this.elements.endGameBtn.addEventListener('click', () => {
                if (confirm('¿Terminar el juego para todos los jugadores?')) {
                    this.endGame();
                }
            });
        }
        
        if (this.elements.backToDashboard) {
            this.elements.backToDashboard.addEventListener('click', () => {
                if (confirm('¿Salir del lobby? Los jugadores no podrán continuar.')) {
                    this.leaveLobby();
                }
            });
        }
        
        // Botones de control del juego
        if (this.elements.nextQuestionBtn) {
            this.elements.nextQuestionBtn.addEventListener('click', () => {
                this.nextQuestion();
            });
        }
        
        if (this.elements.showResultsBtn) {
            this.elements.showResultsBtn.addEventListener('click', () => {
                this.showResults();
            });
        }
        
        if (this.elements.skipQuestionBtn) {
            this.elements.skipQuestionBtn.addEventListener('click', () => {
                if (confirm('¿Saltar esta pregunta?')) {
                    this.skipQuestion();
                }
            });
        }
        
        // Configuración - cambios en tiempo real
        if (this.elements.timerSetting) {
            this.elements.timerSetting.addEventListener('change', (e) => {
                this.lobbyState.settings.timerPerQuestion = parseInt(e.target.value);
                this.showNotification(`Tiempo por pregunta: ${e.target.value}s`, 'info');
            });
        }
        
        // Botones del footer
        if (this.elements.copyCodeBtn) {
            this.elements.copyCodeBtn.addEventListener('click', () => {
                this.copyRoomCode();
            });
        }
        
        if (this.elements.shareLinkBtn) {
            this.elements.shareLinkBtn.addEventListener('click', () => {
                this.shareRoomLink();
            });
        }
        
        if (this.elements.fullscreenBtn) {
            this.elements.fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Configuraciones avanzadas
        if (this.elements.saveSettingsBtn) {
            this.elements.saveSettingsBtn.addEventListener('click', () => {
                this.saveAdvancedSettings();
            });
        }
        
        if (this.elements.cancelSettingsBtn) {
            this.elements.cancelSettingsBtn.addEventListener('click', () => {
                this.hideModal(this.elements.advancedSettingsModal);
            });
        }
        
        // Modal de inicio de juego
        if (this.elements.cancelStartBtn) {
            this.elements.cancelStartBtn.addEventListener('click', () => {
                this.cancelGameStart();
            });
        }
        
        // Configurar teclas rápidas
        this.setupKeyboardShortcuts();
    }
    
    // Configurar atajos de teclado
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Solo si estamos en el lobby y no en un input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case 'F1':
                    e.preventDefault();
                    this.startGame();
                    break;
                    
                case 'F2':
                    e.preventDefault();
                    this.nextQuestion();
                    break;
                    
                case 'F3':
                    e.preventDefault();
                    this.showResults();
                    break;
                    
                case 'F4':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                    
                case 'Escape':
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    break;
            }
        });
    }
    
    // ============ MANEJADORES DE EVENTOS WEBSOCKET ============
    
    // Jugador se unió
    onPlayerJoined(data) {
        console.log('👤 Jugador se unió:', data);
        
        const player = {
            id: data.player_id,
            name: data.player_name,
            score: 0,
            isReady: false,
            hasAnswered: false,
            answers: [],
            joinTime: Date.now()
        };
        
        // Agregar a la lista
        this.lobbyState.players.push(player);
        
        // Actualizar UI
        this.updatePlayersList();
        this.updatePlayerStats();
        
        // Mostrar notificación
        this.showNotification(`${player.name} se ha unido`, 'success');
    }
    
    // Jugador se fue
    onPlayerLeft(data) {
        console.log('👤 Jugador se fue:', data);
        
        // Remover de la lista
        this.lobbyState.players = this.lobbyState.players.filter(p => p.id !== data.player_id);
        
        // Actualizar UI
        this.updatePlayersList();
        this.updatePlayerStats();
        
        // Mostrar notificación
        this.showNotification(`${data.player_name} se ha ido`, 'info');
    }
    
    // Estado de jugador actualizado
    onPlayerStatusUpdate(data) {
        const player = this.lobbyState.players.find(p => p.id === data.player_id);
        if (player) {
            player.isReady = data.is_ready;
            this.updatePlayersList();
            this.updatePlayerStats();
        }
    }
    
    // Respuesta recibida
    onAnswerReceived(data) {
        console.log('📝 Respuesta recibida:', data);
        
        const player = this.lobbyState.players.find(p => p.id === data.player_id);
        if (player) {
            player.hasAnswered = true;
            player.answers.push({
                question_id: data.question_id,
                answer: data.answer,
                response_time: data.response_time,
                timestamp: data.timestamp
            });
            
            // Actualizar estadísticas en tiempo real
            this.updateLiveStats();
            
            // Actualizar leaderboard si tenemos la información de correct/incorrect
            // (En una implementación real, esto vendría del backend)
        }
    }
    
    // ============ MÉTODOS DEL JUEGO ============
    
    // Iniciar juego
    async startGame() {
        if (this.lobbyState.players.length === 0) {
            alert('Espera al menos un jugador para comenzar');
            return;
        }
        
        // Mostrar modal de cuenta regresiva
        this.showStartGameModal();
        
        // Actualizar estado
        this.lobbyState.gameStatus = 'starting';
        this.updateGameStatus('starting');
        
        // Deshabilitar botón de inicio
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.disabled = true;
        }
        
        // Cuenta regresiva
        let countdown = 5;
        const countdownInterval = setInterval(() => {
            if (this.elements.countdownNumber) {
                this.elements.countdownNumber.textContent = countdown;
            }
            
            countdown--;
            
            if (countdown < 0) {
                clearInterval(countdownInterval);
                this.hideModal(this.elements.startGameModal);
                this.beginGame();
            }
        }, 1000);
        
        // Guardar referencia para poder cancelar
        this.lobbyState.startCountdown = countdownInterval;
    }
    
    // Cancelar inicio de juego
    cancelGameStart() {
        if (this.lobbyState.startCountdown) {
            clearInterval(this.lobbyState.startCountdown);
            this.lobbyState.startCountdown = null;
        }
        
        this.lobbyState.gameStatus = 'waiting';
        this.updateGameStatus('waiting');
        
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.disabled = false;
        }
        
        this.hideModal(this.elements.startGameModal);
        this.showNotification('Inicio de juego cancelado', 'warning');
    }
    
    // Comenzar juego (después de cuenta regresiva)
    async beginGame() {
        console.log('🚀 Comenzando juego...');
        
        // Actualizar estado
        this.lobbyState.gameStatus = 'active';
        this.updateGameStatus('active');
        
        // Preparar quiz
        await this.prepareQuiz();
        
        // Enviar evento de inicio a todos los jugadores
        if (this.ws) {
            const quizData = this.lobbyState.quizData || {
                title: 'Quiz de Cultura Dominicana',
                questions: this.quizQuestions,
                total_questions: this.lobbyState.totalQuestions
            };
            
            this.ws.startGame(quizData);
        }
        
        // Habilitar controles de juego
        this.enableGameControls(true);
        
        // Comenzar primera pregunta después de 3 segundos
        setTimeout(() => {
            this.nextQuestion();
        }, 3000);
        
        this.showNotification('¡Juego iniciado!', 'success');
    }
    
    // Siguiente pregunta
    nextQuestion() {
        if (this.lobbyState.gameStatus !== 'active' && this.lobbyState.gameStatus !== 'results') {
            return;
        }
        
        // Verificar si hay más preguntas
        if (this.lobbyState.currentQuestionIndex >= this.lobbyState.totalQuestions) {
            this.endGame();
            return;
        }
        
        // Incrementar índice de pregunta
        this.lobbyState.currentQuestionIndex++;
        
        // Obtener pregunta
        let question;
        if (this.quizQuestions.length > 0) {
            question = this.quizQuestions[this.lobbyState.currentQuestionIndex - 1];
        } else {
            // Generar pregunta aleatoria
            question = this.generateRandomQuestion();
        }
        
        this.lobbyState.currentQuestion = question;
        
        // Actualizar UI
        this.updateCurrentQuestionUI();
        
        // Enviar pregunta a todos los jugadores
        if (this.ws) {
            this.ws.requestNextQuestion({
                ...question,
                question_number: this.lobbyState.currentQuestionIndex,
                total_questions: this.lobbyState.totalQuestions,
                time_limit: this.lobbyState.settings.timerPerQuestion
            });
        }
        
        // Actualizar estado
        this.lobbyState.gameStatus = 'question';
        this.updateGameStatus('question');
        
        // Iniciar temporizador para la pregunta
        this.startQuestionTimer();
        
        // Resetear estado de respuestas de jugadores
        this.lobbyState.players.forEach(player => {
            player.hasAnswered = false;
        });
        
        // Actualizar estadísticas
        this.updateLiveStats();
        
        this.showNotification(`Pregunta ${this.lobbyState.currentQuestionIndex} enviada`, 'info');
    }
    
    // Mostrar resultados de pregunta actual
    showResults() {
        if (!this.lobbyState.currentQuestion || this.lobbyState.gameStatus !== 'question') {
            return;
        }
        
        // Detener temporizador
        this.stopQuestionTimer();
        
        // Calcular estadísticas
        const stats = this.calculateQuestionStats();
        
        // Enviar resultados a todos los jugadores
        if (this.ws) {
            this.ws.showResults(
                this.lobbyState.currentQuestion.respuesta_correcta || this.lobbyState.currentQuestion.correct_answer,
                stats
            );
        }
        
        // Actualizar estado
        this.lobbyState.gameStatus = 'results';
        this.updateGameStatus('results');
        
        // Actualizar leaderboard
        this.updateLeaderboard();
        
        this.showNotification('Resultados mostrados', 'info');
    }
    
    // Saltar pregunta
    skipQuestion() {
        if (this.lobbyState.gameStatus === 'question') {
            this.stopQuestionTimer();
        }
        
        // Notificar a jugadores que se salta la pregunta
        if (this.ws) {
            this.ws.send({
                type: 'question_skipped',
                question_id: this.lobbyState.currentQuestion?.id,
                timestamp: Date.now()
            });
        }
        
        // Pasar a siguiente pregunta después de breve pausa
        setTimeout(() => {
            this.nextQuestion();
        }, 2000);
        
        this.showNotification('Pregunta saltada', 'warning');
    }
    
    // Terminar juego
    endGame() {
        console.log('🏁 Terminando juego...');
        
        // Detener temporizadores
        this.stopQuestionTimer();
        
        // Calcular ranking final
        const finalLeaderboard = this.calculateFinalLeaderboard();
        
        // Enviar evento de fin de juego a todos los jugadores
        if (this.ws) {
            this.ws.endGame(finalLeaderboard);
        }
        
        // Actualizar estado
        this.lobbyState.gameStatus = 'finished';
        this.updateGameStatus('finished');
        
        // Deshabilitar controles de juego
        this.enableGameControls(false);
        
        // Habilitar botón de inicio nuevamente
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.disabled = false;
        }
        
        this.showNotification('¡Juego terminado!', 'success');
    }
    
    // ============ MÉTODOS DE QUIZ ============
    
    // Cargar información de la sala
    async loadRoomInfo() {
        try {
            const response = await window.quizAPI.getGame(this.lobbyState.roomCode);
            if (response) {
                // Actualizar información de la sala
                if (response.quiz_id) {
                    this.lobbyState.quizId = response.quiz_id;
                }
                
                // Cargar jugadores existentes si hay
                if (response.players) {
                    this.lobbyState.players = response.players.map(p => ({
                        id: p.player_id || p.id,
                        name: p.player_name || p.name,
                        score: p.score || 0,
                        isReady: false,
                        hasAnswered: false,
                        answers: [],
                        joinTime: Date.now()
                    }));
                    
                    this.updatePlayersList();
                    this.updatePlayerStats();
                }
            }
        } catch (error) {
            console.error('Error cargando información de sala:', error);
        }
    }
    
    // Cargar datos del quiz
    async loadQuizData() {
        if (!this.lobbyState.quizId) {
            // Generar quiz aleatorio
            await this.generateRandomQuiz();
            return;
        }
        
        try {
            const quiz = await window.quizAPI.getQuiz(this.lobbyState.quizId);
            if (quiz) {
                this.lobbyState.quizData = quiz;
                this.quizQuestions = quiz.questions || [];
                this.lobbyState.totalQuestions = this.quizQuestions.length;
                
                // Actualizar UI con información del quiz
                this.updateQuizInfoUI();
            }
        } catch (error) {
            console.error('Error cargando quiz:', error);
            // Generar quiz aleatorio como fallback
            await this.generateRandomQuiz();
        }
    }
    
    // Generar quiz aleatorio
    async generateRandomQuiz() {
        try {
            const quiz = await window.quizAPI.generateQuiz(10);
            if (quiz && quiz.quiz) {
                this.quizQuestions = quiz.quiz;
                this.lobbyState.totalQuestions = this.quizQuestions.length;
                
                this.lobbyState.quizData = {
                    title: 'Quiz de Cultura Dominicana',
                    description: 'Preguntas aleatorias sobre cultura dominicana',
                    questions: this.quizQuestions
                };
                
                this.updateQuizInfoUI();
            }
        } catch (error) {
            console.error('Error generando quiz:', error);
            // Crear preguntas por defecto
            this.createDefaultQuestions();
        }
    }
    
    // Crear preguntas por defecto
    createDefaultQuestions() {
        this.quizQuestions = [
            {
                id: 1,
                pregunta: "¿En qué año se firmó la Independencia Dominicana?",
                opciones: {"A": "1821", "B": "1844", "C": "1865", "D": "1916"},
                respuesta_correcta: "B",
                puntos: 10,
                tiempo_limite: 30,
                tema: "historia",
                dificultad: "fácil"
            },
            {
                id: 2,
                pregunta: "¿Qué instrumento es típico del merengue dominicano?",
                opciones: {"A": "Maracas", "B": "Güira", "C": "Bongó", "D": "Saxofón"},
                respuesta_correcta: "B",
                puntos: 10,
                tiempo_limite: 30,
                tema: "música",
                dificultad: "fácil"
            },
            {
                id: 3,
                pregunta: "¿Cuál es el plato nacional de República Dominicana?",
                opciones: {"A": "Mangú", "B": "Sancocho", "C": "La Bandera", "D": "Mofongo"},
                respuesta_correcta: "C",
                puntos: 10,
                tiempo_limite: 30,
                tema: "gastronomía",
                dificultad: "fácil"
            }
        ];
        
        this.lobbyState.totalQuestions = this.quizQuestions.length;
        
        this.lobbyState.quizData = {
            title: 'Cultura Dominicana Básica',
            description: 'Preguntas básicas sobre cultura dominicana',
            questions: this.quizQuestions
        };
        
        this.updateQuizInfoUI();
    }
    
    // Preparar quiz para el juego
    prepareQuiz() {
        // Aplicar configuración de orden de preguntas
        if (this.elements.questionOrder) {
            const order = this.elements.questionOrder.value;
            if (order === 'random') {
                this.shuffleQuestions();
            } else if (order === 'difficulty') {
                this.sortQuestionsByDifficulty();
            }
        }
        
        // Actualizar número total de preguntas
        this.lobbyState.totalQuestions = this.quizQuestions.length;
        
        // Actualizar UI
        if (this.elements.totalQNumber) {
            this.elements.totalQNumber.textContent = this.lobbyState.totalQuestions;
        }
        
        if (this.elements.totalQuestionsCount) {
            this.elements.totalQuestionsCount.textContent = this.lobbyState.totalQuestions;
        }
        
        // Calcular tiempo estimado
        this.calculateEstimatedTime();
    }
    
    // Mezclar preguntas aleatoriamente
    shuffleQuestions() {
        for (let i = this.quizQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.quizQuestions[i], this.quizQuestions[j]] = [this.quizQuestions[j], this.quizQuestions[i]];
        }
    }
    
    // Ordenar preguntas por dificultad
    sortQuestionsByDifficulty() {
        const difficultyOrder = { 'fácil': 1, 'media': 2, 'difícil': 3 };
        this.quizQuestions.sort((a, b) => {
            return difficultyOrder[a.dificultad] - difficultyOrder[b.dificultad];
        });
    }
    
    // Generar pregunta aleatoria
    generateRandomQuestion() {
        const topics = ['historia', 'música', 'gastronomía', 'geografía', 'tradiciones'];
        const difficulties = ['fácil', 'media', 'difícil'];
        
        const questionId = Date.now();
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        
        // Preguntas por defecto según tema
        const questionsByTopic = {
            historia: {
                pregunta: "¿En qué año se firmó la Independencia Dominicana?",
                opciones: {"A": "1821", "B": "1844", "C": "1865", "D": "1916"},
                respuesta_correcta: "B"
            },
            música: {
                pregunta: "¿Qué instrumento es típico del merengue dominicano?",
                opciones: {"A": "Maracas", "B": "Güira", "C": "Bongó", "D": "Saxofón"},
                respuesta_correcta: "B"
            },
            gastronomía: {
                pregunta: "¿Cuál es el plato nacional de República Dominicana?",
                opciones: {"A": "Mangú", "B": "Sancocho", "C": "La Bandera", "D": "Mofongo"},
                respuesta_correcta: "C"
            },
            geografía: {
                pregunta: "¿Cuál es la montaña más alta de República Dominicana?",
                opciones: {"A": "Pico Duarte", "B": "Loma La Pelona", "C": "Monte Tina", "D": "Cordillera Central"},
                respuesta_correcta: "A"
            },
            tradiciones: {
                pregunta: "¿Qué se celebra el 27 de febrero en República Dominicana?",
                opciones: {"A": "Día de la Restauración", "B": "Día de la Independencia", "C": "Día de la Bandera", "D": "Día de Duarte"},
                respuesta_correcta: "B"
            }
        };
        
        return {
            id: questionId,
            ...questionsByTopic[topic],
            puntos: difficulty === 'fácil' ? 10 : difficulty === 'media' ? 15 : 20,
            tiempo_limite: this.lobbyState.settings.timerPerQuestion,
            tema: topic,
            dificultad: difficulty
        };
    }
    
    // ============ MÉTODOS DE TEMPORIZADOR ============
    
    // Iniciar temporizador de pregunta
    startQuestionTimer() {
        this.stopQuestionTimer();
        
        let timeLeft = this.lobbyState.settings.timerPerQuestion;
        
        if (this.elements.questionTimer) {
            this.elements.questionTimer.textContent = timeLeft;
        }
        
        this.lobbyState.questionTimer = setInterval(() => {
            timeLeft--;
            
            if (this.elements.questionTimer) {
                this.elements.questionTimer.textContent = timeLeft;
            }
            
            // Enviar actualización de tiempo a jugadores
            if (this.ws && timeLeft % 5 === 0) { // Cada 5 segundos
                this.ws.send({
                    type: 'time_update',
                    time_left: timeLeft,
                    timestamp: Date.now()
                });
            }
            
            if (timeLeft <= 0) {
                this.stopQuestionTimer();
                this.showResults();
            }
        }, 1000);
    }
    
    // Detener temporizador de pregunta
    stopQuestionTimer() {
        if (this.lobbyState.questionTimer) {
            clearInterval(this.lobbyState.questionTimer);
            this.lobbyState.questionTimer = null;
        }
    }
    
    // ============ MÉTODOS DE ESTADÍSTICAS ============
    
    // Calcular estadísticas de pregunta actual
    calculateQuestionStats() {
        const totalPlayers = this.lobbyState.players.length;
        const answeredPlayers = this.lobbyState.players.filter(p => p.hasAnswered).length;
        const correctAnswers = this.lobbyState.players.filter(p => {
            const lastAnswer = p.answers[p.answers.length - 1];
            return lastAnswer && lastAnswer.answer === this.lobbyState.currentQuestion?.respuesta_correcta;
        }).length;
        
        return {
            total_players: totalPlayers,
            answered_players: answeredPlayers,
            correct_answers: correctAnswers,
            correct_percentage: totalPlayers > 0 ? Math.round((correctAnswers / totalPlayers) * 100) : 0,
            participation_rate: totalPlayers > 0 ? Math.round((answeredPlayers / totalPlayers) * 100) : 0
        };
    }
    
    // Calcular ranking final
    calculateFinalLeaderboard() {
        // Ordenar jugadores por puntuación
        const sortedPlayers = [...this.lobbyState.players].sort((a, b) => b.score - a.score);
        
        return sortedPlayers.map((player, index) => ({
            position: index + 1,
            player_id: player.id,
            player_name: player.name,
            score: player.score,
            total_answers: player.answers.length,
            correct_answers: player.answers.filter(a => {
                // En una implementación real, verificaríamos si la respuesta fue correcta
                return true; // Placeholder
            }).length
        }));
    }
    
    // ============ MÉTODOS DE UI ============
    
    // Actualizar lista de jugadores
    updatePlayersList() {
        if (!this.elements.lobbyPlayersList) return;
        
        if (this.lobbyState.players.length === 0) {
            this.elements.lobbyPlayersList.innerHTML = `
                <div class="empty-players">
                    <i class="fas fa-user-clock"></i>
                    <p>Esperando jugadores...</p>
                </div>
            `;
            return;
        }
        
        this.elements.lobbyPlayersList.innerHTML = '';
        
        this.lobbyState.players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item-lobby';
            playerElement.innerHTML = `
                <div class="player-avatar-lobby">
                    <i class="fas fa-user"></i>
                </div>
                <div class="player-details-lobby">
                    <div class="player-name-lobby">${player.name}</div>
                    <div class="player-status ${player.isReady ? 'ready' : 'connected'}">
                        <i class="fas fa-${player.isReady ? 'check' : 'user'}"></i>
                        ${player.isReady ? 'Listo' : 'Conectado'}
                    </div>
                </div>
                <div class="player-score-lobby">${player.score}</div>
            `;
            
            this.elements.lobbyPlayersList.appendChild(playerElement);
        });
    }
    
    // Actualizar estadísticas de jugadores
    updatePlayerStats() {
        const totalPlayers = this.lobbyState.players.length;
        const readyPlayers = this.lobbyState.players.filter(p => p.isReady).length;
        const totalScore = this.lobbyState.players.reduce((sum, player) => sum + player.score, 0);
        const avgScore = totalPlayers > 0 ? Math.round(totalScore / totalPlayers) : 0;
        
        if (this.elements.connectedPlayers) {
            this.elements.connectedPlayers.textContent = totalPlayers;
        }
        
        if (this.elements.totalPlayersCount) {
            this.elements.totalPlayersCount.textContent = totalPlayers;
        }
        
        if (this.elements.readyPlayersCount) {
            this.elements.readyPlayersCount.textContent = readyPlayers;
        }
        
        if (this.elements.avgScore) {
            this.elements.avgScore.textContent = avgScore;
        }
        
        // Actualizar modal de inicio
        if (this.elements.readyCount) {
            this.elements.readyCount.textContent = readyPlayers;
        }
    }
    
    // Actualizar estado del juego en UI
    updateGameStatus(status) {
        this.lobbyState.gameStatus = status;
        
        let statusText = '';
        let statusClass = '';
        
        switch (status) {
            case 'waiting':
                statusText = 'Esperando jugadores';
                statusClass = 'waiting';
                break;
            case 'starting':
                statusText = 'Iniciando juego...';
                statusClass = 'active';
                break;
            case 'active':
                statusText = 'Juego en curso';
                statusClass = 'active';
                break;
            case 'question':
                statusText = 'Pregunta activa';
                statusClass = 'active';
                break;
            case 'results':
                statusText = 'Mostrando resultados';
                statusClass = 'active';
                break;
            case 'finished':
                statusText = 'Juego terminado';
                statusClass = 'finished';
                break;
        }
        
        if (this.elements.lobbyStatus) {
            this.elements.lobbyStatus.textContent = statusText;
            this.elements.lobbyStatus.className = `room-status ${statusClass}`;
        }
        
        if (this.elements.gameStateText) {
            this.elements.gameStateText.textContent = statusText;
        }
        
        if (this.elements.gameStateIndicator) {
            this.elements.gameStateIndicator.className = `state-indicator ${statusClass}`;
        }
    }
    
    // Actualizar pregunta actual en UI
    updateCurrentQuestionUI() {
        if (!this.lobbyState.currentQuestion) return;
        
        if (this.elements.currentQNumber) {
            this.elements.currentQNumber.textContent = this.lobbyState.currentQuestionIndex;
        }
        
        if (this.elements.currentQuestionText) {
            this.elements.currentQuestionText.textContent = 
                this.lobbyState.currentQuestion.pregunta || 
                this.lobbyState.currentQuestion.question_text ||
                'Pregunta cargada';
        }
    }
    
    // Actualizar información del quiz en UI
    updateQuizInfoUI() {
        if (!this.lobbyState.quizData) return;
        
        if (this.elements.quizTitle) {
            this.elements.quizTitle.textContent = this.lobbyState.quizData.title || 'Quiz de Cultura Dominicana';
        }
        
        if (this.elements.quizQuestionCount) {
            this.elements.quizQuestionCount.textContent = this.lobbyState.totalQuestions;
        }
        
        if (this.elements.quizTopic) {
            const topics = new Set(this.quizQuestions.map(q => q.tema));
            this.elements.quizTopic.textContent = Array.from(topics).join(', ') || 'General';
        }
        
        if (this.elements.quizDifficulty) {
            const difficulties = this.quizQuestions.map(q => q.dificultad);
            const avgDifficulty = difficulties.includes('difícil') ? 'Difícil' : 
                                difficulties.includes('media') ? 'Media' : 'Fácil';
            this.elements.quizDifficulty.textContent = avgDifficulty;
        }
    }
    
    // Actualizar estadísticas en tiempo real
    updateLiveStats() {
        const totalPlayers = this.lobbyState.players.length;
        const answeredPlayers = this.lobbyState.players.filter(p => p.hasAnswered).length;
        
        if (this.elements.answersReceived) {
            this.elements.answersReceived.textContent = answeredPlayers;
        }
        
        if (this.elements.participationRate) {
            const rate = totalPlayers > 0 ? Math.round((answeredPlayers / totalPlayers) * 100) : 0;
            this.elements.participationRate.textContent = `${rate}%`;
        }
        
        // Actualizar leaderboard en tiempo real
        this.updateLeaderboard();
    }
    
    // Actualizar leaderboard
    updateLeaderboard() {
        // Ordenar jugadores por puntuación
        const sortedPlayers = [...this.lobbyState.players].sort((a, b) => b.score - a.score);
        
        if (this.elements.lobbyLeaderboard) {
            if (sortedPlayers.length === 0) {
                this.elements.lobbyLeaderboard.innerHTML = `
                    <div class="empty-ranking">
                        <i class="fas fa-chart-bar"></i>
                        <p>Esperando datos...</p>
                    </div>
                `;
                return;
            }
            
            this.elements.lobbyLeaderboard.innerHTML = '';
            
            sortedPlayers.slice(0, 10).forEach((player, index) => {
                const position = index + 1;
                const playerElement = document.createElement('div');
                playerElement.className = 'leaderboard-item-lobby';
                playerElement.innerHTML = `
                    <div class="leaderboard-position">${position}°</div>
                    <div class="leaderboard-name-lobby">${player.name}</div>
                    <div class="leaderboard-score-lobby">${player.score}</div>
                `;
                
                this.elements.lobbyLeaderboard.appendChild(playerElement);
            });
        }
    }
    
    // Habilitar/deshabilitar controles de juego
    enableGameControls(enabled) {
        if (this.elements.nextQuestionBtn) {
            this.elements.nextQuestionBtn.disabled = !enabled;
        }
        
        if (this.elements.showResultsBtn) {
            this.elements.showResultsBtn.disabled = !enabled;
        }
        
        if (this.elements.skipQuestionBtn) {
            this.elements.skipQuestionBtn.disabled = !enabled;
        }
    }
    
    // ============ MÉTODOS DE UTILIDAD ============
    
    // Mostrar modal
    showModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('hidden');
        }
    }
    
    // Ocultar modal
    hideModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('hidden');
        }
    }
    
    // Mostrar modal de inicio de juego
    showStartGameModal() {
        // Calcular tiempo estimado
        this.calculateEstimatedTime();
        
        // Actualizar contador de jugadores listos
        this.updatePlayerStats();
        
        // Mostrar modal
        this.showModal(this.elements.startGameModal);
        
        // Iniciar cuenta regresiva en el número
        if (this.elements.countdownNumber) {
            this.elements.countdownNumber.textContent = '5';
        }
    }
    
    // Calcular tiempo estimado del juego
    calculateEstimatedTime() {
        const questions = this.lobbyState.totalQuestions;
        const timePerQuestion = this.lobbyState.settings.timerPerQuestion;
        const timeForResults = 10; // segundos entre preguntas
        const totalSeconds = (questions * timePerQuestion) + (questions * timeForResults);
        
        const minutes = Math.floor(totalSeconds / 60);
        
        if (this.elements.estimatedTime) {
            this.elements.estimatedTime.textContent = `${minutes} min`;
        }
    }
    
    // Guardar configuraciones avanzadas
    saveAdvancedSettings() {
        // Recopilar configuraciones
        const settings = {
            questionOrder: this.elements.questionOrder?.value || 'sequential',
            pointsSystem: this.elements.pointsSystem?.value || 'standard',
            showAnswers: this.elements.showAnswers?.value || 'after',
            gameMode: this.elements.gameMode?.value || 'classic'
        };
        
        // Aplicar configuraciones
        this.lobbyState.settings = { ...this.lobbyState.settings, ...settings };
        
        // Guardar en localStorage
        localStorage.setItem('quiz_settings', JSON.stringify(this.lobbyState.settings));
        
        // Cerrar modal
        this.hideModal(this.elements.advancedSettingsModal);
        
        this.showNotification('Configuraciones guardadas', 'success');
    }
    
    // Copiar código de sala al portapapeles
    copyRoomCode() {
        navigator.clipboard.writeText(this.lobbyState.roomCode)
            .then(() => {
                this.showNotification('Código copiado al portapapeles', 'success');
            })
            .catch(err => {
                console.error('Error copiando código:', err);
                this.showNotification('Error al copiar código', 'error');
            });
    }
    
    // Compartir enlace de la sala
    shareRoomLink() {
        const link = `${window.location.origin}/frontend/game-room.html?room=${this.lobbyState.roomCode}`;
        
        if (navigator.share) {
            navigator.share({
                title: '¡Únete a mi quiz de Cultura Dominicana!',
                text: `Usa el código: ${this.lobbyState.roomCode}`,
                url: link
            });
        } else {
            navigator.clipboard.writeText(link)
                .then(() => {
                    this.showNotification('Enlace copiado al portapapeles', 'success');
                })
                .catch(err => {
                    console.error('Error copiando enlace:', err);
                    this.showNotification('Error al copiar enlace', 'error');
                });
        }
    }
    
    // Alternar pantalla completa
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Error entrando a pantalla completa:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    // Salir del lobby
    leaveLobby() {
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
    
    // Mostrar notificación
    showNotification(text, type = 'info') {
        console.log(`🔔 ${type.toUpperCase()}: ${text}`);
        

        if (type === 'error') {
            alert(`❌ ${text}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar en game-lobby.html
    if (window.location.pathname.includes('game-lobby.html')) {
        window.gameLobby = new GameLobby();
    }
});