// Dashboard principal
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    if (!window.auth || !window.auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Inicializar elementos del DOM
    const userNameElement = document.getElementById('user-name');
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Cargar información del usuario
    try {
        const user = window.auth.getUser();
        if (user) {
            userNameElement.textContent = user.full_name || user.email;
            welcomeMessage.textContent = `¡Hola ${user.full_name}! ¿Listo para aprender sobre cultura dominicana?`;
        } else {
            // Si no hay usuario en cache, obtener del servidor
            const userData = await window.quizAPI.getCurrentUser();
            window.auth.currentUser = userData;
            userNameElement.textContent = userData.full_name;
            welcomeMessage.textContent = `¡Hola ${userData.full_name}! ¿Listo para aprender sobre cultura dominicana?`;
        }
    } catch (error) {
        console.error('Error cargando usuario:', error);
        userNameElement.textContent = 'Usuario';
        welcomeMessage.textContent = 'Error cargando información del usuario';
    }
    
    // Configurar event listeners
    setupDashboardListeners();
    
    // Cargar datos iniciales
    loadActiveGames();
    loadPublicQuizzes();
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (window.auth) {
                window.auth.logout();
            }
        });
    }
});

function setupDashboardListeners() {
    // Botones de acción rápida
    document.getElementById('create-quiz-btn')?.addEventListener('click', function() {
        window.location.href = 'quiz-creator.html';
    });
    
    document.getElementById('join-game-btn')?.addEventListener('click', function() {
        showJoinModal();
    });
    
    document.getElementById('create-game-btn')?.addEventListener('click', function() {
        showCreateGameModal();
    });
    
    document.getElementById('my-quizzes-btn')?.addEventListener('click', function() {
        window.location.href = 'quiz-creator.html?tab=myquizzes';
    });
    
    // Botones de actualización
    document.getElementById('refresh-games-btn')?.addEventListener('click', loadActiveGames);
    document.getElementById('refresh-quizzes-btn')?.addEventListener('click', loadPublicQuizzes);
    
    // Footer links
    document.getElementById('go-home')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'dashboard.html';
    });
    
    document.getElementById('go-profile')?.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Perfil - En desarrollo');
    });
    
    document.getElementById('go-help')?.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Ayuda - En desarrollo');
    });
}

// ============ FUNCIONES DE DATOS ============ //

async function loadActiveGames() {
    const gamesList = document.getElementById('active-games-list');
    if (!gamesList) return;
    
    gamesList.innerHTML = '<p class="loading-text">Cargando salas activas...</p>';
    
    try {
        const games = await window.quizAPI.getActiveGames();
        
        if (!games || games.length === 0) {
            gamesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-broadcast-tower"></i>
                    <p>No hay salas activas en este momento</p>
                    <button id="create-demo-game" class="btn btn-small btn-primary" style="margin-top: 15px;">
                        <i class="fas fa-magic"></i> Crear Sala de Demo
                    </button>
                </div>
            `;
            
            document.getElementById('create-demo-game')?.addEventListener('click', createDemoGame);
            return;
        }
        
        gamesList.innerHTML = '';
        
        games.forEach(game => {
            const gameItem = document.createElement('div');
            gameItem.className = 'game-item';
            
            const playerCount = game.players ? game.players.length : 0;
            const statusText = game.status === 'active' ? 'En juego' : 'Esperando';
            const statusClass = game.status === 'active' ? 'status-active' : 'status-waiting';
            
            gameItem.innerHTML = `
                <div class="game-info">
                    <div class="game-title">${game.room_name || `Sala ${game.room_code}`}</div>
                    <div class="game-details">
                        <span class="status ${statusClass}">${statusText}</span> • 
                        Código: <strong>${game.room_code}</strong> • 
                        Jugadores: ${playerCount}/${game.max_players}
                    </div>
                </div>
                <div class="game-actions">
                    <button class="btn-icon join-game-btn" data-room="${game.room_code}">
                        <i class="fas fa-door-open"></i>
                    </button>
                </div>
            `;
            
            gamesList.appendChild(gameItem);
        });
        
        // Agregar listeners a los botones de unirse
        document.querySelectorAll('.join-game-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const roomCode = this.getAttribute('data-room');
                joinGame(roomCode);
            });
        });
        
    } catch (error) {
        console.error('Error cargando juegos:', error);
        gamesList.innerHTML = '<p class="error-text">Error cargando salas activas</p>';
    }
}

async function loadPublicQuizzes() {
    const quizzesList = document.getElementById('public-quizzes-list');
    if (!quizzesList) return;
    
    quizzesList.innerHTML = '<p class="loading-text">Cargando quizzes...</p>';
    
    try {
        const quizzes = await window.quizAPI.getQuizzes();
        
        if (!quizzes || quizzes.length === 0) {
            quizzesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-question-circle"></i>
                    <p>No hay quizzes públicos disponibles</p>
                    <button id="populate-test-quizzes" class="btn btn-small btn-primary" style="margin-top: 15px;">
                        <i class="fas fa-magic"></i> Crear Quizzes de Prueba
                    </button>
                </div>
            `;
            
            document.getElementById('populate-test-quizzes')?.addEventListener('click', populateTestQuizzes);
            return;
        }
        
        quizzesList.innerHTML = '';
        
        quizzes.forEach(quiz => {
            const quizItem = document.createElement('div');
            quizItem.className = 'quiz-item';
            
            const questionCount = quiz.questions ? quiz.questions.length : 0;
            const creatorName = quiz.created_by === window.auth.getUser()?.id ? 'Tú' : 'Otro usuario';
            
            quizItem.innerHTML = `
                <div class="quiz-info">
                    <div class="quiz-title">${quiz.title}</div>
                    <div class="quiz-details">
                        ${quiz.description || 'Sin descripción'} • 
                        ${questionCount} preguntas • 
                        Creado por: ${creatorName}
                    </div>
                </div>
                <div class="quiz-actions">
                    <button class="btn-icon play-quiz-btn" data-quiz="${quiz.id}">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn-icon info-quiz-btn" data-quiz="${quiz.id}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            `;
            
            quizzesList.appendChild(quizItem);
        });
        
        // Agregar listeners
        document.querySelectorAll('.play-quiz-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const quizId = this.getAttribute('data-quiz');
                createGameFromQuiz(quizId);
            });
        });
        
        document.querySelectorAll('.info-quiz-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const quizId = this.getAttribute('data-quiz');
                showQuizInfo(quizId);
            });
        });
        
    } catch (error) {
        console.error('Error cargando quizzes:', error);
        quizzesList.innerHTML = '<p class="error-text">Error cargando quizzes</p>';
    }
}

// ============ FUNCIONES DE MODALES ============ //

function showJoinModal() {
    const modal = document.getElementById('join-modal');
    const playerNameInput = document.getElementById('join-player-name');
    const user = window.auth.getUser();
    
    if (user && playerNameInput) {
        playerNameInput.value = user.full_name || '';
    }
    
    modal.classList.remove('hidden');
    
    // Configurar botones del modal
    document.getElementById('join-room-btn')?.addEventListener('click', joinRoomFromModal);
    document.getElementById('cancel-join-btn')?.addEventListener('click', function() {
        modal.classList.add('hidden');
    });
}

function showCreateGameModal() {
    const modal = document.getElementById('create-game-modal');
    modal.classList.remove('hidden');
    
    // Configurar slider de jugadores
    const slider = document.getElementById('max-players');
    const sliderValue = document.getElementById('max-players-value');
    
    if (slider && sliderValue) {
        slider.addEventListener('input', function() {
            sliderValue.textContent = `${this.value} jugadores`;
        });
    }
    
    // Cargar quizzes del usuario
    loadUserQuizzesForModal();
    
    // Configurar botones
    document.getElementById('create-room-btn')?.addEventListener('click', createRoomFromModal);
    document.getElementById('cancel-create-btn')?.addEventListener('click', function() {
        modal.classList.add('hidden');
    });
}

async function loadUserQuizzesForModal() {
    const select = document.getElementById('game-quiz-select');
    if (!select) return;
    
    try {
        const quizzes = await window.quizAPI.getMyQuizzes();
        select.innerHTML = '<option value="">Usar quiz generado automáticamente</option>';
        
        quizzes.forEach(quiz => {
            const option = document.createElement('option');
            option.value = quiz.id;
            option.textContent = `${quiz.title} (${quiz.questions?.length || 0} preguntas)`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error cargando quizzes:', error);
    }
}

// ============ FUNCIONES DE ACCIÓN ============ //

async function joinGame(roomCode) {
    try {
        const game = await window.quizAPI.getGame(roomCode);
        if (!game) {
            alert('Sala no encontrada');
            return;
        }
        
        const user = window.auth.getUser();
        const playerName = user?.full_name || prompt('Ingresa tu nombre para unirte:');
        
        if (!playerName) return;
        
        // Guardar datos y redirigir
        sessionStorage.setItem('current_room', roomCode);
        sessionStorage.setItem('player_name', playerName);
        sessionStorage.setItem('player_id', user?.id || 'guest');
        
        window.location.href = `game-room.html?room=${roomCode}`;
        
    } catch (error) {
        console.error('Error uniéndose al juego:', error);
        alert('Error al unirse a la sala: ' + error.message);
    }
}

function joinRoomFromModal() {
    const roomCode = document.getElementById('join-room-code')?.value?.toUpperCase();
    const playerName = document.getElementById('join-player-name')?.value;
    
    if (!roomCode || !playerName) {
        alert('Por favor ingresa el código de sala y tu nombre');
        return;
    }
    
    if (roomCode.length !== 8) {
        alert('El código de sala debe tener 8 caracteres');
        return;
    }
    
    // Cerrar modal
    document.getElementById('join-modal').classList.add('hidden');
    
    // Guardar y redirigir
    sessionStorage.setItem('current_room', roomCode);
    sessionStorage.setItem('player_name', playerName);
    sessionStorage.setItem('player_id', 'guest');
    
    window.location.href = `game-room.html?room=${roomCode}`;
}

async function createRoomFromModal() {
    const quizId = document.getElementById('game-quiz-select')?.value;
    const maxPlayers = document.getElementById('max-players')?.value;
    const roomName = document.getElementById('room-name')?.value;
    
    try {
        const gameData = {
            quiz_id: quizId ? parseInt(quizId) : null,
            max_players: parseInt(maxPlayers)
        };
        
        const game = await window.quizAPI.createGame(gameData);
        
        // Si hay nombre personalizado, podríamos actualizar el juego aquí
        if (roomName) {
            // En una versión futura, actualizar nombre de sala
        }
        
        // Cerrar modal
        document.getElementById('create-game-modal').classList.add('hidden');
        
        // Mostrar código de sala
        alert(`¡Sala creada! Código: ${game.room_code}\n\nComparte este código con tus estudiantes.`);
        
        // Redirigir al lobby del host
        sessionStorage.setItem('current_room', game.room_code);
        sessionStorage.setItem('player_name', 'Host');
        sessionStorage.setItem('player_id', window.auth.getUser()?.id);
        sessionStorage.setItem('is_host', 'true');
        
        window.location.href = `game-lobby.html?room=${game.room_code}`;
        
    }
    catch (error) {
        console.error('Error creando sala:', error);
        alert('Error al crear la sala: ' + error.message);
    }
}