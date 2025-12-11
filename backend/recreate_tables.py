# backend/recreate_tables.py
from app.database import engine, Base
from app import models

print("⚠️ ADVERTENCIA: Esto borrará todas las tablas existentes")
print("Tablas a borrar: user_sesion, user_profiles, quizzes, questions, game_sessions, player_answers")
confirm = input("¿Continuar? (sí/no): ")

if confirm.lower() in ['sí', 'si', 's', 'yes', 'y']:
    print("Borrando tablas existentes...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creando nuevas tablas...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ Tablas recreadas correctamente")
    print("Ejecuta: python -m app.main")
else:
    print("❌ Operación cancelada")