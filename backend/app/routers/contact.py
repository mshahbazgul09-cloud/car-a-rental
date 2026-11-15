from fastapi import APIRouter, Depends

from ..dependencies import get_repository
from ..repositories.base import Repository
from ..schemas import ContactIn

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", status_code=201)
def send_message(body: ContactIn, repo: Repository = Depends(get_repository)):
    repo.create_contact_message(body.model_dump())
    return {"ok": True}
