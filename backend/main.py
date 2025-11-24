from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
from database import local_session, engine
from schemas import UserData, UserId, fullUserProfile
from models import UserSesion, UserProfile, base
#----------------------------------------------------------------------------#


base.metadata.create_all(bind=engine)
app = FastAPI()

def get_db():
    db = local_session()
    try:
        yield db
    finally:
        db.close()


#creacion de usuario con email y password
@app.post("/users/", response_model=UserId)
def create_user(user: UserData, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_usersesion(db=db, user=user)


    



