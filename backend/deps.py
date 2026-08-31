from datetime import datetime, timedelta, timezone
from typing import Generator
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import settings

# Informs FastAPI where clients exchange credentials for a token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Encodes user claims into a signed JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency to extract, decode, and validate the JWT from incoming requests."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception

        return {
            "username": username,
            "role": payload.get("role", "user")
        }
    except jwt.PyJWTError:
        raise credentials_exception

def require_role(required_role: str):
    """Enforce role-based access control (RBAC) on endpoints."""
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
    return role_checker

def get_db() -> Generator:
    """Placeholder DB session dependency for teammates to bind with their sessionmaker."""
    # When db.py is implemented, replace this with your SessionLocal yield
    db = None
    try:
        yield db
    finally:
        pass
