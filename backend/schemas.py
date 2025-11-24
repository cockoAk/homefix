import email
from pydantic import BaseModel, Field
from typing import List, Optional



class UserData(BaseModel):
    email: str = Field(..., max_length=100)
    password: str = Field(..., max_length=100)


class UserId(UserData):
    id: int

class fullUserProfile(UserData):
    full_name: str
    age: int

