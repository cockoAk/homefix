// Cliente API para DominicanQuiz
class QuizAPI 
{

    constructor(baseURL = 'http://localhost:8000') 
    {
        this.baseURL = baseURL;
    }
    
    // Headers comunes
    getHeaders(withAuth = true) 
    {
        const headers = 
        {
            'Content-Type': 'application/json'
        };
        
        if (withAuth) {
            const token = window.auth?.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    }
    
    // Manejo de errores
    async handleResponse(response) 
    {
        if (!response.ok) {
            let errorMsg = `Error ${response.status}`;
            try 
            {
                const errorData = await response.json();
                errorMsg = errorData.detail || errorMsg;
            } catch (e) {
                // No se p2 parsear JSON
            }
            throw new Error(errorMsg);
        }
        
        return response.json();
    }
    
    // ============ USUARIOS ============ //
    
    async getCurrentUser() {
        const response = await fetch(`${this.baseURL}/users/me`, 
        {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
    
    async updateUserProfile(updates) 
    {
        const response = await fetch(`${this.baseURL}/users/me`, 
        {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(updates)
        });
        return this.handleResponse(response);
    }
    
    // ============ QUIZZES ============ //
    
    async createQuiz(quizData) {
        const response = await fetch(`${this.baseURL}/quizzes/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(quizData)
        });
        return this.handleResponse(response);
    }
    
    async getQuizzes(skip = 0, limit = 100) 
    {
        const response = await fetch(
            `${this.baseURL}/quizzes/?skip=${skip}&limit=${limit}`,
            { headers: this.getHeaders() }
        );
        return this.handleResponse(response);
    }
    
    async getMyQuizzes(skip = 0, limit = 100) 
    {
        const response = await fetch(
            `${this.baseURL}/quizzes/my-quizzes?skip=${skip}&limit=${limit}`,
            { headers: this.getHeaders() }
        );
        return this.handleResponse(response);
    }
    
    async getQuiz(quizId) 
    {
        const response = await fetch(
            `${this.baseURL}/quizzes/${quizId}`,
            { headers: this.getHeaders() }
        );
        return this.handleResponse(response);
    }
    
    async deleteQuiz(quizId) 
    {
        const response = await fetch(`${this.baseURL}/quizzes/${quizId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
    
    async populateTestQuizzes() 
    {
        const response = await fetch(`${this.baseURL}/quizzes/test/populate`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
    
    // ============ JUEGOS ============
    
    async createGame(gameData) 
    {
        const response = await fetch(`${this.baseURL}/game/create`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(gameData)
        });
        return this.handleResponse(response);
    }
    
    async getActiveGames(skip = 0, limit = 50) 
    {
        const response = await fetch(
            `${this.baseURL}/game/active?skip=${skip}&limit=${limit}`,
            { headers: this.getHeaders() }
        );
        return this.handleResponse(response);
    }
    
    async getGame(roomCode) 
    {
        const response = await fetch(
            `${this.baseURL}/game/room/${roomCode}`,
            { headers: this.getHeaders() }
        );
        return this.handleResponse(response);
    }
    
    async startGame(roomCode) 
    {
        const response = await fetch(`${this.baseURL}/game/${roomCode}/start`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
    
    async getLeaderboard(roomCode) 
    {
        const response = await fetch(
            `${this.baseURL}/game/${roomCode}/leaderboard`,
            { headers: this.getHeaders() }
        );
        return this.handleResponse(response);
    }
    
    async createDemoGame() 
    {
        const response = await fetch(`${this.baseURL}/game/test/create-demo`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
    
    // ============ PREGUNTAS ============ //
    
    async generateQuestion(topic = null, difficulty = null) 
    {
        let url = `${this.baseURL}/questions/generate`;
        const params = new URLSearchParams();
        if (topic) params.append('tema', topic);
        if (difficulty) params.append('dificultad', difficulty);
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await fetch(url, { headers: this.getHeaders() });
        return this.handleResponse(response);
    }
    
    async generateQuiz(numQuestions = 5, topic = null, difficulty = null) 
    {
        let url = `${this.baseURL}/questions/generate-quiz`;
        const params = new URLSearchParams();
        params.append('num_preguntas', numQuestions);
        if (topic) params.append('tema', topic);
        if (difficulty) params.append('dificultad', difficulty);
        url += `?${params.toString()}`;
        
        const response = await fetch(url, { headers: this.getHeaders() });
        return this.handleResponse(response);
    }
    
    async getAvailableTopics() 
    {
        const response = await fetch(`${this.baseURL}/questions/topics`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
    
    async getDemoQuiz() 
    {
        const response = await fetch(`${this.baseURL}/questions/demo-quiz`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
    
    async verifyAnswer(preguntaId, respuesta, preguntasQuiz) 
    {
        const response = await fetch(`${this.baseURL}/questions/verify`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                pregunta_id: preguntaId,
                respuesta: respuesta,
                preguntas_quiz: preguntasQuiz
            })
        });
        return this.handleResponse(response);
    }
    
    // ============ UTILIDADES ============ //
    
    async testConnection() 
    {
        try {
            const response = await fetch(`${this.baseURL}/test-db`);
            const data = await response.json();
            return { success: data.status === 'success', data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async checkEnv() {
        const response = await fetch(`${this.baseURL}/env-check`);
        return this.handleResponse(response);
    }
}

// Instancia global de la API
window.quizAPI = new QuizAPI(window.auth?.API_BASE || 'http://localhost:8000');