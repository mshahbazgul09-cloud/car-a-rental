"""
Car rental API with temporary mock data (no database, no Supabase).

Run from the backend folder:   uvicorn app.main:app --reload --port 8000
Docs:                          http://localhost:8000/docs
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import config
from .errors import AppError
from .routers import admin, auth, bookings, cars, contact

app = FastAPI(title="Car Rental API (mock data)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    # With a field name, answer in FastAPI's own validation format so the website can
    # highlight the right input: {"detail": [{"loc": ["body", "<field>"], "msg": "..."}]}
    if exc.field:
        detail = [{"loc": ["body", exc.field], "msg": exc.message}]
    else:
        detail = exc.message
    headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
    return JSONResponse(status_code=exc.status_code, content={"detail": detail}, headers=headers)


@app.exception_handler(NotImplementedError)
async def not_implemented_handler(_: Request, exc: NotImplementedError):
    return JSONResponse(status_code=501, content={"detail": "This feature is not connected to a database yet."})


@app.get("/api/health", tags=["health"])
def health():
    return {"ok": True, "data": "supabase" if config.USE_SUPABASE else "mock"}


for module in (auth, cars, bookings, admin, contact):
    app.include_router(module.router)
