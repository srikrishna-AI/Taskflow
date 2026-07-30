from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserOut, UserUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Annotated[Session, Depends(get_db)]) -> UserOut:
    """Register a new user and return the created profile."""
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login_user(user_in: UserLogin, db: Annotated[Session, Depends(get_db)]) -> Token:
    """Authenticate a user and return JWT tokens."""
    user = db.query(User).filter(User.username == user_in.username).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    access_token = create_access_token(user.username)
    refresh_token = create_refresh_token(user.username)
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
def logout_user() -> dict[str, str]:
    """A placeholder logout endpoint for stateless JWT auth."""
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> UserOut:
    """Return the authenticated user's profile."""
    return current_user


@router.put("/update", response_model=UserOut)
def update_profile(
    user_in: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> UserOut:
    """Update current user profile and/or password."""
    if user_in.username:
        existing = db.query(User).filter(User.username == user_in.username).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Username already in use")
        current_user.username = user_in.username
        
    if user_in.email:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = user_in.email
        
    if user_in.password:
        current_user.hashed_password = get_password_hash(user_in.password)
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
