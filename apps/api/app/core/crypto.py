from base64 import urlsafe_b64encode
from hashlib import sha256

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


def _fernet() -> Fernet:
    secret = get_settings().jwt_secret_key.encode("utf-8")
    key = urlsafe_b64encode(sha256(secret).digest())
    return Fernet(key)


def encrypt_secret(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    return _fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_secret(token: str | None) -> str | None:
    if token is None or not token.strip():
        return None
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return None
