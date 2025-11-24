from sqlalchemy import ForeignKey, Column, Integer, String
from database import base

class UserSesion(base):
    __tablename__ = "user_sesion"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(100), nullable=False) 


class UserProfile(base):
    __tablename__ = "user_profiles"

    id = Column(Integer, ForeignKey("user_sesion.id"), primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
