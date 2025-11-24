from email.mime import base
from math import e
from threading import local
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
#----------------------------------------------------------------------------#


#datos de conexion a la base de datos
host="localhost"
user="root"
password="12345"
database="homefix"

# construccion de la url de conexion
URL_CONNECTION = f"mysql+pymysql://{user}:{password}@{host}:3307/{database}"

# creacion del engine y la session local
engine = create_engine(URL_CONNECTION)
local_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
base = declarative_base()

