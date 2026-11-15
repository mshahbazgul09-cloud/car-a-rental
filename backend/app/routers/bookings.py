from fastapi import APIRouter, Depends

from .. import services
from ..dependencies import get_current_user, get_optional_user, get_repository
from ..repositories.base import Repository
from ..schemas import BookingIn, BookingOut

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    body: BookingIn,
    user: dict | None = Depends(get_optional_user),  # guests may book; logged-in users get it saved to their account
    repo: Repository = Depends(get_repository),
):
    return services.create_booking(
        repo,
        customer_name=body.customer_name,
        phone=body.phone,
        car_id=body.car_id,
        pickup_date=body.pickup_date,
        return_date=body.return_date,
        pickup_location=body.pickup_location,
        user_id=user["id"] if user else None,
    )


@router.get("/me", response_model=list[BookingOut])
def my_bookings(user: dict = Depends(get_current_user), repo: Repository = Depends(get_repository)):
    return services.list_user_bookings(repo, user["id"])


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: str, user: dict = Depends(get_current_user), repo: Repository = Depends(get_repository)):
    return services.cancel_booking(repo, booking_id, user)
