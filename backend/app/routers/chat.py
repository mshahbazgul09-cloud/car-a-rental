from fastapi import APIRouter, Depends, Header

from .. import services
from ..dependencies import get_optional_user, get_repository
from ..repositories.base import Repository
from ..schemas import ChatMessageIn, ChatOut, ChatStartIn, ChatStartOut

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatStartOut, status_code=201)
def start_chat(body: ChatStartIn, user: dict | None = Depends(get_optional_user), repo: Repository = Depends(get_repository)):
    return services.start_chat(repo, name=body.name, contact=body.contact or "", message=body.message,
                               user_id=user["id"] if user else None)


@router.get("/{thread_id}", response_model=ChatOut)
def get_chat(thread_id: str, x_chat_token: str | None = Header(default=None), repo: Repository = Depends(get_repository)):
    return services.get_visitor_chat(repo, thread_id, x_chat_token)


@router.post("/{thread_id}/messages", response_model=ChatOut)
def send_message(thread_id: str, body: ChatMessageIn, x_chat_token: str | None = Header(default=None),
                 repo: Repository = Depends(get_repository)):
    return services.visitor_send(repo, thread_id, x_chat_token, body.body)
