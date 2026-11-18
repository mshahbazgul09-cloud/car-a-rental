from typing import Literal

from fastapi import APIRouter, Depends

from .. import services
from ..dependencies import get_repository, require_admin
from ..repositories.base import Repository
from ..schemas import AdminBookingOut, AdminChatOut, AdminChatThreadOut, ChatMessageIn, ChatStatusIn, StatusIn

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/bookings", response_model=list[AdminBookingOut])
def all_bookings(status: Literal["pending", "confirmed", "cancelled"] | None = None, repo: Repository = Depends(get_repository)):
    return services.list_all_bookings(repo, status)


@router.patch("/bookings/{booking_id}", response_model=AdminBookingOut)
def update_status(booking_id: str, body: StatusIn, repo: Repository = Depends(get_repository)):
    return services.set_booking_status(repo, booking_id, body.status)


# ---- live chat
@router.get("/chats", response_model=list[AdminChatThreadOut])
def chats(repo: Repository = Depends(get_repository)):
    return services.list_chats(repo)


@router.get("/chats/{thread_id}", response_model=AdminChatOut)
def open_chat(thread_id: str, repo: Repository = Depends(get_repository)):
    return services.admin_open_chat(repo, thread_id)


@router.post("/chats/{thread_id}/messages", response_model=AdminChatOut)
def reply(thread_id: str, body: ChatMessageIn, repo: Repository = Depends(get_repository)):
    return services.admin_reply(repo, thread_id, body.body)


@router.patch("/chats/{thread_id}", response_model=AdminChatThreadOut)
def set_chat_status(thread_id: str, body: ChatStatusIn, repo: Repository = Depends(get_repository)):
    return services.admin_set_chat_status(repo, thread_id, body.status)
