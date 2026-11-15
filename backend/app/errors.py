"""Domain errors. Services raise these; main.py turns them into HTTP responses."""


class AppError(Exception):
    status_code = 400

    def __init__(self, message: str, field: str | None = None):
        super().__init__(message)
        self.message = message
        self.field = field  # lets the website highlight the right form field


class ValidationFailed(AppError):
    status_code = 422


class Unauthorized(AppError):
    status_code = 401


class Forbidden(AppError):
    status_code = 403


class NotFound(AppError):
    status_code = 404


class Conflict(AppError):
    status_code = 409
