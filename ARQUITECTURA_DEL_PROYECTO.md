# 📚 Arquitectura del Proyecto: DominicanQuiz

## Narrativa Completa del Proyecto

### ¿Qué es DominicanQuiz?

DominicanQuiz es una aplicación web educativa estilo Kahoot, diseñada específicamente para promover y enseñar sobre la cultura dominicana. Es un proyecto académico desarrollado para la materia de Programación III, que combina tecnologías modernas del backend y frontend para crear una experiencia de aprendizaje interactiva en tiempo real.

La aplicación permite a los usuarios crear quizzes personalizados sobre temas de cultura dominicana, hospedar partidas en vivo, e invitar a otros jugadores a unirse y competir en tiempo real, similar a la experiencia de Kahoot. Todo esto se logra mediante una arquitectura cliente-servidor con comunicación en tiempo real a través de WebSockets.

---

## 🏗️ Visión General de la Arquitectura

El proyecto sigue una arquitectura cliente-servidor moderna separada en dos componentes principales:

### **Frontend** (Cliente)
- Tecnología: HTML5, CSS3, JavaScript vanilla
- Ubicación: `/frontend`
- Función: Interfaz de usuario y lógica del cliente

### **Backend** (Servidor)
- Tecnología: Python con FastAPI
- Ubicación: `/backend`
- Función: API REST, WebSockets, lógica de negocio y persistencia

### **Base de Datos**
- Tecnología: MySQL
- ORM: SQLAlchemy con SQLModel
- Función: Persistencia de usuarios, quizzes, preguntas, sesiones de juego y respuestas

---

## 🎨 Frontend: La Cara del Proyecto

El frontend es una aplicación web de página única (SPA) que proporciona todas las interfaces necesarias para interactuar con el sistema.

### Estructura de Archivos del Frontend

```
frontend/
├── index.html           # Página de inicio y autenticación
├── dashboard.html       # Panel principal del usuario
├── game-lobby.html      # Sala de espera para el host
├── game-room.html       # Sala de juego para jugadores
├── css/
│   └── style.css        # Estilos globales de la aplicación
└── js/
    ├── auth.js          # Manejo de autenticación y registro
    ├── api.js           # Cliente HTTP para comunicación con API
    ├── websocket.js     # Manejo de conexiones WebSocket
    ├── ui.js            # Utilidades de interfaz (mensajes, modales)
    ├── dashboard.js     # Lógica del dashboard
    ├── lobby.js         # Lógica del lobby del host
    └── game.js          # Lógica de la sala de juego
```

### El Flujo de Usuario en el Frontend

**1. Página de Inicio (index.html + auth.js)**

Todo comienza aquí. La aplicación ofrece tres opciones principales:

- **Iniciar Sesión**: Para usuarios registrados que quieren crear quizzes o hospedar partidas
- **Registrarse**: Para nuevos usuarios que desean crear una cuenta
- **Jugar como Invitado**: Para personas que solo quieren unirse a un juego existente sin registro

El módulo `auth.js` maneja toda la lógica de autenticación:
- Valida formularios del lado del cliente
- Envía credenciales al backend mediante `api.js`
- Almacena tokens JWT en localStorage para sesiones persistentes
- Redirige a la página apropiada según el tipo de usuario

**2. Dashboard (dashboard.html + dashboard.js)**

Una vez autenticado, el usuario es dirigido al dashboard, su centro de control. Aquí puede:

- Ver estadísticas personales (partidas jugadas, puntos totales, aciertos)
- Crear nuevos quizzes sobre cultura dominicana
- Explorar quizzes existentes creados por otros usuarios
- Iniciar una nueva sesión de juego como host
- Unirse a partidas activas

El módulo `dashboard.js` se encarga de:
- Cargar los datos del usuario desde el backend
- Mostrar la lista de quizzes disponibles
- Gestionar la creación de nuevos quizzes con sus preguntas
- Iniciar sesiones de juego y generar códigos de sala

**3. Lobby del Host (game-lobby.html + lobby.js)**

Cuando un usuario crea una partida, se convierte en el "host" y es dirigido al lobby. Esta es una sala de espera donde:

- Se muestra un código único de sala (ej: "A1B2C3D4")
- Los jugadores pueden unirse ingresando ese código
- El host ve en tiempo real quién se está conectando
- Hay controles para iniciar el juego cuando estén todos listos

El componente crucial aquí es `lobby.js` que:
- Establece una conexión WebSocket con el servidor
- Escucha eventos de jugadores uniéndose o saliendo
- Actualiza la lista de jugadores en tiempo real
- Envía comandos al servidor cuando el host inicia el juego

**4. Sala de Juego (game-room.html + game.js)**

Esta es la experiencia principal del juego. Los jugadores (incluyendo al host) ven:

- La pregunta actual con sus opciones de respuesta
- Un temporizador de cuenta regresiva
- Retroalimentación inmediata si respondieron correcta o incorrectamente
- Un tablero de puntuaciones en tiempo real

El módulo `game.js` es el más complejo porque:
- Mantiene una conexión WebSocket permanente durante el juego
- Recibe preguntas del servidor y las renderiza
- Envía las respuestas del jugador al servidor
- Sincroniza el estado del juego entre todos los participantes
- Muestra el leaderboard actualizado después de cada pregunta

### Módulos de Soporte del Frontend

**api.js - El Cliente HTTP**

Este módulo es el puente de comunicación HTTP con el backend. Proporciona funciones para:
- Registro y login de usuarios
- Obtener información del usuario actual
- CRUD de quizzes y preguntas
- Crear y unirse a sesiones de juego
- Maneja automáticamente los tokens de autenticación en cada petición

**websocket.js - Comunicación en Tiempo Real**

Abstrae la complejidad de WebSockets y proporciona:
- Una clase simple para conectarse a salas de juego
- Métodos para enviar y recibir mensajes
- Reconexión automática en caso de desconexión
- Manejo de errores de red

**ui.js - Utilidades de Interfaz**

Contiene funciones auxiliares para mejorar la experiencia de usuario:
- Mostrar mensajes flash (éxito, error, advertencia)
- Crear y manejar modales
- Animaciones y transiciones
- Validación visual de formularios

---

## ⚙️ Backend: El Cerebro del Sistema

El backend está construido con FastAPI, un framework moderno de Python que ofrece alto rendimiento y desarrollo rápido con validación automática de datos.

### Estructura del Backend

```
backend/
├── app/
│   ├── main.py                    # Punto de entrada de la aplicación
│   ├── database.py                # Configuración de la base de datos
│   ├── models.py                  # Modelos SQLAlchemy (tablas)
│   ├── schemas.py                 # Esquemas Pydantic (validación)
│   ├── crud.py                    # Operaciones de base de datos
│   ├── game_manager.py            # Gestor de partidas en memoria
│   ├── websocket_manager.py       # Gestor de conexiones WebSocket
│   ├── question_generator.py      # Generador de preguntas con IA
│   ├── routers/
│   │   ├── users.py               # Endpoints de usuarios
│   │   ├── quiz.py                # Endpoints de quizzes
│   │   ├── game.py                # Endpoints de juegos y WebSocket
│   │   └── questions.py           # Endpoints de preguntas
│   └── utils/
│       └── security.py            # Hashing de contraseñas y JWT
└── recreate_tables.py             # Script para recrear tablas
```

### El Corazón del Backend: main.py

`main.py` es el punto de entrada. Aquí ocurre:

1. **Carga de Configuración**: Lee variables de entorno del archivo `.env` (host de BD, credenciales, etc.)
2. **Inicialización de Base de Datos**: Crea el engine de SQLAlchemy y las tablas si no existen
3. **Creación de la App FastAPI**: Configura la aplicación con título, descripción y versión
4. **Configuración de CORS**: Permite peticiones desde el frontend (importante para desarrollo)
5. **Registro de Routers**: Incluye todos los módulos de rutas (users, quiz, game, questions)
6. **Endpoints de Salud**: Proporciona endpoints para verificar que la API está funcionando

El código tiene un manejo robusto de errores: si la base de datos no está disponible, la aplicación sigue funcionando en "modo simple" para no fallar completamente.

### Modelos de Datos: models.py

Los modelos definen la estructura de la base de datos. Las tablas principales son:

**UserSesion** - Información de autenticación
- `id`: Identificador único
- `email`: Email del usuario (único)
- `password`: Contraseña hasheada con bcrypt
- `created_at`: Fecha de registro
- `is_active`: Si la cuenta está activa

**UserProfile** - Información del perfil
- `id`: Mismo que el ID del usuario (relación 1:1)
- `full_name`: Nombre completo
- `age`: Edad del usuario
- `avatar_url`: URL del avatar (opcional)
- `bio`: Biografía (opcional)

**Quiz** - Un conjunto de preguntas
- `id`: Identificador único del quiz
- `title`: Título del quiz
- `description`: Descripción detallada
- `created_by`: ID del creador (foreign key)
- `is_public`: Si está disponible para todos
- `questions`: Relación con preguntas

**Question** - Una pregunta individual
- `id`: Identificador único
- `quiz_id`: A qué quiz pertenece
- `question_text`: El texto de la pregunta
- `options`: JSON con las opciones {"A": "texto", "B": "texto", ...}
- `correct_answer`: La letra de la respuesta correcta
- `points`: Puntos que vale la pregunta
- `time_limit`: Segundos para responder

**GameSession** - Una partida en vivo
- `id`: Identificador de la sesión
- `room_code`: Código único de 8 caracteres para unirse
- `quiz_id`: Qué quiz se está jugando
- `host_id`: Quién creó la partida
- `status`: Estado (waiting, active, finished)
- `current_question`: Pregunta actual (índice)
- `max_players`: Límite de jugadores

**PlayerAnswer** - Respuestas de jugadores
- `id`: Identificador
- `game_id`: En qué partida fue
- `player_id`: Quién respondió
- `question_id`: Qué pregunta
- `answer`: La opción elegida
- `is_correct`: Si fue correcta
- `points_earned`: Puntos obtenidos
- `response_time`: Cuánto tardó en responder

Estas tablas están relacionadas mediante foreign keys, formando un modelo relacional completo que SQLAlchemy maneja automáticamente.

### Esquemas de Validación: schemas.py

Mientras que `models.py` define cómo se guardan los datos, `schemas.py` define cómo se validan y transfieren. Usa Pydantic para:

- Validar que los emails tengan formato correcto
- Asegurar que las contraseñas cumplan requisitos mínimos
- Convertir automáticamente tipos de datos
- Filtrar qué campos se exponen en las respuestas (no devolver contraseñas)
- Documentar automáticamente la API con ejemplos

Por ejemplo, `UserCreate` valida que la contraseña tenga al menos 6 caracteres antes de siquiera llegar a la base de datos.

### Operaciones CRUD: crud.py

Este archivo contiene todas las operaciones de base de datos. Funciones como:

- `create_user()`: Crea un nuevo usuario con contraseña hasheada
- `get_user_by_email()`: Busca usuarios por email
- `authenticate_user()`: Verifica credenciales
- `create_quiz()`: Crea un quiz con todas sus preguntas en una transacción
- `get_public_quizzes()`: Obtiene quizzes disponibles
- `create_game_session()`: Inicia una nueva partida

Estas funciones encapsulan toda la lógica de acceso a datos, manteniendo el resto del código limpio.

### Los Routers: Organizando los Endpoints

FastAPI usa "routers" para organizar endpoints relacionados:

**users.py** - Todo sobre usuarios:
- `POST /users/register`: Crear cuenta
- `POST /users/login`: Iniciar sesión (devuelve JWT token)
- `GET /users/me`: Información del usuario actual
- `GET /users/{user_id}`: Ver perfil de otro usuario

**quiz.py** - Gestión de quizzes:
- `POST /quizzes/`: Crear nuevo quiz
- `GET /quizzes/`: Listar quizzes públicos
- `GET /quizzes/my-quizzes`: Mis quizzes
- `GET /quizzes/{quiz_id}`: Ver quiz específico
- `PUT /quizzes/{quiz_id}`: Actualizar quiz
- `DELETE /quizzes/{quiz_id}`: Eliminar quiz

**questions.py** - Gestión de preguntas:
- `POST /questions/`: Añadir pregunta a un quiz
- `GET /questions/{question_id}`: Ver pregunta
- `PUT /questions/{question_id}`: Actualizar pregunta
- `DELETE /questions/{question_id}`: Eliminar pregunta

**game.py** - El corazón del juego en tiempo real:
- `POST /game/create`: Crear sesión de juego
- `GET /game/active`: Listar juegos activos
- `GET /game/room/{room_code}`: Info de una sala
- `WebSocket /game/ws/{room_code}`: Conexión para el juego en tiempo real

### Seguridad: utils/security.py

La seguridad es crítica. Este módulo proporciona:

- **Hashing de Contraseñas**: Usa bcrypt para almacenar contraseñas de forma segura. Nunca se guarda el texto plano.
- **JWT Tokens**: Genera tokens firmados para autenticación sin estado. El token contiene el ID del usuario encriptado.
- **Verificación**: Funciones para verificar contraseñas y validar tokens.
- **Dependencias**: `get_current_user()` es una dependencia de FastAPI que extrae y valida el token automáticamente en rutas protegidas.

### Gestión de Juegos en Memoria: game_manager.py

Este es un componente fascinante. Debido a que los juegos son eventos en tiempo real, no todo se persiste inmediatamente en la base de datos. `GameManager` mantiene:

**En Memoria:**
- `rooms`: Diccionario con todas las salas activas
- `player_connections`: WebSockets de jugadores por sala
- `game_state`: Estado actual del juego (puntuaciones, respuestas, tiempo)

**Funcionalidades:**
- `create_room()`: Genera código único de sala
- `add_player()`: Registra nuevo jugador en sala
- `remove_player()`: Elimina jugador (si abandona)
- `start_game()`: Cambia estado a "active"
- `next_question()`: Avanza a siguiente pregunta
- `record_answer()`: Registra respuesta de jugador
- `calculate_scores()`: Calcula puntuaciones considerando tiempo
- `end_game()`: Finaliza partida y persiste resultados a BD

Para producción, esto debería usar Redis para ser distribuido, pero para una demo educativa, la memoria local funciona perfectamente.

### WebSocket Manager: websocket_manager.py

Este módulo gestiona las conexiones WebSocket. Proporciona:

- `ConnectionManager`: Clase singleton que mantiene todas las conexiones activas
- `connect()`: Acepta nueva conexión WebSocket y la registra
- `disconnect()`: Limpia conexión cerrada
- `broadcast_to_room()`: Envía mensaje a todos en una sala
- `send_to_player()`: Envía mensaje a jugador específico

El flujo típico es:
1. Jugador se conecta al WebSocket de una sala
2. El servidor acepta y registra la conexión
3. Cuando ocurren eventos (nueva pregunta, respuesta, etc.), el servidor hace broadcast
4. Todos los clientes conectados reciben y procesan el mensaje
5. Los clientes responden con sus propios mensajes

### Generador de Preguntas: question_generator.py

Este es un módulo avanzado que puede usar IA (como OpenAI) para generar preguntas automáticamente sobre cultura dominicana. Aunque requiere configuración adicional, muestra la extensibilidad del sistema.

---

## 🗄️ Base de Datos: La Memoria Persistente

La aplicación usa MySQL como sistema de gestión de base de datos. La configuración está en `database.py`:

### Conexión

```python
DATABASE_URL = f"mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
```

- Usa PyMySQL como driver
- `pool_pre_ping=True` asegura que las conexiones estén vivas
- Lee credenciales de variables de entorno (.env)

### Sesiones

SQLAlchemy usa el patrón de sesión para manejar transacciones:
- Cada petición obtiene una sesión de `get_db()`
- Las operaciones se agrupan en transacciones
- Al finalizar la petición, la sesión se cierra automáticamente

### Migraciones

Actualmente, el proyecto usa `Base.metadata.create_all()` que crea las tablas automáticamente al iniciar. Para producción, se usaría Alembic para migraciones versionadas.

---

## 🔄 Flujo Completo de una Partida

Veamos cómo todos los componentes trabajan juntos en un escenario real:

### 1. Preparación (Host)

**Frontend:**
1. Usuario inicia sesión en `index.html`
2. `auth.js` envía credenciales a `/users/login`
3. Recibe token JWT y redirige a `dashboard.html`

**Backend:**
1. `users.py` recibe login
2. `crud.authenticate_user()` verifica credenciales
3. `security.create_access_token()` genera JWT
4. Devuelve token al cliente

### 2. Creación de Partida (Host)

**Frontend:**
1. Usuario hace clic en "Crear Partida" en dashboard
2. Selecciona un quiz existente
3. `dashboard.js` llama a `api.createGameSession()`

**Backend:**
1. `game.py` recibe POST a `/game/create`
2. Valida que el usuario esté autenticado
3. `crud.create_game_session()` crea entrada en BD
4. `game_manager.create_room()` crea sala en memoria
5. Genera código único de sala (ej: "A1B2C3D4")
6. Devuelve información de la sala

**Frontend:**
1. Redirige a `game-lobby.html?room=A1B2C3D4`
2. `lobby.js` establece WebSocket al backend
3. Muestra código de sala en pantalla grande

### 3. Jugadores Uniéndose

**Frontend (Jugador):**
1. Jugador ingresa código de sala en `index.html`
2. Se une como invitado o con cuenta
3. Redirige a `game-room.html?room=A1B2C3D4`
4. `game.js` establece conexión WebSocket

**Backend:**
1. Acepta conexión WebSocket en `/game/ws/{room_code}`
2. `websocket_manager.connect()` registra conexión
3. `game_manager.add_player()` añade jugador a sala
4. Hace broadcast a todos: "PLAYER_JOINED"

**Frontend (Host en Lobby):**
1. Recibe mensaje "PLAYER_JOINED" por WebSocket
2. `lobby.js` actualiza lista de jugadores
3. Muestra nuevo jugador en la UI

### 4. Inicio del Juego (Host)

**Frontend:**
1. Host hace clic en "Iniciar Juego"
2. `lobby.js` envía mensaje WebSocket: `{action: "START_GAME"}`

**Backend:**
1. Recibe mensaje START_GAME
2. `game_manager.start_game()` cambia estado
3. Carga preguntas del quiz desde BD
4. Envía primera pregunta a todos: `{type: "QUESTION", data: {...}}`

**Frontend (Todos):**
1. Reciben mensaje tipo "QUESTION"
2. `game.js` renderiza pregunta y opciones
3. Inicia temporizador visual de cuenta regresiva
4. Muestra botones de respuesta

### 5. Respondiendo Preguntas

**Frontend (Jugador):**
1. Jugador hace clic en opción (ej: opción "B")
2. `game.js` desactiva botones para evitar cambios
3. Envía WebSocket: `{action: "ANSWER", answer: "B", time: 15}`

**Backend:**
1. Recibe respuesta del jugador
2. `game_manager.record_answer()` guarda respuesta y tiempo
3. Verifica si es correcta comparando con `question.correct_answer`
4. Calcula puntos (más puntos si respondió rápido)
5. Actualiza puntuación del jugador en memoria

### 6. Resultados de la Pregunta

**Backend:**
1. Espera a que termine el tiempo o todos respondan
2. `game_manager.calculate_scores()` finaliza cálculos
3. Broadcast a todos: `{type: "QUESTION_RESULT", scores: [...], correct: "B"}`

**Frontend (Todos):**
1. Reciben resultados
2. `game.js` muestra si acertaron o fallaron con colores
3. Muestra la respuesta correcta
4. Actualiza y muestra leaderboard con animaciones

### 7. Siguiente Pregunta

**Backend:**
1. Después de 5 segundos, `game_manager.next_question()`
2. Envía siguiente pregunta a todos
3. Repite el proceso

### 8. Final del Juego

**Backend:**
1. Cuando se acaban las preguntas, `game_manager.end_game()`
2. Persiste resultados finales en `PlayerAnswer` tabla
3. Actualiza `GameSession.status` a "finished"
4. Broadcast: `{type: "GAME_END", final_scores: [...], winner: {...}}`

**Frontend (Todos):**
1. Reciben mensaje GAME_END
2. Muestran pantalla de resultados finales
3. Destacan al ganador con animaciones
4. Muestran tabla de posiciones completa
5. Ofrecen botones para volver al dashboard

---

## 🔐 Seguridad y Autenticación

### Flujo de Autenticación JWT

1. **Login**: Usuario envía email y contraseña
2. **Verificación**: Backend verifica con bcrypt hash
3. **Token Generation**: Crea JWT con payload: `{sub: user_id, exp: timestamp}`
4. **Token Signing**: Firma el token con clave secreta
5. **Response**: Devuelve token al cliente
6. **Storage**: Cliente guarda token en localStorage
7. **Subsequent Requests**: Cliente incluye token en header `Authorization: Bearer <token>`
8. **Validation**: Backend verifica firma y expiration en cada petición protegida

### Protección de Rutas

En el backend, rutas protegidas usan la dependencia `Depends(get_current_user)`:

```python
@router.get("/quizzes/my-quizzes")
def my_quizzes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Solo usuarios autenticados pueden acceder
    return crud.get_user_quizzes(db, current_user.id)
```

En el frontend, `api.js` automáticamente incluye el token:

```javascript
headers: {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
}
```

---

## 🚀 Tecnologías y Dependencias

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con Flexbox y Grid
- **JavaScript ES6+**: Lógica del cliente con async/await
- **Font Awesome**: Iconos
- **WebSocket API**: Comunicación en tiempo real

### Backend
- **Python 3.8+**: Lenguaje del servidor
- **FastAPI**: Framework web moderno y rápido
- **SQLAlchemy**: ORM para base de datos
- **Pydantic**: Validación de datos
- **Uvicorn**: Servidor ASGI
- **PyMySQL**: Driver de MySQL
- **python-jose**: Manejo de JWT
- **bcrypt**: Hashing de contraseñas
- **python-dotenv**: Variables de entorno

### Base de Datos
- **MySQL**: Sistema de gestión de base de datos relacional

---

## 📦 Estructura de Archivos Completa

```
homefix/
├── README.md                          # Documentación general
├── ARQUITECTURA_DEL_PROYECTO.md      # Este documento
│
├── frontend/                          # Aplicación cliente
│   ├── index.html                    # Login/registro/invitado
│   ├── dashboard.html                # Panel de usuario
│   ├── game-lobby.html               # Sala de espera del host
│   ├── game-room.html                # Sala de juego activa
│   ├── css/
│   │   └── style.css                 # Estilos globales
│   └── js/
│       ├── auth.js                   # Autenticación
│       ├── api.js                    # Cliente HTTP
│       ├── websocket.js              # Cliente WebSocket
│       ├── ui.js                     # Utilidades UI
│       ├── dashboard.js              # Lógica dashboard
│       ├── lobby.js                  # Lógica lobby
│       └── game.js                   # Lógica juego
│
└── backend/                           # Aplicación servidor
    ├── app/
    │   ├── main.py                   # Punto de entrada
    │   ├── database.py               # Configuración BD
    │   ├── models.py                 # Modelos SQLAlchemy
    │   ├── schemas.py                # Esquemas Pydantic
    │   ├── crud.py                   # Operaciones BD
    │   ├── game_manager.py           # Gestor juegos en memoria
    │   ├── websocket_manager.py      # Gestor WebSockets
    │   ├── question_generator.py     # Generador IA de preguntas
    │   ├── routers/
    │   │   ├── users.py              # Endpoints usuarios
    │   │   ├── quiz.py               # Endpoints quizzes
    │   │   ├── game.py               # Endpoints juegos
    │   │   └── questions.py          # Endpoints preguntas
    │   └── utils/
    │       └── security.py           # Seguridad y JWT
    ├── .env                          # Variables de entorno
    └── recreate_tables.py            # Script de inicialización
```

---

## 🎯 Flujo de Datos: Diagrama Conceptual

```
[Usuario] --> [Frontend HTML/JS] --> [API REST FastAPI] --> [MySQL Database]
                    ↕                        ↕
              [WebSocket]  <-->  [WebSocket Manager]
                                       ↕
                                [Game Manager (Memoria)]
```

---

## 🧩 Patrones de Diseño Utilizados

1. **MVC (Model-View-Controller)**:
   - Model: `models.py` (estructura de datos)
   - View: HTML/CSS (presentación)
   - Controller: Routers y JS (lógica)

2. **Repository Pattern**:
   - `crud.py` abstrae acceso a datos
   - Separa lógica de negocio de persistencia

3. **Dependency Injection**:
   - FastAPI usa DI para `get_db()` y `get_current_user()`
   - Facilita testing y modularidad

4. **Singleton**:
   - `GameManager` y `ConnectionManager` son singletons
   - Una única instancia gestiona todo

5. **Observer (Pub/Sub)**:
   - WebSocket implementa patrón observer
   - Eventos se propagan a suscriptores

---

## 🛠️ Instalación y Ejecución

### Requisitos Previos
- Python 3.8+
- MySQL Server
- Navegador moderno
- Node.js (opcional, para servidor estático)

### Configuración del Backend

1. Navegar al directorio backend:
```bash
cd backend/
```

2. Crear entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. Configurar variables de entorno (crear archivo `.env`):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=homefix
SECRET_KEY=tu_clave_secreta_para_jwt
```

5. Iniciar el servidor:
```bash
python -m app.main
```

El servidor estará disponible en `http://localhost:8000`
Documentación automática en `http://localhost:8000/docs`

### Configuración del Frontend

1. Opción 1 - Servidor simple con Python:
```bash
cd frontend/
python -m http.server 5500
```

2. Opción 2 - Live Server (VS Code extension)
   - Abrir `frontend/` en VS Code
   - Click derecho en `index.html`
   - "Open with Live Server"

3. Opción 3 - Node.js:
```bash
cd frontend/
npx serve .
```

El frontend estará disponible en `http://localhost:5500`

---

## 🔍 Endpoints Principales de la API

### Autenticación
- `POST /users/register` - Crear cuenta
- `POST /users/login` - Iniciar sesión
- `GET /users/me` - Perfil actual

### Quizzes
- `GET /quizzes/` - Listar quizzes públicos
- `POST /quizzes/` - Crear quiz
- `GET /quizzes/{id}` - Ver quiz
- `PUT /quizzes/{id}` - Actualizar quiz
- `DELETE /quizzes/{id}` - Eliminar quiz

### Preguntas
- `POST /questions/` - Crear pregunta
- `GET /questions/{id}` - Ver pregunta
- `PUT /questions/{id}` - Actualizar pregunta
- `DELETE /questions/{id}` - Eliminar pregunta

### Juegos
- `POST /game/create` - Crear sesión
- `GET /game/active` - Listar activos
- `GET /game/room/{code}` - Info de sala
- `WebSocket /game/ws/{code}` - Conexión tiempo real

### Utilidades
- `GET /` - Estado de la API
- `GET /docs` - Documentación interactiva (Swagger)
- `GET /redoc` - Documentación alternativa (ReDoc)

---

## 🎓 Conceptos Técnicos Clave

### WebSockets vs HTTP
- **HTTP**: Petición-respuesta, cliente inicia
- **WebSocket**: Conexión persistente, bidireccional
- El juego usa WebSocket porque necesita actualizaciones instantáneas
- El servidor puede "empujar" datos sin que el cliente pregunte

### JWT (JSON Web Tokens)
- Token auto-contenido con información del usuario
- Firmado criptográficamente (no se puede falsificar)
- Permite autenticación sin estado (no se guarda sesión en servidor)
- Expira automáticamente por seguridad

### ORM (Object-Relational Mapping)
- SQLAlchemy mapea clases Python a tablas SQL
- Permite trabajar con objetos en lugar de SQL directo
- Previene SQL injection automáticamente
- Facilita cambiar de base de datos

### Arquitectura Cliente-Servidor
- **Separación de responsabilidades**: UI vs Lógica de negocio
- **Escalabilidad**: Se puede escalar backend y frontend independientemente
- **Mantenibilidad**: Cambios en uno no afectan al otro
- **Multi-plataforma**: Mismo backend para web, móvil, etc.

---

## 🚧 Limitaciones Actuales y Mejoras Futuras

### Limitaciones
- Estado del juego en memoria (se pierde al reiniciar servidor)
- No hay persistencia de conexiones WebSocket
- Sin sala de chat entre jugadores
- No hay sistema de rankings global
- Frontend no es responsivo para móviles

### Mejoras Propuestas
- **Redis**: Para estado distribuido del juego
- **PostgreSQL**: Base de datos más robusta
- **React/Vue**: Frontend con componentes
- **Docker**: Containerización para fácil despliegue
- **CI/CD**: Pipeline de integración continua
- **Tests**: Pruebas unitarias y de integración
- **Multimedia**: Preguntas con imágenes y videos
- **Avatares**: Sistema de avatares personalizables
- **Achievements**: Sistema de logros y badges
- **Mobile App**: Aplicación nativa iOS/Android

---

## 📚 Conclusión

DominicanQuiz es un proyecto educativo completo que demuestra una arquitectura moderna de aplicación web. Combina tecnologías del frontend (HTML, CSS, JavaScript) con un backend robusto (Python, FastAPI, MySQL) para crear una experiencia interactiva en tiempo real.

El proyecto ilustra conceptos fundamentales de desarrollo web:
- Arquitectura cliente-servidor
- API RESTful
- Autenticación y autorización
- Base de datos relacional
- Comunicación en tiempo real con WebSockets
- Gestión de estado
- Seguridad web

Aunque es una demo académica, la estructura y patrones utilizados son escalables y aplicables a proyectos de producción. Cada componente tiene un propósito claro y la separación de responsabilidades facilita el mantenimiento y extensión futura.

---

**Tiempo de lectura estimado: 8-10 minutos**

---

*Documentación creada para el proyecto DominicanQuiz - Programación III*
*Fecha: Diciembre 2024*
