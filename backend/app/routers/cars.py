from typing import Literal

from fastapi import APIRouter, Depends, Query

from .. import config, services
from ..dependencies import get_repository
from ..repositories.base import Repository
from ..schemas import CarOut, RangeOut

router = APIRouter(prefix="/api/cars", tags=["cars"])


@router.get("", response_model=list[CarOut])
def list_cars(
    q: str | None = Query(None, max_length=60),
    category: str | None = Query(None, max_length=30),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    sort: Literal["featured", "price_asc", "price_desc"] = "featured",
    repo: Repository = Depends(get_repository),
):
    return services.search_cars(repo, q, category, min_price, max_price, sort)


@router.get("/{car_id}", response_model=CarOut)
def get_car(car_id: str, repo: Repository = Depends(get_repository)):
    return services.get_car_or_404(repo, car_id)


@router.get("/{car_id}/availability", response_model=list[RangeOut])
def availability(car_id: str, repo: Repository = Depends(get_repository)):
    """Confirmed (unavailable) date ranges from today on. Dates only, no customer data."""
    return repo.list_confirmed_ranges(car_id, config.today())
