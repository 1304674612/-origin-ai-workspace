from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_returns_different_from_input(self):
        hashed = hash_password("secret123")
        assert hashed != "secret123"
        assert hashed.startswith("$2b$")

    def test_verify_correct_password(self):
        hashed = hash_password("secret123")
        assert verify_password("secret123", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("secret123")
        assert verify_password("different", hashed) is False

    def test_hash_is_salted(self):
        h1 = hash_password("secret123")
        h2 = hash_password("secret123")
        assert h1 != h2


class TestJWT:
    def test_create_and_decode_token(self):
        token = create_access_token("user-1")
        assert decode_access_token(token) == "user-1"

    def test_decode_invalid_token(self):
        assert decode_access_token("not-a-valid-token") is None

    def test_decode_tampered_token(self):
        token = create_access_token("user-1")
        tampered = token[:-5] + "aaaaa"
        assert decode_access_token(tampered) is None
