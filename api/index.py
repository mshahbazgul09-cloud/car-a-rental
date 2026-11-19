"""Vercel entry point: runs the FastAPI backend (backend/app) as a Vercel Function.

vercel.json sends every /api/... request here, so the website and its data share one address.
Settings come from the Vercel project's Environment Variables (see backend/.env.example).
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))

from app.main import app  # noqa: E402,F401  (Vercel serves this ASGI app)
