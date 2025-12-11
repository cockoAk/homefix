// Utilidades de interfaz de usuario

// Navegación entre páginas
function navigateTo(page) {
    window.location.href = page;
}

// Cargar plantillas HTML (para reutilización)
async function loadTemplate(templateName) {
    try {
        const response = await fetch(`templates/${templateName}.html`);
        if (!response.ok) throw new Error('Template no encontrado');
        return await response.text();
    } catch (error) {
        console.error('Error cargando template:', error);
        return `<div class="error">Error cargando ${templateName}</div>`;
    }
}

// Actualizar título de página
function updatePageTitle(title) {
    document.title = `${title} - DominicanQuiz`;
}

// Mostrar/ocultar elementos
function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.remove('hidden');
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.add('hidden');
}

// Formatear tiempo (segundos a MM:SS)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Crear elemento DOM
function createElement(tag, classes = [], attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    if (classes.length > 0) {
        element.classList.add(...classes);
    }
    
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    
    if (content) {
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else {
            element.appendChild(content);
        }
    }
    
    return element;
}

// Animación de conteo regresivo
function animateCountdown(element, from, to, duration = 1000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const endTime = startTime + duration;
        
        function update() {
            const now = Date.now();
            const progress = Math.min(1, (now - startTime) / duration);
            
            const current = Math.floor(from + (to - from) * progress);
            element.textContent = current;
            
            if (now < endTime) {
                requestAnimationFrame(update);
            } else {
                element.textContent = to;
                resolve();
            }
        }
        
        update();
    });
}

// Efecto de confeti (simple)
function showConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const container = document.body;
    
    for (let i = 0; i < 50; i++) {
        const confetti = createElement('div', ['confetti'], {
            style: `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * 100}%;
                z-index: 10000;
                border-radius: 50%;
                pointer-events: none;
            `
        });
        
        container.appendChild(confetti);
        
        // Animación
        const animation = confetti.animate([
            { 
                transform: 'translateY(0) rotate(0deg)',
                opacity: 1 
            },
            { 
                transform: `translateY(${window.innerHeight + 10}px) rotate(${Math.random() * 360}deg)`,
                opacity: 0 
            }
        ], {
            duration: 1000 + Math.random() * 2000,
            easing: 'cubic-bezier(0.215, 0.610, 0.355, 1)'
        });
        
        animation.onfinish = () => confetti.remove();
    }
}

// Vibrar elemento (para respuestas incorrectas)
function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Estilo para shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .confetti {
        animation-timing-function: linear;
    }
`;
document.head.appendChild(style);

// Exportar funciones
window.ui = {
    navigateTo,
    loadTemplate,
    updatePageTitle,
    showElement,
    hideElement,
    formatTime,
    createElement,
    animateCountdown,
    showConfetti,
    shakeElement
};