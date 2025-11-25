from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
from database import local_session, engine
from schemas import UserData, UserId, fullUserProfile
from models import UserSesion, UserProfile, base
#--------------------------------------------------------------------#


base.metadata.create_all(bind=engine)
app = FastAPI()

def get_db():
    db = local_session()
    try:
        yield db
    finally:
        db.close()


#----------------------------EndPoints------------------------------#

#para crear un nuevo usuario
@app.post("/users/", response_model=UserId)
def create_user(user: UserData, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_usersesion(db=db, user=user)

#para objtener todas las sesiones usuarios
@app.get("/users/", response_model=list[UserId])
def read_users(db: Session = Depends(get_db)):
    users = crud.get_users(db)
    return users

#para obtener la sesion via su correo
@app.get("/user_by_email/", response_model=UserId)
def read_user_by_email(email: str, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=email)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

app.post("/user_profile/{user_id}/", response_model=fullUserProfile)
def create_profile_for_user(user_id: int, full_name: str, age: int, db: Session = Depends(get_db)):
    return crud.create_userprofile(db=db, user_id=user_id, full_name=full_name, age=age)

app.get("/full_users/", response_model=list[fullUserProfile])
def read_full_users(db: Session = Depends(get_db)):
    full_users = crud.get_full_users(db)
    result = []
    for user_sesion, user_profile in full_users:
        result.append(fullUserProfile(
            email=user_sesion.email,
            password=user_sesion.password,
            full_name=user_profile.full_name,
            age=user_profile.age
        ))
    return result

app.get("user_profiles_by_email/", response_model=fullUserProfile)
def read_user_profile_by_email(email: str, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=email)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    db_profile = db.query(UserProfile).filter(UserProfile.id == db_user.id).first()
    if db_profile is None:
        raise HTTPException(status_code=404, detail="User profile not found")
    return fullUserProfile(
        email=db_user.email,
        password=db_user.password,
        full_name=db_profile.full_name,
        age=db_profile.age
    )






