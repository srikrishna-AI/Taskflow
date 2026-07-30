from app.core.security import create_access_token, get_password_hash, verify_password


def test_password_hashing_and_verification() -> None:
    password = "supersecret"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)


def test_access_token_contains_subject() -> None:
    token = create_access_token("demo-user")
    assert token
