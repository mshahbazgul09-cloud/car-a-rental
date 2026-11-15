from fastapi import APIRouter, Depends

from .. import config, services
from ..dependencies import get_current_user, get_repository
from ..repositories.base import Repository
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut
from ..security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token(user: dict) -> dict:
    return {"access_token": create_access_token(user["id"], user["role"], config.JWT_SECRET, config.TOKEN_MINUTES), "user": user}


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, repo: Repository = Depends(get_repository)):
    return _token(services.register_user(repo, body.name, body.email, body.phone, body.password))


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, repo: Repository = Depends(get_repository)):
    return _token(services.authenticate(repo, body.email, body.password))


@router.get("/me", response_model=UserOut)
def me(user: dict = Depends(get_current_user)):
    return user
