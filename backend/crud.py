from sqlalchemy.orm import Session

from models import UserProfile, UserSesion
from schemas import UserData
#----------------------------------------------------------------------------#


#crar usuario por email
def create_usersesion(db: Session, user: UserData):
    db_user = UserSesion(email=user.email, password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

#crellenar otros datos del usuario
def create_userprofile(db: Session, user_id: int, full_name: str, age: int):
    db_profile = UserProfile(id=user_id, full_name=full_name, age=age)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

