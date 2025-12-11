const API_BASE = 'http://localhost:8000';
let currentToken = null;
let currentUser = null;

// DOM Elements 
let loginSection, registerSection, loginForm, registerForm, guestForm;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Obtener elementos del DOM
    loginSection = document.getElementById('login-section');
    registerSection = document.getElementById('register-section');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    guestForm = document.getElementById('guest-form');
    
    setupEventListeners();
    checkSavedAuth();
});

function setupEventListeners() {
    // Toggle entre login y registro
    document.getElementById('show-register')?.addEventListener('click', function(e) {
        e.preventDefault();
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });
    
    document.getElementById('show-login')?.addEventListener('click', function(e) {
        e.preventDefault();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });
    

    if (loginForm) 
    {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) 
    {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (guestForm) 
    {
        guestForm.addEventListener('submit', handleGuestJoin);
    }
}

// ============ FUNCIONES DE AUTENTICACIÓN ============ //

async function handleLogin(e) 
{
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) 
    {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    
    try 
{
        showMessage('Iniciando sesión...', 'info');
        
        const data = await login(email, password);
        
        // Guardar token y usuario
        currentToken = data.access_token;
        currentUser = data.user;
        
        // Guardar en localStorage
        localStorage.setItem('quiz_token', currentToken);
        localStorage.setItem('quiz_user', JSON.stringify(currentUser));
        
        showMessage('¡Login exitoso! Redirigiendo...', 'success');
        
        // Redirigir al dashboard después de 1 segundo
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) 
{
        showMessage(error.message || 'Error al iniciar sesión', 'error');
    }
}

async function handleRegister(e) 
{
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const age = parseInt(document.getElementById('register-age').value);
    const password = document.getElementById('register-password').value;
    
    if (!name || !email || !age || !password) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        showMessage('Creando cuenta...', 'info');
        
        const userData = await register(name, email, age, password);
        
        showMessage('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión', 'success');
        
        // Cambiar a formulario de login
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        
        // Pre-llenar email
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').focus();
        
    } catch (error) {
        showMessage(error.message || 'Error al crear la cuenta', 'error');
    }
}

async function handleGuestJoin(e) 
{
    e.preventDefault();
    
    const playerName = document.getElementById('guest-name').value;
    const roomCode = document.getElementById('room-code').value.toUpperCase();
    
    if (!playerName || !roomCode) {
        showMessage('Por favor ingresa tu nombre y el código de sala', 'error');
        return;
    }
    
    // Guardar datos de invitado
    sessionStorage.setItem('guest_name', playerName);
    sessionStorage.setItem('room_code', roomCode);
    
    // Redirigir a la sala de juego
    window.location.href = `game-room.html?room=${roomCode}&player=guest&name=${encodeURIComponent(playerName)}`;
}

// ============ FUNCIONES API ============ //

async function login(email, password) 
{
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Credenciales incorrectas');
    }
    
    return await response.json();
}

async function register(name, email, age, password) 
{
    const userData = {
        email: email,
        password: password,
        full_name: name,
        age: age
    };
    
    const response = await fetch(`${API_BASE}/users/register`, 
        {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Error al crear usuario');
    }
    
    return await response.json();
}

// ============ UTILIDADES ============ //

function checkSavedAuth() 
{
    const savedToken = localStorage.getItem('quiz_token');
    const savedUser = localStorage.getItem('quiz_user');
    
    if (savedToken && savedUser) {
        try {
            currentToken = savedToken;
            currentUser = JSON.parse(savedUser);
            
            // Si estamos en index.html y hay token, redirigir al dashboard
            if (window.location.pathname.endsWith('index.html') || 
                window.location.pathname.endsWith('/')) {
                window.location.href = 'dashboard.html';
            }
        } catch (e) {
            // Limpiar datos corruptos
            localStorage.removeItem('quiz_token');
            localStorage.removeItem('quiz_user');
        }
    }
}

function logout() {
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    currentToken = null;
    currentUser = null;
    window.location.href = 'index.html';
}

function showMessage(text, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    container.appendChild(message);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        message.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => message.remove(), 300);
    }, 5000);
}

// Exportar para uso en otros archivos
window.auth = {
    getToken: () => currentToken,
    getUser: () => currentUser,
    logout: logout,
    isAuthenticated: () => !!currentToken,
    API_BASE: API_BASE
};