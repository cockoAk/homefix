from email.mime import base
from math import e
from threading import local
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker




host="localhost"
user="root"
password="12345"
database="homefix"

URL_CONNECTION = f"mysql+pymysql://{user}:{password}@{host}:3307/{database}"

engine = create_engine(URL_CONNECTION)
local_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
base = declarative_base()

