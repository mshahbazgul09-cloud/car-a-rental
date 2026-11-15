"""Shared FastAPI dependencies: the data repository and the logged-in user."""
from functools import lru_cache

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import config
from .errors import Forbidden, Unauthorized
from .repositories.base import Repository
from .repositories.memory import MemoryRepository
from .security import decode_access_token
from .services import public_user

bearer = HTTPBearer(auto_error=False)


@lru_cache
def get_repository() -> Repository:
    """THE switch between mock data and the real database.

    Today: temporary in-memory data.
    Later (after you connect Supabase yourself):
        from .repositories.supabase_repo import SupabaseRepository
        return SupabaseRepository(your_supabase_client)
    """
    return MemoryRepository()


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    repo: Repository = Depends(get_repository),
) -> dict | None:
    """The logged-in user, or None for guests. A bad or expired token is an error."""
    if creds is None:
        return None
    claims = decode_access_token(creds.credentials, config.JWT_SECRET)
    user = repo.get_user(claims["sub"])
    if not user:
        raise Unauthorized("Invalid login token.")
    return public_user(user)


def get_current_user(user: dict | None = Depends(get_optional_user)) -> dict:
    if user is None:
        raise Unauthorized("Please log in to continue.")
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise Forbidden("Admin access required.")
    return user
