from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app import crud, schemas
from app.utils.security import create_access_token, decode_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/users", tags=["users"])

# Configurar OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# ============ HELPER FUNCTIONS ============

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Obtiene el usuario actual basado en el token JWT"""
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# ============ AUTH ENDPOINTS ============

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Registra un nuevo usuario (versión debug)"""
    try:
        db_user = crud.create_user(db, user)
        
        # Retorna respuesta simple sin schema
        return {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.profile.full_name,
            "age": db_user.profile.age,
            "message": "Usuario creado exitosamente"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Inicia sesión y obtiene token JWT"""
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear token de acceso
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    # Crear objeto UserResponse con los datos del perfil
    user_response = schemas.UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.profile.full_name,
        age=user.profile.age,
        created_at=user.created_at,
        is_active=user.is_active,
        avatar_url=user.profile.avatar_url,
        bio=user.profile.bio
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }
    

    
    # Crear token de acceso
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# ============ USER PROFILE ENDPOINTS ============

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(
    current_user: schemas.UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)  # Necesitamos db para cargar relaciones
):
    """Obtiene el perfil del usuario actual"""
    # Necesitamos recargar el usuario con sus relaciones
    db_user = crud.get_user(db, current_user.id)
    
    if not db_user or not db_user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario o perfil no encontrado"
        )
    
    # Convertir a UserResponse
    return schemas.UserResponse(
        id=db_user.id,
        email=db_user.email,
        full_name=db_user.profile.full_name,
        age=db_user.profile.age,
        created_at=db_user.created_at,
        is_active=db_user.is_active,
        avatar_url=db_user.profile.avatar_url,
        bio=db_user.profile.bio
    )

@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    """Obtiene un usuario por ID (público)"""
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return db_user

# ============ TEST ENDPOINTS (para desarrollo) ============

@router.get("/test/protected")
def test_protected(current_user: schemas.UserResponse = Depends(get_current_user)):
    """Endpoint protegido para probar autenticación"""
    return {
        "message": f"Hola {current_user.profile.full_name}!",
        "email": current_user.email,
        "user_id": current_user.id
    }

@router.get("/test/all")
def get_all_users(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """Obtiene todos los usuarios (solo para desarrollo)"""
    users = db.query(crud.models.UserSesion).offset(skip).limit(limit).all()
    return users