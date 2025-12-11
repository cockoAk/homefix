from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware

# Cargar .env primero
load_dotenv()

print("=" * 50)
print("✅ VERIFICANDO CONFIGURACIÓN")
print("=" * 50)
print(f"DB_HOST: {os.getenv('DB_HOST')}")
print(f"DB_NAME: {os.getenv('DB_NAME')}")
print("=" * 50)

# Intentar configurar la base de datos
try:
    from app.database import engine, Base
    from app import models  # Esto creará los modelos
    
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas de base de datos creadas/verificadas")
    
    # Ahora importar get_db que ya está definido
    from app.database import get_db
    
    # Crear app FastAPI
    app = FastAPI(
        title="Cultura Dominicana API",
        description="API para plataforma educativa tipo Kahoot sobre cultura dominicana",
        version="1.0.0"
    )
    
    origins = [
    "http://localhost:5500",  # Live Server por defecto
    "http://127.0.0.1:5500",  # Live Server alternativo
    "http://localhost:8000",  # Backend mismo
    "http://127.0.0.1:8000",  # Backend alternativo
    "http://localhost:3000",  # React por defecto
    "http://localhost:5173",  # Vite por defecto
]
    app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ¡PELIGRO! Solo para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

    
    # Importar routers
    from app.routers import users, quiz, game, questions
    
    # Incluir routers
    app.include_router(users.router)
    app.include_router(quiz.router)
    app.include_router(game.router)  
    app.include_router(questions.router)




    
    @app.get("/")
    def root():
        return {
            "message": "¡API de Cultura Dominicana funcionando!",
            "status": "online",
            "project": "Kahoot Dominicano",
            "endpoints": {
                "users": "/users",
                "quizzes": "/quizzes", 
                "docs": "/docs",
                "redoc": "/redoc"
            }
        }
    
    @app.get("/test-db")
    def test_db(db: Session = Depends(get_db)):
        """Endpoint para probar la conexión a la base de datos"""
        try:
            # Hacer una consulta simple
            result = db.execute("SELECT 1").fetchone()
            if result and result[0] == 1:
                return {"status": "success", "message": "Conexión a la base de datos exitosa"}
            else:
                return {"status": "error", "message": "Consulta fallida"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("⚠️ Continuando en modo simple (sin base de datos)...")
    
    # App sin base de datos
    app = FastAPI(title="Cultura Dominicana API", version="1.0.0")
    
    @app.get("/")
    def root():
        return {"message": "API funcionando (modo simple)", "database": "no configurada"}
    
    @app.get("/test-db")
    def test_db():
        return {"status": "error", "message": "Base de datos no configurada"}

@app.get("/env-check")
def env_check():
    """Muestra las variables de entorno cargadas"""
    return {
        "DB_HOST": os.getenv("DB_HOST"),
        "DB_PORT": os.getenv("DB_PORT"),
        "DB_NAME": os.getenv("DB_NAME"),
        "DB_USER": os.getenv("DB_USER"),
        "DEBUG": os.getenv("DEBUG")
    }

# Para desarrollo
if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("🚀 Iniciando servidor FastAPI...")
    print("📚 Documentación: http://localhost:8000/docs")
    print("👤 Endpoints de usuario: http://localhost:8000/users")
    print("🎯 Endpoints de quizzes: http://localhost:8000/quizzes")
    print("=" * 50)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)