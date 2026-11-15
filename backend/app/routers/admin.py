from typing import Literal

from fastapi import APIRouter, Depends

from .. import services
from ..dependencies import get_repository, require_admin
from ..repositories.base import Repository
from ..schemas import AdminBookingOut, StatusIn

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/bookings", response_model=list[AdminBookingOut])
def all_bookings(status: Literal["pending", "confirmed", "cancelled"] | None = None, repo: Repository = Depends(get_repository)):
    return services.list_all_bookings(repo, status)


@router.patch("/bookings/{booking_id}", response_model=AdminBookingOut)
def update_status(booking_id: str, body: StatusIn, repo: Repository = Depends(get_repository)):
    return services.set_booking_status(repo, booking_id, body.status)
